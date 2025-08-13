import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Facebook, Twitter, MessageCircle, Link } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Deal } from "@shared/schema";

interface SocialShareProps {
  deal: Deal;
}

export function SocialShare({ deal }: SocialShareProps) {
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();

  const trackShare = async (platform: string) => {
    try {
      await apiRequest('POST', `/api/deals/${deal.id}/share`, { platform });
    } catch (error) {
      console.error('Failed to track share:', error);
    }
  };

  const shareOnFacebook = async () => {
    setIsSharing(true);
    try {
      const dealUrl = `${window.location.origin}/deals/${deal.id}`;
      const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(dealUrl)}&quote=${encodeURIComponent(deal.title)}`;
      
      await trackShare('facebook');
      window.open(shareUrl, '_blank', 'width=600,height=400');
      
      toast({
        title: "Shared on Facebook",
        description: "Thanks for sharing this deal!",
      });
    } catch (error) {
      console.error('Facebook share error:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const shareOnTwitter = async () => {
    setIsSharing(true);
    try {
      const dealUrl = `${window.location.origin}/deals/${deal.id}`;
      const tweetText = `${deal.title} - ${deal.discountPercentage}% OFF! Get it for just $${deal.salePrice} (was $${deal.originalPrice})`;
      const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(dealUrl)}`;
      
      await trackShare('twitter');
      window.open(shareUrl, '_blank', 'width=600,height=400');
      
      toast({
        title: "Shared on Twitter",
        description: "Thanks for sharing this deal!",
      });
    } catch (error) {
      console.error('Twitter share error:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const shareOnWhatsApp = async () => {
    setIsSharing(true);
    try {
      const dealUrl = `${window.location.origin}/deals/${deal.id}`;
      const message = `Check out this amazing deal: ${deal.title} - ${deal.discountPercentage}% OFF! ${dealUrl}`;
      const shareUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      
      await trackShare('whatsapp');
      window.open(shareUrl, '_blank');
      
      toast({
        title: "Shared on WhatsApp",
        description: "Thanks for sharing this deal!",
      });
    } catch (error) {
      console.error('WhatsApp share error:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const copyLink = async () => {
    setIsSharing(true);
    try {
      // Create short URL for sharing
      const response = await apiRequest('POST', `/api/deals/${deal.id}/share?platform=copy`);
      const { shortUrl } = await response.json();
      
      await navigator.clipboard.writeText(shortUrl);
      toast({
        title: "Short Link Copied",
        description: "Shareable link copied to clipboard!",
      });
    } catch (error) {
      console.error('Copy link error:', error);
      // Fallback to regular URL if short URL creation fails
      try {
        const dealUrl = `${window.location.origin}/deals/${deal.id}`;
        await navigator.clipboard.writeText(dealUrl);
        
        await trackShare('copy');
        toast({
          title: "Link Copied",
          description: "Deal link copied to clipboard!",
        });
      } catch (fallbackError) {
        toast({
          title: "Error",
          description: "Failed to copy link",
          variant: "destructive",
        });
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="flex justify-center space-x-3 pt-3 border-t border-gray-100">
      <Button
        variant="ghost"
        size="sm"
        onClick={shareOnFacebook}
        disabled={isSharing}
        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        title="Share on Facebook"
      >
        <Facebook className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={shareOnTwitter}
        disabled={isSharing}
        className="text-blue-400 hover:text-blue-500 hover:bg-blue-50"
        title="Share on Twitter"
      >
        <Twitter className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={shareOnWhatsApp}
        disabled={isSharing}
        className="text-green-600 hover:text-green-700 hover:bg-green-50"
        title="Share on WhatsApp"
      >
        <MessageCircle className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={copyLink}
        disabled={isSharing}
        className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
        title="Copy Link"
      >
        <Link className="w-4 h-4" />
      </Button>
    </div>
  );
}
