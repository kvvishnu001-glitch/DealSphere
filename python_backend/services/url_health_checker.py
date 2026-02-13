import asyncio
import ipaddress
import logging
import socket
from datetime import datetime, timedelta
from typing import Dict, Any, List
from urllib.parse import urlparse
import aiohttp
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_, or_, func

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from database import async_session
from models import Deal as DealModel

logger = logging.getLogger(__name__)

CONCURRENT_CHECKS = 10
BATCH_SIZE = 50
REQUEST_TIMEOUT = 15
MAX_FAILURES_BEFORE_FLAG = 2
TTL_HOURS = 24

_check_progress = {"running": False, "checked": 0, "total": 0, "status": "idle"}
_check_lock = asyncio.Lock()

SAFE_HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; DealSphere URL Checker/1.0)",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

BLOCKED_HOSTS = {"localhost", "127.0.0.1", "0.0.0.0", "metadata.google.internal", "169.254.169.254"}

SOFT_404_PATTERNS = [
    "page not found",
    "product not available",
    "currently unavailable",
    "this item is no longer available",
    "we couldn't find that page",
    "this page doesn't exist",
    "no longer exists",
    "item not found",
    "deal has expired",
    "offer has ended",
    "this deal is no longer available",
    "sorry, this product is unavailable",
    "this product is currently unavailable",
    "looking for something?",
    '"message":"page not found"',
    '"message": "page not found"',
    '"message":"deal not found"',
    '"message": "deal not found"',
    '"message":"deal expired"',
    '"message": "deal expired"',
    '"message":"not found"',
    '"message": "not found"',
    '"message":"not found"',
]


def _is_safe_url(url: str) -> bool:
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https"):
            return False
        hostname = parsed.hostname
        if not hostname:
            return False
        if hostname in BLOCKED_HOSTS:
            return False
        try:
            ip = ipaddress.ip_address(hostname)
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
                return False
        except ValueError:
            try:
                resolved = socket.getaddrinfo(hostname, None, socket.AF_UNSPEC, socket.SOCK_STREAM)
                for _, _, _, _, addr in resolved:
                    ip = ipaddress.ip_address(addr[0])
                    if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
                        return False
            except socket.gaierror:
                return False
        return True
    except Exception:
        return False


def _check_soft_404(body_text: str) -> bool:
    lower = body_text.lower()
    for pattern in SOFT_404_PATTERNS:
        if pattern in lower:
            return True
    return False


async def check_single_url(session: aiohttp.ClientSession, url: str) -> Dict[str, Any]:
    if not _is_safe_url(url):
        return {"url": url, "status": 0, "accessible": False, "error": "blocked_url"}
    try:
        async with session.get(
            url,
            timeout=aiohttp.ClientTimeout(total=REQUEST_TIMEOUT),
            allow_redirects=True,
            headers=SAFE_HEADERS,
        ) as response:
            if response.status >= 400:
                return {"url": url, "status": response.status, "accessible": False}

            body = await response.text(encoding="utf-8", errors="replace")
            snippet = body[:5000]

            if _check_soft_404(snippet):
                return {
                    "url": url,
                    "status": response.status,
                    "accessible": False,
                    "error": "soft_404_detected",
                }

            return {"url": url, "status": response.status, "accessible": True}
    except asyncio.TimeoutError:
        return {"url": url, "status": 0, "accessible": False, "error": "timeout"}
    except aiohttp.ClientError as e:
        return {"url": url, "status": 0, "accessible": False, "error": str(e)}
    except Exception as e:
        return {"url": url, "status": 0, "accessible": False, "error": str(e)}


def get_check_progress() -> Dict[str, Any]:
    return dict(_check_progress)


