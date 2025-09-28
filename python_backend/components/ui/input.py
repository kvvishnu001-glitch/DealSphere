from reactpy import component, html

@component
def Input(placeholder="", value="", on_change=None, type_="text", class_name="", disabled=False):
    """Input component with Tailwind CSS styling"""
    
    input_classes = f"flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 {class_name}"
    
    return html.input({
        "type": type_,
        "placeholder": placeholder,
        "value": value,
        "on_change": on_change,
        "class": input_classes,
        "disabled": disabled
    })