import { useState, useEffect } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DealCard } from "@/components/ui/deal-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

import {
  Percent,
  Search,
  Flame,
  Clock,
  Tag,
  Store,
  X,
  Loader2,
  Bot
} from "lucide-react";

// Define types to match API response
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

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStore, setSelectedStore] = useState<string>("all");
  const [selectedDiscount, setSelectedDiscount] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Fetch deals count for the hero section
  const { data: dealsCount } = useQuery({
    queryKey: ['/api/deals/count'],
    queryFn: async () => {
      const response = await fetch('/api/deals/count');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    refetchInterval: 30000,
  });

  // Fetch deals with infinite scroll pagination
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['/api/deals'],
    queryFn: async ({ pageParam = 0 }) => {
      const url = new URL('/api/deals', window.location.origin);
      url.searchParams.set('limit', '20');
      url.searchParams.set('offset', String(pageParam));

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    getNextPageParam: (lastPage: any, allPages: any) => {
      if (lastPage.length < 20) return undefined;
      return allPages.length * 20;
    },
    refetchInterval: 30000,
    staleTime: 10000,
    initialPageParam: 0,
  });

  // Flatten all pages into a single array of deals
  const deals: Deal[] = data?.pages.flatMap((page: any) => page) || [];

  if (error) {
    console.error('Query error:', error);
  }

  // State to control infinite scroll vs manual loading
  const [autoLoadEnabled, setAutoLoadEnabled] = useState(true);
  const [loadedPages, setLoadedPages] = useState(0);

  // Modified scroll handler with limits
  useEffect(() => {
    const handleScroll = () => {
      // Disable auto-loading after 5 pages to allow access to footer
      if (!autoLoadEnabled || loadedPages >= 5) return;

      const scrollPosition = window.innerHeight + document.documentElement.scrollTop;
      const scrollThreshold = document.documentElement.offsetHeight - 1000;

      if (scrollPosition >= scrollThreshold && !isFetchingNextPage && hasNextPage) {
        fetchNextPage();
        setLoadedPages(prev => prev + 1);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [fetchNextPage, isFetchingNextPage, hasNextPage, autoLoadEnabled, loadedPages]);

  // Get unique filter options from actual deals data
  const availableCategories = [...new Set(deals?.map((deal: Deal) => deal.category) || [])];
  const availableStores = [...new Set(deals?.map((deal: Deal) => deal.store) || [])];

  // Filter deals properly
  const filteredDeals = deals?.filter((deal: Deal) => {
    if (!deal.is_active || deal.is_ai_approved === false) {
      return false;
    }

    if (!deal.title || !deal.original_price || !deal.sale_price || !deal.store || !deal.category) {
      return false;
    }

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      const searchable = `${deal.title} ${deal.description} ${deal.store} ${deal.category}`.toLowerCase();
      if (!searchable.includes(query)) return false;
    }

    if (selectedCategory !== "all" && deal.category !== selectedCategory) return false;
    if (selectedStore !== "all" && deal.store !== selectedStore) return false;

    if (selectedDiscount !== "all") {
      const discount = deal.discount_percentage ||
        Math.round(((deal.original_price - deal.sale_price) / deal.original_price) * 100);
      switch (selectedDiscount) {
        case "50+":
          if (discount < 50) return false;
          break;
        case "30+":
          if (discount < 30) return false;
          break;
        case "10+":
          if (discount < 10) return false;
          break;
      }
    }
    return true;
  }) || [];

  // Deal sections
  const topDeals = filteredDeals
    .filter((deal: Deal) => deal.deal_type === 'top' && deal.image_url && deal.image_url.trim() !== '')
    .slice(0, 3);

  const hotDeals = filteredDeals
    .filter((deal: Deal) => deal.deal_type === 'hot' && deal.image_url && deal.image_url.trim() !== '')
    .slice(0, 4);

  const latestDeals = filteredDeals
    .filter((deal: Deal) => (deal.deal_type === 'latest' || deal.deal_type === 'regular') && deal.image_url && deal.image_url.trim() !== '')
    .slice(0, 25);

  const clearFilters = () => {
    setSelectedCategory("all");
    setSelectedStore("all");
    setSelectedDiscount("all");
    setSearchQuery("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="w-full h-48" />
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-6 w-1/2 mb-4" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center py-4 sm:h-16 space-y-3 sm:space-y-0">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Percent className="text-red-600 text-xl sm:text-2xl mr-2" />
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">DealSphere</h1>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-lg mx-0 sm:mx-4 lg:mx-8 w-full sm:w-auto">
              <div className="relative">
                <Input
                  type="search"
                  placeholder="Search deals, stores..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 bg-gray-100 border-gray-300 focus:border-red-600 focus:ring-red-600"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Search className="text-gray-400 w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-red-600 to-red-700 text-white py-8 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl sm:text-4xl lg:text-6xl font-bold mb-4">
            AI-Powered Deals & Coupons
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl mb-8 text-red-100">
            Discover verified deals curated by artificial intelligence
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-red-100 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold">{dealsCount?.count || 0}</div>
              <div className="text-sm">Active Deals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold">$1.2M+</div>
              <div className="text-sm">Total Savings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold">98%</div>
              <div className="text-sm">AI Verified</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-lg mb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-3 items-center">
                    {/* Category Filter */}
                    <div className="flex items-center space-x-2">
                      <Tag className="w-4 h-4 text-gray-500" />
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="h-10 min-w-[140px] border-gray-300 rounded-full bg-white hover:bg-gray-50">
                          <SelectValue placeholder="📁 All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">📁 All Categories</SelectItem>
                          {availableCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Store Filter */}
                    <div className="flex items-center space-x-2">
                      <Store className="w-4 h-4 text-gray-500" />
                      <Select value={selectedStore} onValueChange={setSelectedStore}>
                        <SelectTrigger className="h-10 min-w-[140px] border-gray-300 rounded-full bg-white hover:bg-gray-50">
                          <SelectValue placeholder="🏪 All Stores" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">🏪 All Stores</SelectItem>
                          {availableStores.map((store) => (
                            <SelectItem key={store} value={store}>
                              {store}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Discount Filter */}
                    <div className="flex items-center space-x-2">
                      <Percent className="w-4 h-4 text-gray-500" />
                      <Select value={selectedDiscount} onValueChange={setSelectedDiscount}>
                        <SelectTrigger className="h-10 min-w-[140px] border-gray-300 rounded-full bg-white hover:bg-gray-50">
                          <SelectValue placeholder="💰 All Discounts" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">💰 All Discounts</SelectItem>
                          <SelectItem value="50+">50%+ Off</SelectItem>
                          <SelectItem value="30+">30%+ Off</SelectItem>
                          <SelectItem value="10+">10%+ Off</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Clear Filters */}
                    {(selectedCategory !== "all" || selectedStore !== "all" || selectedDiscount !== "all" || searchQuery) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                        className="rounded-full border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Clear Filters
                      </Button>
                    )}
                  </div>

                  {/* Active Filters Display */}
                  <div className="flex flex-wrap gap-2">
                    {selectedCategory !== "all" && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        Category: {selectedCategory}
                      </Badge>
                    )}
                    {selectedStore !== "all" && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Store: {selectedStore}
                      </Badge>
                    )}
                    {selectedDiscount !== "all" && (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                        Discount: {selectedDiscount}
                      </Badge>
                    )}
                    {searchQuery && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        Search: "{searchQuery}"
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Top Deals Section */}
        {topDeals.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center mb-6">
              <div className="flex items-center">
                <Bot className="w-6 h-6 text-purple-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">🔥 AI Top Picks</h2>
              </div>
              <div className="ml-auto">
                <Badge className="bg-purple-100 text-purple-800 text-xs">
                  AI Curated
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topDeals.map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          </section>
        )}

        {/* Hot Deals Section */}
        {hotDeals.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center mb-6">
              <div className="flex items-center">
                <Flame className="w-6 h-6 text-orange-500 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">🌶️ Hot Deals</h2>
              </div>
              <div className="ml-auto">
                <Badge className="bg-orange-100 text-orange-800 text-xs">
                  Trending
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {hotDeals.map((deal) => (
                <DealCard key={deal.id} deal={deal} variant="compact" />
              ))}
            </div>
          </section>
        )}

        {/* Latest Deals Section */}
        {latestDeals.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center mb-6">
              <div className="flex items-center">
                <Clock className="w-6 h-6 text-blue-500 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">🕒 Latest Deals</h2>
              </div>
              <div className="ml-auto">
                <Badge className="bg-blue-100 text-blue-800 text-xs">
                  Fresh
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestDeals.map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          </section>
        )}

        {/* Load More Section */}
        {hasNextPage && (
          <div className="text-center py-8">
            {isFetchingNextPage ? (
              <div className="flex justify-center items-center space-x-2 text-gray-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading more deals...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {loadedPages >= 5 && (
                  <div className="text-sm text-gray-500 mb-2">
                    Infinite scroll paused to allow footer access
                  </div>
                )}
                <Button
                  onClick={() => fetchNextPage()}
                  variant="outline"
                  size="lg"
                  className="px-8 py-3 border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                >
                  Load More Deals ({data?.pages.length || 0} pages loaded)
                </Button>
                {loadedPages >= 5 && (
                  <div className="mt-3">
                    <Button
                      onClick={() => {
                        setAutoLoadEnabled(!autoLoadEnabled);
                        setLoadedPages(0);
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-sm text-gray-500 hover:text-red-600"
                    >
                      {autoLoadEnabled ? 'Disable' : 'Enable'} Auto-Loading
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* No deals found */}
        {filteredDeals.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No deals found matching your criteria</p>
            <Button onClick={clearFilters} variant="outline">
              Clear Filters
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand Section */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <Percent className="text-red-500 text-2xl mr-2" />
                <h3 className="text-xl font-bold">DealSphere</h3>
              </div>
              <p className="text-gray-300 mb-4">
                AI-powered deals and coupons platform that helps you save money on your favorite products. 
                Our artificial intelligence validates and curates the best deals from trusted retailers.
              </p>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <span>🛡️ AI Verified</span>
                <span>•</span>
                <span>💰 Best Prices</span>
                <span>•</span>
                <span>🚀 Real-time Updates</span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/" className="hover:text-red-400 transition-colors">Home</Link></li>
                <li><Link href="/privacy-policy" className="hover:text-red-400 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms-conditions" className="hover:text-red-400 transition-colors">Terms & Conditions</Link></li>
                <li><Link href="/admin" className="hover:text-red-400 transition-colors">Admin Portal</Link></li>
              </ul>
            </div>

            {/* Contact & Stats */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Platform Stats</h4>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center">
                  <Tag className="w-4 h-4 mr-2 text-red-400" />
                  <span>{dealsCount?.count || 0}+ Active Deals</span>
                </li>
                <li className="flex items-center">
                  <Store className="w-4 h-4 mr-2 text-red-400" />
                  <span>50+ Partner Stores</span>
                </li>
                <li className="flex items-center">
                  <span className="text-red-400 mr-2">🤖</span>
                  <span>98% AI Accuracy</span>
                </li>
                <li className="flex items-center">
                  <span className="text-red-400 mr-2">💵</span>
                  <span>$1M+ Total Savings</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm">
              © 2025 DealSphere. All rights reserved. Built with AI-powered technology.
            </div>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <span className="text-gray-400 text-sm">Powered by:</span>
              <div className="flex items-center space-x-2 text-sm">
                <span className="bg-red-600 px-2 py-1 rounded text-white">Python</span>
                <span className="bg-blue-600 px-2 py-1 rounded text-white">React</span>
                <span className="bg-green-600 px-2 py-1 rounded text-white">AI</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}