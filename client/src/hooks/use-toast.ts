import * as React from "react"

type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

export const useToast = () => {
  const toast = ({ title, description, variant = "default" }: ToastProps) => {
    // Simple alert implementation
    // In a real app, this would show a proper toast notification
    const message = title ? `${title}: ${description || ''}` : description || '';
    alert(message);
  }

  return { toast }
}