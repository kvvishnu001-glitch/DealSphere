from reactpy import component, html

@component
def Button(children, variant="default", size="default", on_click=None, class_name="", disabled=False):
    """Button component with Tailwind CSS styling"""
    
    # Base button classes
    base_classes = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    
    # Variant classes
    variant_classes = {
        "default": "bg-primary text-primary-foreground hover:bg-primary/90",
        "destructive": "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        "outline": "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        "secondary": "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        "ghost": "hover:bg-accent hover:text-accent-foreground",
        "link": "text-primary underline-offset-4 hover:underline"
    }
    
    # Size classes  
    size_classes = {
        "default": "h-10 px-4 py-2",
        "sm": "h-9 rounded-md px-3",
        "lg": "h-11 rounded-md px-8",
        "icon": "h-10 w-10"
    }
    
    button_classes = f"{base_classes} {variant_classes.get(variant, variant_classes['default'])} {size_classes.get(size, size_classes['default'])} {class_name}"
    
    return html.button(
        {
            "class": button_classes,
            "on_click": on_click,
            "disabled": disabled
        },
        children
    )