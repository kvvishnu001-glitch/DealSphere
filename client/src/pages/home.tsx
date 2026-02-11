import React, { useState, useEffect, useCallback } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useRealTimeUpdates } from "@/hooks/use-auto-refresh";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DealCard } from "@/components/ui/deal-card";
import { Skeleton } from "@/components/ui/skeleton";

import { 
  Search, 
  Flame, 
  Clock, 
  Tag, 
  Store, 
  X,
  Loader2
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AdBannerLeaderboard, AdBannerBetweenSections, AdBannerBeforeFooter, SidebarAdWrapper } from "@/components/ad-banner";
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
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  
  // View All states for infinite scroll
  const [showAllTop, setShowAllTop] = useState(false);
  const [showAllHot, setShowAllHot] = useState(false);
  const [showAllLatest, setShowAllLatest] = useState(false);
  const [topDealsPage, setTopDealsPage] = useState(1);
  const [hotDealsPage, setHotDealsPage] = useState(1);
  const [latestDealsPage, setLatestDealsPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchLimit, setSearchLimit] = useState(20);

  // Debounce search query - wait 400ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Enable real-time updates
  useRealTimeUpdates();

  // Fetch real-time stats for the hero section
  const { data: heroStats } = useQuery({
    queryKey: ['/api/deals/stats'],
    queryFn: async () => {
      const response = await fetch('/api/deals/stats');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    refetchInterval: 30000,
  });

  // Fetch total latest deals count from database (not affected by pagination)
  const { data: latestDealsTotal } = useQuery({
    queryKey: ['/api/deals/latest-count'],
    queryFn: async () => {
      const response = await fetch('/api/deals/latest-count');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    refetchInterval: 30000,
  });

  // Reset search limit when search query changes
  useEffect(() => {
    setSearchLimit(20);
  }, [debouncedSearch]);

  // Search deals from backend when user types a search query
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['/api/deals/search', debouncedSearch, searchLimit, selectedCategory, selectedStore],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('q', debouncedSearch);
      params.set('limit', searchLimit.toString());
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      if (selectedStore !== 'all') params.set('store', selectedStore);
      const response = await fetch(`/api/deals/search?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return {
        deals: data.deals.map((deal: any) => ({
          ...deal,
          original_price: deal.originalPrice || deal.original_price,
          sale_price: deal.salePrice || deal.sale_price,
          discount_percentage: deal.discountPercentage || deal.discount_percentage,
          image_url: deal.imageUrl || deal.image_url,
          affiliate_url: deal.affiliateUrl || deal.affiliate_url,
          store_logo_url: deal.storeLogoUrl || deal.store_logo_url,
          review_count: deal.reviewCount || deal.review_count,
          expires_at: deal.expiresAt || deal.expires_at,
          deal_type: deal.dealType || deal.deal_type,
          coupon_code: deal.couponCode || deal.coupon_code,
          coupon_required: deal.couponRequired || deal.coupon_required,
          is_active: deal.isActive !== undefined ? deal.isActive : deal.is_active,
          is_ai_approved: deal.isAiApproved !== undefined ? deal.isAiApproved : deal.is_ai_approved,
          ai_score: deal.aiScore || deal.ai_score,
          click_count: deal.clickCount || deal.click_count,
          created_at: deal.createdAt || deal.created_at,
        })) as Deal[],
        total: data.total,
        query: data.query
      };
    },
    enabled: debouncedSearch.length > 0,
  });

  const isSearchActive = debouncedSearch.length > 0;

  // Fetch deals with infinite scroll pagination
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['/api/deals'],
    initialPageParam: 0,
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const url = new URL('/api/deals', window.location.origin);
      // Load 100 deals per page to ensure all sections have enough content
      url.searchParams.set('limit', '100');
      url.searchParams.set('offset', pageParam.toString());
      
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const deals = await response.json();
      
      // Transform camelCase fields to snake_case for frontend compatibility
      return deals.map((deal: any) => ({
        ...deal,
        original_price: deal.originalPrice || deal.original_price,
        sale_price: deal.salePrice || deal.sale_price,
        discount_percentage: deal.discountPercentage || deal.discount_percentage,
        image_url: deal.imageUrl || deal.image_url,
        affiliate_url: deal.affiliateUrl || deal.affiliate_url,
        store_logo_url: deal.storeLogoUrl || deal.store_logo_url,
        review_count: deal.reviewCount || deal.review_count,
        expires_at: deal.expiresAt || deal.expires_at,
        deal_type: deal.dealType || deal.deal_type,
        source_api: deal.sourceApi || deal.source_api,
        coupon_code: deal.couponCode || deal.coupon_code,
        coupon_required: deal.couponRequired || deal.coupon_required,
        is_active: deal.isActive !== undefined ? deal.isActive : deal.is_active,
        is_ai_approved: deal.isAiApproved !== undefined ? deal.isAiApproved : deal.is_ai_approved,
        ai_score: deal.aiScore || deal.ai_score,
        ai_reasons: deal.aiReasons || deal.ai_reasons,
        click_count: deal.clickCount || deal.click_count,
        share_count: deal.shareCount || deal.share_count,
        created_at: deal.createdAt || deal.created_at,
        updated_at: deal.updatedAt || deal.updated_at
      })) as Deal[];
    },
    getNextPageParam: (lastPage: Deal[], allPages: Deal[][]) => {
      // If we got less than 100 deals, we've reached the end
      if (lastPage.length < 100) return undefined;
      // Return the offset for the next page
      return allPages.length * 100;
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });

  // Flatten all pages into a single array of deals
  const deals: Deal[] = data?.pages.flatMap(page => page) || [];

  if (error) {
    console.error('Query error:', error);
  }

  // Scroll handler for infinite loading - disabled to prevent background fetching
  // The Latest Deals section has its own pagination with a max limit
  // We only fetch more from API when user explicitly clicks "Load More"
  useEffect(() => {
    // No automatic background fetching - user controls loading via "Load More" button
  }, []);

  // Get unique filter options from actual deals data
  const availableCategories = [...new Set(deals.map((deal: Deal) => deal.category))];
  const availableStores = [...new Set(deals.map((deal: Deal) => deal.store))];
  const availableDiscounts = [...new Set(deals.map((deal: Deal) => {
    const discount = deal.discount_percentage;
    if (discount >= 50) return "50+";
    if (discount >= 30) return "30+";
    if (discount >= 10) return "10+";
    return null;
  }).filter(Boolean) || [])];

  // Filter deals properly
  const filteredDeals = deals?.filter((deal: Deal) => {
    // Check if deal is active and approved (critical filters)
    if (!deal.is_active || deal.is_ai_approved === false) {
      return false;
    }
    
    // Basic field validation
    if (!deal.title || !deal.original_price || !deal.sale_price || !deal.store || !deal.category) {
      return false;
    }
    
    // Category filter
    if (selectedCategory !== "all" && deal.category !== selectedCategory) return false;
    
    // Store filter  
    if (selectedStore !== "all" && deal.store !== selectedStore) return false;
    
    // Discount filter - use calculated percentage if stored is 0
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



  // Load more function for infinite scroll
  const loadMoreDeals = (section: 'top' | 'hot' | 'latest') => {
    if (loadingMore) return;
    setLoadingMore(true);
    
    setTimeout(() => {
      if (section === 'top') {
        setTopDealsPage(prev => prev + 1);
      } else if (section === 'hot') {
        setHotDealsPage(prev => prev + 1);
      } else if (section === 'latest') {
        setLatestDealsPage(prev => prev + 1);
      }
      setLoadingMore(false);
    }, 500);
  };

  // Enhanced deal sections with image validation and pagination
  const topDealsLimit = showAllTop ? topDealsPage * 30 : 3;
  const topDeals = filteredDeals
    .filter((deal: Deal) => deal.deal_type === 'top' && deal.image_url && deal.image_url.trim() !== '')
    .slice(0, topDealsLimit);
  
  const hotDealsLimit = showAllHot ? hotDealsPage * 30 : 4;  
  const hotDeals = filteredDeals
    .filter((deal: Deal) => deal.deal_type === 'hot' && deal.image_url && deal.image_url.trim() !== '')
    .slice(0, hotDealsLimit);
  
  // Latest Deals: show filtered latest/regular deals with automatic pagination
  const latestFilteredDeals = filteredDeals
    .filter((deal: Deal) => (deal.deal_type === 'latest' || deal.deal_type === 'regular' || !deal.deal_type || deal.deal_type === '') && deal.image_url && deal.image_url.trim() !== '');
  
  // Show 20 deals initially, then 20 more each time "Load More" is clicked
  const LATEST_DEALS_PER_PAGE = 20;
  const latestDealsLimit = latestDealsPage * LATEST_DEALS_PER_PAGE;
  const latestDeals = latestFilteredDeals.slice(0, latestDealsLimit);
  
  // Check if there are more deals to show (either locally or from API)
  const hasMoreLocalDeals = latestDeals.length < latestFilteredDeals.length;
  const canFetchMore = hasNextPage;



  // Infinite scroll effect - only for Top/Hot "View All" sections, Latest Deals uses button
  React.useEffect(() => {
    const handleSectionScroll = () => {
      const footer = document.querySelector('footer');
      const footerOffset = footer ? footer.offsetTop - 200 : document.documentElement.offsetHeight - 200;
      const scrollPosition = window.innerHeight + document.documentElement.scrollTop;
      
      // Stop loading if we're too close to footer
      if (scrollPosition >= footerOffset) return;
      
      // Load more when 800px from current scroll position, but respect footer boundary
      if (scrollPosition >= document.documentElement.offsetHeight - 800 && !loadingMore) {
        if (showAllTop && topDeals.length < filteredDeals.filter((d: Deal) => d.deal_type === 'top' && d.image_url).length) {
          loadMoreDeals('top');
        } else if (showAllHot && hotDeals.length < filteredDeals.filter((d: Deal) => d.deal_type === 'hot' && d.image_url).length) {
          loadMoreDeals('hot');
        }
        // Note: Latest Deals does NOT auto-scroll load - uses "Load More" button only
      }
    };

    window.addEventListener('scroll', handleSectionScroll);
    return () => window.removeEventListener('scroll', handleSectionScroll);
  }, [showAllTop, showAllHot, topDeals.length, hotDeals.length, filteredDeals, loadingMore]);
  

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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header>
        <div className="relative">
          <Input
            type="search"
            placeholder="Search deals, stores..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 bg-gray-100 border-gray-300 focus:border-red-600 focus:ring-red-600"
            aria-label="Search deals"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
            <Search className="text-gray-400 w-4 h-4" />
          </div>
        </div>
      </Header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-red-600 via-red-700 to-red-800 text-white py-6 sm:py-12 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl sm:text-4xl lg:text-6xl font-extrabold mb-2 sm:mb-4 lg:mb-6 tracking-tight">
            AI-Powered Deals & Coupons
          </h1>
          <p className="text-sm sm:text-lg lg:text-xl mb-5 sm:mb-8 lg:mb-12 text-red-100 max-w-2xl mx-auto">
            Verified deals curated by artificial intelligence. Save more on every purchase.
          </p>
          <div className="grid grid-cols-3 gap-3 sm:gap-6 lg:gap-10 max-w-sm sm:max-w-2xl lg:max-w-3xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-5 lg:p-8 border border-white/20">
              <div className="text-xl sm:text-3xl lg:text-5xl font-extrabold text-white">{heroStats?.active_deals?.toLocaleString() || '...'}</div>
              <div className="text-[10px] sm:text-sm lg:text-base text-red-100 mt-1 lg:mt-2 font-medium">Active Deals</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-5 lg:p-8 border border-white/20">
              <div className="text-xl sm:text-3xl lg:text-5xl font-extrabold text-white">{heroStats?.total_savings || '...'}</div>
              <div className="text-[10px] sm:text-sm lg:text-base text-red-100 mt-1 lg:mt-2 font-medium">Total Savings</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-5 lg:p-8 border border-white/20">
              <div className="text-xl sm:text-3xl lg:text-5xl font-extrabold text-white">{heroStats ? `${heroStats.ai_verified_pct}%` : '...'}</div>
              <div className="text-[10px] sm:text-sm lg:text-base text-red-100 mt-1 lg:mt-2 font-medium">AI Verified</div>
            </div>
          </div>
        </div>
      </section>



      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* Leaderboard Ad - Below Hero */}
        <div className="mb-6 sm:mb-8 lg:mb-10">
          <AdBannerLeaderboard />
        </div>

        {/* Filter Bar - below hero banner */}
        <div className="bg-white rounded-lg lg:rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4 lg:p-5 mb-6 sm:mb-8 lg:mb-10">
          <div className="flex gap-2 sm:gap-3 lg:gap-4 items-center">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-9 sm:h-10 lg:h-11 flex-1 border-gray-300 rounded-lg bg-gray-50 text-xs sm:text-sm lg:text-sm">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {availableCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger className="h-9 sm:h-10 lg:h-11 flex-1 border-gray-300 rounded-lg bg-gray-50 text-xs sm:text-sm lg:text-sm">
                <SelectValue placeholder="Store" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stores</SelectItem>
                {availableStores.map((store) => (
                  <SelectItem key={store} value={store}>
                    {store}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedDiscount} onValueChange={setSelectedDiscount}>
              <SelectTrigger className="h-9 sm:h-10 lg:h-11 flex-1 border-gray-300 rounded-lg bg-gray-50 text-xs sm:text-sm lg:text-sm">
                <SelectValue placeholder="Discount" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Discount</SelectItem>
                {availableDiscounts.includes("50+") && (
                  <SelectItem value="50+">50%+ Off</SelectItem>
                )}
                {availableDiscounts.includes("30+") && (
                  <SelectItem value="30+">30%+ Off</SelectItem>
                )}
                {availableDiscounts.includes("10+") && (
                  <SelectItem value="10+">10%+ Off</SelectItem>
                )}
              </SelectContent>
            </Select>

            {(selectedCategory !== "all" || selectedStore !== "all" || selectedDiscount !== "all" || searchQuery) && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={clearFilters}
                className="h-9 sm:h-10 px-2 text-red-600 text-xs sm:text-sm flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        <SidebarAdWrapper>

        {/* Search Results Section - shown when user searches */}
        {isSearchActive && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
                <Search className="text-red-600 mr-2 w-5 h-5 sm:w-6 sm:h-6" />
                Search Results
              </h2>
              <span className="text-xs sm:text-sm text-gray-500">
                {isSearching ? 'Searching...' : `${searchResults?.total?.toLocaleString() || 0} results for "${debouncedSearch}"`}
              </span>
            </div>
            
            {isSearching && (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-red-600 mb-4" />
                <p className="text-gray-500">Searching all deals...</p>
              </div>
            )}

            {!isSearching && searchResults && searchResults.deals.length > 0 && (
              <>
                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {searchResults.deals.map((deal: Deal) => (
                    <DealCard key={deal.id} deal={deal} variant="compact" />
                  ))}
                </div>
                {searchResults.deals.length < searchResults.total && (
                  <div className="text-center mt-6">
                    <Button
                      onClick={() => setSearchLimit(prev => prev + 20)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                    >
                      Load More Results ({(searchResults.total - searchResults.deals.length).toLocaleString()} remaining)
                    </Button>
                  </div>
                )}
                {searchResults.deals.length >= searchResults.total && (
                  <div className="text-center py-6 text-gray-500 text-sm">
                    Showing all {searchResults.total.toLocaleString()} results for "{debouncedSearch}"
                  </div>
                )}
              </>
            )}

            {!isSearching && searchResults && searchResults.deals.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No deals found</h3>
                  <p className="text-gray-600 mb-4">
                    We couldn't find any deals matching "{debouncedSearch}". Try a different search term.
                  </p>
                  <Button onClick={() => setSearchQuery("")} className="bg-red-600 hover:bg-red-700">
                    Clear Search
                  </Button>
                </CardContent>
              </Card>
            )}
          </section>
        )}

        {/* Regular deal sections - hidden when search is active */}
        {!isSearchActive && (
        <>
        {/* Top Deals Section */}
        <section className="mb-10 sm:mb-12 lg:mb-16">
          <div className="flex items-center justify-between mb-4 sm:mb-6 lg:mb-8">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center">
              <Flame className="text-red-600 mr-2 w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
              Top Deals
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-xs sm:text-sm lg:text-base text-gray-500">AI-curated deals</span>
              {!showAllTop && topDeals.length >= 3 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAllTop(true)}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  View All
                </Button>
              )}
              {showAllTop && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setShowAllTop(false);
                    setTopDealsPage(1);
                  }}
                  className="text-gray-600 border-gray-600 hover:bg-gray-50"
                >
                  Show Less
                </Button>
              )}
            </div>
          </div>
          
          <div className={`grid gap-4 sm:gap-6 lg:gap-8 ${showAllTop ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
            {topDeals.length > 0 ? topDeals.map((deal: Deal) => (
              <DealCard key={deal.id} deal={deal} variant="full" />
            )) : (
              <div className="col-span-full text-center text-gray-500 py-8 bg-red-100 p-4 rounded">
                No top deals available (Total filtered deals: {filteredDeals.length})
              </div>
            )}
          </div>
          
          {showAllTop && loadingMore && (
            <div className="text-center py-8">
              <div className="inline-flex items-center px-4 py-2 text-sm text-gray-600">
                Loading more deals...
              </div>
            </div>
          )}
        </section>

        {/* Ad Between Top and Hot Deals */}
        <div className="mb-10 sm:mb-12 lg:mb-16">
          <AdBannerBetweenSections />
        </div>

        {/* Hot Deals Section */}
        <section className="mb-10 sm:mb-12 lg:mb-16">
          <div className="flex items-center justify-between mb-4 sm:mb-6 lg:mb-8">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center">
              <Flame className="text-amber-500 mr-2 w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
              Hot Deals
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-xs sm:text-sm lg:text-base text-gray-500">Trending now</span>
              {!showAllHot && hotDeals.length >= 4 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAllHot(true)}
                  className="text-amber-600 border-amber-600 hover:bg-amber-50"
                >
                  View All
                </Button>
              )}
              {showAllHot && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setShowAllHot(false);
                    setHotDealsPage(1);
                  }}
                  className="text-gray-600 border-gray-600 hover:bg-gray-50"
                >
                  Show Less
                </Button>
              )}
            </div>
          </div>
          
          <div className={`grid gap-4 sm:gap-6 lg:gap-8 ${showAllHot ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
            {hotDeals.length > 0 ? hotDeals.map((deal: Deal) => (
              <DealCard key={deal.id} deal={deal} variant="compact" />
            )) : (
              <div className="col-span-full text-center text-gray-500 py-8 bg-yellow-100 p-4 rounded">
                No hot deals available (Total filtered deals: {filteredDeals.length})
              </div>
            )}
          </div>
          
          {showAllHot && loadingMore && (
            <div className="text-center py-8">
              <div className="inline-flex items-center px-4 py-2 text-sm text-gray-600">
                Loading more deals...
              </div>
            </div>
          )}
        </section>

        {/* Ad Between Hot and Latest Deals */}
        <div className="mb-10 sm:mb-12 lg:mb-16">
          <AdBannerBetweenSections className="second-ad" />
        </div>

        {/* Latest Deals Section - Infinite scroll enabled by default */}
        <section className="mb-10 sm:mb-12 lg:mb-16">
          <div className="flex items-center justify-between mb-4 sm:mb-6 lg:mb-8">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center">
              <Clock className="text-blue-500 mr-2 w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
              Latest Deals
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-xs sm:text-sm lg:text-base text-gray-500">
                Showing {latestDeals.length.toLocaleString()} of {(latestDealsTotal?.count || latestFilteredDeals.length).toLocaleString()} deals
              </span>
            </div>
          </div>
          
          <div className="grid gap-4 sm:gap-6 lg:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {latestDeals.length > 0 ? latestDeals.map((deal: Deal) => (
              <DealCard key={deal.id} deal={deal} variant="compact" />
            )) : (
              <div className="col-span-full text-center text-gray-500 py-8 bg-blue-100 p-4 rounded">
                No latest deals available (Total filtered deals: {filteredDeals.length})
              </div>
            )}
          </div>
          
          {/* Load More button - shows 20 more deals each click */}
          {(hasMoreLocalDeals || canFetchMore) && latestDeals.length > 0 && (
            <div className="text-center py-8">
              <Button 
                onClick={() => {
                  // If we have more local deals to show, just increment the page
                  if (hasMoreLocalDeals) {
                    setLatestDealsPage(prev => prev + 1);
                  } else if (canFetchMore) {
                    // If we've shown all local deals but API has more, fetch and increment
                    fetchNextPage();
                    setLatestDealsPage(prev => prev + 1);
                  }
                }}
                disabled={isFetchingNextPage}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  `Load More Deals (${((latestDealsTotal?.count || latestFilteredDeals.length) - latestDeals.length).toLocaleString()} remaining)`
                )}
              </Button>
            </div>
          )}
          
          {/* End of Latest Deals indicator - only show when all deals are displayed */}
          {!hasMoreLocalDeals && !canFetchMore && latestDeals.length > 0 && (
            <div className="text-center py-6 text-gray-500 text-sm">
              You've seen all {(latestDealsTotal?.count || latestDeals.length).toLocaleString()} latest deals
            </div>
          )}
        </section>

        {filteredDeals.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No deals found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your filters or check back later for new deals.
              </p>
              <Button onClick={clearFilters} className="bg-red-600 hover:bg-red-700">
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Main infinite scroll loading indicator - only show when not in "View All" mode */}
        {isFetchingNextPage && !showAllTop && !showAllHot && !showAllLatest && (
          <div className="text-center py-8 bg-white rounded-lg shadow-sm border border-gray-200 mx-4 my-8">
            <div className="inline-flex items-center space-x-3 px-6 py-4 text-gray-600">
              <Loader2 className="w-6 h-6 animate-spin text-red-600" />
              <span className="text-lg font-medium">Loading more deals...</span>
            </div>
            <div className="text-sm text-gray-500 mt-2">
              Discovering amazing deals for you
            </div>
          </div>
        )}
        
        {/* End of deals indicator - only show when not in "View All" mode and ensure footer is reachable */}
        {!hasNextPage && deals.length > 0 && !showAllTop && !showAllHot && !showAllLatest && (
          <div className="text-center py-8 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg shadow-sm border border-gray-200 mx-4 my-8 mb-16">
            <div className="text-gray-600 flex flex-col items-center justify-center">
              <div className="text-3xl mb-3">🎉</div>
              <div className="text-lg font-medium mb-2">You've seen all deals!</div>
              <div className="text-sm">Check back soon for new deals</div>
            </div>
          </div>
        )}
        </>
        )}

        </SidebarAdWrapper>
      </main>

      {/* Ad Before Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <AdBannerBeforeFooter />
      </div>

      <Footer />
    </div>
  );
}
