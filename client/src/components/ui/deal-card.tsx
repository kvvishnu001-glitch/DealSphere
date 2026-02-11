import React, { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SocialShare } from "@/components/social-share";
import { Star, Clock, Flame, Bot, X, Tag, ExternalLink } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CouponCode } from "@/components/ui/coupon-code";

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

export function DealCard({ deal, variant = "full" }: DealCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const { toast } = useToast();
  

  const calculatedPercentage = deal.discount_percentage || 
    Math.round(((deal.original_price - deal.sale_price) / deal.original_price) * 100);

  if (imageError) {
    return null;
  }

  const handleDealClick = async () => {
    if (isLoading) return;
    
    if (deal.coupon_code) {
      setShowCouponModal(true);
      return;
    }
    
    await redirectToDeal();
  };

  const redirectToDeal = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', `/api/deals/${deal.id}/click`);
      const data = await response.json();
      
      window.open(data.affiliate_url || deal.affiliate_url, '_blank', 'noopener,noreferrer');
      
      toast({
        title: "Deal Opened",
        description: "Redirecting to the deal page...",
      });
    } catch (error) {
      console.error('Failed to track deal click:', error);
      window.open(deal.affiliate_url, '_blank', 'noopener,noreferrer');
      
      toast({
        title: "Deal Opened", 
        description: "Redirecting to the deal page...",
      });
    } finally {
      setIsLoading(false);
      setShowCouponModal(false);
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

  if (variant === "compact") {
    return (
      <Card className="overflow-hidden hover:shadow-lg lg:hover:shadow-xl transition-all duration-300 h-full flex flex-col group">
        <div className="relative">
          <Link href={`/deals/${deal.id}`}>
            <img 
              src={deal.image_url}
              alt={`${deal.title} - ${deal.discount_percentage || calculatedPercentage}% off at ${deal.store}`}
              className="w-full h-40 sm:h-48 lg:h-56 object-cover cursor-pointer group-hover:scale-[1.02] transition-transform duration-300"
              loading="lazy"
              onError={(e) => {
                console.log('Image failed to load for deal:', deal.title, deal.image_url);
                setImageError(true);
              }}
              onLoad={() => setImageLoaded(true)}
            />
          </Link>
          <Badge className="absolute top-2 left-2 lg:top-3 lg:left-3 bg-amber-500 text-white text-xs lg:text-sm">
            {calculatedPercentage}% OFF
          </Badge>
        </div>
        <CardContent className="p-3 sm:p-4 lg:p-5 flex flex-col flex-grow">
          <Link href={`/deals/${deal.id}`}>
            <h4 className="font-semibold text-sm lg:text-base text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem] lg:min-h-[3rem] hover:text-red-600 transition-colors cursor-pointer">
              {deal.title}
            </h4>
          </Link>
          <p className="text-xs lg:text-sm text-gray-500 mb-2 flex items-center">
            <Clock className="w-3 h-3 lg:w-3.5 lg:h-3.5 mr-1" />
            {formatDate(deal.created_at)}
          </p>
          <div className="flex items-center space-x-1 lg:space-x-2 mb-1">
            <span className="text-lg lg:text-xl font-bold text-red-600">
              {formatPrice(deal.sale_price)}
            </span>
            <span className="text-sm lg:text-base text-gray-500 line-through">
              {formatPrice(deal.original_price)}
            </span>
          </div>
          <p className="text-[9px] lg:text-[10px] text-gray-400 mb-3">Prices may vary</p>
          <div className="mt-auto space-y-2 sm:space-y-3">
            <Button
              onClick={handleDealClick}
              disabled={isLoading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white lg:py-2.5"
              size="sm"
            >
              {isLoading ? "Loading..." : "Get Deal"}
            </Button>
            <SocialShare deal={deal} />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === "list") {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center p-4 lg:p-5 hover:bg-gray-50 transition-colors min-h-[120px] space-y-3 sm:space-y-0">
        <Link href={`/deals/${deal.id}`}>
          <img 
            src={deal.image_url}
            alt={`${deal.title} - ${deal.discount_percentage || calculatedPercentage}% off at ${deal.store}`}
            className="w-16 h-16 lg:w-20 lg:h-20 rounded-lg sm:mr-4 lg:mr-5 flex-shrink-0 self-start object-cover cursor-pointer"
            loading="lazy"
            onError={(e) => {
              console.log('Image failed to load for deal:', deal.title, deal.image_url);
              setImageError(true);
            }}
            onLoad={() => setImageLoaded(true)}
          />
        </Link>
        <div className="flex-1 min-w-0 sm:pr-4">
          <Link href={`/deals/${deal.id}`}>
            <h4 className="font-semibold text-gray-900 text-sm sm:text-base lg:text-lg line-clamp-2 sm:truncate hover:text-red-600 transition-colors cursor-pointer">{deal.title}</h4>
          </Link>
          <p className="text-sm lg:text-base text-gray-600 mt-1 flex items-center">
            {deal.store} • <Clock className="w-3 h-3 ml-1 mr-1" /> {formatDate(deal.created_at)}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="text-lg lg:text-xl font-bold text-red-600">
              {formatPrice(deal.sale_price)}
            </span>
            <span className="text-sm lg:text-base text-gray-500 line-through">
              {formatPrice(deal.original_price)}
            </span>
            <Badge className="bg-red-600 text-white text-xs">
              {calculatedPercentage}% OFF
            </Badge>
            {deal.coupon_code && (
              <CouponCode code={deal.coupon_code} variant="badge" />
            )}
          </div>
          <p className="text-[9px] text-gray-400 mt-1">Prices may vary</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 sm:ml-4">
          <Button
            onClick={handleDealClick}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2"
            size="sm"
          >
            {isLoading ? "Loading..." : "Get Deal"}
          </Button>
          <SocialShare deal={deal} />
        </div>
      </div>
    );
  }

  // Full variant (default)
  return (
    <Card className="overflow-hidden hover:shadow-lg lg:hover:shadow-xl transition-all duration-300 h-full flex flex-col group">
      <div className="relative overflow-hidden">
        <Link href={`/deals/${deal.id}`}>
          <img 
            src={deal.image_url}
            alt={`${deal.title} - ${deal.discount_percentage || calculatedPercentage}% off at ${deal.store}`}
            className="w-full h-48 sm:h-64 lg:h-72 object-cover cursor-pointer group-hover:scale-[1.03] transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              console.log('Image failed to load for deal:', deal.title, deal.image_url);
              setImageError(true);
            }}
            onLoad={() => setImageLoaded(true)}
          />
        </Link>
        <Badge className="absolute top-3 left-3 bg-red-600 text-white text-xs lg:text-sm px-2.5 lg:px-3 py-1">
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
      
      <CardContent className="p-4 sm:p-5 lg:p-6 flex flex-col flex-grow">
        <div className="mb-3 lg:mb-4">
          <Link href={`/deals/${deal.id}`}>
            <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 hover:text-red-600 transition-colors line-clamp-2 mb-2 cursor-pointer">
              {deal.title}
            </h3>
          </Link>
          <p className="text-xs lg:text-sm text-gray-500 mb-2 flex items-center">
            <Clock className="w-3 h-3 lg:w-3.5 lg:h-3.5 mr-1" />
            {formatDate(deal.created_at)}
          </p>
          <p className="text-sm lg:text-base text-gray-600 line-clamp-2 hidden sm:block">
            {deal.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
          <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600">
            {formatPrice(deal.sale_price)}
          </span>
          <span className="text-sm sm:text-lg lg:text-xl text-gray-500 line-through">
            {formatPrice(deal.original_price)}
          </span>
          <span className="text-xs sm:text-sm lg:text-base text-green-600 font-medium ml-auto">
            Save {formatSavings()}
          </span>
        </div>
        <p className="text-[10px] lg:text-xs text-gray-400 mt-1">Prices may vary. Check retailer for current pricing.</p>
        
        {deal.coupon_code && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                {deal.coupon_required ? "Coupon Required" : "Bonus Coupon Available"}
              </span>
            </div>
            <CouponCode code={deal.coupon_code} variant="inline" size="sm" />
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm lg:text-base font-medium text-gray-700">{deal.store}</span>
            <Badge variant="secondary" className="text-xs lg:text-sm">
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

        <div className="mt-auto space-y-3 sm:space-y-4">
          <Button
            onClick={handleDealClick}
            disabled={isLoading}
            className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white py-2.5 sm:py-3 lg:py-3.5 font-semibold text-sm sm:text-base"
            data-testid={`button-get-deal-${deal.id}`}
          >
            {isLoading ? "Loading..." : (deal.coupon_code ? "Get Deal & Copy Code" : "Get Deal")}
          </Button>
          <SocialShare deal={deal} />
        </div>
      </CardContent>
      
      {showCouponModal && deal.coupon_code && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowCouponModal(false)}>
          <div className="bg-white rounded-lg lg:rounded-xl p-6 lg:p-8 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-green-600" />
                <h3 className="text-lg lg:text-xl font-semibold">Coupon Code Available!</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowCouponModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="text-center mb-6">
              <p className="text-gray-600 mb-4 lg:text-lg">
                {deal.coupon_required 
                  ? "This coupon code is required to get the deal price. Copy it and apply during checkout."
                  : "Use this coupon code at checkout for a potential additional discount."
                }
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <CouponCode code={deal.coupon_code} variant="modal" />
              </div>
              
              <div className="flex flex-col gap-3">
                <Button
                  onClick={redirectToDeal}
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 lg:py-3"
                >
                  <ExternalLink className="w-4 h-4" />
                  {isLoading ? "Opening Deal..." : "Continue to Store"}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setShowCouponModal(false)}
                  className="w-full"
                >
                  Copy Code Later
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
