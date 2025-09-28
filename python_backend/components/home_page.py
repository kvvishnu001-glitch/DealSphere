from reactpy import component, html, hooks
from reactpy.backend.fastapi import use_connection
import asyncio
import aiohttp

@component
def HomePage():
    # State management using ReactPy hooks
    deals, set_deals = hooks.use_state([])
    loading, set_loading = hooks.use_state(True)
    selected_category, set_selected_category = hooks.use_state("all")
    selected_store, set_selected_store = hooks.use_state("all")
    search_query, set_search_query = hooks.use_state("")
    
    # Fetch deals on component mount
    async def fetch_deals():
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get("http://localhost:5000/api/deals") as response:
                    if response.status == 200:
                        deals_data = await response.json()
                        set_deals(deals_data)
        except Exception as e:
            print(f"Error fetching deals: {e}")
        finally:
            set_loading(False)
    
    hooks.use_effect(lambda: asyncio.create_task(fetch_deals()), [])
    
    # Filter deals based on search and filters
    filtered_deals = deals
    
    if search_query:
        filtered_deals = [deal for deal in filtered_deals 
                         if search_query.lower() in deal.get('title', '').lower()]
    
    if selected_category != "all":
        filtered_deals = [deal for deal in filtered_deals 
                         if deal.get('category') == selected_category]
    
    if selected_store != "all":
        filtered_deals = [deal for deal in filtered_deals 
                         if deal.get('store') == selected_store]
    
    # Separate deals by type
    top_deals = [deal for deal in filtered_deals if deal.get('dealType') == 'top'][:3]
    hot_deals = [deal for deal in filtered_deals if deal.get('dealType') == 'hot'][:4]
    latest_deals = [deal for deal in filtered_deals if deal.get('dealType') in ['latest', 'regular']][:10]
    
    if loading:
        return html.div(
            {"class": "min-h-screen bg-gray-50 flex items-center justify-center"},
            html.div(
                {"class": "text-center"},
                html.div({"class": "animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"}),
                html.p({"class": "mt-4 text-gray-600"}, "Loading amazing deals...")
            )
        )
    
    return html.div(
        {"class": "min-h-screen bg-gray-50"},
        
        # Header Section
        html.header(
            {"class": "bg-white shadow-sm border-b border-gray-200"},
            html.div(
                {"class": "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4"},
                html.div(
                    {"class": "flex items-center justify-between"},
                    # Logo
                    html.div(
                        {"class": "flex items-center space-x-3"},
                        html.div(
                            {"class": "bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg"},
                            html.span({"class": "text-white text-xl font-bold"}, "💰")
                        ),
                        html.h1({"class": "text-2xl font-bold text-gray-900"}, "DealSphere")
                    ),
                    # Search Bar
                    html.div(
                        {"class": "flex-1 max-w-lg mx-8"},
                        html.div(
                            {"class": "relative"},
                            html.input({
                                "type": "text",
                                "placeholder": "Search deals...",
                                "class": "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                                "value": search_query,
                                "on_change": lambda event: set_search_query(event["target"]["value"])
                            }),
                            html.div(
                                {"class": "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"},
                                html.span({"class": "text-gray-400"}, "🔍")
                            )
                        )
                    )
                )
            )
        ),
        
        # Main Content
        html.main(
            {"class": "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"},
            
            # Hero Section
            html.section(
                {"class": "text-center mb-12"},
                html.h2({"class": "text-4xl font-bold text-gray-900 mb-4"}, "🎯 Amazing Deals Await!"),
                html.p({"class": "text-xl text-gray-600 mb-6"}, f"Discover {len(deals)} hand-picked deals with AI-verified savings"),
                html.div(
                    {"class": "flex justify-center space-x-8 text-sm text-gray-500"},
                    html.div({"class": "flex items-center"}, "✅ AI-Verified"),
                    html.div({"class": "flex items-center"}, "🔄 Real-time Updates"),
                    html.div({"class": "flex items-center"}, "💰 Best Prices")
                )
            ),
            
            # Filters
            html.section(
                {"class": "mb-8"},
                html.div(
                    {"class": "flex flex-wrap gap-4 items-center justify-center"},
                    # Category Filter
                    html.select({
                        "class": "px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500",
                        "value": selected_category,
                        "on_change": lambda event: set_selected_category(event["target"]["value"])
                    },
                        html.option({"value": "all"}, "All Categories"),
                        html.option({"value": "Electronics"}, "Electronics"),
                        html.option({"value": "Home & Garden"}, "Home & Garden"),
                        html.option({"value": "Fashion"}, "Fashion"),
                        html.option({"value": "Books"}, "Books")
                    ),
                    # Store Filter
                    html.select({
                        "class": "px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500",
                        "value": selected_store,
                        "on_change": lambda event: set_selected_store(event["target"]["value"])
                    },
                        html.option({"value": "all"}, "All Stores"),
                        html.option({"value": "Amazon"}, "Amazon"),
                        html.option({"value": "Best Buy"}, "Best Buy"),
                        html.option({"value": "Target"}, "Target")
                    )
                )
            ),
            
            # Top Deals Section
            html.section(
                {"class": "mb-12"},
                html.h3({"class": "text-2xl font-bold text-gray-900 mb-6 flex items-center"},
                    html.span({"class": "text-yellow-500 mr-2"}, "⭐"),
                    "Top Deals"
                ),
                html.div(
                    {"class": "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"},
                    [DealCard(deal) for deal in top_deals] if top_deals else [html.p({"class": "text-gray-500 col-span-full text-center"}, "No top deals available")]
                )
            ),
            
            # Hot Deals Section
            html.section(
                {"class": "mb-12"},
                html.h3({"class": "text-2xl font-bold text-gray-900 mb-6 flex items-center"},
                    html.span({"class": "text-red-500 mr-2"}, "🔥"),
                    "Hot Deals"
                ),
                html.div(
                    {"class": "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"},
                    [DealCard(deal) for deal in hot_deals] if hot_deals else [html.p({"class": "text-gray-500 col-span-full text-center"}, "No hot deals available")]
                )
            ),
            
            # Latest Deals Section
            html.section(
                {"class": "mb-12"},
                html.h3({"class": "text-2xl font-bold text-gray-900 mb-6 flex items-center"},
                    html.span({"class": "text-blue-500 mr-2"}, "🕐"),
                    "Latest Deals"
                ),
                html.div(
                    {"class": "space-y-4"},
                    [DealListItem(deal) for deal in latest_deals] if latest_deals else [html.p({"class": "text-gray-500 text-center"}, "No latest deals available")]
                )
            )
        ),
        
        # Footer
        html.footer(
            {"class": "bg-gray-800 text-white py-8 mt-12"},
            html.div(
                {"class": "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"},
                html.p({"class": "text-gray-400"}, "© 2024 DealSphere. All rights reserved."),
                html.p({"class": "text-gray-400 mt-2"}, "Powered by AI | Built with Python & ReactPy")
            )
        )
    )

