import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DealCard } from "@/components/ui/deal-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Percent,
  ChevronRight,
  ArrowLeft,
  Loader2,
  Tag,
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
  deal_type?: string;
  created_at?: string;
  coupon_code?: string;
  coupon_required?: boolean;
}

interface CategoryInfo {
  name: string;
  slug: string;
  count: number;
}

export default function CategoryPage() {
  const [match, params] = useRoute("/category/:slug");
  const slug = params?.slug || "";
  const [visibleCount, setVisibleCount] = useState(20);

  const { data: allDeals = [], isLoading } = useQuery<Deal[]>({
    queryKey: ['/api/deals'],
  });

  const { data: categories = [] } = useQuery<CategoryInfo[]>({
    queryKey: ['/api/seo/categories'],
  });

  const matchedCategory = categories.find((cat: CategoryInfo) => cat.slug === slug);
  const categoryName = matchedCategory?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const categoryDeals = allDeals.filter(
    (deal: Deal) => deal.category.toLowerCase() === categoryName.toLowerCase()
  );

  const visibleDeals = categoryDeals.slice(0, visibleCount);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Percent className="text-red-600 w-6 h-6" />
              <span className="text-xl font-bold text-gray-900">DealSphere</span>
            </Link>
            <nav className="hidden md:flex items-center space-x-6 text-sm">
              <Link href="/" className="text-gray-600 hover:text-red-600 transition-colors">Home</Link>
              <Link href="/about" className="text-gray-600 hover:text-red-600 transition-colors">About</Link>
              <Link href="/blog" className="text-gray-600 hover:text-red-600 transition-colors">Blog</Link>
              <Link href="/contact" className="text-gray-600 hover:text-red-600 transition-colors">Contact</Link>
            </nav>
          </div>
        </div>
      </header>

      <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li><Link href="/" className="hover:text-red-600">Home</Link></li>
          <li><ChevronRight className="w-4 h-4" /></li>
          <li className="text-gray-900 font-medium">{categoryName} Deals</li>
        </ol>
      </nav>

      <section className="bg-gradient-to-r from-red-600 to-red-700 text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-4xl font-bold mb-3">{categoryName} Deals & Coupons</h1>
          <p className="text-red-100 text-lg mb-4">
            Browse {categoryDeals.length} AI-verified {categoryName.toLowerCase()} deals from top stores. Updated daily.
          </p>
          <div className="flex items-center gap-2 text-sm text-red-200">
            <Tag className="w-4 h-4" />
            <span>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </section>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
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
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No {categoryName} deals available</h3>
                  <p className="text-gray-600 mb-4">Check back soon for new {categoryName.toLowerCase()} deals and coupons.</p>
                  <Link href="/">
                    <Button className="bg-red-600 hover:bg-red-700">
                      <ArrowLeft className="w-4 h-4 mr-2" /> Browse All Deals
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

          <aside className="lg:w-64 shrink-0">
            <div className="sticky top-20">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Browse Categories</h2>
              <nav aria-label="Categories">
                <ul className="space-y-2">
                  {categories.map((cat: CategoryInfo) => (
                    <li key={cat.slug}>
                      <Link
                        href={`/category/${cat.slug}`}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                          cat.slug === slug
                            ? 'bg-red-50 text-red-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <span>{cat.name}</span>
                        <span className="text-xs text-gray-400">{cat.count}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </aside>
        </div>
      </main>

      <footer className="bg-gray-800 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center">
                <Percent className="text-red-600 text-xl mr-2" />
                <h3 className="text-lg font-bold">DealSphere</h3>
              </div>
              <p className="text-gray-400 text-xs max-w-xs">
                AI-verified deals and coupons updated daily to help you save more.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="/terms-conditions" className="hover:text-white transition-colors">Terms of Service</Link>
                <Link href="/about" className="hover:text-white transition-colors">About</Link>
                <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
                <Link href="/affiliate-disclosure" className="hover:text-white transition-colors">Affiliate Disclosure</Link>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 text-right">
              <div className="text-gray-400 text-xs">© {new Date().getFullYear()} DealSphere. All rights reserved.</div>
              <p className="text-[10px] text-gray-500 max-w-[200px]">
                As an Amazon Associate, we earn from qualifying purchases.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