async def run_url_health_check(check_all: bool = False) -> Dict[str, Any]:
    global _check_progress
    if _check_lock.locked():
        return {"error": "A URL health check is already running", "total_checked": 0}

    async with _check_lock:
        logger.info("Starting URL health check for active deals")
        now = datetime.utcnow()
        stats = {
            "total_checked": 0,
            "healthy": 0,
            "broken": 0,
            "flagged_pending_review": 0,
            "removed": 0,
            "errors": 0,
            "started_at": now.isoformat(),
        }

        try:
            deal_ids = []
            async with async_session() as db:
                query = select(DealModel.id).where(
                    and_(
                        DealModel.is_active == True,
                        DealModel.status.in_(["approved", "pending"]),
                    )
                )
                if not check_all:
                    query = query.where(
                        or_(
                            DealModel.url_last_checked.is_(None),
                            DealModel.url_last_checked < now - timedelta(hours=2),
                        )
                    ).limit(200)
                query = query.order_by(DealModel.url_last_checked.asc().nullsfirst())
                result = await db.execute(query)
                deal_ids = [row[0] for row in result.all()]

            if not deal_ids:
                logger.info("No deals need URL checking right now")
                _check_progress = {"running": False, "checked": 0, "total": 0, "status": "idle"}
                stats["message"] = "No deals needed checking"
                return stats

            total_deals = len(deal_ids)
            logger.info(f"Checking URLs for {total_deals} deals in batches of {BATCH_SIZE}")
            _check_progress = {"running": True, "checked": 0, "total": total_deals, "status": "running"}

            for batch_start in range(0, total_deals, BATCH_SIZE):
                batch_ids = deal_ids[batch_start:batch_start + BATCH_SIZE]

                async with async_session() as db:
                    result = await db.execute(
                        select(DealModel).where(DealModel.id.in_(batch_ids))
                    )
                    batch_deals = result.scalars().all()

                    semaphore = asyncio.Semaphore(CONCURRENT_CHECKS)

                    async def check_with_semaphore(
                        http_session: aiohttp.ClientSession, deal: DealModel
                    ):
                        async with semaphore:
                            return deal, await check_single_url(http_session, deal.affiliate_url)

                    connector = aiohttp.TCPConnector(limit=CONCURRENT_CHECKS, ssl=False)
                    async with aiohttp.ClientSession(connector=connector) as http_session:
                        tasks = [check_with_semaphore(http_session, deal) for deal in batch_deals]
                        results = await asyncio.gather(*tasks, return_exceptions=True)

                    for item in results:
                        stats["total_checked"] += 1

                        if isinstance(item, Exception):
                            stats["errors"] += 1
                            logger.error(f"URL check exception: {item}")
                            continue

                        deal, check_result = item
                        deal.url_last_checked = now

                        if check_result["accessible"]:
                            deal.url_check_failures = 0
                            deal.url_status = "healthy"
                            stats["healthy"] += 1
                        else:
                            error_type = check_result.get("error", "")
                            http_status = check_result.get("status", 0)
                            is_definite_dead = (
                                error_type == "soft_404_detected"
                                or http_status == 404
                                or http_status == 410
                            )

                            if is_definite_dead:
                                deal.url_status = "broken"
                                deal.status = "deleted"
                                deal.is_active = False
                                deal.url_flagged_at = now
                                deal.url_check_failures = (deal.url_check_failures or 0) + 1
                                stats["removed"] += 1
                                logger.info(
                                    f"Deal {deal.id} removed - URL is dead "
                                    f"(status={http_status}, error={error_type}): {deal.affiliate_url}"
                                )
                            else:
                                deal.url_check_failures = (deal.url_check_failures or 0) + 1
                                logger.warning(
                                    f"Deal {deal.id} URL failed check #{deal.url_check_failures}: "
                                    f"{deal.affiliate_url} - status {http_status} "
                                    f"error: {error_type or 'N/A'}"
                                )

                                if deal.url_check_failures >= MAX_FAILURES_BEFORE_FLAG:
                                    deal.url_status = "broken"
                                    deal.status = "pending"
                                    deal.is_ai_approved = False
                                    deal.url_flagged_at = now
                                    stats["flagged_pending_review"] += 1
                                    logger.info(
                                        f"Deal {deal.id} flagged as pending review - "
                                        f"URL broken after {deal.url_check_failures} failures"
                                    )
                                else:
                                    deal.url_status = "broken"
                                    stats["broken"] += 1

                    await db.commit()

                _check_progress = {
                    "running": True,
                    "checked": stats["total_checked"],
                    "total": total_deals,
                    "status": "running",
                }
                logger.info(f"Batch complete: {stats['total_checked']}/{total_deals} checked")

            _check_progress = {"running": False, "checked": total_deals, "total": total_deals, "status": "done"}

            stats["completed_at"] = datetime.utcnow().isoformat()
            logger.info(
                f"URL health check completed: {stats['total_checked']} checked, "
                f"{stats['healthy']} healthy, {stats['broken']} broken, "
                f"{stats['flagged_pending_review']} flagged for review"
            )
            return stats

        except Exception as e:
            logger.error(f"Error in URL health check: {e}")
            _check_progress = {"running": False, "checked": 0, "total": 0, "status": "error"}
            stats["error"] = str(e)
            return stats


