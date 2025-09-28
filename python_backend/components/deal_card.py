from reactpy import component, html, hooks
from .ui.card import Card, CardContent
from .ui.button import Button

@component
def DealCard(deal, variant="full"):
    """Deal card component matching the React version"""
    
    # Calculate discount percentage if not provided
    discount = deal.get('discount_percentage', 0)
    if not discount and deal.get('original_price') and deal.get('sale_price'):
        original = float(deal['original_price'])
        sale = float(deal['sale_price'])
        discount = round(((original - sale) / original) * 100)
    
    # Handle deal click
    def handle_deal_click():
        try:
            # Track click
            requests.post(f"http://localhost:5000/api/deals/{deal['id']}/click")
            # Note: In ReactPy, we need a different approach for opening URLs
            print(f"Deal clicked: {deal['title']} -> {deal['affiliate_url']}")
        except Exception as e:
            print(f"Error tracking click: {e}")
        
    if variant == "compact":
        return html.div(
            {"class": "bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow"},
            html.div(
                {"class": "flex items-center space-x-4"},
                # Deal image
                html.img({
                    "src": deal.get('image_url', ''),
                    "alt": deal.get('title', ''),
                    "class": "w-16 h-16 object-cover rounded-md"
                }),
                # Deal info
                html.div(
                    {"class": "flex-1 min-w-0"},
                    html.h3({
                        "class": "text-sm font-semibold text-gray-900 truncate"
                    }, deal.get('title', '')),
                    html.p({
                        "class": "text-xs text-gray-500 mt-1"
                    }, deal.get('store', '')),
                    html.div(
                        {"class": "flex items-center space-x-2 mt-2"},
                        html.span({
                            "class": "text-lg font-bold text-green-600"
                        }, f"${float(deal.get('sale_price', 0)):.2f}"),
                        html.span({
                            "class": "text-sm text-gray-500 line-through"
                        }, f"${float(deal.get('original_price', 0)):.2f}"),
                        html.span({
                            "class": "text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full"
                        }, f"{discount}% OFF")
                    )
                ),
                # Action button
                Button(
                    "Get Deal",
                    variant="outline",
                    size="sm",
                    on_click=lambda _: handle_deal_click()
                )
            )
        )
    
    elif variant == "list":
        return html.div(
            {"class": "bg-white border-b last:border-b-0 p-4 hover:bg-gray-50 transition-colors"},
            html.div(
                {"class": "flex items-center space-x-4"},
                # Deal image
                html.img({
                    "src": deal.get('image_url', ''),
                    "alt": deal.get('title', ''),
                    "class": "w-20 h-20 object-cover rounded-md"
                }),
                # Deal content
                html.div(
                    {"class": "flex-1 min-w-0"},
                    html.div(
                        {"class": "flex items-start justify-between"},
                        html.div(
                            {"class": "flex-1"},
                            html.h3({
                                "class": "text-sm font-semibold text-gray-900 mb-1"
                            }, deal.get('title', '')),
                            html.p({
                                "class": "text-xs text-gray-600 mb-2 line-clamp-2"
                            }, deal.get('description', '')),
                            html.div(
                                {"class": "flex items-center space-x-3"},
                                html.span({
                                    "class": "text-lg font-bold text-green-600"
                                }, f"${float(deal.get('sale_price', 0)):.2f}"),
                                html.span({
                                    "class": "text-sm text-gray-500 line-through"
                                }, f"${float(deal.get('original_price', 0)):.2f}"),
                                html.span({
                                    "class": "text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full"
                                }, f"{discount}% OFF"),
                                html.span({
                                    "class": "text-xs text-gray-500"
                                }, deal.get('store', ''))
                            )
                        ),
                        Button(
                            "Get Deal",
                            variant="outline",
                            on_click=lambda _: handle_deal_click()
                        )
                    )
                )
            )
        )
    
    else:  # full variant
        return Card(
            html.div(
                {"class": "relative"},
                # Deal image
                html.div(
                    {"class": "aspect-video relative overflow-hidden rounded-t-lg"},
                    html.img({
                        "src": deal.get('image_url', ''),
                        "alt": deal.get('title', ''),
                        "class": "w-full h-full object-cover"
                    }),
                    # Discount badge
                    html.div(
                        {"class": "absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-semibold"},
                        f"{discount}% OFF"
                    )
                ),
                # Deal content
                CardContent(
                    html.div(
                        {"class": "space-y-3"},
                        html.h3({
                            "class": "font-semibold text-gray-900 line-clamp-2"
                        }, deal.get('title', '')),
                        html.p({
                            "class": "text-sm text-gray-600 line-clamp-2"
                        }, deal.get('description', '')),
                        # Price section
                        html.div(
                            {"class": "flex items-center justify-between"},
                            html.div(
                                {"class": "space-y-1"},
                                html.div(
                                    {"class": "flex items-center space-x-2"},
                                    html.span({
                                        "class": "text-2xl font-bold text-green-600"
                                    }, f"${float(deal.get('sale_price', 0)):.2f}"),
                                    html.span({
                                        "class": "text-lg text-gray-500 line-through"
                                    }, f"${float(deal.get('original_price', 0)):.2f}")
                                ),
                                html.p({
                                    "class": "text-sm text-gray-500"
                                }, f"Save ${float(deal.get('original_price', 0)) - float(deal.get('sale_price', 0)):.2f}")
                            )
                        ),
                        # Store info
                        html.div(
                            {"class": "flex items-center justify-between pt-2 border-t"},
                            html.span({
                                "class": "text-sm text-gray-600"
                            }, deal.get('store', '')),
                            html.span({
                                "class": "text-xs text-gray-500"
                            }, deal.get('category', ''))
                        ),
                        # Action button
                        Button(
                            "Get This Deal",
                            class_name="w-full mt-4",
                            on_click=lambda _: handle_deal_click()
                        )
                    )
                )
            )
        )