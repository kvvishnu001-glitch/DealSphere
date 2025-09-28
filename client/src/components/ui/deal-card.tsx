import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SocialShare } from "@/components/social-share";
import { Star, Clock, Flame, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Deal {
  id: string;
  title: string;
  description: string;
  original_price: number;
  sale_price: number;
  discount_percentage: number;
  image_url: string;
  affiliate_url: string;
  store: string;
  category: string;
  rating?: number;
  review_count?: number;
  deal_type?: string;
  created_at?: string;
  coupon_code?: string;
  coupon_required?: boolean;
}

interface DealCardProps {
  deal: Deal;
  variant?: "full" | "compact" | "list";
}

export function DealCard({ deal }: DealCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { toast } = useToast();

  // Calculate discount percentage if not provided
  const calculatedPercentage = deal.discount_percentage ||
    Math.round(((deal.original_price - deal.sale_price) / deal.original_price) * 100);

  // Hide the deal card if image failed to load
  if (imageError) {
    return null;
  }

  const handleDealClick = async () => {
    if (isLoading) return;
    await redirectToDeal();
  };

  const redirectToDeal = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/deals/${deal.id}/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();

      // Open affiliate URL in new tab
      window.open(data.affiliate_url || deal.affiliate_url, '_blank');

      toast({
        title: "Deal Opened",
        description: "Redirecting to the deal page...",
      });
    } catch (error) {
      console.error('Failed to track deal click:', error);
      // Fallback: open affiliate URL directly
      window.open(deal.affiliate_url, '_blank');

      toast({
        title: "Deal Opened",
        description: "Redirecting to the deal page...",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: string | number) => {
    return `$${parseFloat(price.toString()).toFixed(2)}`;
  };

  const formatSavings = () => {
    const original = parseFloat(deal.original_price.toString());
    const sale = parseFloat(deal.sale_price.toString());
    return `$${(original - sale).toFixed(2)}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Recently posted";

    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) return "Just posted";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  // Full variant (default)
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
      <div className="relative">
        <Link href={`/deals/${deal.id}`}>
          <img
            src={deal.image_url}
            alt={deal.title}
            className="w-full h-64 object-cover cursor-pointer"
            onError={() => {
              console.log('Image failed to load for deal:', deal.title, deal.image_url);
              setImageError(true);
            }}
            onLoad={() => {}}
          />
        </Link>
        <Badge className="absolute top-3 left-3 bg-red-600 text-white">
          {calculatedPercentage}% OFF
        </Badge>
        {deal.deal_type === "hot" && (
          <Badge className="absolute top-3 right-3 bg-amber-500 text-white">
            <Flame className="w-3 h-3 mr-1" />
            Hot
          </Badge>
        )}
        {deal.deal_type === "top" && (
          <Badge className="absolute top-3 right-3 bg-purple-600 text-white">
            <Bot className="w-3 h-3 mr-1" />
            AI Top
          </Badge>
        )}
        {deal.deal_type === "latest" && (
          <Badge className="absolute top-3 right-3 bg-blue-500 text-white">
            <Clock className="w-3 h-3 mr-1" />
            New
          </Badge>
        )}
      </div>

      <CardContent className="p-6 flex flex-col flex-grow">
        <div className="mb-3">
          <Link href={`/deals/${deal.id}`}>
            <h3 className="text-lg font-semibold text-gray-900 hover:text-red-600 transition-colors line-clamp-2 mb-2 cursor-pointer">
              {deal.title}
            </h3>
          </Link>
          <p className="text-xs text-gray-500 mb-2 flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {formatDate(deal.created_at)}
          </p>
          <p className="text-sm text-gray-600 line-clamp-2">
            {deal.description}
          </p>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-red-600">
              {formatPrice(deal.sale_price)}
            </span>
            <span className="text-lg text-gray-500 line-through">
              {formatPrice(deal.original_price)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-sm text-green-600 font-medium">
              Save {formatSavings()}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">{deal.store}</span>
            <Badge variant="secondary" className="text-xs">
              {deal.category}
            </Badge>
          </div>
          {deal.rating && (
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm text-gray-600">{deal.rating}</span>
              {deal.review_count && (
                <span className="text-xs text-gray-500">({deal.review_count})</span>
              )}
            </div>
          )}
        </div>

        <div className="mt-auto space-y-4">
          <Button
            onClick={handleDealClick}
            disabled={isLoading}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 font-semibold"
            data-testid={`button-get-deal-${deal.id}`}
          >
            {isLoading ? "Loading..." : (deal.coupon_code ? "Get Deal & Copy Code" : "Get Deal")}
          </Button>
          <SocialShare deal={deal} />
        </div>
      </CardContent>
    </Card>
  );
}