import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DealCard } from "@/components/ui/deal-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronRight,
  ArrowLeft,
  Tag,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

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
  deal_type?: string;
  created_at?: string;
  coupon_code?: string;
  coupon_required?: boolean;
}

export default function CategoryPage() {
  const [match, params] = useRoute("/category/:slug");
  const slug = params?.slug || "";
  const [visibleCount, setVisibleCount] = useState(20);

  const categoryName = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const displayName = categoryName;

  const { data: categoryDeals = [], isLoading } = useQuery<Deal[]>({
    queryKey: ['/api/deals', { category: categoryName }],
    queryFn: async () => {
      const res = await fetch(`/api/deals?category=${encodeURIComponent(categoryName)}&limit=100&offset=0`);
      if (!res.ok) throw new Error('Failed to fetch deals');
      return res.json();
    },
    enabled: !!slug,
  });

  const visibleDeals = categoryDeals.slice(0, visibleCount);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li><Link href="/" className="hover:text-red-600">Home</Link></li>
          <li><ChevronRight className="w-4 h-4" /></li>
          <li className="text-gray-900 font-medium">{displayName} Deals</li>
        </ol>
      </nav>

      <section className="bg-gradient-to-r from-red-600 to-red-700 text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-4xl font-bold mb-3">{displayName} Deals & Coupons</h1>
          <p className="text-red-100 text-lg mb-4">
            Browse {categoryDeals.length} AI-verified {displayName.toLowerCase()} deals from top stores. Updated daily.
          </p>
          <div className="flex items-center gap-2 text-sm text-red-200">
            <Tag className="w-4 h-4" />
            <span>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </section>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div>
          <div>
            {isLoading ? (
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-lg" />
                ))}
              </div>
            ) : categoryDeals.length > 0 ? (
              <>
                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleDeals.map((deal: Deal) => (
                    <DealCard key={deal.id} deal={deal} variant="compact" />
                  ))}
                </div>
                {visibleCount < categoryDeals.length && (
                  <div className="text-center py-8">
                    <Button
                      onClick={() => setVisibleCount(prev => prev + 20)}
                      className="bg-red-600 hover:bg-red-700 text-white px-8 py-3"
                    >
                      Load More ({categoryDeals.length - visibleCount} remaining)
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No {displayName} deals available</h3>
                  <p className="text-gray-600 mb-4">Check back soon for new {displayName.toLowerCase()} deals and coupons.</p>
                  <Link href="/">
                    <Button className="bg-red-600 hover:bg-red-700">
                      <ArrowLeft className="w-4 h-4 mr-2" /> Browse All Deals
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
