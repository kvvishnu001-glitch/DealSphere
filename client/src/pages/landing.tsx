import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Percent, Search, Flame, Clock, Tag, Store, Facebook, Twitter, Instagram, Youtube } from "lucide-react";

export default function Landing() {
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
            <div className="flex-1 max-w-lg mx-8">
              <div className="relative">
                <Input
                  type="search"
                  placeholder="Search deals, stores, or products..."
                  className="w-full pl-10 pr-4 bg-gray-100 border-gray-300 focus:border-red-600 focus:ring-red-600"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Search className="text-gray-400 w-4 h-4" />
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => window.location.href = '/api/login'}
                className="bg-red-600 hover:bg-red-700 text-white font-medium"
              >
                Admin Dashboard
              </Button>
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
              <div className="text-3xl font-bold">2,847</div>
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

      {/* Deal Categories */}
      <section className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            <div className="py-4 px-2 border-b-2 border-red-600 text-red-600 font-medium whitespace-nowrap flex items-center">
              <Flame className="w-4 h-4 mr-2" />
              Top Deals
            </div>
            <div className="py-4 px-2 border-b-2 border-transparent text-gray-500 font-medium whitespace-nowrap flex items-center">
              <Flame className="w-4 h-4 mr-2" />
              Hot Deals
            </div>
            <div className="py-4 px-2 border-b-2 border-transparent text-gray-500 font-medium whitespace-nowrap flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Latest Deals
            </div>
            <div className="py-4 px-2 border-b-2 border-transparent text-gray-500 font-medium whitespace-nowrap flex items-center">
              <Tag className="w-4 h-4 mr-2" />
              Categories
            </div>
            <div className="py-4 px-2 border-b-2 border-transparent text-gray-500 font-medium whitespace-nowrap flex items-center">
              <Store className="w-4 h-4 mr-2" />
              Stores
            </div>
          </nav>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="text-center py-12">
          <CardContent>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to DealSphere
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Get access to thousands of AI-verified deals and coupons. Our platform uses 
              artificial intelligence to find the best deals and ensure they're legitimate 
              before sharing them with you.
            </p>
            <Button 
              onClick={() => window.location.href = '/api/login'}
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3"
            >
              Access Admin Dashboard
            </Button>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          <Card>
            <CardContent className="text-center p-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Flame className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">AI-Verified Deals</h3>
              <p className="text-gray-600">
                Our AI system validates every deal to ensure authenticity and value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="text-center p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Tag className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Smart Categorization</h3>
              <p className="text-gray-600">
                Deals are automatically categorized and ranked by our AI system
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="text-center p-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Store className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Trusted Retailers</h3>
              <p className="text-gray-600">
                We partner with legitimate retailers and maintain compliance standards
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12 mt-16">
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
