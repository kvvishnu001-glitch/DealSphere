import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SocialShare } from "@/components/social-share";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CouponCode } from "@/components/ui/coupon-code";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { 
  Star, 
  Clock, 
  ExternalLink, 
  ArrowLeft,
  Tag,
  Store,
  Copy,
  Link as LinkIcon,
  X,
  ChevronRight,
  HelpCircle
} from "lucide-react";

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
  store_logo_url?: string;
  category: string;
  rating?: number;
  review_count?: number;
  expires_at?: string;
  is_active: boolean;
  is_ai_approved?: boolean;
  ai_score?: number;
  click_count?: number;
  share_count?: number;
  deal_type?: string;
  created_at?: string;
  coupon_code?: string;
  coupon_required?: boolean;
}

export default function DealDetail() {
  const [match, params] = useRoute("/deals/:id");
  const [shortUrl, setShortUrl] = useState<string>("");
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [isDealLoading, setIsDealLoading] = useState(false);
  const { toast } = useToast();
  
  const dealId = params?.id;

  // Fetch deal details with periodic refresh to update click/share counts
  const { data: deal, isLoading, error, refetch } = useQuery<Deal>({
    queryKey: ['/api/deals', dealId],
    queryFn: async () => {
      if (!dealId) throw new Error('No deal ID');
      const response = await fetch(`/api/deals/${dealId}`);
      if (!response.ok) {
        throw new Error('Deal not found');
      }
      return response.json();
    },
    enabled: !!dealId,
    refetchInterval: 10000, // Refresh every 10 seconds to update stats
  });

  useEffect(() => {
    if (dealId) {
      setShortUrl(`${window.location.origin}/deals/${dealId}`);
    }
  }, [dealId]);

  const handleDealClick = async () => {
    if (!deal || isDealLoading) return;
    
    // If deal has coupon code, show modal first
    if (deal.coupon_code) {
      setShowCouponModal(true);
      return;
    }
    
    // Otherwise redirect directly
    await redirectToDeal();
  };

  const redirectToDeal = async () => {
    if (!deal) return;
    
    setIsDealLoading(true);
    try {
      await apiRequest('POST', `/api/deals/${deal.id}/click`);
      window.open(deal.affiliate_url, '_blank', 'noopener,noreferrer');
      // Refresh deal data to update click count
      setTimeout(() => refetch(), 1000);
    } catch (error) {
      console.error('Failed to track deal click:', error);
      window.open(deal.affiliate_url, '_blank', 'noopener,noreferrer');
    } finally {
      setIsDealLoading(false);
      setShowCouponModal(false);
    }
  };

  const copyShortUrl = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      toast({
        title: "Link Copied!",
        description: "Short URL copied to clipboard",
      });
    } catch (error) {
      console.error('Failed to copy URL:', error);
      toast({
        title: "Error",
        description: "Failed to copy URL",
        variant: "destructive",
      });
    }
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

  // Calculate discount percentage if not provided
  const calculatedPercentage = deal ? (deal.discount_percentage || 
    Math.round(((deal.original_price - deal.sale_price) / deal.original_price) * 100)) : 0;

  if (!match) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-8 w-32 mb-6" />
            <div className="grid md:grid-cols-2 gap-8">
              <Skeleton className="h-96 rounded-lg" />
              <div className="space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-10 w-40" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Deal Not Found</h1>
            <p className="text-gray-600 mb-8">The deal you're looking for doesn't exist or has been removed.</p>
            <Link href="/">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Deals
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const categorySlug = deal?.category ? deal.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : '';
  const savings = deal ? (deal.original_price - deal.sale_price) : 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      {deal && (
        <nav aria-label="Breadcrumb" className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-3">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li><Link href="/" className="hover:text-red-600">Home</Link></li>
            <li><ChevronRight className="w-4 h-4" /></li>
            <li><Link href={`/category/${categorySlug}`} className="hover:text-red-600">{deal.category}</Link></li>
            <li><ChevronRight className="w-4 h-4" /></li>
            <li className="text-gray-900 font-medium truncate max-w-[200px]">{deal.title}</li>
          </ol>
        </nav>
      )}

      <div className="flex-1 container mx-auto px-4 py-4">
        <div className="max-w-4xl mx-auto">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Deal Image */}
            <div className="space-y-4">
              <img
                src={deal.image_url}
                alt={`${deal.title} - ${deal.discount_percentage}% off at ${deal.store}`}
                className="w-full h-64 sm:h-80 lg:h-96 object-cover rounded-lg shadow-lg"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/400x300/f3f4f6/9ca3af?text=Deal+Image';
                }}
              />
              
              {/* Short URL Section */}
              <Card className="lg:hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    Share This Deal
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-2 bg-gray-50 rounded border text-xs sm:text-sm font-mono truncate">
                      {shortUrl || "Loading..."}
                    </div>
                    <Button 
                      size="sm" 
                      onClick={copyShortUrl}
                      disabled={!shortUrl}
                    >
                      <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Share with rich previews on social media
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Deal Details */}
            <div className="space-y-6">
              {/* Title and Store */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Store className="w-3 h-3" />
                    {deal.store}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {deal.category}
                  </Badge>
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{deal.title}</h1>
                <p className="text-xs text-gray-500 mb-3 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatDate(deal.created_at)}
                </p>
                <p className="text-gray-600">{deal.description}</p>
              </div>

              {/* Rating */}
              {deal.rating && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="ml-1 text-sm font-medium">{deal.rating}</span>
                  </div>
                  {deal.review_count && deal.review_count > 0 && (
                    <span className="text-sm text-gray-500">
                      ({deal.review_count.toLocaleString()} reviews)
                    </span>
                  )}
                </div>
              )}

              {/* Pricing */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <span className="text-2xl sm:text-3xl font-bold text-green-600">
                    ${deal.sale_price.toFixed(2)}
                  </span>
                  <span className="text-base sm:text-lg text-gray-500 line-through">
                    ${deal.original_price.toFixed(2)}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <Badge variant="destructive" className="text-sm sm:text-lg px-2 sm:px-3 py-1 w-fit">
                    {calculatedPercentage}% OFF
                  </Badge>
                  <span className="text-sm text-gray-600">
                    Est. savings: ${(deal.original_price - deal.sale_price).toFixed(2)}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mt-2">Prices and availability are subject to change. Final price at retailer may differ.</p>
              </div>

              {/* Coupon Code */}
              {deal.coupon_code && (
                <div>
                  <CouponCode code={deal.coupon_code} size="md" />
                  {deal.coupon_required && (
                    <p className="text-sm text-amber-700 mt-2">
                      ⚠️ This coupon code is required to get the discounted price
                    </p>
                  )}
                </div>
              )}

              {/* Expiration */}
              {deal.expires_at && (
                <div className="flex items-center gap-2 text-sm text-orange-600">
                  <Clock className="w-4 h-4" />
                  <span>Expires {new Date(deal.expires_at).toLocaleDateString()}</span>
                </div>
              )}

              {/* CTA Button */}
              <Button 
                onClick={handleDealClick} 
                className="w-full text-lg py-6 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                size="lg"
              >
                Get This Deal
                <ExternalLink className="w-5 h-5 ml-2" />
              </Button>

              {/* Deal Stats */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{deal.click_count || 0}</div>
                  <div className="text-sm text-gray-600">Clicks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{deal.share_count || 0}</div>
                  <div className="text-sm text-gray-600">Shares</div>
                </div>
              </div>
            </div>
          </div>

          {/* Social Sharing */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-center">Share This Deal</CardTitle>
            </CardHeader>
            <CardContent>
              <SocialShare deal={deal} onShare={() => setTimeout(() => refetch(), 1000)} />
            </CardContent>
          </Card>

          {/* How to Redeem Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-green-600" />
                How to Redeem This Deal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">1</span>
                  <span className="text-sm text-gray-700">Click the "Get This Deal" button above to visit {deal.store}'s website.</span>
                </li>
                {deal.coupon_code ? (
                  <>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">2</span>
                      <span className="text-sm text-gray-700">Copy the coupon code: <strong>{deal.coupon_code}</strong></span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">3</span>
                      <span className="text-sm text-gray-700">Add the item to your cart and paste the code at checkout.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">4</span>
                      <span className="text-sm text-gray-700">The discount should be applied at checkout.</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">2</span>
                      <span className="text-sm text-gray-700">The discounted price should already be reflected on the retailer's page.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">3</span>
                      <span className="text-sm text-gray-700">Add to cart and complete your purchase at the retailer.</span>
                    </li>
                  </>
                )}
              </ol>
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <section className="mt-8 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-red-600" />
              Frequently Asked Questions
            </h2>
            <div className="space-y-3">
              <details className="bg-white rounded-lg border border-gray-200 p-4">
                <summary className="font-medium text-gray-900 cursor-pointer">How much can I save on {deal.title}?</summary>
                <p className="mt-3 text-sm text-gray-600">
                  This deal was listed at ${deal.sale_price.toFixed(2)} (originally ${deal.original_price.toFixed(2)}) at the time it was verified. Prices and availability are subject to change. Please check the retailer for the current price.
                </p>
              </details>
              <details className="bg-white rounded-lg border border-gray-200 p-4">
                <summary className="font-medium text-gray-900 cursor-pointer">Is this {deal.store} deal verified?</summary>
                <p className="mt-3 text-sm text-gray-600">
                  Yes, this deal has been AI-verified by DealSphere's validation system to ensure it's a genuine offer from {deal.store}.
                </p>
              </details>
              <details className="bg-white rounded-lg border border-gray-200 p-4">
                <summary className="font-medium text-gray-900 cursor-pointer">How do I redeem this deal?</summary>
                <p className="mt-3 text-sm text-gray-600">
                  Click the "Get This Deal" button to visit {deal.store}'s website where the discount will be applied.
                  {deal.coupon_code ? ` Use coupon code ${deal.coupon_code} at checkout.` : ' No coupon code is required - the price is already discounted.'}
                </p>
              </details>
              {deal.expires_at && (
                <details className="bg-white rounded-lg border border-gray-200 p-4">
                  <summary className="font-medium text-gray-900 cursor-pointer">When does this deal expire?</summary>
                  <p className="mt-3 text-sm text-gray-600">
                    This deal expires on {new Date(deal.expires_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. We recommend acting quickly to secure this discount.
                  </p>
                </details>
              )}
              <details className="bg-white rounded-lg border border-gray-200 p-4">
                <summary className="font-medium text-gray-900 cursor-pointer">Can I share this deal?</summary>
                <p className="mt-3 text-sm text-gray-600">
                  Absolutely! Use the share buttons above to share this deal on Facebook, Twitter, WhatsApp, or copy the link. When shared, it will show a rich preview with the deal image and pricing.
                </p>
              </details>
            </div>
          </section>

          <div className="text-center mb-4">
            <Link href={`/category/${categorySlug}`}>
              <Button variant="outline" className="mr-3">
                More {deal.category} Deals
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                All Deals
              </Button>
            </Link>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8 text-center">
            <p className="text-xs text-gray-500">
              As an Amazon Associate, we earn from qualifying purchases. Prices and availability are subject to change.
            </p>
            <p className="text-[10px] text-gray-400 mt-1">
              <Link href="/affiliate-disclosure" className="underline hover:text-gray-600">Affiliate Disclosure</Link>
            </p>
          </div>
        </div>
      </div>
      
      {/* Coupon Modal */}
      {showCouponModal && deal.coupon_code && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowCouponModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold">Coupon Code Available!</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowCouponModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="text-center mb-6">
              <p className="text-gray-600 mb-4">
                {deal.coupon_required 
                  ? "This coupon code may be required for the deal. Copy and apply during checkout."
                  : "Try this coupon code at checkout for a potential additional discount."
                }
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <CouponCode code={deal.coupon_code} variant="modal" />
              </div>
              
              <div className="flex flex-col gap-3">
                <Button
                  onClick={redirectToDeal}
                  disabled={isDealLoading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  {isDealLoading ? "Opening Deal..." : "Continue to Store"}
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

      <Footer />
    </div>
  );
}