async def cleanup_stale_flagged_deals() -> Dict[str, Any]:
    logger.info("Starting cleanup of stale URL-flagged deals")
    now = datetime.utcnow()
    cutoff = now - timedelta(hours=TTL_HOURS)
    stats = {"removed": 0, "cutoff_time": cutoff.isoformat()}

    try:
        async with async_session() as db:
            result = await db.execute(
                select(DealModel).where(
                    and_(
                        DealModel.url_status == "broken",
                        DealModel.url_flagged_at.isnot(None),
                        DealModel.url_flagged_at < cutoff,
                        DealModel.status == "pending",
                    )
                )
            )
            stale_deals = result.scalars().all()

            for deal in stale_deals:
                deal.is_active = False
                deal.status = "deleted"
                deal.deleted_at = now
                stats["removed"] += 1
                logger.info(
                    f"Removed stale deal {deal.id} - URL broken since {deal.url_flagged_at}"
                )

            await db.commit()

        logger.info(f"Stale deal cleanup completed: {stats['removed']} deals removed")
        return stats

    except Exception as e:
        logger.error(f"Error in stale deal cleanup: {e}")
        stats["error"] = str(e)
        return stats


async def cleanup_data_quality_issues() -> Dict[str, Any]:
    logger.info("Starting data quality cleanup for active deals")
    now = datetime.utcnow()
    stats = {
        "removed": 0,
        "missing_image": 0,
        "invalid_pricing": 0,
        "missing_required_fields": 0,
        "started_at": now.isoformat(),
        "removed_deals": [],
    }

    try:
        async with async_session() as db:
            quality_filter = or_(
                DealModel.image_url == None,
                DealModel.image_url == "",
                DealModel.title == None,
                DealModel.title == "",
                DealModel.description == None,
                DealModel.description == "",
                DealModel.store == None,
                DealModel.store == "",
                DealModel.category == None,
                DealModel.category == "",
                DealModel.affiliate_url == None,
                DealModel.affiliate_url == "",
                DealModel.original_price == None,
                DealModel.original_price <= 0,
                DealModel.sale_price == None,
                DealModel.sale_price <= 0,
                DealModel.sale_price >= DealModel.original_price,
            )

            result = await db.execute(
                select(DealModel).where(
                    and_(
                        DealModel.status != "deleted",
                        quality_filter,
                    )
                )
            )
            bad_deals = result.scalars().all()

            for deal in bad_deals:
                issues = []
                if not deal.image_url or deal.image_url.strip() == "":
                    issues.append("missing_image")
                    stats["missing_image"] += 1
                if not deal.title or deal.title.strip() == "":
                    issues.append("missing_title")
                    stats["missing_required_fields"] += 1
                if not deal.description or deal.description.strip() == "":
                    issues.append("missing_description")
                    stats["missing_required_fields"] += 1
                if not deal.store or deal.store.strip() == "":
                    issues.append("missing_store")
                    stats["missing_required_fields"] += 1
                if not deal.category or deal.category.strip() == "":
                    issues.append("missing_category")
                    stats["missing_required_fields"] += 1
                if not deal.affiliate_url or deal.affiliate_url.strip() == "":
                    issues.append("missing_affiliate_url")
                    stats["missing_required_fields"] += 1
                if not deal.original_price or deal.original_price <= 0:
                    issues.append("invalid_original_price")
                    stats["invalid_pricing"] += 1
                if not deal.sale_price or deal.sale_price <= 0:
                    issues.append("invalid_sale_price")
                    stats["invalid_pricing"] += 1
                if (deal.original_price and deal.sale_price and
                        deal.original_price > 0 and deal.sale_price >= deal.original_price):
                    issues.append("sale_price_not_lower")
                    stats["invalid_pricing"] += 1

                deal.is_active = False
                deal.status = "deleted"
                deal.deleted_at = now
                stats["removed"] += 1
                stats["removed_deals"].append({
                    "id": str(deal.id),
                    "title": deal.title[:60] if deal.title else "(no title)",
                    "issues": issues,
                })
                logger.info(
                    f"Removed deal {deal.id} - data quality issues: {', '.join(issues)}"
                )

            await db.commit()

        stats["completed_at"] = datetime.utcnow().isoformat()
        logger.info(f"Data quality cleanup completed: {stats['removed']} deals removed")
        return stats

    except Exception as e:
        logger.error(f"Error in data quality cleanup: {e}")
        stats["error"] = str(e)
        return stats


