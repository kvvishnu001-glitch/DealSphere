import json
import html
import re
from datetime import datetime
from typing import Optional, Dict, Any, List


def escape_html(text: str) -> str:
    if not text:
        return ""
    return html.escape(str(text), quote=True)


def generate_deal_seo(deal: Any, base_url: str) -> str:
    title = escape_html(deal.title)
    store = escape_html(deal.store)
    category = escape_html(deal.category)
    description = escape_html(deal.description or "")
    sale_price = float(deal.sale_price) if deal.sale_price else 0
    original_price = float(deal.original_price) if deal.original_price else 0
    discount = deal.discount_percentage or 0
    image_url = deal.image_url or f"{base_url}/og-default.jpg"
    deal_url = f"{base_url}/deals/{deal.id}"
    savings = original_price - sale_price
    
    meta_title = f"{title} - {discount}% OFF | {store} Deal | DealSphere"
    meta_description = f"Save ${savings:.2f} on {title} at {store}. Now ${sale_price:.2f} (was ${original_price:.2f}). {discount}% discount. AI-verified deal."
    
    if len(meta_description) > 160:
        meta_description = meta_description[:157] + "..."
    
    updated_at = deal.updated_at.isoformat() if deal.updated_at else datetime.utcnow().isoformat()
    expires_at = deal.expires_at.isoformat() if deal.expires_at else None
    
    product_schema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": deal.title,
        "description": deal.description or f"{deal.title} available at {deal.store}",
        "image": deal.image_url or "",
        "brand": {
            "@type": "Brand",
            "name": deal.store
        },
        "offers": {
            "@type": "Offer",
            "url": deal_url,
            "priceCurrency": "USD",
            "price": str(sale_price),
            "priceValidUntil": expires_at or "",
            "availability": "https://schema.org/InStock",
            "seller": {
                "@type": "Organization",
                "name": deal.store
            }
        }
    }
    
    if deal.rating:
        product_schema["aggregateRating"] = {
            "@type": "AggregateRating",
            "ratingValue": str(deal.rating),
            "reviewCount": str(deal.review_count or 1)
        }
    
    breadcrumb_schema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": base_url
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": category,
                "item": f"{base_url}/category/{re.sub(r'[^a-z0-9]+', '-', category.lower()).strip('-')}"
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": deal.title[:50],
                "item": deal_url
            }
        ]
    }
    
    faq_items = [
        {
            "@type": "Question",
            "name": f"How much can I save on {deal.title}?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": f"You can save ${savings:.2f} ({discount}% off) on {deal.title}. The regular price is ${original_price:.2f}, and the sale price is ${sale_price:.2f}."
            }
        },
        {
            "@type": "Question",
            "name": f"Is this {deal.store} deal verified?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": f"Yes, this deal has been AI-verified by DealSphere's validation system with a quality score to ensure it's a genuine offer from {deal.store}."
            }
        },
        {
            "@type": "Question",
            "name": f"How do I redeem this deal?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": f"Click the 'Get This Deal' button to visit {deal.store}'s website where the discount will be applied. {'Use coupon code ' + deal.coupon_code + ' at checkout.' if deal.coupon_code else 'No coupon code is required - the price is already discounted.'}"
            }
        }
    ]
    
    if expires_at:
        faq_items.append({
            "@type": "Question",
            "name": "When does this deal expire?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": f"This deal expires on {deal.expires_at.strftime('%B %d, %Y') if deal.expires_at else 'a limited time'}. We recommend acting quickly to secure this discount."
            }
        })
    
    faq_schema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faq_items
    }
    
    meta_tags = f'''
    <title>{meta_title}</title>
    <meta name="description" content="{escape_html(meta_description)}" />
    <link rel="canonical" href="{deal_url}" />
    <meta name="robots" content="index, follow" />
    
    <meta property="og:title" content="{escape_html(meta_title)}" />
    <meta property="og:description" content="{escape_html(meta_description)}" />
    <meta property="og:image" content="{image_url}" />
    <meta property="og:url" content="{deal_url}" />
    <meta property="og:type" content="product" />
    <meta property="og:site_name" content="DealSphere" />
    <meta property="product:price:amount" content="{sale_price}" />
    <meta property="product:price:currency" content="USD" />
    
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="{escape_html(meta_title)}" />
    <meta name="twitter:description" content="{escape_html(meta_description)}" />
    <meta name="twitter:image" content="{image_url}" />
    
    <meta name="article:modified_time" content="{updated_at}" />
    
    <script type="application/ld+json">{json.dumps(product_schema)}</script>
    <script type="application/ld+json">{json.dumps(breadcrumb_schema)}</script>
    <script type="application/ld+json">{json.dumps(faq_schema)}</script>
'''
    return meta_tags


