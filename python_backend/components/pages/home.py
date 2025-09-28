from reactpy import component, html, hooks
import requests
from ..deal_card import DealCard
from ..ui.button import Button
from ..ui.card import Card, CardContent
from ..ui.input import Input

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
    
    # Fetch deals from API using absolute URLs
    def fetch_deals():
        try:
            response = requests.get('http://localhost:5000/api/deals')
            if response.status_code == 200:
                deals_data = response.json()
                set_deals(deals_data)
            set_loading(False)
        except Exception as e:
            print(f"Error fetching deals: {e}")
            set_loading(False)
    
    # Fetch deals count
    def fetch_deals_count():
        try:
            response = requests.get('http://localhost:5000/api/deals/count')
            if response.status_code == 200:
                count_data = response.json()
                set_deals_count(count_data.get('count', 0))
        except Exception as e:
            print(f"Error fetching deals count: {e}")
    
    # Load data on component mount
    def load_data():
        fetch_deals()
        fetch_deals_count()
    
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