async def get_url_health_stats() -> Dict[str, Any]:
    try:
        async with async_session() as db:
            total = await db.execute(
                select(func.count(DealModel.id)).where(
                    DealModel.is_active == True,
                    DealModel.status.in_(["approved", "pending"]),
                )
            )
            total_count = total.scalar() or 0

            healthy = await db.execute(
                select(func.count(DealModel.id)).where(
                    DealModel.is_active == True,
                    DealModel.url_status == "healthy",
                )
            )
            healthy_count = healthy.scalar() or 0

            broken = await db.execute(
                select(func.count(DealModel.id)).where(
                    DealModel.is_active == True,
                    DealModel.url_status == "broken",
                )
            )
            broken_count = broken.scalar() or 0

            flagged = await db.execute(
                select(func.count(DealModel.id)).where(
                    DealModel.url_status == "broken",
                    DealModel.url_flagged_at.isnot(None),
                    DealModel.status == "pending",
                )
            )
            flagged_count = flagged.scalar() or 0

            unchecked = await db.execute(
                select(func.count(DealModel.id)).where(
                    DealModel.is_active == True,
                    or_(
                        DealModel.url_status == "unchecked",
                        DealModel.url_status.is_(None),
                    ),
                )
            )
            unchecked_count = unchecked.scalar() or 0

            quality_issues = await db.execute(
                select(func.count(DealModel.id)).where(
                    and_(
                        DealModel.status != "deleted",
                        or_(
                            DealModel.image_url == None,
                            DealModel.image_url == "",
                            DealModel.title == None,
                            DealModel.title == "",
                            DealModel.description == None,
                            DealModel.description == "",
                            DealModel.store == None,
                            DealModel.store == "",
                            DealModel.category == None,
                            DealModel.category == "",
                            DealModel.affiliate_url == None,
                            DealModel.affiliate_url == "",
                            DealModel.original_price == None,
                            DealModel.original_price <= 0,
                            DealModel.sale_price == None,
                            DealModel.sale_price <= 0,
                            DealModel.sale_price >= DealModel.original_price,
                        ),
                    )
                )
            )
            quality_issues_count = quality_issues.scalar() or 0

            return {
                "total_active_deals": total_count,
                "healthy_urls": healthy_count,
                "broken_urls": broken_count,
                "flagged_pending_review": flagged_count,
                "unchecked": unchecked_count,
                "data_quality_issues": quality_issues_count,
                "health_percentage": round(
                    (healthy_count / max(total_count, 1)) * 100, 1
                ),
            }

    except Exception as e:
        logger.error(f"Error getting URL health stats: {e}")
        return {"error": str(e)}
