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
REQUEST_TIMEOUT = 15
MAX_FAILURES_BEFORE_FLAG = 2
TTL_HOURS = 24

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


async def run_url_health_check() -> Dict[str, Any]:
    logger.info("Starting URL health check for active deals")
    now = datetime.utcnow()
    stats = {
        "total_checked": 0,
        "healthy": 0,
        "broken": 0,
        "flagged_pending_review": 0,
        "errors": 0,
        "started_at": now.isoformat(),
    }

    try:
        async with async_session() as db:
            result = await db.execute(
                select(DealModel).where(
                    and_(
                        DealModel.is_active == True,
                        DealModel.status.in_(["approved", "pending"]),
                        or_(
                            DealModel.url_last_checked.is_(None),
                            DealModel.url_last_checked < now - timedelta(hours=2),
                        ),
                    )
                ).order_by(DealModel.url_last_checked.asc().nullsfirst())
                .limit(200)
            )
            deals = result.scalars().all()

            if not deals:
                logger.info("No deals need URL checking right now")
                stats["message"] = "No deals needed checking"
                return stats

            logger.info(f"Checking URLs for {len(deals)} deals")

            semaphore = asyncio.Semaphore(CONCURRENT_CHECKS)

            async def check_with_semaphore(
                http_session: aiohttp.ClientSession, deal: DealModel
            ):
                async with semaphore:
                    return deal, await check_single_url(http_session, deal.affiliate_url)

            connector = aiohttp.TCPConnector(limit=CONCURRENT_CHECKS, ssl=False)
            async with aiohttp.ClientSession(connector=connector) as http_session:
                tasks = [check_with_semaphore(http_session, deal) for deal in deals]
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
                    deal.url_check_failures = (deal.url_check_failures or 0) + 1
                    logger.warning(
                        f"Deal {deal.id} URL failed check #{deal.url_check_failures}: "
                        f"{deal.affiliate_url} - status {check_result.get('status')} "
                        f"error: {check_result.get('error', 'N/A')}"
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

        stats["completed_at"] = datetime.utcnow().isoformat()
        logger.info(
            f"URL health check completed: {stats['total_checked']} checked, "
            f"{stats['healthy']} healthy, {stats['broken']} broken, "
            f"{stats['flagged_pending_review']} flagged for review"
        )
        return stats

    except Exception as e:
        logger.error(f"Error in URL health check: {e}")
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

            return {
                "total_active_deals": total_count,
                "healthy_urls": healthy_count,
                "broken_urls": broken_count,
                "flagged_pending_review": flagged_count,
                "unchecked": unchecked_count,
                "health_percentage": round(
                    (healthy_count / max(total_count, 1)) * 100, 1
                ),
            }

    except Exception as e:
        logger.error(f"Error getting URL health stats: {e}")
        return {"error": str(e)}
