import re
from fastapi import APIRouter, Depends, Request
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, distinct
from database import get_db
from models import Deal as DealModel
from datetime import datetime

router = APIRouter(tags=["seo"])


def _get_base_url(request: Request) -> str:
    forwarded_proto = request.headers.get("x-forwarded-proto", "https")
    host = request.headers.get("host", request.base_url.hostname)
    return f"{forwarded_proto}://{host}"

@router.get("/sitemap.xml")
async def sitemap_xml(request: Request, db: AsyncSession = Depends(get_db)):
    base_url = _get_base_url(request)
    today = datetime.utcnow().strftime("%Y-%m-%d")

    result = await db.execute(
        select(DealModel).where(
            DealModel.is_active == True,
            DealModel.is_ai_approved == True,
            DealModel.status == "approved",
        )
    )
    deals = result.scalars().all()

    cat_result = await db.execute(
        select(distinct(DealModel.category)).where(
            DealModel.is_active == True,
            DealModel.is_ai_approved == True,
            DealModel.status == "approved",
        )
    )
    categories = [row[0] for row in cat_result.all() if row[0]]

    urls = []

    urls.append(
        f"  <url>\n"
        f"    <loc>{base_url}/</loc>\n"
        f"    <lastmod>{today}</lastmod>\n"
        f"    <changefreq>daily</changefreq>\n"
        f"    <priority>1.0</priority>\n"
        f"  </url>"
    )

    static_pages = [
        ("/about", "0.5"),
        ("/contact", "0.5"),
        ("/blog", "0.6"),
        ("/blog/how-to-find-best-deals", "0.5"),
        ("/blog/ai-deal-verification", "0.5"),
        ("/blog/coupon-strategies", "0.5"),
        ("/blog/online-shopping-safety", "0.5"),
        ("/blog/best-deal-categories", "0.5"),
    ]
    for path, priority in static_pages:
        urls.append(
            f"  <url>\n"
            f"    <loc>{base_url}{path}</loc>\n"
            f"    <lastmod>{today}</lastmod>\n"
            f"    <changefreq>monthly</changefreq>\n"
            f"    <priority>{priority}</priority>\n"
            f"  </url>"
        )

    for category in categories:
        slug = re.sub(r'[^a-z0-9]+', '-', category.lower()).strip('-')
        urls.append(
            f"  <url>\n"
            f"    <loc>{base_url}/category/{slug}</loc>\n"
            f"    <lastmod>{today}</lastmod>\n"
            f"    <changefreq>daily</changefreq>\n"
            f"    <priority>0.8</priority>\n"
            f"  </url>"
        )

    for deal in deals:
        lastmod = deal.updated_at.strftime("%Y-%m-%d") if deal.updated_at else today
        urls.append(
            f"  <url>\n"
            f"    <loc>{base_url}/deals/{deal.id}</loc>\n"
            f"    <lastmod>{lastmod}</lastmod>\n"
            f"    <changefreq>weekly</changefreq>\n"
            f"    <priority>0.6</priority>\n"
            f"  </url>"
        )

    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(urls)
        + "\n</urlset>\n"
    )

    return Response(content=xml, media_type="application/xml")


@router.get("/robots.txt")
async def robots_txt(request: Request):
    base_url = _get_base_url(request)
    content = (
        "User-agent: *\n"
        "Allow: /\n"
        "Disallow: /admin\n"
        "Disallow: /api/\n"
        "Disallow: /s/\n"
        "\n"
        f"Sitemap: {base_url}/sitemap.xml\n"
    )
    return Response(content=content, media_type="text/plain")


@router.get("/api/seo/categories")
async def seo_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(DealModel.category, func.count(DealModel.id).label("count"))
        .where(
            DealModel.is_active == True,
            DealModel.is_ai_approved == True,
            DealModel.status == "approved",
        )
        .group_by(DealModel.category)
        .order_by(func.count(DealModel.id).desc())
    )
    rows = result.all()

    categories = []
    for row in rows:
        if row.category:
            categories.append(
                {
                    "name": row.category,
                    "slug": re.sub(r'[^a-z0-9]+', '-', row.category.lower()).strip('-'),
                    "count": row.count,
                }
            )

    return categories
