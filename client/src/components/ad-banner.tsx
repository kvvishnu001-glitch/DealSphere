import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";

interface BannerData {
  id: string;
  name: string;
  position: string;
  banner_type: string;
  image_url?: string;
  link_url?: string;
  html_code?: string;
  alt_text?: string;
}

interface AdBannerProps {
  position: string;
  className?: string;
}

export function AdBanner({ position, className = "" }: AdBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: banners } = useQuery<BannerData[]>({
    queryKey: ['/api/banners', position],
    queryFn: async () => {
      const res = await fetch(`/api/banners?position=${position}`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 60000,
  });

  useEffect(() => {
    if (banners && banners.length > 0) {
      banners.forEach(banner => {
        fetch(`/api/banners/${banner.id}/impression`, { method: 'POST' }).catch(() => {});
      });
    }
  }, [banners]);

  const handleBannerClick = async (banner: BannerData) => {
    try {
      await fetch(`/api/banners/${banner.id}/click`, { method: 'POST' });
    } catch {}
    if (banner.link_url) {
      window.open(banner.link_url, '_blank', 'noopener,noreferrer');
    }
  };

  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    <div className={`ad-slot ${className}`} ref={containerRef}>
      {banners.map(banner => (
        <div key={banner.id} className="mb-2 last:mb-0">
          {banner.banner_type === 'google_ads' && banner.html_code ? (
            <div className="text-center">
              <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Advertisement</div>
              <div dangerouslySetInnerHTML={{ __html: banner.html_code }} />
            </div>
          ) : banner.image_url ? (
            <div className="text-center">
              <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Advertisement</div>
              <div
                onClick={() => handleBannerClick(banner)}
                className={banner.link_url ? "cursor-pointer hover:opacity-90 transition-opacity" : ""}
              >
                <img
                  src={banner.image_url}
                  alt={banner.alt_text || banner.name}
                  className="w-full rounded-lg max-h-[250px] object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function AdBannerLeaderboard({ className = "" }: { className?: string }) {
  return <AdBanner position="hero_below" className={className} />;
}

export function AdBannerBetweenSections({ className = "" }: { className?: string }) {
  return <AdBanner position="between_sections" className={className} />;
}

export function AdBannerSidebar({ className = "" }: { className?: string }) {
  return <AdBanner position="sidebar" className={`w-full ${className}`} />;
}

export function AdBannerBeforeFooter({ className = "" }: { className?: string }) {
  return <AdBanner position="before_footer" className={className} />;
}

export function AdBannerDealDetail({ className = "" }: { className?: string }) {
  return <AdBanner position="deal_detail" className={className} />;
}

export function SidebarAdWrapper({ children }: { children: React.ReactNode }) {
  const { data: sidebarBanners } = useQuery<BannerData[]>({
    queryKey: ['/api/banners', 'sidebar'],
    queryFn: async () => {
      const res = await fetch(`/api/banners?position=sidebar`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 60000,
  });

  const hasSidebarAds = sidebarBanners && sidebarBanners.length > 0;

  if (!hasSidebarAds) {
    return <>{children}</>;
  }

  return (
    <div className="flex gap-6 lg:gap-8">
      <div className="flex-1 min-w-0">
        {children}
      </div>
      <aside className="hidden xl:block w-[200px] flex-shrink-0">
        <div className="sticky top-20 space-y-6">
          <AdBannerSidebar />
          <AdBannerSidebar className="sidebar-second" />
        </div>
      </aside>
    </div>
  );
}
