import { dealService } from "./services/dealService";
import type { InsertDeal } from "@shared/schema";

const sampleDeals: Partial<InsertDeal>[] = [
  {
    title: "Echo Dot (5th Gen) Smart Speaker with Alexa - 65% Off",
    description: "Compact smart speaker with improved audio, LED display, and Alexa voice control. Perfect for any room.",
    originalPrice: "59.99",
    salePrice: "19.99",
    discountPercentage: 67,
    imageUrl: "https://images.unsplash.com/photo-1589492477829-5e65395b66cc?ixlib=rb-4.0.3&w=800&h=600&fit=crop",
    affiliateUrl: "https://amazon.com/echo-dot-5th-gen",
    store: "Amazon",
    storeLogoUrl: "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?ixlib=rb-4.0.3&w=100&h=100&fit=crop",
    category: "electronics",
    rating: "4.7",
    reviewCount: 47821,
    sourceApi: "amazon_api"
  },
  {
    title: "Fire TV Stick 4K Max Streaming Device - 50% Off",
    description: "Stream 4K Ultra HD content with Wi-Fi 6 support, Alexa Voice Remote, and faster app starts.",
    originalPrice: "54.99",
    salePrice: "27.99",
    discountPercentage: 49,
    imageUrl: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?ixlib=rb-4.0.3&w=800&h=600&fit=crop",
    affiliateUrl: "https://amazon.com/fire-tv-stick-4k-max",
    store: "Amazon",
    storeLogoUrl: "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?ixlib=rb-4.0.3&w=100&h=100&fit=crop",
    category: "electronics",
    rating: "4.6",
    reviewCount: 231654,
    sourceApi: "amazon_api"
  },
  {
    title: "Kindle Paperwhite (11th Generation) - 32% Off",
    description: "Waterproof e-reader with 6.8\" display, adjustable warm light, and weeks of battery life.",
    originalPrice: "149.99",
    salePrice: "99.99",
    discountPercentage: 33,
    imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-4.0.3&w=800&h=600&fit=crop",
    affiliateUrl: "https://amazon.com/kindle-paperwhite-11th-gen",
    store: "Amazon",
    storeLogoUrl: "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?ixlib=rb-4.0.3&w=100&h=100&fit=crop",
    category: "electronics",
    rating: "4.5",
    reviewCount: 89432,
    sourceApi: "amazon_api"
  },
  {
    title: "Apple AirPods (3rd Generation) - 25% Off",
    description: "Spatial audio, sweat and water resistant, up to 30 hours of listening time with charging case.",
    originalPrice: "179.00",
    salePrice: "134.99",
    discountPercentage: 25,
    imageUrl: "https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?ixlib=rb-4.0.3&w=800&h=600&fit=crop",
    affiliateUrl: "https://amazon.com/airpods-3rd-generation",
    store: "Amazon",
    storeLogoUrl: "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?ixlib=rb-4.0.3&w=100&h=100&fit=crop",
    category: "electronics",
    rating: "4.4",
    reviewCount: 156789,
    sourceApi: "amazon_api"
  },
  {
    title: "Instant Vortex Plus 6 Quart Air Fryer - 43% Off",
    description: "6-in-1 air fryer with smart programs, crispy cooking technology, and easy cleanup.",
    originalPrice: "139.99",
    salePrice: "79.99",
    discountPercentage: 43,
    imageUrl: "https://images.unsplash.com/photo-1585515656798-f4da54d7c3bf?ixlib=rb-4.0.3&w=800&h=600&fit=crop",
    affiliateUrl: "https://amazon.com/instant-vortex-plus-air-fryer",
    store: "Amazon",
    storeLogoUrl: "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?ixlib=rb-4.0.3&w=100&h=100&fit=crop",
    category: "home",
    rating: "4.3",
    reviewCount: 23876,
    sourceApi: "amazon_api"
  },
  {
    title: "Anker Portable Charger 10000mAh - 38% Off",
    description: "Ultra-compact power bank with fast charging, multiple device support, and LED indicators.",
    originalPrice: "39.99",
    salePrice: "24.99",
    discountPercentage: 38,
    imageUrl: "https://images.unsplash.com/photo-1609392133730-ba3779e5b304?ixlib=rb-4.0.3&w=800&h=600&fit=crop",
    affiliateUrl: "https://amazon.com/anker-portable-charger-10000",
    store: "Amazon",
    storeLogoUrl: "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?ixlib=rb-4.0.3&w=100&h=100&fit=crop",
    category: "electronics",
    rating: "4.6",
    reviewCount: 145632,
    sourceApi: "amazon_api"
  },
  {
    title: "Levi's 501 Original Fit Jeans - 35% Off",
    description: "Classic straight fit jeans with button fly, made from premium cotton denim.",
    originalPrice: "69.50",
    salePrice: "44.99",
    discountPercentage: 35,
    imageUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?ixlib=rb-4.0.3&w=800&h=600&fit=crop",
    affiliateUrl: "https://amazon.com/levis-501-original-fit-jeans",
    store: "Amazon",
    storeLogoUrl: "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?ixlib=rb-4.0.3&w=100&h=100&fit=crop",
    category: "fashion",
    rating: "4.2",
    reviewCount: 8934,
    sourceApi: "amazon_api"
  },
  {
    title: "Samsung 55\" Crystal UHD 4K Smart TV - 47% Off",
    description: "Crystal UHD processor, HDR support, Tizen OS with built-in streaming apps, and voice control.",
    originalPrice: "649.99",
    salePrice: "344.99",
    discountPercentage: 47,
    imageUrl: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?ixlib=rb-4.0.3&w=800&h=600&fit=crop",
    affiliateUrl: "https://amazon.com/samsung-55-crystal-uhd-4k",
    store: "Amazon",
    storeLogoUrl: "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?ixlib=rb-4.0.3&w=100&h=100&fit=crop",
    category: "electronics",
    rating: "4.5",
    reviewCount: 12847,
    sourceApi: "amazon_api"
  },
  {
    title: "Ninja Foodi Personal Blender - 41% Off",
    description: "Personal-sized blender with nutrient extraction, 18 oz cup, and easy cleaning.",
    originalPrice: "79.99",
    salePrice: "46.99",
    discountPercentage: 41,
    imageUrl: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?ixlib=rb-4.0.3&w=800&h=600&fit=crop",
    affiliateUrl: "https://amazon.com/ninja-foodi-personal-blender",
    store: "Amazon",
    storeLogoUrl: "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?ixlib=rb-4.0.3&w=100&h=100&fit=crop",
    category: "home",
    rating: "4.4",
    reviewCount: 7654,
    sourceApi: "amazon_api"
  },
  {
    title: "Carhartt Men's Acrylic Watch Hat - 29% Off",
    description: "Classic knit beanie made from soft acrylic yarn, perfect for cold weather.",
    originalPrice: "16.99",
    salePrice: "11.99",
    discountPercentage: 29,
    imageUrl: "https://images.unsplash.com/photo-1521369909029-2afed882baee?ixlib=rb-4.0.3&w=800&h=600&fit=crop",
    affiliateUrl: "https://amazon.com/carhartt-acrylic-watch-hat",
    store: "Amazon",
    storeLogoUrl: "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?ixlib=rb-4.0.3&w=100&h=100&fit=crop",
    category: "fashion",
    rating: "4.6",
    reviewCount: 45123,
    sourceApi: "amazon_api"
  },
  {
    title: "Dyson V15 Detect Cordless Vacuum - 35% Off",
    description: "Advanced cordless vacuum with laser dust detection and powerful suction for all floor types.",
    originalPrice: "750.00",
    salePrice: "487.50",
    discountPercentage: 35,
    imageUrl: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&w=800&h=600&fit=crop",
    affiliateUrl: "https://dyson.com/v15-detect",
    store: "Dyson",
    storeLogoUrl: "https://images.unsplash.com/photo-1586953983027-d7508a64f4bb?ixlib=rb-4.0.3&w=100&h=100&fit=crop",
    category: "home",
    rating: "4.9",
    reviewCount: 567,
    sourceApi: "dyson_api"
  },
  {
    title: "Instant Pot Duo 7-in-1 Electric Pressure Cooker - 50% Off",
    description: "Multi-functional pressure cooker that combines 7 kitchen appliances in one. Perfect for quick meals.",
    originalPrice: "99.99",
    salePrice: "49.99",
    discountPercentage: 50,
    imageUrl: "https://images.unsplash.com/photo-1556909114-2b522d8deb8d?ixlib=rb-4.0.3&w=800&h=600&fit=crop",
    affiliateUrl: "https://instantpot.com/duo-7-in-1",
    store: "Target",
    storeLogoUrl: "https://images.unsplash.com/photo-1596464716127-f2a82984de30?ixlib=rb-4.0.3&w=100&h=100&fit=crop",
    category: "home",
    rating: "4.5",
    reviewCount: 3421,
    sourceApi: "target_api"
  },
  {
    title: "AirPods Pro 2nd Generation - 30% Off Apple Store",
    description: "Active Noise Cancellation, Adaptive Transparency, and spatial audio with dynamic head tracking.",
    originalPrice: "249.00",
    salePrice: "174.30",
    discountPercentage: 30,
    imageUrl: "https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?ixlib=rb-4.0.3&w=800&h=600&fit=crop",
    affiliateUrl: "https://apple.com/airpods-pro",
    store: "Apple",
    storeLogoUrl: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?ixlib=rb-4.0.3&w=100&h=100&fit=crop",
    category: "electronics",
    rating: "4.8",
    reviewCount: 1876,
    sourceApi: "apple_api"
  }
];

export async function seedDeals() {
  console.log("Seeding sample deals...");
  
  for (const dealData of sampleDeals) {
    try {
      const result = await dealService.processDealSubmission(dealData);
      console.log(`Deal processed: ${dealData.title} - ${result.success ? 'Success' : 'Failed'}`);
    } catch (error) {
      console.error(`Failed to process deal: ${dealData.title}`, error);
    }
  }
  
  console.log("Finished seeding deals.");
}