def generate_home_seo(base_url: str, deal_count: int = 0) -> str:
    meta_title = "DealSphere - AI-Verified Deals, Coupons & Discounts | Save Up to 90%"
    meta_description = f"Discover {deal_count}+ AI-verified deals and coupons from top stores. Save up to 90% on electronics, fashion, home & more. Updated daily with the best discounts."
    
    website_schema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "DealSphere",
        "url": base_url,
        "description": "AI-powered deals and coupons platform aggregating the best discounts from top stores.",
        "potentialAction": {
            "@type": "SearchAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": f"{base_url}/?search={{search_term_string}}"
            },
            "query-input": "required name=search_term_string"
        }
    }
    
    org_schema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "DealSphere",
        "url": base_url,
        "logo": f"{base_url}/favicon.ico",
        "description": "AI-powered deals aggregation platform that verifies and curates the best online deals and coupons.",
        "sameAs": []
    }
    
    breadcrumb_schema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": base_url
            }
        ]
    }
    
    meta_tags = f'''
    <title>{meta_title}</title>
    <meta name="description" content="{escape_html(meta_description)}" />
    <link rel="canonical" href="{base_url}/" />
    <meta name="robots" content="index, follow" />
    
    <meta property="og:title" content="{meta_title}" />
    <meta property="og:description" content="{escape_html(meta_description)}" />
    <meta property="og:url" content="{base_url}/" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="DealSphere" />
    
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="{meta_title}" />
    <meta name="twitter:description" content="{escape_html(meta_description)}" />
    
    <script type="application/ld+json">{json.dumps(website_schema)}</script>
    <script type="application/ld+json">{json.dumps(org_schema)}</script>
    <script type="application/ld+json">{json.dumps(breadcrumb_schema)}</script>
'''
    return meta_tags


def generate_category_seo(category_name: str, category_slug: str, base_url: str, deal_count: int = 0) -> str:
    meta_title = f"{category_name} Deals & Coupons - Up to 90% Off | DealSphere"
    meta_description = f"Browse {deal_count}+ AI-verified {category_name.lower()} deals and coupons. Find the best discounts on {category_name.lower()} products from top stores. Updated daily."
    category_url = f"{base_url}/category/{category_slug}"
    
    collection_schema = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": f"{category_name} Deals",
        "description": f"Best {category_name.lower()} deals, coupons, and discounts curated and verified by AI.",
        "url": category_url,
        "isPartOf": {
            "@type": "WebSite",
            "name": "DealSphere",
            "url": base_url
        }
    }
    
    breadcrumb_schema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": base_url
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": f"{category_name} Deals",
                "item": category_url
            }
        ]
    }
    
    meta_tags = f'''
    <title>{escape_html(meta_title)}</title>
    <meta name="description" content="{escape_html(meta_description)}" />
    <link rel="canonical" href="{category_url}" />
    <meta name="robots" content="index, follow" />
    
    <meta property="og:title" content="{escape_html(meta_title)}" />
    <meta property="og:description" content="{escape_html(meta_description)}" />
    <meta property="og:url" content="{category_url}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="DealSphere" />
    
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="{escape_html(meta_title)}" />
    <meta name="twitter:description" content="{escape_html(meta_description)}" />
    
    <script type="application/ld+json">{json.dumps(collection_schema)}</script>
    <script type="application/ld+json">{json.dumps(breadcrumb_schema)}</script>
'''
    return meta_tags