@component 
def DealCard(deal):
    """Card component for grid layout deals"""
    def handle_click():
        # Track click and open affiliate URL
        window = use_connection().location
        window.open(deal.get('affiliateUrl', '#'), '_blank')
    
    discount = deal.get('discountPercentage', 0)
    original_price = float(deal.get('originalPrice', 0))
    sale_price = float(deal.get('salePrice', 0))
    
    return html.div(
        {"class": "bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer",
         "on_click": lambda _: handle_click()},
        html.div(
            {"class": "relative"},
            html.img({
                "src": deal.get('imageUrl', 'https://via.placeholder.com/300x200'),
                "alt": deal.get('title', ''),
                "class": "w-full h-48 object-cover rounded-t-lg"
            }),
            html.div(
                {"class": "absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-bold"},
                f"{discount}% OFF"
            )
        ),
        html.div(
            {"class": "p-4"},
            html.h4({"class": "font-semibold text-gray-900 mb-2 line-clamp-2"}, deal.get('title', '')),
            html.p({"class": "text-gray-600 text-sm mb-3 line-clamp-2"}, deal.get('description', '')),
            html.div(
                {"class": "flex items-center justify-between"},
                html.div(
                    {"class": "flex items-center space-x-2"},
                    html.span({"class": "text-2xl font-bold text-green-600"}, f"${sale_price:.2f}"),
                    html.span({"class": "text-gray-500 line-through text-sm"}, f"${original_price:.2f}")
                ),
                html.span({"class": "text-blue-600 text-sm font-medium"}, deal.get('store', ''))
            )
        )
    )

@component
def DealListItem(deal):
    """List item component for latest deals"""
    def handle_click():
        window = use_connection().location
        window.open(deal.get('affiliateUrl', '#'), '_blank')
    
    discount = deal.get('discountPercentage', 0)
    original_price = float(deal.get('originalPrice', 0))
    sale_price = float(deal.get('salePrice', 0))
    
    return html.div(
        {"class": "bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer p-4 flex items-center space-x-4",
         "on_click": lambda _: handle_click()},
        html.img({
            "src": deal.get('imageUrl', 'https://via.placeholder.com/80x80'),
            "alt": deal.get('title', ''),
            "class": "w-20 h-20 object-cover rounded-lg flex-shrink-0"
        }),
        html.div(
            {"class": "flex-1"},
            html.h4({"class": "font-semibold text-gray-900 mb-1"}, deal.get('title', '')),
            html.p({"class": "text-gray-600 text-sm mb-2 line-clamp-1"}, deal.get('description', '')),
            html.div(
                {"class": "flex items-center justify-between"},
                html.div(
                    {"class": "flex items-center space-x-2"},
                    html.span({"class": "text-xl font-bold text-green-600"}, f"${sale_price:.2f}"),
                    html.span({"class": "text-gray-500 line-through text-sm"}, f"${original_price:.2f}")
                ),
                html.div(
                    {"class": "flex items-center space-x-2"},
                    html.span({"class": "bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium"}, f"{discount}% OFF"),
                    html.span({"class": "text-blue-600 text-sm"}, deal.get('store', ''))
                )
            )
        )
    )