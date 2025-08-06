import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SocialShare } from "@/components/social-share";
import { Star, Clock, Flame, Bot } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Deal } from "@shared/schema";

interface DealCardProps {
  deal: Deal;
  variant?: "full" | "compact" | "list";
}

export function DealCard({ deal, variant = "full" }: DealCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDealClick = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', `/api/deals/${deal.id}/click`);
      const data = await response.json();
      
      // Open affiliate URL in new tab
      window.open(data.affiliateUrl, '_blank');
    } catch (error) {
      console.error('Failed to track deal click:', error);
      toast({
        title: "Error",
        description: "Failed to open deal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: string | number) => {
    return `$${parseFloat(price.toString()).toFixed(2)}`;
  };

  const formatSavings = () => {
    const original = parseFloat(deal.originalPrice.toString());
    const sale = parseFloat(deal.salePrice.toString());
    return `$${(original - sale).toFixed(2)}`;
  };

  if (variant === "compact") {
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative">
          <img
            src={deal.imageUrl || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&w=400&h=200&fit=crop"}
            alt={deal.title}
            className="w-full h-32 object-cover"
          />
          <Badge className="absolute top-2 left-2 bg-amber-500 text-white">
            {deal.discountPercentage}% OFF
          </Badge>
        </div>
        <CardContent className="p-4">
          <h4 className="font-semibold text-sm text-gray-900 mb-2 line-clamp-2">
            {deal.title}
          </h4>
          <div className="flex items-center space-x-1 mb-2">
            <span className="text-lg font-bold text-red-600">
              {formatPrice(deal.salePrice)}
            </span>
            <span className="text-sm text-gray-500 line-through">
              {formatPrice(deal.originalPrice)}
            </span>
          </div>
          <Button
            onClick={handleDealClick}
            disabled={isLoading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white"
            size="sm"
          >
            {isLoading ? "Loading..." : "Get Deal"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (variant === "list") {
    return (
      <div className="flex items-center p-4 hover:bg-gray-50 transition-colors">
        <img
          src={deal.imageUrl || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&w=100&h=100&fit=crop"}
          alt={deal.title}
          className="w-16 h-16 rounded-lg object-cover mr-4"
        />
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{deal.title}</h4>
          <p className="text-sm text-gray-600">{deal.store} • Just added</p>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-lg font-bold text-red-600">
              {formatPrice(deal.salePrice)}
            </span>
            <span className="text-sm text-gray-500 line-through">
              {formatPrice(deal.originalPrice)}
            </span>
            <Badge className="bg-red-600 text-white text-xs">
              {deal.discountPercentage}% OFF
            </Badge>
          </div>
        </div>
        <Button
          onClick={handleDealClick}
          disabled={isLoading}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          {isLoading ? "Loading..." : "Get Deal"}
        </Button>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="relative">
        <img
          src={deal.imageUrl || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&w=800&h=600&fit=crop"}
          alt={deal.title}
          className="w-full h-48 object-cover"
        />
        <Badge className="absolute top-4 left-4 bg-red-600 text-white font-bold">
          {deal.discountPercentage}% OFF
        </Badge>
        {deal.isAiApproved && (
          <Badge className="absolute top-4 right-4 bg-green-600 text-white text-xs">
            <Bot className="w-3 h-3 mr-1" />
            AI Verified
          </Badge>
        )}
      </div>

      <CardContent className="p-6">
        <div className="flex items-center mb-2">
          <img
            src={deal.storeLogoUrl || "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?ixlib=rb-4.0.3&w=100&h=100&fit=crop"}
            alt={`${deal.store} logo`}
            className="w-6 h-6 rounded mr-2"
          />
          <span className="text-sm text-gray-600">{deal.store}</span>
        </div>

        <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
          {deal.title}
        </h3>

        <div className="flex items-center space-x-2 mb-3">
          <span className="text-2xl font-bold text-red-600">
            {formatPrice(deal.salePrice)}
          </span>
          <span className="text-lg text-gray-500 line-through">
            {formatPrice(deal.originalPrice)}
          </span>
          <span className="text-sm text-green-600 font-medium">
            Save {formatSavings()}
          </span>
        </div>

        {deal.rating && (
          <div className="flex items-center mb-4">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(parseFloat(deal.rating!.toString()))
                      ? "fill-current"
                      : "stroke-current"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600 ml-2">
              {deal.rating} ({deal.reviewCount} reviews)
            </span>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-600 flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            {deal.expiresAt ? "2 days left" : "Limited time"}
          </span>
          <span className="text-sm text-amber-600 font-medium flex items-center">
            <Flame className="w-4 h-4 mr-1" />
            {deal.clickCount} bought today
          </span>
        </div>

        <Button
          onClick={handleDealClick}
          disabled={isLoading}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 mb-3"
        >
          {isLoading ? "Loading..." : "Get Deal Now"}
        </Button>

        <SocialShare deal={deal} />
      </CardContent>
    </Card>
  );
}
