import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CouponCodeProps {
  code: string;
  variant?: "inline" | "badge" | "modal";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function CouponCode({ code, variant = "inline", size = "md", className }: CouponCodeProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (variant === "badge") {
    return (
      <Badge 
        className={cn("bg-green-100 text-green-800 cursor-pointer hover:bg-green-200", className)}
        onClick={copyToClipboard}
      >
        Code: {code}
      </Badge>
    );
  }

  if (variant === "modal") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex-1 bg-gray-100 rounded-lg p-3 font-mono text-lg text-center tracking-wider">
          {code}
        </div>
        <Button
          onClick={copyToClipboard}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>
    );
  }

  // Default inline variant
  const sizeClasses = {
    sm: "text-sm px-2 py-1",
    md: "text-base px-3 py-2", 
    lg: "text-lg px-4 py-3"
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn(
        "bg-gray-100 rounded border-2 border-dashed border-gray-300 font-mono tracking-wider text-center",
        sizeClasses[size]
      )}>
        {code}
      </div>
      <Button
        onClick={copyToClipboard}
        variant="outline"
        size={size === "sm" ? "sm" : "default"}
        className="flex items-center gap-1"
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        {copied ? "Copied!" : "Copy"}
      </Button>
    </div>
  );
}