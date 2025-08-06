import { dealService } from "./services/dealService";
import type { InsertDeal } from "@shared/schema";

const sampleDeals: Partial<InsertDeal>[] = [
  {
    title: "Apple MacBook Air M2 - 70% Off Limited Time Deal",
    description: "Latest Apple MacBook Air with M2 chip, 8GB RAM, 256GB SSD. Perfect for students and professionals.",
    originalPrice: "1199.00",
    salePrice: "359.70",
    discountPercentage: 70,
    imageUrl: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?ixlib=rb-4.0.3&w=800&h=600&fit=crop",
    affiliateUrl: "https://amazon.com/macbook-air-m2",
    store: "Amazon",
    storeLogoUrl: "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?ixlib=rb-4.0.3&w=100&h=100&fit=crop",
    category: "electronics",
    rating: "4.8",
    reviewCount: 2847,
    sourceApi: "amazon_api"
  },
  {
    title: "Nike Air Max 270 Sneakers - 60% Off Flash Sale",
    description: "Premium running shoes with air cushioning technology. Available in multiple colors and sizes.",
    originalPrice: "150.00",
    salePrice: "60.00",
    discountPercentage: 60,
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&w=800&h=600&fit=crop",
    affiliateUrl: "https://nike.com/air-max-270",
    store: "Nike",
    storeLogoUrl: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?ixlib=rb-4.0.3&w=100&h=100&fit=crop",
    category: "fashion",
    rating: "4.6",
    reviewCount: 1523,
    sourceApi: "nike_api"
  },
  {
    title: "Samsung 65\" 4K Smart TV - 45% Off Black Friday Special",
    description: "Ultra HD 4K Smart TV with HDR, built-in streaming apps, and voice control.",
    originalPrice: "899.99",
    salePrice: "494.99",
    discountPercentage: 45,
    imageUrl: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?ixlib=rb-4.0.3&w=800&h=600&fit=crop",
    affiliateUrl: "https://samsung.com/smart-tv-65",
    store: "Samsung",
    storeLogoUrl: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?ixlib=rb-4.0.3&w=100&h=100&fit=crop",
    category: "electronics",
    rating: "4.7",
    reviewCount: 892,
    sourceApi: "samsung_api"
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