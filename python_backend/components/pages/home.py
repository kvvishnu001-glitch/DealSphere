from reactpy import component, html, hooks

@component
def Home():
    """Main home page component with deals listing"""
    
    # State management
    deals, set_deals = hooks.use_state([])
    loading, set_loading = hooks.use_state(True)
    deals_count, set_deals_count = hooks.use_state(0)
    
    # Load sample data
    def load_data():
        sample_deals = [
            {
                'id': '1',
                'title': 'Apple MacBook Air M2',
                'description': 'Latest Apple MacBook with M2 chip',
                'store': 'Apple Store',
                'category': 'Electronics',
                'deal_type': 'top',
                'original_price': 1199.00,
                'sale_price': 999.00,
                'discount_percentage': 17,
                'image_url': 'https://via.placeholder.com/300x200?text=MacBook',
                'affiliate_url': 'https://apple.com',
                'is_active': True,
                'is_ai_approved': True
            },
            {
                'id': '2', 
                'title': 'Nike Air Force 1',
                'description': 'Classic white sneakers',
                'store': 'Nike',
                'category': 'Fashion',
                'deal_type': 'hot',
                'original_price': 90.00,
                'sale_price': 70.00,
                'discount_percentage': 22,
                'image_url': 'https://via.placeholder.com/300x200?text=Nike',
                'affiliate_url': 'https://nike.com',
                'is_active': True,
                'is_ai_approved': True
            }
        ]
        set_deals(sample_deals)
        set_deals_count(2)
        set_loading(False)
    
    hooks.use_effect(load_data, [])
    
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
        html.header(
            {"class": "bg-white shadow-sm border-b"},
            html.div(
                {"class": "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"},
                html.div(
                    {"class": "flex items-center justify-between h-16"},
                    html.h1(
                        {"class": "text-xl font-bold text-gray-900"},
                        "🛍️ DealSphere"
                    ),
                    html.div(
                        {"class": "text-sm text-gray-500"},
                        f"{deals_count} deals available"
                    )
                )
            )
        ),
        html.main(
            {"class": "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"},
            html.h2(
                {"class": "text-2xl font-bold text-gray-900 mb-6"},
                "Featured Deals"
            ),
            html.div(
                {"class": "grid gap-6 grid-cols-1 md:grid-cols-2"},
                *[
                    html.div(
                        {"class": "bg-white rounded-lg shadow-sm border p-6"},
                        html.h3(
                            {"class": "text-lg font-semibold text-gray-900 mb-2"},
                            deal['title']
                        ),
                        html.p(
                            {"class": "text-gray-600 mb-4"},
                            deal['description']
                        ),
                        html.div(
                            {"class": "flex items-center justify-between"},
                            html.div(
                                {"class": "flex items-center space-x-2"},
                                html.span(
                                    {"class": "text-lg font-bold text-green-600"},
                                    f"${deal['sale_price']:.2f}"
                                ),
                                html.span(
                                    {"class": "text-sm text-gray-500 line-through"},
                                    f"${deal['original_price']:.2f}"
                                ),
                                html.span(
                                    {"class": "text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full"},
                                    f"{deal['discount_percentage']}% OFF"
                                )
                            ),
                            html.button(
                                {"class": "bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"},
                                "View Deal"
                            )
                        )
                    )
                    for deal in deals
                ]
            )
        ),
        html.footer(
            {"class": "bg-gray-900 text-white py-8 mt-12"},
            html.div(
                {"class": "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"},
                html.p(
                    {"class": "text-gray-400"},
                    "© 2024 DealSphere. All rights reserved. Built with Python + ReactPy."
                )
            )
        )
    )