def generate_about_seo(base_url: str) -> str:
    meta_title = "About DealSphere - AI-Powered Deals & Coupons Platform"
    meta_description = "DealSphere uses artificial intelligence to find, verify, and curate the best deals and coupons from top online stores. Learn about our mission to save you money."
    about_url = f"{base_url}/about"
    
    org_schema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "DealSphere",
        "url": base_url,
        "description": "AI-powered deals aggregation platform that verifies and curates the best online deals and coupons from top retailers.",
        "foundingDate": "2025",
        "knowsAbout": ["deals", "coupons", "discounts", "online shopping", "price comparison", "affiliate marketing"]
    }
    
    breadcrumb_schema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": base_url
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "About Us",
                "item": about_url
            }
        ]
    }
    
    meta_tags = f'''
    <title>{meta_title}</title>
    <meta name="description" content="{meta_description}" />
    <link rel="canonical" href="{about_url}" />
    <meta name="robots" content="index, follow" />
    
    <meta property="og:title" content="{meta_title}" />
    <meta property="og:description" content="{meta_description}" />
    <meta property="og:url" content="{about_url}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="DealSphere" />
    
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="{meta_title}" />
    <meta name="twitter:description" content="{meta_description}" />
    
    <script type="application/ld+json">{json.dumps(org_schema)}</script>
    <script type="application/ld+json">{json.dumps(breadcrumb_schema)}</script>
'''
    return meta_tags


def generate_contact_seo(base_url: str) -> str:
    meta_title = "Contact DealSphere - Get in Touch | Support & Feedback"
    meta_description = "Contact the DealSphere team for support, partnership inquiries, or feedback. We're here to help you find the best deals and coupons."
    contact_url = f"{base_url}/contact"
    
    breadcrumb_schema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": base_url
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "Contact",
                "item": contact_url
            }
        ]
    }
    
    meta_tags = f'''
    <title>{meta_title}</title>
    <meta name="description" content="{meta_description}" />
    <link rel="canonical" href="{contact_url}" />
    <meta name="robots" content="index, follow" />
    
    <meta property="og:title" content="{meta_title}" />
    <meta property="og:description" content="{meta_description}" />
    <meta property="og:url" content="{contact_url}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="DealSphere" />
    
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="{meta_title}" />
    <meta name="twitter:description" content="{meta_description}" />
    
    <script type="application/ld+json">{json.dumps(breadcrumb_schema)}</script>
'''
    return meta_tags


def generate_blog_seo(base_url: str) -> str:
    meta_title = "Deal Guides & Shopping Tips - DealSphere Blog"
    meta_description = "Expert shopping guides, deal-finding tips, and money-saving strategies. Learn how to maximize your savings with AI-verified deals and coupons."
    blog_url = f"{base_url}/blog"
    
    breadcrumb_schema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": base_url
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "Blog",
                "item": blog_url
            }
        ]
    }
    
    meta_tags = f'''
    <title>{meta_title}</title>
    <meta name="description" content="{meta_description}" />
    <link rel="canonical" href="{blog_url}" />
    <meta name="robots" content="index, follow" />
    
    <meta property="og:title" content="{meta_title}" />
    <meta property="og:description" content="{meta_description}" />
    <meta property="og:url" content="{blog_url}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="DealSphere" />
    
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="{meta_title}" />
    <meta name="twitter:description" content="{meta_description}" />
    
    <script type="application/ld+json">{json.dumps(breadcrumb_schema)}</script>
'''
    return meta_tags


def generate_generic_seo(page_title: str, page_description: str, page_url: str, base_url: str) -> str:
    breadcrumb_schema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": base_url
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": page_title,
                "item": page_url
            }
        ]
    }
    
    meta_tags = f'''
    <title>{escape_html(page_title)}</title>
    <meta name="description" content="{escape_html(page_description)}" />
    <link rel="canonical" href="{page_url}" />
    <meta name="robots" content="index, follow" />
    
    <meta property="og:title" content="{escape_html(page_title)}" />
    <meta property="og:description" content="{escape_html(page_description)}" />
    <meta property="og:url" content="{page_url}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="DealSphere" />
    
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="{escape_html(page_title)}" />
    <meta name="twitter:description" content="{escape_html(page_description)}" />
    
    <script type="application/ld+json">{json.dumps(breadcrumb_schema)}</script>
'''
    return meta_tags


def inject_seo_into_html(html_content: str, seo_tags: str) -> str:
    return html_content.replace('</head>', f'{seo_tags}</head>')
