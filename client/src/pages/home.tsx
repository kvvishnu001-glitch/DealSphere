import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DealCard } from "@/components/ui/deal-card";
import { Skeleton } from "@/components/ui/skeleton";

import { 
  Percent, 
  Search, 
  Flame, 
  Clock, 
  Tag, 
  Store, 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube, 
  X,
  LogOut
} from "lucide-react";
import type { Deal, User } from "@shared/schema";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStore, setSelectedStore] = useState<string>("all");
  const [selectedDiscount, setSelectedDiscount] = useState<string>("all");

  // Fetch all deals
  const { data: deals, isLoading } = useQuery({
    queryKey: ['/api/deals', { limit: 100 }],
    queryFn: ({ queryKey }) => {
      const [path, params] = queryKey as [string, { limit: number }];
      const url = new URL(path, window.location.origin);
      url.searchParams.set('limit', params.limit.toString());
      return fetch(url.toString()).then(res => res.json());
    },
  });

  // Filter deals based on selected filters
  const filteredDeals = deals?.filter((deal: Deal) => {
    if (selectedCategory !== "all" && deal.category !== selectedCategory) return false;
    if (selectedStore !== "all" && deal.store !== selectedStore) return false;
    if (selectedDiscount !== "all") {
      const discount = deal.discountPercentage;
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

  const topDeals = filteredDeals.filter((deal: Deal) => deal.dealType === 'top').slice(0, 3);
  const hotDeals = filteredDeals.filter((deal: Deal) => deal.dealType === 'hot').slice(0, 4);
  const latestDeals = filteredDeals.filter((deal: Deal) => deal.dealType === 'latest').slice(0, 5);

  const clearFilters = () => {
    setSelectedCategory("all");
    setSelectedStore("all");
    setSelectedDiscount("all");
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
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Percent className="text-red-600 text-2xl mr-2" />
                <h1 className="text-2xl font-bold text-gray-800">DealSphere</h1>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="flex-1 max-w-lg mx-4 sm:mx-8">
              <div className="relative">
                <Input
                  type="search"
                  placeholder="Search deals, stores..."
                  className="w-full pl-10 pr-4 bg-gray-100 border-gray-300 focus:border-red-600 focus:ring-red-600"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Search className="text-gray-400 w-4 h-4" />
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Admin Dashboard button will be shown only on /admin route */}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-red-600 to-red-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            AI-Powered Deals & Coupons
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-red-100">
            Discover verified deals curated by artificial intelligence
          </p>
          <div className="flex justify-center items-center space-x-8 text-red-100">
            <div className="text-center">
              <div className="text-3xl font-bold">{deals?.length || 0}</div>
              <div className="text-sm">Active Deals</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">$1.2M+</div>
              <div className="text-sm">Total Savings</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">98%</div>
              <div className="text-sm">AI Verified</div>
            </div>
          </div>
        </div>
      </section>



      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block">Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="fashion">Fashion</SelectItem>
                    <SelectItem value="home">Home & Garden</SelectItem>
                    <SelectItem value="travel">Travel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block">Store</label>
                <Select value={selectedStore} onValueChange={setSelectedStore}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stores</SelectItem>
                    <SelectItem value="Amazon">Amazon</SelectItem>
                    <SelectItem value="Target">Target</SelectItem>
                    <SelectItem value="Best Buy">Best Buy</SelectItem>
                    <SelectItem value="Walmart">Walmart</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block">Discount</label>
                <Select value={selectedDiscount} onValueChange={setSelectedDiscount}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Discount</SelectItem>
                    <SelectItem value="50+">50%+ Off</SelectItem>
                    <SelectItem value="30+">30%+ Off</SelectItem>
                    <SelectItem value="10+">10%+ Off</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block sm:invisible">Actions</label>
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  className="w-full text-gray-600 hover:text-gray-800"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Deals Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Flame className="text-red-600 mr-2" />
              Top Deals
            </h2>
            <span className="text-sm text-gray-500">AI-curated best deals</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topDeals.map((deal: Deal) => (
              <DealCard key={deal.id} deal={deal} variant="full" />
            ))}
          </div>
        </section>

        {/* Hot Deals Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Flame className="text-amber-500 mr-2" />
              Hot Deals
            </h2>
            <span className="text-sm text-gray-500">Trending now</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {hotDeals.map((deal: Deal) => (
              <DealCard key={deal.id} deal={deal} variant="compact" />
            ))}
          </div>
        </section>

        {/* Latest Deals Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Clock className="text-blue-500 mr-2" />
              Latest Deals
            </h2>
            <span className="text-sm text-gray-500">Just added</span>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {latestDeals.map((deal: Deal) => (
                  <DealCard key={deal.id} deal={deal} variant="list" />
                ))}
              </div>
            </CardContent>
          </Card>
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
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Percent className="text-red-600 text-2xl mr-2" />
                <h3 className="text-xl font-bold">DealSphere</h3>
              </div>
              <p className="text-gray-300 mb-4">
                AI-powered deals and coupons platform helping you save money on your favorite products.
              </p>
              <div className="flex space-x-4">
                <Facebook className="w-5 h-5 hover:text-red-600 cursor-pointer transition-colors" />
                <Twitter className="w-5 h-5 hover:text-red-600 cursor-pointer transition-colors" />
                <Instagram className="w-5 h-5 hover:text-red-600 cursor-pointer transition-colors" />
                <Youtube className="w-5 h-5 hover:text-red-600 cursor-pointer transition-colors" />
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Popular Categories</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">Electronics</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Fashion</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Home & Garden</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Travel</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Sports & Outdoors</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Top Stores</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">Amazon</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Target</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Best Buy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Walmart</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Macy's</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Affiliate Disclosure</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-600 mt-8 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-300 text-sm mb-4 md:mb-0">
                © 2024 DealSphere. All rights reserved.
              </p>
              <div className="text-sm text-gray-300 max-w-md">
                <strong>Affiliate Disclosure:</strong> DealSphere is a participant in various affiliate programs and may earn commissions from qualifying purchases made through our links.
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
