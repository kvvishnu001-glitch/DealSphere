import { Link } from "wouter";
import { Percent } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-6 lg:gap-8">
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-2 mb-3 lg:mb-4">
              <Percent className="text-red-500 w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-base sm:text-lg font-bold">DealSphere</span>
            </div>
            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed max-w-xs">
              AI-verified deals and coupons updated daily. Save more on every purchase with smart deal discovery.
            </p>
          </div>

          <div>
            <h4 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-gray-300 mb-2 sm:mb-3">Explore</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors">About</Link></li>
              <li><Link href="/blog" className="text-gray-400 hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-gray-300 mb-2 sm:mb-3">Legal</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <li><Link href="/privacy-policy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms-conditions" className="text-gray-400 hover:text-white transition-colors">Terms</Link></li>
              <li><Link href="/affiliate-disclosure" className="text-gray-400 hover:text-white transition-colors">Affiliate Disclosure</Link></li>
            </ul>
          </div>

          <div className="col-span-2 lg:col-span-1">
            <p className="text-[10px] sm:text-xs text-gray-500 leading-relaxed">
              As an Amazon Associate, we earn from qualifying purchases. Prices and availability are subject to change.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-4 sm:pt-5 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-[10px] sm:text-xs text-gray-500">
            &copy; {new Date().getFullYear()} DealSphere. All rights reserved.
          </p>
          <p className="text-[9px] sm:text-[10px] text-gray-600">
            Prices shown may differ from actual retailer pricing.
          </p>
        </div>
      </div>
    </footer>
  );
}
