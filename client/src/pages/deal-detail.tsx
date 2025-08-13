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
import { 
  Star, 
  Clock, 
  ExternalLink, 
  ArrowLeft,
  Tag,
  Store,
  Copy,
  Link as LinkIcon
} from "lucide-react";

interface Deal {
  id: string;
  title: string;
  description: string;
  originalPrice: string;
  salePrice: string;
  discountPercentage: number;
  imageUrl: string;
  affiliateUrl: string;
  store: string;
  storeLogoUrl?: string;
  category: string;
  rating?: string;
  reviewCount?: number;
  expiresAt?: string;
  isActive: boolean;
  isAiApproved?: boolean;
  aiScore?: string;
  clickCount?: number;
  shareCount?: number;
  dealType?: string;
}

export default function DealDetail() {
  const [match, params] = useRoute("/deals/:id");
  const [shortUrl, setShortUrl] = useState<string>("");
  const [isGeneratingShortUrl, setIsGeneratingShortUrl] = useState(false);
  const { toast } = useToast();
  
  const dealId = params?.id;

  // Fetch deal details
  const { data: deal, isLoading, error } = useQuery<Deal>({
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
  });

  // Generate short URL when component loads
  useEffect(() => {
    const generateShortUrl = async () => {
      if (!dealId) return;
      
      setIsGeneratingShortUrl(true);
      try {
        const response = await apiRequest('POST', `/api/deals/${dealId}/share?platform=copy`);
        const data = await response.json();
        setShortUrl(data.shortUrl);
      } catch (error) {
        console.error('Failed to generate short URL:', error);
        setShortUrl(window.location.href);
      } finally {
        setIsGeneratingShortUrl(false);
      }
    };

    generateShortUrl();
  }, [dealId]);

  const handleDealClick = async () => {
    if (!deal) return;
    
    try {
      await apiRequest('POST', `/api/deals/${deal.id}/click`);
      window.open(deal.affiliateUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Failed to track deal click:', error);
      window.open(deal.affiliateUrl, '_blank', 'noopener,noreferrer');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <Link href="/">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Deals
            </Button>
          </Link>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Deal Image */}
            <div className="space-y-4">
              <img
                src={deal.imageUrl}
                alt={deal.title}
                className="w-full h-96 object-cover rounded-lg shadow-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/400x300/f3f4f6/9ca3af?text=Deal+Image';
                }}
              />
              
              {/* Short URL Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    Share This Deal
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-2 bg-gray-50 rounded border text-sm font-mono truncate">
                      {isGeneratingShortUrl ? "Generating short URL..." : shortUrl}
                    </div>
                    <Button 
                      size="sm" 
                      onClick={copyShortUrl}
                      disabled={isGeneratingShortUrl || !shortUrl}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Use this short URL to share the deal with rich previews on social media
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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{deal.title}</h1>
                <p className="text-gray-600">{deal.description}</p>
              </div>

              {/* Rating */}
              {deal.rating && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="ml-1 text-sm font-medium">{deal.rating}</span>
                  </div>
                  {deal.reviewCount && deal.reviewCount > 0 && (
                    <span className="text-sm text-gray-500">
                      ({deal.reviewCount.toLocaleString()} reviews)
                    </span>
                  )}
                </div>
              )}

              {/* Pricing */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-green-600">
                    ${parseFloat(deal.salePrice).toFixed(2)}
                  </span>
                  <span className="text-lg text-gray-500 line-through">
                    ${parseFloat(deal.originalPrice).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="text-lg px-3 py-1">
                    {deal.discountPercentage}% OFF
                  </Badge>
                  <span className="text-sm text-gray-600">
                    Save ${(parseFloat(deal.originalPrice) - parseFloat(deal.salePrice)).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Expiration */}
              {deal.expiresAt && (
                <div className="flex items-center gap-2 text-sm text-orange-600">
                  <Clock className="w-4 h-4" />
                  <span>Expires {new Date(deal.expiresAt).toLocaleDateString()}</span>
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
                  <div className="text-2xl font-bold text-blue-600">{deal.clickCount || 0}</div>
                  <div className="text-sm text-gray-600">Clicks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{deal.shareCount || 0}</div>
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
              <SocialShare deal={deal} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}