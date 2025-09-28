import { Button } from "@/components/ui/button";
import { Facebook, Twitter, Link } from "lucide-react";

interface Deal {
  id: string;
  title: string;
  original_price: number;
  sale_price: number;
  discount_percentage: number;
  store: string;
}

interface SocialShareProps {
  deal: Deal;
}

export function SocialShare({ deal }: SocialShareProps) {
  const shareOnTwitter = () => {
    const discount = deal.discount_percentage || 
      Math.round(((deal.original_price - deal.sale_price) / deal.original_price) * 100);
    const text = `🔥 Amazing Deal Alert! ${deal.title} - Save ${discount}% at ${deal.store}! Only $${deal.sale_price} (was $${deal.original_price})`;
    const url = `${window.location.origin}/deals/${deal.id}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const shareOnFacebook = () => {
    const url = `${window.location.origin}/deals/${deal.id}`;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(deal.title)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const copyLink = async () => {
    const url = `${window.location.origin}/deals/${deal.id}`;
    try {
      await navigator.clipboard.writeText(url);
      alert("Deal link copied to clipboard!");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      alert("Deal link copied to clipboard!");
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={shareOnTwitter}
        className="flex items-center space-x-1"
      >
        <Twitter className="w-4 h-4" />
        <span className="hidden sm:inline">Tweet</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={shareOnFacebook}
        className="flex items-center space-x-1"
      >
        <Facebook className="w-4 h-4" />
        <span className="hidden sm:inline">Share</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={copyLink}
        className="flex items-center space-x-1"
      >
        <Link className="w-4 h-4" />
        <span className="hidden sm:inline">Copy</span>
      </Button>
    </div>
  );
}