import json
import html
import re
from datetime import datetime
from typing import Optional, Dict, Any, List


DEFAULT_OG_IMAGE_PATH = "/og-default.png"


def escape_html(text: str) -> str:
    if not text:
        return ""
    return html.escape(str(text), quote=True)


def _slugify(text: str) -> str:
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')


def _calc_discount(original: float, sale: float) -> int:
    if original > 0 and sale < original:
        return round(((original - sale) / original) * 100)
    return 0


def generate_deal_seo(deal: Any, base_url: str) -> str:
    title = escape_html(deal.title)
    store = escape_html(deal.store)
    category = escape_html(deal.category)
    description = escape_html(deal.description or "")
    sale_price = float(deal.sale_price) if deal.sale_price else 0
    original_price = float(deal.original_price) if deal.original_price else 0
    discount = deal.discount_percentage if deal.discount_percentage else _calc_discount(original_price, sale_price)
    image_url = deal.image_url or f"{base_url}{DEFAULT_OG_IMAGE_PATH}"
    deal_url = f"{base_url}/deals/{deal.id}"
    savings = original_price - sale_price
    
    meta_title = f"{title} - {discount}% OFF | {store} Deal | DealSphere"
    if len(meta_title) > 60:
        meta_title = f"{deal.title[:40]}... - {discount}% OFF | DealSphere"
    
    meta_description = f"{title} at {store} - {discount}% off. Listed at ${sale_price:.2f}. Prices subject to change. AI-verified deal."
    if len(meta_description) > 160:
        meta_description = meta_description[:157] + "..."
    
    updated_at = deal.updated_at.isoformat() if deal.updated_at else datetime.utcnow().isoformat()
    created_at = deal.created_at.isoformat() if deal.created_at else updated_at
    expires_at = deal.expires_at.isoformat() if deal.expires_at else None
    
    product_schema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": deal.title,
        "description": (deal.description or f"{deal.title} available at {deal.store}") + " Prices and availability subject to change.",
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
            "availability": "https://schema.org/InStock",
            "seller": {
                "@type": "Organization",
                "name": deal.store
            }
        },
        "datePublished": created_at,
        "dateModified": updated_at
    }
    
    if expires_at:
        product_schema["offers"]["priceValidUntil"] = expires_at
    
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
                "item": f"{base_url}/category/{_slugify(deal.category)}"
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
                "text": f"This deal was listed at ${sale_price:.2f} (originally ${original_price:.2f}) when verified. Prices and availability are subject to change."
            }
        },
        {
            "@type": "Question",
            "name": f"Is this {deal.store} deal verified?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": f"This deal has been verified by DealSphere's AI validation system. However, prices and availability may change at any time."
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
    <meta name="article:published_time" content="{created_at}" />
    
    <script type="application/ld+json">{json.dumps(product_schema)}</script>
    <script type="application/ld+json">{json.dumps(breadcrumb_schema)}</script>
    <script type="application/ld+json">{json.dumps(faq_schema)}</script>
'''
    return meta_tags


def generate_home_seo(base_url: str, deal_count: int = 0) -> str:
    meta_title = "DealSphere - AI-Verified Deals, Coupons & Discounts"
    meta_description = f"Discover {deal_count}+ AI-verified deals and coupons from top stores. Find discounts on electronics, fashion, home & more. Updated daily."
    og_image = f"{base_url}{DEFAULT_OG_IMAGE_PATH}"
    
    website_schema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "DealSphere",
        "url": base_url,
        "description": "AI-powered deals and coupons platform aggregating verified discounts from top stores.",
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
        "logo": f"{base_url}{DEFAULT_OG_IMAGE_PATH}",
        "description": "AI-powered deals aggregation platform that verifies and curates top online deals and coupons from top retailers.",
        "foundingDate": "2025",
        "knowsAbout": ["deals", "coupons", "discounts", "online shopping", "price comparison", "AI deal verification"]
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
    <meta property="og:image" content="{og_image}" />
    <meta property="og:url" content="{base_url}/" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="DealSphere" />
    
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="{meta_title}" />
    <meta name="twitter:description" content="{escape_html(meta_description)}" />
    <meta name="twitter:image" content="{og_image}" />
    
    <script type="application/ld+json">{json.dumps(website_schema)}</script>
    <script type="application/ld+json">{json.dumps(org_schema)}</script>
    <script type="application/ld+json">{json.dumps(breadcrumb_schema)}</script>
'''
    return meta_tags


def generate_category_seo(category_name: str, category_slug: str, base_url: str, deal_count: int = 0) -> str:
    meta_title = f"{category_name} Deals & Coupons | DealSphere"
    meta_description = f"Browse {deal_count}+ AI-verified {category_name.lower()} deals and coupons. Find verified discounts on {category_name.lower()} products from top stores. Updated daily."
    category_url = f"{base_url}/category/{category_slug}"
    og_image = f"{base_url}{DEFAULT_OG_IMAGE_PATH}"
    
    collection_schema = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": f"{category_name} Deals",
        "description": f"Top {category_name.lower()} deals, coupons, and discounts curated and verified by AI.",
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
    <meta property="og:image" content="{og_image}" />
    <meta property="og:url" content="{category_url}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="DealSphere" />
    
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="{escape_html(meta_title)}" />
    <meta name="twitter:description" content="{escape_html(meta_description)}" />
    <meta name="twitter:image" content="{og_image}" />
    
    <script type="application/ld+json">{json.dumps(collection_schema)}</script>
    <script type="application/ld+json">{json.dumps(breadcrumb_schema)}</script>
'''
    return meta_tags


def generate_category_seo_with_deals(category_name: str, category_slug: str, base_url: str, deal_count: int = 0, deals: list = None) -> str:
    meta_title = f"{category_name} Deals & Coupons | DealSphere"
    meta_description = f"Browse {deal_count}+ AI-verified {category_name.lower()} deals and coupons. Find verified discounts on {category_name.lower()} products from top stores. Updated daily."
    category_url = f"{base_url}/category/{category_slug}"
    og_image = f"{base_url}{DEFAULT_OG_IMAGE_PATH}"
    
    collection_schema = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": f"{category_name} Deals",
        "description": f"Top {category_name.lower()} deals, coupons, and discounts curated and verified by AI.",
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
    
    schemas = [collection_schema, breadcrumb_schema]
    
    if deals:
        item_list = {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": f"{category_name} Deals",
            "numberOfItems": deal_count,
            "itemListElement": []
        }
        for i, deal in enumerate(deals[:10]):
            sale_price = float(deal.sale_price) if deal.sale_price else 0
            item_list["itemListElement"].append({
                "@type": "ListItem",
                "position": i + 1,
                "url": f"{base_url}/deals/{deal.id}",
                "name": deal.title
            })
        schemas.append(item_list)
    
    schema_tags = "\n    ".join(
        f'<script type="application/ld+json">{json.dumps(s)}</script>' for s in schemas
    )
    
    meta_tags = f'''
    <title>{escape_html(meta_title)}</title>
    <meta name="description" content="{escape_html(meta_description)}" />
    <link rel="canonical" href="{category_url}" />
    <meta name="robots" content="index, follow" />
    
    <meta property="og:title" content="{escape_html(meta_title)}" />
    <meta property="og:description" content="{escape_html(meta_description)}" />
    <meta property="og:image" content="{og_image}" />
    <meta property="og:url" content="{category_url}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="DealSphere" />
    
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="{escape_html(meta_title)}" />
    <meta name="twitter:description" content="{escape_html(meta_description)}" />
    <meta name="twitter:image" content="{og_image}" />
    
    {schema_tags}
'''
    return meta_tags


def generate_about_seo(base_url: str) -> str:
    meta_title = "About DealSphere - AI-Powered Deals & Coupons Platform"
    meta_description = "DealSphere uses artificial intelligence to find, verify, and curate verified deals and coupons from top online stores. Learn about our mission to save you money."
    about_url = f"{base_url}/about"
    og_image = f"{base_url}{DEFAULT_OG_IMAGE_PATH}"
    
    org_schema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "DealSphere",
        "url": base_url,
        "logo": f"{base_url}{DEFAULT_OG_IMAGE_PATH}",
        "description": "AI-powered deals aggregation platform that verifies and curates top online deals and coupons from top retailers.",
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
    
    faq_schema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "Is DealSphere free to use?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, DealSphere is completely free for shoppers. We earn a small commission from affiliate networks when you purchase through our links, at no extra cost to you."
                }
            },
            {
                "@type": "Question",
                "name": "How often are deals updated?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Our system checks for new deals multiple times per day. Deals are updated continuously to ensure pricing accuracy and availability."
                }
            },
            {
                "@type": "Question",
                "name": "What makes DealSphere different from other deal sites?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Unlike traditional deal sites that rely on manual curation, DealSphere uses AI to validate every deal. This means fewer expired or misleading offers, and a higher quality selection of genuine discounts."
                }
            },
            {
                "@type": "Question",
                "name": "Which stores does DealSphere cover?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "We aggregate deals from major retailers including Amazon, Walmart, Target, Best Buy, Macy's, Nike, and hundreds more through our affiliate network partnerships."
                }
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
    <meta property="og:image" content="{og_image}" />
    <meta property="og:url" content="{about_url}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="DealSphere" />
    
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="{meta_title}" />
    <meta name="twitter:description" content="{meta_description}" />
    <meta name="twitter:image" content="{og_image}" />
    
    <script type="application/ld+json">{json.dumps(org_schema)}</script>
    <script type="application/ld+json">{json.dumps(breadcrumb_schema)}</script>
    <script type="application/ld+json">{json.dumps(faq_schema)}</script>
'''
    return meta_tags


def generate_contact_seo(base_url: str) -> str:
    meta_title = "Contact DealSphere - Get in Touch | Support & Feedback"
    meta_description = "Contact the DealSphere team for support, partnership inquiries, or feedback. We're here to help you find great deals and coupons."
    contact_url = f"{base_url}/contact"
    og_image = f"{base_url}{DEFAULT_OG_IMAGE_PATH}"
    
    contact_schema = {
        "@context": "https://schema.org",
        "@type": "ContactPage",
        "name": "Contact DealSphere",
        "description": "Get in touch with the DealSphere team for support, partnerships, or feedback.",
        "url": contact_url,
        "mainEntity": {
            "@type": "Organization",
            "name": "DealSphere",
            "email": "support@dealsphere.com",
            "contactPoint": [
                {
                    "@type": "ContactPoint",
                    "contactType": "customer support",
                    "email": "support@dealsphere.com"
                },
                {
                    "@type": "ContactPoint",
                    "contactType": "partnerships",
                    "email": "partners@dealsphere.com"
                }
            ]
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
    <meta property="og:image" content="{og_image}" />
    <meta property="og:url" content="{contact_url}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="DealSphere" />
    
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="{meta_title}" />
    <meta name="twitter:description" content="{meta_description}" />
    <meta name="twitter:image" content="{og_image}" />
    
    <script type="application/ld+json">{json.dumps(contact_schema)}</script>
    <script type="application/ld+json">{json.dumps(breadcrumb_schema)}</script>
'''
    return meta_tags


def generate_blog_seo(base_url: str) -> str:
    meta_title = "Deal Guides & Shopping Tips - DealSphere Blog"
    meta_description = "Expert shopping guides, deal-finding tips, and money-saving strategies. Learn how to maximize your savings with AI-verified deals and coupons."
    blog_url = f"{base_url}/blog"
    og_image = f"{base_url}{DEFAULT_OG_IMAGE_PATH}"
    
    blog_schema = {
        "@context": "https://schema.org",
        "@type": "Blog",
        "name": "DealSphere Blog",
        "description": "Expert shopping guides, deal-finding tips, and money-saving strategies.",
        "url": blog_url,
        "publisher": {
            "@type": "Organization",
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
    <meta property="og:image" content="{og_image}" />
    <meta property="og:url" content="{blog_url}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="DealSphere" />
    
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="{meta_title}" />
    <meta name="twitter:description" content="{meta_description}" />
    <meta name="twitter:image" content="{og_image}" />
    
    <script type="application/ld+json">{json.dumps(blog_schema)}</script>
    <script type="application/ld+json">{json.dumps(breadcrumb_schema)}</script>
'''
    return meta_tags


def generate_blog_article_seo(article_id: str, title: str, excerpt: str, date: str, category: str, base_url: str) -> str:
    article_url = f"{base_url}/blog/{article_id}"
    og_image = f"{base_url}{DEFAULT_OG_IMAGE_PATH}"
    meta_title = f"{title} | DealSphere Blog"
    
    article_schema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": title,
        "description": excerpt,
        "url": article_url,
        "datePublished": date,
        "dateModified": date,
        "author": {
            "@type": "Organization",
            "name": "DealSphere"
        },
        "publisher": {
            "@type": "Organization",
            "name": "DealSphere",
            "url": base_url,
            "logo": {
                "@type": "ImageObject",
                "url": f"{base_url}{DEFAULT_OG_IMAGE_PATH}"
            }
        },
        "image": og_image,
        "articleSection": category,
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": article_url
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
                "name": "Blog",
                "item": f"{base_url}/blog"
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": title,
                "item": article_url
            }
        ]
    }
    
    meta_tags = f'''
    <title>{escape_html(meta_title)}</title>
    <meta name="description" content="{escape_html(excerpt)}" />
    <link rel="canonical" href="{article_url}" />
    <meta name="robots" content="index, follow" />
    
    <meta property="og:title" content="{escape_html(meta_title)}" />
    <meta property="og:description" content="{escape_html(excerpt)}" />
    <meta property="og:image" content="{og_image}" />
    <meta property="og:url" content="{article_url}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="DealSphere" />
    <meta property="article:published_time" content="{date}" />
    <meta property="article:section" content="{escape_html(category)}" />
    
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="{escape_html(meta_title)}" />
    <meta name="twitter:description" content="{escape_html(excerpt)}" />
    <meta name="twitter:image" content="{og_image}" />
    
    <script type="application/ld+json">{json.dumps(article_schema)}</script>
    <script type="application/ld+json">{json.dumps(breadcrumb_schema)}</script>
'''
    return meta_tags


def generate_generic_seo(page_title: str, page_description: str, page_url: str, base_url: str) -> str:
    og_image = f"{base_url}{DEFAULT_OG_IMAGE_PATH}"
    
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
    <meta property="og:image" content="{og_image}" />
    <meta property="og:url" content="{page_url}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="DealSphere" />
    
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="{escape_html(page_title)}" />
    <meta name="twitter:description" content="{escape_html(page_description)}" />
    <meta name="twitter:image" content="{og_image}" />
    
    <script type="application/ld+json">{json.dumps(breadcrumb_schema)}</script>
'''
    return meta_tags


def inject_seo_into_html(html_content: str, seo_tags: str) -> str:
    return html_content.replace('</head>', f'{seo_tags}</head>')
