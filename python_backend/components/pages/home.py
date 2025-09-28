from reactpy import component, html, hooks
import asyncio
from ..deal_card import DealCard
from ..ui.button import Button
from ..ui.card import Card, CardContent
from ..ui.input import Input
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from database import get_db
from services.deals_service import DealsService
from sqlalchemy import func, select
from models import Deal

@component
def HeadContent():
    """Head content with CSS and meta tags"""
    return html.head(
        html.title("DealSphere - AI-Powered Deals Platform"),
        html.meta({"charset": "utf-8"}),
        html.meta({"name": "viewport", "content": "width=device-width, initial-scale=1"}),
        html.meta({"name": "description", "content": "Discover amazing deals and save big with our AI-powered deals platform"}),
        # Tailwind CSS via CDN - no Node.js build needed!
        html.script({"src": "https://cdn.tailwindcss.com"}),
        # Custom styles
        html.link({"rel": "stylesheet", "href": "/static/styles.css"}),
        # Favicon
        html.link({"rel": "icon", "href": "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🛍️</text></svg>"})
    )

@component
def Home():
    """Main home page component with deals listing"""
    
    # State management
    deals, set_deals = hooks.use_state([])
    loading, set_loading = hooks.use_state(True)
    selected_category, set_selected_category = hooks.use_state("all")
    selected_store, set_selected_store = hooks.use_state("all")
    search_query, set_search_query = hooks.use_state("")
    deals_count, set_deals_count = hooks.use_state(0)
    
    # Fetch deals directly from database
    async def fetch_deals():
        try:
            async for db_session in get_db():
                deals_service = DealsService(db_session)
                deals_data = await deals_service.get_deals(
                    limit=100, 
                    offset=0, 
                    only_approved=True
                )
                # Convert to dicts for ReactPy
                deals_list = []
                for deal in deals_data:
                    deals_list.append({
                        'id': deal.id,
                        'title': deal.title,
                        'description': deal.description,
                        'store': deal.store,
                        'category': deal.category,
                        'deal_type': deal.deal_type,
                        'original_price': deal.original_price,
                        'sale_price': deal.sale_price,
                        'discount_percentage': deal.discount_percentage,
                        'image_url': deal.image_url,
                        'affiliate_url': deal.affiliate_url,
                        'is_active': deal.is_active,
                        'is_ai_approved': deal.is_ai_approved
                    })
                set_deals(deals_list)
                set_loading(False)
                break
        except Exception as e:
            print(f"Error fetching deals: {e}")
            set_loading(False)
    
    # Fetch deals count directly from database
    async def fetch_deals_count():
        try:
            async for db_session in get_db():
                result = await db_session.execute(
                    select(func.count(Deal.id)).where(
                        Deal.is_active == True,
                        Deal.is_ai_approved == True
                    )
                )
                count = result.scalar() or 0
                set_deals_count(count)
                break
        except Exception as e:
            print(f"Error fetching deals count: {e}")
    
    # Load data on component mount
    def load_data():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(fetch_deals())
            loop.run_until_complete(fetch_deals_count())
        finally:
            loop.close()
    
    hooks.use_effect(load_data, [])
    
    # Filter deals based on search and filters
    filtered_deals = deals
    if search_query:
        filtered_deals = [deal for deal in filtered_deals if search_query.lower() in deal.get('title', '').lower()]
    if selected_category != "all":
        filtered_deals = [deal for deal in filtered_deals if deal.get('category') == selected_category]
    if selected_store != "all":
        filtered_deals = [deal for deal in filtered_deals if deal.get('store') == selected_store]
    
    # Separate deals by type
    top_deals = [deal for deal in filtered_deals if deal.get('deal_type') == 'top'][:3]
    hot_deals = [deal for deal in filtered_deals if deal.get('deal_type') == 'hot'][:4]
    latest_deals = [deal for deal in filtered_deals if deal.get('deal_type') in ['latest', 'regular']][:25]
    
    # Get unique categories and stores for filters
    categories = list(set([deal.get('category', '') for deal in deals if deal.get('category')]))
    stores = list(set([deal.get('store', '') for deal in deals if deal.get('store')]))
    
    if loading:
        return html.div(
            {"class": "min-h-screen bg-gray-50 flex items-center justify-center"},
            html.div(
                {"class": "text-center"},
                html.div({"class": "animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"}),
                html.p({"class": "mt-4 text-gray-600"}, "Loading amazing deals...")
            )
        )
    
    return html.html(
        HeadContent(),
        html.body(
            {"class": "min-h-screen bg-gray-50"},
        
        # Header
        html.header(
            {"class": "bg-white shadow-sm border-b"},
            html.div(
                {"class": "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"},
                html.div(
                    {"class": "flex items-center justify-between h-16"},
                    # Logo
                    html.div(
                        {"class": "flex items-center"},
                        html.h1(
                            {"class": "text-2xl font-bold text-blue-600"},
                            "DealSphere"
                        )
                    ),
                    # Navigation
                    html.nav(
                        {"class": "hidden md:flex space-x-8"},
                        html.a(
                            {"href": "/", "class": "text-gray-900 hover:text-blue-600"},
                            "Home"
                        ),
                        html.a(
                            {"href": "/admin", "class": "text-gray-500 hover:text-blue-600"},
                            "Admin"
                        )
                    )
                )
            )
        ),
        
        # Hero Section
        html.section(
            {"class": "bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20"},
            html.div(
                {"class": "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"},
                html.h1(
                    {"class": "text-4xl md:text-6xl font-bold mb-6"},
                    "Amazing Deals Await!"
                ),
                html.p(
                    {"class": "text-xl md:text-2xl mb-8 text-blue-100"},
                    "Discover thousands of verified deals and save big on your favorite products"
                ),
                html.div(
                    {"class": "grid grid-cols-1 md:grid-cols-3 gap-8 mt-12"},
                    html.div(
                        {"class": "text-center"},
                        html.div({"class": "text-3xl font-bold"}, str(deals_count)),
                        html.div({"class": "text-blue-200"}, "Active Deals")
                    ),
                    html.div(
                        {"class": "text-center"},
                        html.div({"class": "text-3xl font-bold"}, "100%"),
                        html.div({"class": "text-blue-200"}, "AI Verified")
                    ),
                    html.div(
                        {"class": "text-center"},
                        html.div({"class": "text-3xl font-bold"}, "24/7"),
                        html.div({"class": "text-blue-200"}, "Updated")
                    )
                )
            )
        ),
        
        # Search and Filters
        html.section(
            {"class": "py-8 bg-white border-b"},
            html.div(
                {"class": "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"},
                html.div(
                    {"class": "flex flex-col md:flex-row gap-4 items-center"},
                    # Search
                    html.div(
                        {"class": "flex-1"},
                        Input(
                            placeholder="Search for deals...",
                            value=search_query,
                            on_change=lambda event: set_search_query(event["target"]["value"]),
                            class_name="w-full"
                        )
                    ),
                    # Filters
                    html.div(
                        {"class": "flex gap-4"},
                        # Category filter
                        html.select(
                            {
                                "class": "px-4 py-2 border rounded-md",
                                "value": selected_category,
                                "on_change": lambda event: set_selected_category(event["target"]["value"])
                            },
                            html.option({"value": "all"}, "All Categories"),
                            *[html.option({"value": cat}, cat) for cat in categories]
                        ),
                        # Store filter
                        html.select(
                            {
                                "class": "px-4 py-2 border rounded-md",
                                "value": selected_store,
                                "on_change": lambda event: set_selected_store(event["target"]["value"])
                            },
                            html.option({"value": "all"}, "All Stores"),
                            *[html.option({"value": store}, store) for store in stores]
                        )
                    )
                )
            )
        ),
        
        # Main Content
        html.main(
            {"class": "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"},
            
            # Top Deals Section
            html.section(
                {"class": "mb-12"},
                html.div(
                    {"class": "flex items-center justify-between mb-6"},
                    html.h2(
                        {"class": "text-2xl font-bold text-gray-900 flex items-center"},
                        "🔥 Top Deals"
                    ),
                    html.span(
                        {"class": "text-sm text-gray-500"},
                        "Editor's picks"
                    )
                ),
                html.div(
                    {"class": "grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"},
                    *[DealCard(deal, variant="full") for deal in top_deals]
                ) if top_deals else html.div(
                    {"class": "text-center text-gray-500 py-8"},
                    "No top deals available"
                )
            ),
            
            # Hot Deals Section
            html.section(
                {"class": "mb-12"},
                html.div(
                    {"class": "flex items-center justify-between mb-6"},
                    html.h2(
                        {"class": "text-2xl font-bold text-gray-900 flex items-center"},
                        "🌶️ Hot Deals"
                    ),
                    html.span(
                        {"class": "text-sm text-gray-500"},
                        "Trending now"
                    )
                ),
                html.div(
                    {"class": "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"},
                    *[DealCard(deal, variant="compact") for deal in hot_deals]
                ) if hot_deals else html.div(
                    {"class": "text-center text-gray-500 py-8"},
                    "No hot deals available"
                )
            ),
            
            # Latest Deals Section
            html.section(
                {"class": "mb-12"},
                html.div(
                    {"class": "flex items-center justify-between mb-6"},
                    html.h2(
                        {"class": "text-2xl font-bold text-gray-900 flex items-center"},
                        "🕒 Latest Deals"
                    ),
                    html.span(
                        {"class": "text-sm text-gray-500"},
                        "Just added"
                    )
                ),
                Card(
                    CardContent(
                        html.div(
                            {"class": "divide-y divide-gray-100"},
                            *[DealCard(deal, variant="list") for deal in latest_deals]
                        )
                    )
                ) if latest_deals else html.div(
                    {"class": "text-center text-gray-500 py-8"},
                    "No latest deals available"
                )
            )
        ),
        
        # Footer
        html.footer(
            {"class": "bg-gray-900 text-white py-8"},
            html.div(
                {"class": "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"},
                html.p(
                    {"class": "text-gray-400"},
                    "© 2024 DealSphere. All rights reserved. Built with Python + ReactPy."
                )
            )
        )
        )
    )