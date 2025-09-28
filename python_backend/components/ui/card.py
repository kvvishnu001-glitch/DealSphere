from reactpy import component, html

@component
def Card(children, class_name=""):
    """Card component with Tailwind CSS styling"""
    card_classes = f"rounded-lg border bg-card text-card-foreground shadow-sm {class_name}"
    
    return html.div(
        {"class": card_classes},
        children
    )

@component  
def CardHeader(children, class_name=""):
    """Card header component"""
    header_classes = f"flex flex-col space-y-1.5 p-6 {class_name}"
    
    return html.div(
        {"class": header_classes},
        children
    )

@component
def CardTitle(children, class_name=""):
    """Card title component"""
    title_classes = f"text-2xl font-semibold leading-none tracking-tight {class_name}"
    
    return html.h3(
        {"class": title_classes},
        children
    )

@component
def CardContent(children, class_name=""):
    """Card content component"""
    content_classes = f"p-6 pt-0 {class_name}"
    
    return html.div(
        {"class": content_classes},
        children
    )