import React, { useState, useEffect } from "react";
import { useRealTimeUpdates } from "@/hooks/use-auto-refresh";
import { FileUploadModal } from "../components/FileUploadModal";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [metrics, setMetrics] = useState<any>(null);
  const [deals, setDeals] = useState<any[]>([]);
  const [filteredDeals, setFilteredDeals] = useState<any[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddDeal, setShowAddDeal] = useState(false);
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [jsonImportLoading, setJsonImportLoading] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [editingDeal, setEditingDeal] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [urlCheckRunning, setUrlCheckRunning] = useState(false);
  const [urlCheckResult, setUrlCheckResult] = useState<any>(null);
  const [urlCheckProgress, setUrlCheckProgress] = useState(0);
  const [urlCheckStatus, setUrlCheckStatus] = useState("");
  const [selectedDeals, setSelectedDeals] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDeals, setTotalDeals] = useState(0);
  const [dealsPerPage, setDealsPerPage] = useState(25);
  const [newDeal, setNewDeal] = useState({
    title: "",
    description: "",
    original_price: "",
    sale_price: "",
    store: "",
    category: "",
    affiliate_url: "",
    image_url: "",
    deal_type: "regular",
    coupon_code: "",
    coupon_required: false
  });
  
  // Automation state
  const [automationStatus, setAutomationStatus] = useState<any>(null);
  const [automationLoading, setAutomationLoading] = useState(false);
  
  // Affiliate networks state
  const [affiliateNetworks, setAffiliateNetworks] = useState<any[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<any>(null);
  const [networkConfig, setNetworkConfig] = useState<any>({});
  const [showConfigModal, setShowConfigModal] = useState(false);
  
  // Deal issues tracking for "Needs Review" functionality
  const [dealIssues, setDealIssues] = useState<Record<string, string[]>>({});
  
  // User management state
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [availablePermissions, setAvailablePermissions] = useState<string[]>([]);
  const [newUser, setNewUser] = useState({
    username: "", email: "", password: "", role: "admin", permissions: [] as string[]
  });
  const [auditFilter, setAuditFilter] = useState({ admin_id: "", action: "" });

  // Banner management state
  const [banners, setBanners] = useState<any[]>([]);
  const [showBannerForm, setShowBannerForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [bannerForm, setBannerForm] = useState({
    name: "", position: "hero_below", banner_type: "custom",
    image_url: "", link_url: "", html_code: "", alt_text: "",
    sort_order: 0, is_active: true, start_date: "", end_date: ""
  });

  // Enable real-time updates
  useRealTimeUpdates();

  const categories = ["Electronics", "Clothing", "Home & Garden", "Sports", "Books", "Toys", "Beauty", "Automotive", "Food", "Health"];
  const dealTypes = ["regular", "hot", "top"];

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      window.location.href = "/admin";
      return;
    }
    fetchData();
    if (activeTab === "automation") {
      fetchAutomationStatus();
    } else if (activeTab === "affiliates") {
      fetchAffiliateNetworks();
    } else if (activeTab === "users") {
      fetchUsers();
      fetchAuditLogs();
      fetchPermissions();
    } else if (activeTab === "banners") {
      fetchBanners();
    }
    
    // Set up auto-refresh for deals and metrics every 30 seconds
    const autoRefreshInterval = setInterval(() => {
      fetchData();
    }, 30000);
    
    return () => clearInterval(autoRefreshInterval);
  }, [activeTab]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedCategory, statusFilter]);

  useEffect(() => {
    fetchDeals();
    setSelectedDeals(new Set());
  }, [currentPage, dealsPerPage, debouncedSearch, selectedCategory, statusFilter]);

  const fetchData = async () => {
    await Promise.all([fetchMetrics(), fetchDeals()]);
  };

  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin/metrics", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error("Error fetching metrics:", error);
    }
  };

  const fetchDeals = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("per_page", String(dealsPerPage));
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (selectedCategory !== "all") params.set("category", selectedCategory);
      if (statusFilter !== "all") params.set("deal_status", statusFilter);

      const response = await fetch(`/api/admin/deals?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDeals(data.deals || []);
        setTotalPages(data.total_pages || 1);
        setTotalDeals(data.total || 0);
        setFilteredDeals(data.deals || []);
        analyzeDealIssues(data.deals || []);
      }
    } catch (error) {
      console.error("Error fetching deals:", error);
    }
  };

  // Function to analyze deals and identify issues
  const analyzeDealIssues = (dealsData: any[]) => {
    const issues: Record<string, string[]> = {};
    
    dealsData.forEach((deal) => {
      const dealIssues: string[] = [];
      
      // Check for missing or invalid image URL
      if (!deal.image_url || deal.image_url.trim() === '') {
        dealIssues.push('Missing image URL');
      } else if (!isValidImageUrl(deal.image_url)) {
        dealIssues.push('Invalid image URL format');
      }
      
      // Check for missing required fields
      if (!deal.title || deal.title.trim() === '') {
        dealIssues.push('Missing title');
      }
      if (!deal.description || deal.description.trim() === '') {
        dealIssues.push('Missing description');
      }
      if (!deal.store || deal.store.trim() === '') {
        dealIssues.push('Missing store name');
      }
      if (!deal.category || deal.category.trim() === '') {
        dealIssues.push('Missing category');
      }
      if (!deal.affiliate_url || deal.affiliate_url.trim() === '') {
        dealIssues.push('Missing affiliate URL');
      }
      
      // Check for invalid pricing
      if (!deal.original_price || deal.original_price <= 0) {
        dealIssues.push('Invalid original price');
      }
      if (!deal.sale_price || deal.sale_price <= 0) {
        dealIssues.push('Invalid sale price');
      }
      if (deal.sale_price >= deal.original_price) {
        dealIssues.push('Sale price not lower than original price');
      }
      // Auto-calculate discount percentage if missing or invalid
      const calculatedDiscount = deal.original_price > 0 && deal.sale_price < deal.original_price 
        ? Math.round(((deal.original_price - deal.sale_price) / deal.original_price) * 100 * 10) / 10
        : 0;
      
      if (calculatedDiscount === 0 && deal.original_price > 0 && deal.sale_price >= deal.original_price) {
        dealIssues.push('Sale price not lower than original price - no discount available');
      }
      
      // Store issues if any found
      if (dealIssues.length > 0) {
        issues[deal.id] = dealIssues;
      }
    });
    
    setDealIssues(issues);
  };

  // Helper function to validate image URL format
  const isValidImageUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return /\.(jpg|jpeg|png|gif|webp)$/i.test(urlObj.pathname) || 
             url.includes('unsplash.com') || 
             url.includes('images.') ||
             url.includes('cdn.');
    } catch {
      return false;
    }
  };


  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin/deals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newDeal,
          original_price: parseFloat(newDeal.original_price),
          sale_price: parseFloat(newDeal.sale_price)
        })
      });

      if (response.ok) {
        alert("Deal created successfully!");
        setShowAddDeal(false);
        setNewDeal({
          title: "",
          description: "",
          original_price: "",
          sale_price: "",
          store: "",
          category: "",
          affiliate_url: "",
          image_url: "",
          deal_type: "regular",
          coupon_code: "",
          coupon_required: false
        });
        fetchData();
      } else {
        const errData = await response.json().catch(() => null);
        const detail = errData?.detail;
        const msg = Array.isArray(detail) ? detail.map((d: any) => d.msg || d.loc?.join('.')).join(', ') : (typeof detail === 'string' ? detail : "Failed to create deal");
        alert("Error: " + msg);
      }
    } catch (error) {
      alert("Error creating deal: " + error);
    } finally {
      setLoading(false);
    }
  };

  const handleJsonImport = async () => {
    if (!jsonInput.trim()) {
      alert("Please paste JSON data first.");
      return;
    }
    
    let deals: any[];
    try {
      const parsed = JSON.parse(jsonInput);
      deals = Array.isArray(parsed) ? parsed : [parsed];
    } catch (err) {
      alert("Invalid JSON format. Please check your input.");
      return;
    }
    
    if (deals.length === 0) {
      alert("No deals found in the JSON data.");
      return;
    }
    
    setJsonImportLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin/deals/json-import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ deals })
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Successfully imported ${result.created} deal(s)!${result.errors > 0 ? ` ${result.errors} failed.` : ''}`);
        setShowJsonImport(false);
        setJsonInput("");
        fetchData();
      } else {
        const errData = await response.json().catch(() => null);
        const detail = errData?.detail || "Failed to import deals";
        alert("Error: " + (typeof detail === 'string' ? detail : JSON.stringify(detail)));
      }
    } catch (error) {
      alert("Error importing deals: " + error);
    } finally {
      setJsonImportLoading(false);
    }
  };

  const handleUpdateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDeal) return;
    setLoading(true);

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/deals/${editingDeal.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...editingDeal,
          original_price: parseFloat(editingDeal.original_price),
          sale_price: parseFloat(editingDeal.sale_price)
        })
      });

      if (response.ok) {
        alert("Deal updated successfully!");
        setEditingDeal(null);
        fetchData();
      } else {
        alert("Failed to update deal");
      }
    } catch (error) {
      alert("Error updating deal: " + error);
    } finally {
      setLoading(false);
    }
  };

  const approveDeal = async (dealId: string) => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/deals/${dealId}/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        alert("Deal approved successfully!");
        fetchData();
      }
    } catch (error) {
      alert("Error approving deal: " + error);
    }
  };

  const rejectDeal = async (dealId: string) => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/deals/${dealId}/reject`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        alert("Deal rejected and will be deleted in 24 hours!");
        fetchData();
      }
    } catch (error) {
      alert("Error rejecting deal: " + error);
    }
  };

  const deleteDeal = async (dealId: string) => {
    if (!confirm("Are you sure you want to permanently delete this deal?")) return;

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/deals/${dealId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        alert("Deal deleted successfully!");
        fetchData();
      }
    } catch (error) {
      alert("Error deleting deal: " + error);
    }
  };

  const runUrlHealthCheck = async () => {
    if (!confirm("This will check all deal URLs and remove any that are expired, not found, or broken. Continue?")) return;
    setUrlCheckRunning(true);
    setUrlCheckResult(null);
    setUrlCheckProgress(0);
    setUrlCheckStatus("Starting URL check...");
    try {
      const token = localStorage.getItem("admin_token");

      let polling = true;
      const pollInterval = setInterval(async () => {
        if (!polling) return;
        try {
          const pollRes = await fetch("/api/admin/url-health", {
            headers: { Authorization: `Bearer ${token}` }
          });
          const pollStats = await pollRes.json();
          const progress = pollStats.check_progress;
          if (progress && progress.running && progress.total > 0) {
            const pct = Math.min(95, Math.round((progress.checked / progress.total) * 100));
            setUrlCheckProgress(pct);
            setUrlCheckStatus(`Checking URLs... ${progress.checked} of ${progress.total} done`);
          }
        } catch {}
      }, 1500);

      const checkResponse = await fetch("/api/admin/url-health/check", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const checkData = await checkResponse.json();

      polling = false;
      clearInterval(pollInterval);

      setUrlCheckProgress(97);
      setUrlCheckStatus("Cleaning up broken deals...");

      const cleanupResponse = await fetch("/api/admin/url-health/cleanup", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const cleanupData = await cleanupResponse.json();

      setUrlCheckProgress(100);
      setUrlCheckStatus("Complete!");

      setUrlCheckResult({
        total_checked: checkData.total_checked || 0,
        healthy: checkData.healthy || 0,
        broken: checkData.broken || 0,
        flagged: checkData.flagged_pending_review || 0,
        removed: (checkData.removed || 0) + (cleanupData.removed || 0),
      });
      fetchData();
    } catch (error) {
      alert("Error running URL health check: " + error);
    } finally {
      setUrlCheckRunning(false);
    }
  };

  const toggleDealSelection = (dealId: string) => {
    setSelectedDeals(prev => {
      const next = new Set(prev);
      if (next.has(dealId)) next.delete(dealId);
      else next.add(dealId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedDeals.size === filteredDeals.length) {
      setSelectedDeals(new Set());
    } else {
      setSelectedDeals(new Set(filteredDeals.map((d: any) => d.id)));
    }
  };

  const runBulkAction = async (action: string) => {
    const count = selectedDeals.size;
    const label = action === "delete" ? "permanently delete" : action;
    if (!confirm(`Are you sure you want to ${label} ${count} selected deal${count > 1 ? 's' : ''}?`)) return;
    setBulkActionLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin/deals/bulk", {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ deal_ids: Array.from(selectedDeals), action })
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        setSelectedDeals(new Set());
        fetchData();
      } else {
        alert("Error: " + (data.detail || "Something went wrong"));
      }
    } catch (error) {
      alert("Error performing bulk action: " + error);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const downloadSampleFile = (networkType: string) => {
    let csvContent = '';
    let filename = '';
    
    const header = 'title,description,original_price,sale_price,store,category,affiliate_url,image_url,deal_type,coupon_code,coupon_required,needs_ai_review';
    
    switch (networkType) {
      case 'amazon':
        csvContent = `${header}
"Amazon Echo Dot (5th Gen)","Smart speaker with Alexa - Charcoal",49.99,29.99,"Amazon","Electronics","https://amazon.com/dp/B09B8V1LZ3?tag=YOURTAG-20","https://m.media-amazon.com/images/I/714Rq4k05UL.jpg","hot","SAVE20",false,false
"Wireless Bluetooth Headphones","Premium sound quality with noise cancellation",199.99,99.99,"Amazon","Electronics","https://amazon.com/dp/B08PZHYWJS?tag=YOURTAG-20","https://m.media-amazon.com/images/I/61a45+UbLYL.jpg","latest","",false,false
"Kitchen Stand Mixer","Professional 6-quart stand mixer with attachments",399.99,249.99,"Amazon","Home & Garden","https://amazon.com/dp/B00005UP2P?tag=YOURTAG-20","https://m.media-amazon.com/images/I/81VjYXa6NFL.jpg","top","KITCHEN15",true,false`;
        filename = 'amazon_sample_deals.csv';
        break;
      case 'cj':
        csvContent = `${header}
"Gaming Laptop - RTX 4060","High-performance gaming laptop with RTX 4060",1299.99,999.99,"Best Buy","Electronics","https://www.tkqlhce.com/click-123456-987654?url=https://bestbuy.com/laptop","https://pisces.bbystatic.com/image2/BestBuy_US/images/products/laptop.jpg","hot","GAME100",false,false
"Modern Home Decor Set","Modern living room decor bundle",249.99,149.99,"Target","Home & Garden","https://www.anrdoezrs.net/links/123456/type/dlg/https://target.com/decor","https://target.scene7.com/is/image/Target/decor_set","latest","HOME25",true,false
"Advanced Fitness Tracker","Fitness tracker with heart rate monitor",199.99,119.99,"Walmart","Sports","https://linksynergy.walmart.com/deeplink?id=abc123&mid=2149&murl=https://walmart.com/tracker","https://i5.walmartimages.com/asr/fitness-tracker.jpg","latest","",false,false`;
        filename = 'commission_junction_sample_deals.csv';
        break;
      case 'shareasale':
        csvContent = `${header}
"Professional Running Shoes","Running shoes with advanced cushioning",129.99,89.99,"Nike","Sports","https://www.shareasale.com/r.cfm?b=123456&u=789012&m=1234&urllink=nike.com/running-shoes","https://static.nike.com/a/images/running-shoe.jpg","latest","RUN30",false,false
"Bestseller Book Set","Collection of top 10 bestselling novels",199.99,99.99,"Barnes & Noble","Books","https://www.shareasale.com/r.cfm?b=234567&u=789012&m=2345&urllink=barnesandnoble.com/book-set","https://prodimage.images-bn.com/book-collection.jpg","hot","BOOKS50",true,false
"Designer Leather Handbag","Luxury leather handbag from premium brand",599.99,399.99,"Nordstrom","Clothing","https://www.shareasale.com/r.cfm?b=345678&u=789012&m=3456&urllink=nordstrom.com/handbag","https://n.nordstrommedia.com/id/handbag-image.jpg","top","",false,false`;
        filename = 'shareasale_sample_deals.csv';
        break;
      case 'rakuten':
        csvContent = `${header}
"Winter Coat Collection","Premium winter coats for men and women",299.99,179.99,"Macy's","Clothing","https://click.linksynergy.com/deeplink?id=xyz789&mid=1234&murl=macys.com/coats","https://slimages.macysassets.com/winter-coat.jpg","latest","WINTER40",false,false
"Professional Power Tool Set","Professional grade power tools with case",399.99,249.99,"Home Depot","Home & Garden","https://click.linksynergy.com/deeplink?id=xyz789&mid=2345&murl=homedepot.com/tools","https://images.homedepot-static.com/power-tools.jpg","hot","TOOLS25",true,false
"Premium Pet Food Bundle","Premium dog food and treats bundle",89.99,59.99,"Petco","Pet Supplies","https://click.linksynergy.com/deeplink?id=xyz789&mid=3456&murl=petco.com/pet-food","https://assets.petco.com/petco/image/pet-food.jpg","latest","",false,false`;
        filename = 'rakuten_sample_deals.csv';
        break;
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Social sharing functions for admin
  const shareOnX = (deal: any) => {
    const calculatedDiscount = deal.original_price > 0 && deal.sale_price < deal.original_price 
      ? Math.round(((deal.original_price - deal.sale_price) / deal.original_price) * 100 * 10) / 10
      : deal.discount_percentage || 0;
    const text = `🔥 Amazing Deal Alert! ${deal.title} - Great deal at ${deal.store}! Check it out`;
    const url = `${window.location.origin}/deals/${deal.id}`;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const shareOnWhatsApp = (deal: any) => {
    const calculatedDiscount = deal.original_price > 0 && deal.sale_price < deal.original_price 
      ? Math.round(((deal.original_price - deal.sale_price) / deal.original_price) * 100 * 10) / 10
      : deal.discount_percentage || 0;
    const text = `🔥 Amazing Deal Alert! ${deal.title} - Great deal at ${deal.store}! Check it out: ${window.location.origin}/deals/${deal.id}`;
    const shareUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(shareUrl, '_blank');
  };

  const shareOnFacebook = (deal: any) => {
    const url = `${window.location.origin}/deals/${deal.id}`;
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(deal.title)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const copyDealLink = async (deal: any) => {
    const url = `${window.location.origin}/deals/${deal.id}`;
    try {
      await navigator.clipboard.writeText(url);
      alert('Deal link copied to clipboard!');
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Deal link copied to clipboard!');
    }
  };

  const fetchAutomationStatus = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin/automation/status", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAutomationStatus(data);
      }
    } catch (error) {
      console.error("Error fetching automation status:", error);
    }
  };

  const triggerManualFetch = async () => {
    setAutomationLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin/automation/fetch-deals", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        alert(`Manual fetch completed! ${result.details.saved_deals_count} new deals added.`);
        fetchData(); // Refresh deals
        fetchAutomationStatus(); // Refresh automation status
      } else {
        alert("Failed to trigger manual fetch");
      }
    } catch (error) {
      alert("Error triggering manual fetch: " + error);
    } finally {
      setAutomationLoading(false);
    }
  };

  const toggleAutomation = async (start: boolean) => {
    setAutomationLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      const endpoint = start ? "/api/admin/automation/start-scheduler" : "/api/admin/automation/stop-scheduler";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        alert(start ? "Automation started successfully!" : "Automation stopped successfully!");
        fetchAutomationStatus();
      } else {
        alert("Failed to toggle automation");
      }
    } catch (error) {
      alert("Error toggling automation: " + error);
    } finally {
      setAutomationLoading(false);
    }
  };

  const fetchAffiliateNetworks = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin/affiliates/networks", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAffiliateNetworks(data);
      }
    } catch (error) {
      console.error("Error fetching affiliate networks:", error);
    }
  };

  const configureNetwork = async (networkId: string, configData: any) => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/affiliates/networks/${networkId}/configure`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(configData)
      });
      
      if (response.ok) {
        alert("Network configured successfully!");
        fetchAffiliateNetworks();
        setShowConfigModal(false);
      } else {
        const error = await response.json();
        alert(`Configuration failed: ${error.detail}`);
      }
    } catch (error) {
      alert("Error configuring network: " + error);
    }
  };

  const testNetworkConnection = async (networkId: string) => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/affiliates/networks/${networkId}/test`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.status === "success") {
          alert(`Connection successful! Found ${result.deals_found} deals.`);
        } else {
          alert(`Connection failed: ${result.error_message}`);
        }
      }
    } catch (error) {
      alert("Error testing connection: " + error);
    }
  };

  const toggleNetworkStatus = async (networkId: string, enable: boolean) => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/affiliates/networks/${networkId}/toggle`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ enable })
      });
      
      if (response.ok) {
        alert(`Network ${enable ? 'enabled' : 'disabled'} successfully!`);
        fetchAffiliateNetworks();
      }
    } catch (error) {
      alert("Error toggling network: " + error);
    }
  };

  const openConfigModal = (network: any) => {
    setSelectedNetwork(network);
    setNetworkConfig({});
    setShowConfigModal(true);
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setUsers(await response.json());
      }
    } catch (error) { /* ignore */ }
  };

  const fetchAuditLogs = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      let url = "/api/admin/audit-logs?limit=100";
      if (auditFilter.admin_id) url += `&admin_id=${auditFilter.admin_id}`;
      if (auditFilter.action) url += `&action=${auditFilter.action}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setAuditLogs(await response.json());
      }
    } catch (error) { /* ignore */ }
  };

  const fetchPermissions = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin/permissions", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAvailablePermissions(data.permissions);
      }
    } catch (error) { /* ignore */ }
  };

  const fetchBanners = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin/banners", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setBanners(data);
      }
    } catch (error) { /* ignore */ }
  };

  const resetBannerForm = () => {
    setBannerForm({
      name: "", position: "hero_below", banner_type: "custom",
      image_url: "", link_url: "", html_code: "", alt_text: "",
      sort_order: 0, is_active: true, start_date: "", end_date: ""
    });
    setEditingBanner(null);
    setShowBannerForm(false);
  };

  const handleSaveBanner = async (e: any) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("admin_token");
      const payload: any = { ...bannerForm };
      payload.start_date = payload.start_date ? new Date(payload.start_date).toISOString() : null;
      payload.end_date = payload.end_date ? new Date(payload.end_date).toISOString() : null;
      if (!payload.image_url) payload.image_url = null;
      if (!payload.link_url) payload.link_url = null;
      if (!payload.html_code) payload.html_code = null;
      if (!payload.alt_text) payload.alt_text = null;

      const url = editingBanner ? `/api/admin/banners/${editingBanner.id}` : "/api/admin/banners";
      const method = editingBanner ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        resetBannerForm();
        fetchBanners();
        alert(editingBanner ? "Banner updated!" : "Banner created!");
      } else {
        const err = await response.json();
        alert(err.detail || "Failed to save banner");
      }
    } catch (error) {
      alert("Error saving banner");
    }
  };

  const handleEditBanner = (banner: any) => {
    setEditingBanner(banner);
    setBannerForm({
      name: banner.name || "",
      position: banner.position || "hero_below",
      banner_type: banner.banner_type || "custom",
      image_url: banner.image_url || "",
      link_url: banner.link_url || "",
      html_code: banner.html_code || "",
      alt_text: banner.alt_text || "",
      sort_order: banner.sort_order || 0,
      is_active: banner.is_active !== false,
      start_date: banner.start_date ? banner.start_date.slice(0, 16) : "",
      end_date: banner.end_date ? banner.end_date.slice(0, 16) : ""
    });
    setShowBannerForm(true);
  };

  const handleDeleteBanner = async (bannerId: string) => {
    if (!confirm("Delete this banner?")) return;
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/banners/${bannerId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        fetchBanners();
        alert("Banner deleted");
      }
    } catch (error) {
      alert("Error deleting banner");
    }
  };

  const handleToggleBanner = async (banner: any) => {
    try {
      const token = localStorage.getItem("admin_token");
      await fetch(`/api/admin/banners/${banner.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_active: !banner.is_active })
      });
      fetchBanners();
    } catch (error) { /* ignore */ }
  };

  const handleCreateUser = async (e: any) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(newUser)
      });
      if (response.ok) {
        setShowCreateUser(false);
        setNewUser({ username: "", email: "", password: "", role: "admin", permissions: [] });
        fetchUsers();
        fetchAuditLogs();
        alert("User created successfully!");
      } else {
        const err = await response.json();
        alert(err.detail || "Failed to create user");
      }
    } catch (error) {
      alert("Error creating user");
    }
  };

  const handleToggleUserActive = async (userId: string) => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/users/${userId}/toggle-active`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        fetchUsers();
        fetchAuditLogs();
      } else {
        const err = await response.json();
        alert(err.detail || "Failed to toggle user");
      }
    } catch (error) {
      alert("Error toggling user");
    }
  };

  const handleUpdateUserPermissions = async (userId: string, permissions: string[]) => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ permissions })
      });
      if (response.ok) {
        fetchUsers();
        fetchAuditLogs();
      } else {
        const err = await response.json();
        alert(err.detail || "Failed to update permissions");
      }
    } catch (error) {
      alert("Error updating permissions");
    }
  };

  const togglePermission = (perms: string[], perm: string) => {
    return perms.includes(perm) ? perms.filter(p => p !== perm) : [...perms, perm];
  };

  const permissionLabels: Record<string, string> = {
    manage_deals: "Manage Deals",
    approve_deals: "Approve/Reject Deals",
    manage_users: "Manage Users",
    view_analytics: "View Analytics",
    manage_affiliates: "Manage Affiliates",
    manage_automation: "Manage Automation",
    upload_deals: "Upload Deals"
  };

  const actionLabels: Record<string, string> = {
    login: "Logged In",
    create_user: "Created User",
    update_user: "Updated User",
    enable_user: "Enabled User",
    disable_user: "Disabled User",
    create_deal: "Created Deal",
    update_deal: "Updated Deal",
    delete_deal: "Deleted Deal",
    approve_deal: "Approved Deal",
    reject_deal: "Rejected Deal",
    cleanup_rejected_deals: "Cleaned Up Deals"
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    window.location.href = "/admin";
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      {/* Header */}
      <div style={{ backgroundColor: "white", borderBottom: "1px solid #ddd", padding: "15px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <h1 style={{ margin: 0, color: "#333" }}>DealSphere Admin</h1>
            <nav style={{ display: "flex", gap: "15px" }}>
              <button
                onClick={() => setActiveTab("dashboard")}
                style={{ 
                  padding: "8px 15px", 
                  backgroundColor: activeTab === "dashboard" ? "#007bff" : "transparent", 
                  color: activeTab === "dashboard" ? "white" : "#333",
                  border: "1px solid #007bff",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab("deals")}
                style={{ 
                  padding: "8px 15px", 
                  backgroundColor: activeTab === "deals" ? "#007bff" : "transparent", 
                  color: activeTab === "deals" ? "white" : "#333",
                  border: "1px solid #007bff",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Manage Deals
              </button>
              <button
                onClick={() => setActiveTab("automation")}
                style={{ 
                  padding: "8px 15px", 
                  backgroundColor: activeTab === "automation" ? "#007bff" : "transparent", 
                  color: activeTab === "automation" ? "white" : "#333",
                  border: "1px solid #007bff",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Automation
              </button>
              <button
                onClick={() => setActiveTab("affiliates")}
                style={{ 
                  padding: "8px 15px", 
                  backgroundColor: activeTab === "affiliates" ? "#007bff" : "transparent", 
                  color: activeTab === "affiliates" ? "white" : "#333",
                  border: "1px solid #007bff",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Affiliate Networks
              </button>
              <button
                onClick={() => setActiveTab("users")}
                style={{ 
                  padding: "8px 15px", 
                  backgroundColor: activeTab === "users" ? "#007bff" : "transparent", 
                  color: activeTab === "users" ? "white" : "#333",
                  border: "1px solid #007bff",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Users
              </button>
              <button
                onClick={() => setActiveTab("banners")}
                style={{ 
                  padding: "8px 15px", 
                  backgroundColor: activeTab === "banners" ? "#007bff" : "transparent", 
                  color: activeTab === "banners" ? "white" : "#333",
                  border: "1px solid #007bff",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Banners / Ads
              </button>
            </nav>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <span style={{ fontSize: "14px", color: "#666" }}>Welcome, Admin</span>
            <button 
              onClick={handleLogout}
              style={{ 
                padding: "8px 15px", 
                backgroundColor: "#dc3545", 
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && metrics && (
          <div>
            <h2 style={{ marginBottom: "20px", color: "#333" }}>Dashboard Overview</h2>
            
            {/* Metrics Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "30px" }}>
              <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                <h3 style={{ margin: "0 0 10px 0", color: "#666", fontSize: "14px" }}>Total Deals</h3>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#333" }}>{metrics.total_deals}</div>
                <div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>{metrics.ai_approved_deals} approved</div>
              </div>
              
              <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                <h3 style={{ margin: "0 0 10px 0", color: "#666", fontSize: "14px" }}>Total Clicks</h3>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#333" }}>{metrics.total_clicks}</div>
                <div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>{metrics.total_shares} shares</div>
              </div>
              
              <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                <h3 style={{ margin: "0 0 10px 0", color: "#666", fontSize: "14px" }}>Revenue Estimate</h3>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#333" }}>${metrics.revenue_estimate.toFixed(2)}</div>
                <div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>Based on clicks</div>
              </div>
              
              <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                <h3 style={{ margin: "0 0 10px 0", color: "#666", fontSize: "14px" }}>Pending Review</h3>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#333" }}>{metrics.pending_deals}</div>
                <div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>Awaiting approval</div>
              </div>
              
              <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                <h3 style={{ margin: "0 0 10px 0", color: "#666", fontSize: "14px" }}>Issues Found</h3>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#ffc107" }}>{metrics.issues_count || 0}</div>
                <div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>Deals need review</div>
              </div>
            </div>

            {/* Recent Activity */}
            <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
              <h3 style={{ marginBottom: "15px", color: "#333" }}>Recent Activity</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {metrics.recent_activity && metrics.recent_activity.map((activity: any) => (
                  <div key={activity.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", backgroundColor: "#f8f9fa", borderRadius: "4px" }}>
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: "14px" }}>{activity.title}</div>
                      <div style={{ fontSize: "12px", color: "#666" }}>{activity.store} • {activity.category}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ 
                        fontSize: "12px", 
                        padding: "2px 8px", 
                        borderRadius: "12px", 
                        backgroundColor: activity.ai_approved ? "#28a745" : "#6c757d", 
                        color: "white" 
                      }}>
                        {activity.ai_approved ? "Approved" : "Pending"}
                      </span>
                      <span style={{ fontSize: "12px", color: "#666" }}>{activity.clicks} clicks</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Deals Management Tab */}
        {activeTab === "deals" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ color: "#333" }}>Manage Deals</h2>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button
                  onClick={runUrlHealthCheck}
                  disabled={urlCheckRunning}
                  style={{ 
                    padding: "10px 20px", 
                    backgroundColor: urlCheckRunning ? "#6c757d" : "#dc3545", 
                    color: "white", 
                    border: "none", 
                    borderRadius: "4px", 
                    cursor: urlCheckRunning ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    opacity: urlCheckRunning ? 0.7 : 1,
                    whiteSpace: "nowrap",
                  }}
                >
                  {urlCheckRunning ? "⏳ Running..." : "🔍 Check Deal URLs"}
                </button>
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => setShowFileUpload(true)}
                    style={{ 
                      padding: "10px 20px", 
                      backgroundColor: "#007bff", 
                      color: "white", 
                      border: "none", 
                      borderRadius: "4px 0 0 4px", 
                      cursor: "pointer",
                      fontSize: "14px"
                    }}
                    data-testid="upload-deals-button"
                  >
                    📁 UPLOAD FILES
                  </button>
                  <button
                    onClick={() => {
                      const dropdown = document.querySelector('.sample-dropdown') as HTMLElement;
                      if (dropdown) {
                        dropdown.style.display = dropdown.style.display === 'none' || !dropdown.style.display ? 'block' : 'none';
                      }
                    }}
                    style={{ 
                      padding: "10px 15px", 
                      backgroundColor: "#0056b3", 
                      color: "white", 
                      border: "none", 
                      borderRadius: "0 4px 4px 0", 
                      cursor: "pointer",
                      fontSize: "14px",
                      borderLeft: "1px solid #004494"
                    }}
                  >
                    📄 ↓
                  </button>
                  <div className="sample-dropdown" style={{ 
                    position: "absolute", 
                    top: "100%", 
                    left: 0, 
                    backgroundColor: "white", 
                    border: "1px solid #ddd", 
                    borderRadius: "4px", 
                    minWidth: "250px", 
                    boxShadow: "0 2px 10px rgba(0,0,0,0.1)", 
                    zIndex: 1000,
                    display: "none"
                  }}>
                    <div style={{ padding: "8px 12px", borderBottom: "1px solid #eee", fontSize: "12px", fontWeight: "bold", color: "#666" }}>
                      Download Sample Files:
                    </div>
                    <button onClick={() => downloadSampleFile('amazon')} style={{ width: "100%", padding: "10px 15px", border: "none", background: "none", textAlign: "left", cursor: "pointer", fontSize: "14px" }}>
                      📦 Amazon Associates CSV
                    </button>
                    <button onClick={() => downloadSampleFile('cj')} style={{ width: "100%", padding: "10px 15px", border: "none", background: "none", textAlign: "left", cursor: "pointer", fontSize: "14px" }}>
                      🏢 Commission Junction CSV
                    </button>
                    <button onClick={() => downloadSampleFile('shareasale')} style={{ width: "100%", padding: "10px 15px", border: "none", background: "none", textAlign: "left", cursor: "pointer", fontSize: "14px" }}>
                      💼 ShareASale CSV
                    </button>
                    <button onClick={() => downloadSampleFile('rakuten')} style={{ width: "100%", padding: "10px 15px", border: "none", background: "none", textAlign: "left", cursor: "pointer", fontSize: "14px" }}>
                      🛍️ Rakuten Advertising CSV
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddDeal(true)}
                  style={{ 
                    padding: "10px 20px", 
                    backgroundColor: "#28a745", 
                    color: "white", 
                    border: "none", 
                    borderRadius: "4px", 
                    cursor: "pointer",
                    fontSize: "14px"
                  }}
                >
                  + Add Deal
                </button>
                <button
                  onClick={() => setShowJsonImport(true)}
                  style={{ 
                    padding: "10px 20px", 
                    backgroundColor: "#6f42c1", 
                    color: "white", 
                    border: "none", 
                    borderRadius: "4px", 
                    cursor: "pointer",
                    fontSize: "14px"
                  }}
                >
                  { } JSON Import
                </button>
              </div>
            </div>

            {(urlCheckRunning || urlCheckResult) && (
              <div style={{ 
                backgroundColor: urlCheckResult ? (urlCheckResult.broken > 0 || urlCheckResult.removed > 0 ? "#fff3cd" : "#d4edda") : "#e8f4fd", 
                border: `1px solid ${urlCheckResult ? (urlCheckResult.broken > 0 || urlCheckResult.removed > 0 ? "#ffc107" : "#28a745") : "#b8daff"}`, 
                borderRadius: "8px", 
                padding: "16px 20px", 
                marginBottom: "20px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: urlCheckRunning ? "10px" : "0" }}>
                  <span style={{ fontWeight: "bold", fontSize: "14px" }}>
                    {urlCheckRunning ? "🔍 " + urlCheckStatus : urlCheckResult ? "✅ URL Health Check Complete" : ""}
                  </span>
                  {urlCheckResult && !urlCheckRunning && (
                    <button onClick={() => { setUrlCheckResult(null); setUrlCheckProgress(0); setUrlCheckStatus(""); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#666" }}>✕</button>
                  )}
                </div>

                {urlCheckRunning && (
                  <div>
                    <div style={{ 
                      width: "100%", 
                      height: "20px", 
                      backgroundColor: "#e0e0e0", 
                      borderRadius: "10px", 
                      overflow: "hidden",
                      marginBottom: "6px",
                    }}>
                      <div style={{ 
                        width: `${urlCheckProgress}%`, 
                        height: "100%", 
                        backgroundColor: urlCheckProgress >= 97 ? "#28a745" : "#007bff", 
                        borderRadius: "10px", 
                        transition: "width 0.5s ease",
                        background: urlCheckProgress < 97 
                          ? "linear-gradient(90deg, #007bff 0%, #0056b3 50%, #007bff 100%)" 
                          : "#28a745",
                        backgroundSize: "200% 100%",
                        animation: urlCheckProgress < 97 ? "shimmer 1.5s infinite" : "none",
                      }} />
                    </div>
                    <div style={{ fontSize: "12px", color: "#666", textAlign: "right" }}>{urlCheckProgress}%</div>
                  </div>
                )}

                {urlCheckResult && !urlCheckRunning && (
                  <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", marginTop: "10px" }}>
                    <div style={{ textAlign: "center", padding: "8px 16px", backgroundColor: "rgba(255,255,255,0.7)", borderRadius: "6px" }}>
                      <div style={{ fontSize: "24px", fontWeight: "bold", color: "#333" }}>{urlCheckResult.total_checked}</div>
                      <div style={{ fontSize: "11px", color: "#666", textTransform: "uppercase" }}>Checked</div>
                    </div>
                    <div style={{ textAlign: "center", padding: "8px 16px", backgroundColor: "rgba(255,255,255,0.7)", borderRadius: "6px" }}>
                      <div style={{ fontSize: "24px", fontWeight: "bold", color: "#28a745" }}>{urlCheckResult.healthy}</div>
                      <div style={{ fontSize: "11px", color: "#666", textTransform: "uppercase" }}>Healthy</div>
                    </div>
                    <div style={{ textAlign: "center", padding: "8px 16px", backgroundColor: "rgba(255,255,255,0.7)", borderRadius: "6px" }}>
                      <div style={{ fontSize: "24px", fontWeight: "bold", color: "#dc3545" }}>{urlCheckResult.broken}</div>
                      <div style={{ fontSize: "11px", color: "#666", textTransform: "uppercase" }}>Broken</div>
                    </div>
                    <div style={{ textAlign: "center", padding: "8px 16px", backgroundColor: "rgba(255,255,255,0.7)", borderRadius: "6px" }}>
                      <div style={{ fontSize: "24px", fontWeight: "bold", color: "#fd7e14" }}>{urlCheckResult.flagged}</div>
                      <div style={{ fontSize: "11px", color: "#666", textTransform: "uppercase" }}>Flagged</div>
                    </div>
                    <div style={{ textAlign: "center", padding: "8px 16px", backgroundColor: "rgba(255,255,255,0.7)", borderRadius: "6px" }}>
                      <div style={{ fontSize: "24px", fontWeight: "bold", color: "#dc3545" }}>{urlCheckResult.removed}</div>
                      <div style={{ fontSize: "11px", color: "#666", textTransform: "uppercase" }}>Removed</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Filters */}
            <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", marginBottom: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 200px 200px 200px", gap: "15px", alignItems: "end" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "14px" }}>Search</label>
                  <input
                    type="text"
                    placeholder="Search deals..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      fontSize: "14px"
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "14px" }}>Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      fontSize: "14px"
                    }}
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "14px" }}>Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      fontSize: "14px"
                    }}
                  >
                    <option value="all">All Status</option>
                    <option value="approved">✅ Approved</option>
                    <option value="pending">⏳ Pending</option>
                    <option value="rejected">❌ Rejected</option>
                    <option value="needs_review">🔧 Needs Review ({Object.keys(dealIssues).length})</option>
                  </select>
                </div>
              </div>
            </div>

            {selectedDeals.size > 0 && (
              <div style={{ 
                backgroundColor: "#e3f2fd", 
                border: "1px solid #90caf9", 
                borderRadius: "8px", 
                padding: "12px 20px", 
                marginBottom: "15px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px"
              }}>
                <span style={{ fontWeight: "bold", fontSize: "14px", color: "#1565c0" }}>
                  {selectedDeals.size} deal{selectedDeals.size > 1 ? 's' : ''} selected
                </span>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    onClick={() => runBulkAction("approve")}
                    disabled={bulkActionLoading}
                    style={{ 
                      padding: "6px 16px", 
                      backgroundColor: "#28a745", 
                      color: "white", 
                      border: "none", 
                      borderRadius: "4px", 
                      cursor: bulkActionLoading ? "not-allowed" : "pointer",
                      fontSize: "13px",
                      opacity: bulkActionLoading ? 0.6 : 1
                    }}
                  >
                    ✓ Approve Selected
                  </button>
                  <button
                    onClick={() => runBulkAction("reject")}
                    disabled={bulkActionLoading}
                    style={{ 
                      padding: "6px 16px", 
                      backgroundColor: "#ffc107", 
                      color: "black", 
                      border: "none", 
                      borderRadius: "4px", 
                      cursor: bulkActionLoading ? "not-allowed" : "pointer",
                      fontSize: "13px",
                      opacity: bulkActionLoading ? 0.6 : 1
                    }}
                  >
                    ✗ Reject Selected
                  </button>
                  <button
                    onClick={() => runBulkAction("delete")}
                    disabled={bulkActionLoading}
                    style={{ 
                      padding: "6px 16px", 
                      backgroundColor: "#dc3545", 
                      color: "white", 
                      border: "none", 
                      borderRadius: "4px", 
                      cursor: bulkActionLoading ? "not-allowed" : "pointer",
                      fontSize: "13px",
                      opacity: bulkActionLoading ? 0.6 : 1
                    }}
                  >
                    🗑 Delete Selected
                  </button>
                  <button
                    onClick={() => setSelectedDeals(new Set())}
                    style={{ 
                      padding: "6px 16px", 
                      backgroundColor: "transparent", 
                      color: "#666", 
                      border: "1px solid #ccc", 
                      borderRadius: "4px", 
                      cursor: "pointer",
                      fontSize: "13px"
                    }}
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            )}

            {/* Deals Table */}
            {filteredDeals.length > 0 ? (
              <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead style={{ backgroundColor: "#f8f9fa" }}>
                      <tr>
                        <th style={{ padding: "12px", textAlign: "center", borderBottom: "1px solid #dee2e6", width: "40px" }}>
                          <input 
                            type="checkbox" 
                            checked={filteredDeals.length > 0 && selectedDeals.size === filteredDeals.length}
                            onChange={toggleSelectAll}
                            style={{ width: "16px", height: "16px", cursor: "pointer" }}
                            title="Select all"
                          />
                        </th>
                        <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #dee2e6" }}>Deal</th>
                        <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #dee2e6" }}>Store</th>
                        <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #dee2e6" }}>Category</th>
                        <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #dee2e6" }}>Price</th>
                        <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #dee2e6" }}>Discount</th>
                        <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #dee2e6" }}>Status</th>
                        <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #dee2e6" }}>Issues</th>
                        <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #dee2e6" }}>Stats</th>
                        <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #dee2e6" }}>Social Share</th>
                        <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #dee2e6" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDeals.map((deal) => (
                        <tr key={deal.id} style={{ borderBottom: "1px solid #dee2e6", backgroundColor: selectedDeals.has(deal.id) ? "#e3f2fd" : "transparent" }}>
                          <td style={{ padding: "12px", textAlign: "center" }}>
                            <input 
                              type="checkbox" 
                              checked={selectedDeals.has(deal.id)}
                              onChange={() => toggleDealSelection(deal.id)}
                              style={{ width: "16px", height: "16px", cursor: "pointer" }}
                            />
                          </td>
                          <td style={{ padding: "12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <img 
                                src={deal.image_url || "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=400&fit=crop"} 
                                alt={deal.title}
                                style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "4px" }}
                                onError={(e) => {
                                  e.currentTarget.src = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=400&fit=crop";
                                }}
                              />
                              <div>
                                <div 
                                  style={{ 
                                    fontWeight: "bold", 
                                    fontSize: "14px", 
                                    maxWidth: "200px", 
                                    overflow: "hidden", 
                                    textOverflow: "ellipsis", 
                                    whiteSpace: "nowrap",
                                    cursor: "pointer",
                                    color: "#007bff"
                                  }}
                                  onClick={() => window.open(`/deals/${deal.id}`, '_blank')}
                                  title="Click to view deal page"
                                >
                                  {deal.title}
                                </div>
                                <div style={{ fontSize: "12px", color: "#666" }}>{deal.deal_type}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "12px", fontSize: "14px" }}>{deal.store}</td>
                          <td style={{ padding: "12px", fontSize: "14px" }}>{deal.category}</td>
                          <td style={{ padding: "12px" }}>
                            <div style={{ fontSize: "14px", fontWeight: "bold" }}>${deal.sale_price}</div>
                            <div style={{ fontSize: "12px", color: "#666", textDecoration: "line-through" }}>${deal.original_price}</div>
                          </td>
                          <td style={{ padding: "12px" }}>
                            {(() => {
                              const calculatedDiscount = deal.original_price > 0 && deal.sale_price < deal.original_price 
                                ? Math.round(((deal.original_price - deal.sale_price) / deal.original_price) * 100 * 10) / 10
                                : deal.discount_percentage || 0;
                              return (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                  <span style={{
                                    fontSize: "16px",
                                    fontWeight: "bold",
                                    color: calculatedDiscount >= 50 ? "#28a745" : calculatedDiscount >= 30 ? "#ffc107" : "#dc3545"
                                  }}>
                                    {calculatedDiscount}%
                                  </span>
                                  <span style={{ fontSize: "10px", color: "#666" }}>
                                    Save ${((deal.original_price - deal.sale_price) || 0).toFixed(2)}
                                  </span>
                                </div>
                              );
                            })()}
                          </td>
                          <td style={{ padding: "12px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              <span style={{ 
                                fontSize: "12px", 
                                padding: "4px 8px", 
                                borderRadius: "12px", 
                                backgroundColor: deal.status === "rejected" ? "#dc3545" : deal.is_ai_approved ? "#28a745" : "#6c757d", 
                                color: "white" 
                              }}>
                                {deal.status === "rejected" ? "❌ Rejected" : deal.is_ai_approved ? "✅ Approved" : "⏳ Pending"}
                              </span>
                              {dealIssues[deal.id] && (
                                <span style={{
                                  fontSize: "10px",
                                  padding: "2px 6px",
                                  borderRadius: "8px",
                                  backgroundColor: "#ffc107",
                                  color: "#212529"
                                }}>
                                  🔧 Needs Review
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: "12px" }}>
                            {dealIssues[deal.id] ? (
                              <div style={{ fontSize: "12px" }}>
                                {dealIssues[deal.id].slice(0, 3).map((issue, index) => (
                                  <div key={index} style={{ 
                                    color: "#dc3545", 
                                    marginBottom: "2px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px"
                                  }}>
                                    <span style={{ color: "#dc3545" }}>⚠️</span>
                                    {issue}
                                  </div>
                                ))}
                                {dealIssues[deal.id].length > 3 && (
                                  <div style={{ fontSize: "10px", color: "#6c757d", marginTop: "4px" }}>
                                    +{dealIssues[deal.id].length - 3} more issues
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span style={{ fontSize: "12px", color: "#28a745" }}>✓ No issues</span>
                            )}
                          </td>
                          <td style={{ padding: "12px", fontSize: "12px", color: "#666" }}>
                            <div>{deal.click_count || 0} clicks</div>
                            <div>{deal.share_count || 0} shares</div>
                          </td>
                          <td style={{ padding: "12px" }}>
                            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                              <button
                                onClick={() => shareOnX(deal)}
                                style={{
                                  padding: "8px",
                                  backgroundColor: "#000000",
                                  border: "none",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center"
                                }}
                                title="Share on X"
                              >
                                <span style={{ color: "white", fontSize: "14px", fontWeight: "bold" }}>𝕏</span>
                              </button>
                              <button
                                onClick={() => shareOnWhatsApp(deal)}
                                style={{
                                  padding: "8px",
                                  backgroundColor: "#25D366",
                                  border: "none",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center"
                                }}
                                title="Share on WhatsApp"
                              >
                                <span style={{ color: "white", fontSize: "14px" }}>💬</span>
                              </button>
                              <button
                                onClick={() => shareOnFacebook(deal)}
                                style={{
                                  padding: "8px",
                                  backgroundColor: "#1877F2",
                                  border: "none",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center"
                                }}
                                title="Share on Facebook"
                              >
                                <span style={{ color: "white", fontSize: "14px", fontWeight: "bold" }}>f</span>
                              </button>
                              <button
                                onClick={() => copyDealLink(deal)}
                                style={{
                                  padding: "8px",
                                  backgroundColor: "#6c757d",
                                  border: "none",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center"
                                }}
                                title="Copy Link"
                              >
                                <span style={{ color: "white", fontSize: "14px" }}>📋</span>
                              </button>
                            </div>
                          </td>
                          <td style={{ padding: "12px" }}>
                            <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                              {deal.status !== "rejected" && !deal.is_ai_approved && (
                                <button
                                  onClick={() => approveDeal(deal.id)}
                                  style={{ 
                                    padding: "4px 8px", 
                                    backgroundColor: "#28a745", 
                                    color: "white", 
                                    border: "none", 
                                    borderRadius: "4px", 
                                    cursor: "pointer",
                                    fontSize: "12px"
                                  }}
                                >
                                  ✓ Approve
                                </button>
                              )}
                              {deal.status !== "rejected" && (
                                <button
                                  onClick={() => rejectDeal(deal.id)}
                                  style={{ 
                                    padding: "4px 8px", 
                                    backgroundColor: "#ffc107", 
                                    color: "black", 
                                    border: "none", 
                                    borderRadius: "4px", 
                                    cursor: "pointer",
                                    fontSize: "12px"
                                  }}
                                >
                                  ✗ Reject
                                </button>
                              )}
                              <button
                                onClick={() => setEditingDeal(deal)}
                                style={{ 
                                  padding: "4px 8px", 
                                  backgroundColor: "#007bff", 
                                  color: "white", 
                                  border: "none", 
                                  borderRadius: "4px", 
                                  cursor: "pointer",
                                  fontSize: "12px"
                                }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteDeal(deal.id)}
                                style={{ 
                                  padding: "4px 8px", 
                                  backgroundColor: "#dc3545", 
                                  color: "white", 
                                  border: "none", 
                                  borderRadius: "4px", 
                                  cursor: "pointer",
                                  fontSize: "12px"
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div style={{ backgroundColor: "white", padding: "40px", textAlign: "center", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                <p style={{ color: "#666", margin: 0 }}>No deals found matching your criteria.</p>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 0 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "16px", padding: "12px 16px", backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ fontSize: "14px", color: "#666" }}>
                  Showing {filteredDeals.length > 0 ? ((currentPage - 1) * dealsPerPage + 1) : 0}–{Math.min(currentPage * dealsPerPage, totalDeals)} of {totalDeals} deals
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    style={{ padding: "6px 10px", border: "1px solid #dee2e6", borderRadius: "4px", backgroundColor: currentPage === 1 ? "#f8f9fa" : "white", cursor: currentPage === 1 ? "not-allowed" : "pointer", fontSize: "13px", color: currentPage === 1 ? "#adb5bd" : "#333" }}
                  >
                    First
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{ padding: "6px 10px", border: "1px solid #dee2e6", borderRadius: "4px", backgroundColor: currentPage === 1 ? "#f8f9fa" : "white", cursor: currentPage === 1 ? "not-allowed" : "pointer", fontSize: "13px", color: currentPage === 1 ? "#adb5bd" : "#333" }}
                  >
                    Prev
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        style={{ padding: "6px 12px", border: "1px solid #dee2e6", borderRadius: "4px", backgroundColor: currentPage === pageNum ? "#007bff" : "white", color: currentPage === pageNum ? "white" : "#333", cursor: "pointer", fontSize: "13px", fontWeight: currentPage === pageNum ? "bold" : "normal" }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    style={{ padding: "6px 10px", border: "1px solid #dee2e6", borderRadius: "4px", backgroundColor: currentPage === totalPages ? "#f8f9fa" : "white", cursor: currentPage === totalPages ? "not-allowed" : "pointer", fontSize: "13px", color: currentPage === totalPages ? "#adb5bd" : "#333" }}
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    style={{ padding: "6px 10px", border: "1px solid #dee2e6", borderRadius: "4px", backgroundColor: currentPage === totalPages ? "#f8f9fa" : "white", cursor: currentPage === totalPages ? "not-allowed" : "pointer", fontSize: "13px", color: currentPage === totalPages ? "#adb5bd" : "#333" }}
                  >
                    Last
                  </button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <label style={{ fontSize: "13px", color: "#666" }}>Show:</label>
                  <select
                    value={dealsPerPage}
                    onChange={(e) => { setDealsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    style={{ padding: "5px 8px", border: "1px solid #dee2e6", borderRadius: "4px", fontSize: "13px", backgroundColor: "white", cursor: "pointer" }}
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={500}>500</option>
                    <option value={1000}>1000</option>
                  </select>
                  <span style={{ fontSize: "13px", color: "#666" }}>per page</span>
                  <span style={{ fontSize: "14px", color: "#666", marginLeft: "8px" }}>Page {currentPage} of {totalPages}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Automation Tab */}
        {activeTab === "automation" && (
          <div>
            <h2 style={{ marginBottom: "20px", color: "#333" }}>Deal Automation & AI</h2>
            
            {/* Automation Status Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", marginBottom: "30px" }}>
              <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                <h3 style={{ margin: "0 0 15px 0", color: "#333" }}>Automation Status</h3>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
                  <div style={{ 
                    width: "12px", 
                    height: "12px", 
                    borderRadius: "50%", 
                    backgroundColor: automationStatus?.running ? "#28a745" : "#dc3545" 
                  }}></div>
                  <span style={{ fontWeight: "bold" }}>
                    {automationStatus?.running ? "Running" : "Stopped"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => toggleAutomation(true)}
                    disabled={automationLoading || automationStatus?.running}
                    style={{ 
                      padding: "8px 16px", 
                      backgroundColor: automationLoading ? "#ccc" : "#28a745", 
                      color: "white", 
                      border: "none", 
                      borderRadius: "4px", 
                      cursor: automationLoading ? "not-allowed" : "pointer",
                      fontSize: "14px"
                    }}
                  >
                    Start
                  </button>
                  <button
                    onClick={() => toggleAutomation(false)}
                    disabled={automationLoading || !automationStatus?.running}
                    style={{ 
                      padding: "8px 16px", 
                      backgroundColor: automationLoading ? "#ccc" : "#dc3545", 
                      color: "white", 
                      border: "none", 
                      borderRadius: "4px", 
                      cursor: automationLoading ? "not-allowed" : "pointer",
                      fontSize: "14px"
                    }}
                  >
                    Stop
                  </button>
                </div>
              </div>

              <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                <h3 style={{ margin: "0 0 15px 0", color: "#333" }}>API Configuration</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Amazon Associates:</span>
                    <span style={{ 
                      color: automationStatus?.api_configurations?.amazon_configured ? "#28a745" : "#dc3545",
                      fontWeight: "bold" 
                    }}>
                      {automationStatus?.api_configurations?.amazon_configured ? "✓ Configured" : "✗ Not Configured"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Commission Junction:</span>
                    <span style={{ 
                      color: automationStatus?.api_configurations?.cj_configured ? "#28a745" : "#dc3545",
                      fontWeight: "bold" 
                    }}>
                      {automationStatus?.api_configurations?.cj_configured ? "✓ Configured" : "✗ Not Configured"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>ClickBank:</span>
                    <span style={{ 
                      color: automationStatus?.api_configurations?.clickbank_configured ? "#28a745" : "#dc3545",
                      fontWeight: "bold" 
                    }}>
                      {automationStatus?.api_configurations?.clickbank_configured ? "✓ Configured" : "✗ Not Configured"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>OpenAI (AI Validation):</span>
                    <span style={{ 
                      color: automationStatus?.api_configurations?.openai_configured ? "#28a745" : "#dc3545",
                      fontWeight: "bold" 
                    }}>
                      {automationStatus?.api_configurations?.openai_configured ? "✓ Configured" : "✗ Not Configured"}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                <h3 style={{ margin: "0 0 15px 0", color: "#333" }}>Manual Actions</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <button
                    onClick={triggerManualFetch}
                    disabled={automationLoading}
                    style={{ 
                      padding: "10px 16px", 
                      backgroundColor: automationLoading ? "#ccc" : "#007bff", 
                      color: "white", 
                      border: "none", 
                      borderRadius: "4px", 
                      cursor: automationLoading ? "not-allowed" : "pointer",
                      fontSize: "14px"
                    }}
                  >
                    {automationLoading ? "Fetching..." : "Fetch Deals Now"}
                  </button>
                  <button
                    onClick={fetchAutomationStatus}
                    style={{ 
                      padding: "10px 16px", 
                      backgroundColor: "#6c757d", 
                      color: "white", 
                      border: "none", 
                      borderRadius: "4px", 
                      cursor: "pointer",
                      fontSize: "14px"
                    }}
                  >
                    Refresh Status
                  </button>
                </div>
              </div>
            </div>

            {/* Configuration Guide */}
            <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", marginBottom: "20px" }}>
              <h3 style={{ marginBottom: "15px", color: "#333" }}>Setup Guide</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
                <div>
                  <h4 style={{ color: "#007bff", marginBottom: "10px" }}>Amazon Associates</h4>
                  <p style={{ fontSize: "14px", marginBottom: "10px" }}>Required environment variables:</p>
                  <ul style={{ fontSize: "12px", margin: "0", paddingLeft: "20px" }}>
                    <li>AWS_ACCESS_KEY_ID</li>
                    <li>AWS_SECRET_ACCESS_KEY</li>
                    <li>AMAZON_ASSOCIATE_TAG</li>
                  </ul>
                  <p style={{ fontSize: "12px", marginTop: "10px" }}>
                    <a href="https://affiliate-program.amazon.com/" target="_blank" style={{ color: "#007bff" }}>
                      Sign up for Amazon Associates →
                    </a>
                  </p>
                </div>
                
                <div>
                  <h4 style={{ color: "#007bff", marginBottom: "10px" }}>Commission Junction</h4>
                  <p style={{ fontSize: "14px", marginBottom: "10px" }}>Required environment variables:</p>
                  <ul style={{ fontSize: "12px", margin: "0", paddingLeft: "20px" }}>
                    <li>CJ_DEVELOPER_KEY</li>
                    <li>CJ_WEBSITE_ID</li>
                  </ul>
                  <p style={{ fontSize: "12px", marginTop: "10px" }}>
                    <a href="https://www.cj.com/" target="_blank" style={{ color: "#007bff" }}>
                      Sign up for CJ Affiliate →
                    </a>
                  </p>
                </div>
                
                <div>
                  <h4 style={{ color: "#007bff", marginBottom: "10px" }}>ClickBank</h4>
                  <p style={{ fontSize: "14px", marginBottom: "10px" }}>Required environment variables:</p>
                  <ul style={{ fontSize: "12px", margin: "0", paddingLeft: "20px" }}>
                    <li>CLICKBANK_CLIENT_ID</li>
                    <li>CLICKBANK_DEVELOPER_KEY</li>
                    <li>CLICKBANK_NICKNAME</li>
                  </ul>
                  <p style={{ fontSize: "12px", marginTop: "10px" }}>
                    <a href="https://www.clickbank.com/" target="_blank" style={{ color: "#007bff" }}>
                      Sign up for ClickBank →
                    </a>
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Activity Log */}
            {automationStatus?.recent_logs && (
              <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                <h3 style={{ marginBottom: "15px", color: "#333" }}>Recent Automation Activity</h3>
                <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                  {automationStatus.recent_logs.slice(0, 10).map((log: any, index: number) => (
                    <div key={index} style={{ 
                      padding: "10px", 
                      borderBottom: "1px solid #eee", 
                      display: "flex", 
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>
                      <div>
                        <div style={{ fontWeight: "bold", fontSize: "14px" }}>{log.task}</div>
                        <div style={{ fontSize: "12px", color: "#666" }}>{log.result}</div>
                      </div>
                      <div style={{ fontSize: "12px", color: "#666" }}>
                        {log.executed_at ? new Date(log.executed_at).toLocaleString() : 'Unknown time'}
                      </div>
                    </div>
                  ))}
                  {automationStatus.recent_logs.length === 0 && (
                    <div style={{ textAlign: "center", color: "#666", padding: "20px" }}>
                      No automation activity yet
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Affiliate Networks Tab */}
        {activeTab === "affiliates" && (
          <div>
            <h2 style={{ marginBottom: "20px", color: "#333" }}>Affiliate Network Management</h2>
            
            {/* Network Overview */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "20px", marginBottom: "30px" }}>
              {affiliateNetworks.map((network: any) => (
                <div key={network.network_id} style={{ 
                  backgroundColor: "white", 
                  padding: "20px", 
                  borderRadius: "8px", 
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  border: network.is_active ? "2px solid #28a745" : "2px solid #dc3545"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                    <h3 style={{ margin: 0, color: "#333" }}>{network.name}</h3>
                    <div style={{ 
                      padding: "4px 8px", 
                      borderRadius: "4px", 
                      fontSize: "12px", 
                      fontWeight: "bold",
                      backgroundColor: network.is_configured ? "#d4edda" : "#f8d7da",
                      color: network.is_configured ? "#155724" : "#721c24"
                    }}>
                      {network.is_configured ? "Configured" : "Not Configured"}
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: "15px", fontSize: "14px", color: "#666" }}>
                    <div><strong>Type:</strong> {network.type}</div>
                    <div><strong>Status:</strong> {network.is_active ? "Active" : "Inactive"}</div>
                    {network.last_sync && (
                      <div><strong>Last Sync:</strong> {new Date(network.last_sync).toLocaleString()}</div>
                    )}
                  </div>

                  <div style={{ marginBottom: "15px" }}>
                    <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#333" }}>Required Fields:</h4>
                    <ul style={{ margin: 0, padding: "0 0 0 16px", fontSize: "12px", color: "#666" }}>
                      {network.configuration_fields?.map((field: string, index: number) => (
                        <li key={index}>{field}</li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      onClick={() => openConfigModal(network)}
                      style={{ 
                        padding: "6px 12px", 
                        backgroundColor: "#007bff", 
                        color: "white", 
                        border: "none", 
                        borderRadius: "4px", 
                        cursor: "pointer",
                        fontSize: "12px"
                      }}
                    >
                      Configure
                    </button>
                    
                    {network.is_configured && (
                      <>
                        <button
                          onClick={() => testNetworkConnection(network.network_id)}
                          style={{ 
                            padding: "6px 12px", 
                            backgroundColor: "#28a745", 
                            color: "white", 
                            border: "none", 
                            borderRadius: "4px", 
                            cursor: "pointer",
                            fontSize: "12px"
                          }}
                        >
                          Test
                        </button>
                        
                        <button
                          onClick={() => toggleNetworkStatus(network.network_id, !network.is_active)}
                          style={{ 
                            padding: "6px 12px", 
                            backgroundColor: network.is_active ? "#dc3545" : "#28a745", 
                            color: "white", 
                            border: "none", 
                            borderRadius: "4px", 
                            cursor: "pointer",
                            fontSize: "12px"
                          }}
                        >
                          {network.is_active ? "Disable" : "Enable"}
                        </button>
                      </>
                    )}
                  </div>

                  {/* Compliance Terms */}
                  <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#f8f9fa", borderRadius: "4px" }}>
                    <h4 style={{ margin: "0 0 8px 0", fontSize: "12px", color: "#333" }}>Compliance Requirements:</h4>
                    <ul style={{ margin: 0, padding: "0 0 0 16px", fontSize: "11px", color: "#666" }}>
                      {network.compliance_terms?.attribution_required && <li>Attribution required</li>}
                      {network.compliance_terms?.data_retention && (
                        <li>Data retention: {network.compliance_terms.data_retention.replace('_', ' ')}</li>
                      )}
                      {network.compliance_terms?.content_restrictions?.map((restriction: string, index: number) => (
                        <li key={index}>{restriction.replace('_', ' ')}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* Configuration Instructions */}
            <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", marginBottom: "20px" }}>
              <h3 style={{ marginBottom: "15px", color: "#333" }}>Setup Instructions</h3>
              <div style={{ fontSize: "14px", lineHeight: "1.6", color: "#666" }}>
                <h4 style={{ color: "#007bff", marginBottom: "10px" }}>How to Configure Affiliate Networks:</h4>
                <ol style={{ paddingLeft: "20px" }}>
                  <li><strong>Sign up</strong> for each affiliate program you want to use</li>
                  <li><strong>Get API credentials</strong> from the affiliate network's developer section</li>
                  <li><strong>Click "Configure"</strong> on any network above to enter your credentials</li>
                  <li><strong>Test the connection</strong> to verify everything works</li>
                  <li><strong>Enable the network</strong> to start fetching deals automatically</li>
                </ol>
                
                <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#fff3cd", borderRadius: "4px", border: "1px solid #ffeaa7" }}>
                  <strong>⚠️ Important:</strong> All affiliate networks have specific terms of service and compliance requirements. 
                  Make sure to review their terms before enabling automated deal fetching.
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ color: "#333" }}>User Management</h2>
              <button
                onClick={() => setShowCreateUser(true)}
                style={{ padding: "10px 20px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "14px" }}
              >
                + Create User
              </button>
            </div>

            <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", overflow: "hidden", marginBottom: "30px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f8f9fa" }}>
                    <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #dee2e6", fontSize: "13px", color: "#666" }}>Username</th>
                    <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #dee2e6", fontSize: "13px", color: "#666" }}>Email</th>
                    <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #dee2e6", fontSize: "13px", color: "#666" }}>Role</th>
                    <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #dee2e6", fontSize: "13px", color: "#666" }}>Permissions</th>
                    <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #dee2e6", fontSize: "13px", color: "#666" }}>Status</th>
                    <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #dee2e6", fontSize: "13px", color: "#666" }}>Created</th>
                    <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #dee2e6", fontSize: "13px", color: "#666" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user: any) => (
                    <tr key={user.id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "12px", fontWeight: "bold", color: "#333" }}>
                        {user.username}
                        {user.role === 'super_admin' && <span style={{ fontSize: "10px", color: "#007bff", marginLeft: "6px", padding: "2px 6px", backgroundColor: "#e7f1ff", borderRadius: "3px" }}>SUPER</span>}
                      </td>
                      <td style={{ padding: "12px", color: "#666", fontSize: "13px" }}>{user.email}</td>
                      <td style={{ padding: "12px", color: "#333", fontSize: "13px", textTransform: "capitalize" }}>{user.role?.replace('_', ' ')}</td>
                      <td style={{ padding: "12px", maxWidth: "250px" }}>
                        {user.role === 'super_admin' ? (
                          <span style={{ fontSize: "12px", color: "#28a745", fontStyle: "italic" }}>All permissions</span>
                        ) : (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                            {(user.permissions || []).map((p: string) => (
                              <span key={p} style={{ fontSize: "11px", padding: "2px 6px", backgroundColor: "#e9ecef", borderRadius: "3px", color: "#495057" }}>
                                {permissionLabels[p] || p}
                              </span>
                            ))}
                            {(!user.permissions || user.permissions.length === 0) && (
                              <span style={{ fontSize: "12px", color: "#dc3545", fontStyle: "italic" }}>No permissions</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <span style={{
                          padding: "4px 10px", borderRadius: "12px", fontSize: "12px",
                          backgroundColor: user.is_active ? "#d4edda" : "#f8d7da",
                          color: user.is_active ? "#155724" : "#721c24"
                        }}>
                          {user.is_active ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td style={{ padding: "12px", textAlign: "center", fontSize: "12px", color: "#666" }}>
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                          {user.role !== 'super_admin' && (
                            <>
                              <button
                                onClick={() => setEditingUser(editingUser?.id === user.id ? null : user)}
                                style={{ padding: "4px 10px", fontSize: "12px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "3px", cursor: "pointer" }}
                              >
                                Permissions
                              </button>
                              <button
                                onClick={() => handleToggleUserActive(user.id)}
                                style={{ padding: "4px 10px", fontSize: "12px", backgroundColor: user.is_active ? "#dc3545" : "#28a745", color: "white", border: "none", borderRadius: "3px", cursor: "pointer" }}
                              >
                                {user.is_active ? "Disable" : "Enable"}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <div style={{ padding: "40px", textAlign: "center", color: "#999" }}>No users found</div>
              )}
            </div>

            {editingUser && editingUser.role !== 'super_admin' && (
              <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", marginBottom: "30px" }}>
                <h3 style={{ margin: "0 0 15px 0", color: "#333" }}>Edit Permissions: {editingUser.username}</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px", marginBottom: "15px" }}>
                  {availablePermissions.map((perm: string) => {
                    const userPerms = editingUser.permissions || [];
                    const isChecked = userPerms.includes(perm);
                    return (
                      <label key={perm} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", backgroundColor: isChecked ? "#e7f1ff" : "#f8f9fa", borderRadius: "6px", cursor: "pointer", border: isChecked ? "1px solid #007bff" : "1px solid #dee2e6" }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            const newPerms = togglePermission(userPerms, perm);
                            setEditingUser({ ...editingUser, permissions: newPerms });
                          }}
                        />
                        <span style={{ fontSize: "13px", color: "#333" }}>{permissionLabels[perm] || perm}</span>
                      </label>
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => { handleUpdateUserPermissions(editingUser.id, editingUser.permissions || []); setEditingUser(null); }}
                    style={{ padding: "8px 20px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                  >
                    Save Permissions
                  </button>
                  <button
                    onClick={() => setEditingUser(null)}
                    style={{ padding: "8px 20px", backgroundColor: "#6c757d", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", overflow: "hidden" }}>
              <div style={{ padding: "15px 20px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, color: "#333" }}>Audit Log</h3>
                <div style={{ display: "flex", gap: "10px" }}>
                  <select
                    value={auditFilter.admin_id}
                    onChange={(e) => { setAuditFilter({ ...auditFilter, admin_id: e.target.value }); }}
                    style={{ padding: "6px 10px", borderRadius: "4px", border: "1px solid #ddd", fontSize: "13px" }}
                  >
                    <option value="">All Users</option>
                    {users.map((u: any) => (
                      <option key={u.id} value={u.id}>{u.username}</option>
                    ))}
                  </select>
                  <select
                    value={auditFilter.action}
                    onChange={(e) => { setAuditFilter({ ...auditFilter, action: e.target.value }); }}
                    style={{ padding: "6px 10px", borderRadius: "4px", border: "1px solid #ddd", fontSize: "13px" }}
                  >
                    <option value="">All Actions</option>
                    <option value="login">Login</option>
                    <option value="create_user">Create User</option>
                    <option value="update_user">Update User</option>
                    <option value="enable_user">Enable User</option>
                    <option value="disable_user">Disable User</option>
                    <option value="create_deal">Create Deal</option>
                    <option value="update_deal">Update Deal</option>
                    <option value="delete_deal">Delete Deal</option>
                    <option value="approve_deal">Approve Deal</option>
                    <option value="reject_deal">Reject Deal</option>
                  </select>
                  <button
                    onClick={fetchAuditLogs}
                    style={{ padding: "6px 15px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "13px" }}
                  >
                    Filter
                  </button>
                </div>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f8f9fa" }}>
                    <th style={{ padding: "10px 12px", textAlign: "left", borderBottom: "2px solid #dee2e6", fontSize: "12px", color: "#666" }}>Time</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", borderBottom: "2px solid #dee2e6", fontSize: "12px", color: "#666" }}>User</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", borderBottom: "2px solid #dee2e6", fontSize: "12px", color: "#666" }}>Action</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", borderBottom: "2px solid #dee2e6", fontSize: "12px", color: "#666" }}>Resource</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", borderBottom: "2px solid #dee2e6", fontSize: "12px", color: "#666" }}>Details</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", borderBottom: "2px solid #dee2e6", fontSize: "12px", color: "#666" }}>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log: any) => (
                    <tr key={log.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                      <td style={{ padding: "10px 12px", fontSize: "12px", color: "#666", whiteSpace: "nowrap" }}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: "13px", fontWeight: "500", color: "#333" }}>{log.admin_username}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{
                          padding: "3px 8px", borderRadius: "3px", fontSize: "12px",
                          backgroundColor:
                            log.action.includes("delete") || log.action.includes("reject") || log.action.includes("disable") ? "#f8d7da" :
                            log.action.includes("create") || log.action.includes("approve") || log.action.includes("enable") ? "#d4edda" :
                            log.action === "login" ? "#cce5ff" : "#e9ecef",
                          color:
                            log.action.includes("delete") || log.action.includes("reject") || log.action.includes("disable") ? "#721c24" :
                            log.action.includes("create") || log.action.includes("approve") || log.action.includes("enable") ? "#155724" :
                            log.action === "login" ? "#004085" : "#495057"
                        }}>
                          {actionLabels[log.action] || log.action}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: "12px", color: "#666" }}>
                        {log.resource_type}{log.resource_id ? ` #${log.resource_id.substring(0, 8)}` : ""}
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: "12px", color: "#666", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {log.details ? (log.details.username || log.details.title || log.details.count || JSON.stringify(log.details).substring(0, 50)) : "-"}
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: "12px", color: "#999" }}>{log.ip_address || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {auditLogs.length === 0 && (
                <div style={{ padding: "40px", textAlign: "center", color: "#999" }}>No audit logs found</div>
              )}
            </div>
          </div>
        )}

        {showCreateUser && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "8px", width: "90%", maxWidth: "500px", maxHeight: "90vh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ margin: 0, color: "#333" }}>Create New User</h3>
                <button onClick={() => setShowCreateUser(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#999" }}>x</button>
              </div>
              <form onSubmit={handleCreateUser}>
                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#333", fontSize: "14px" }}>Username *</label>
                  <input
                    type="text" required value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#333", fontSize: "14px" }}>Email *</label>
                  <input
                    type="email" required value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#333", fontSize: "14px" }}>Password *</label>
                  <input
                    type="password" required value={newUser.password} minLength={6}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#333", fontSize: "14px" }}>Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box" }}
                  >
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#333", fontSize: "14px" }}>Permissions</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    {availablePermissions.map((perm: string) => (
                      <label key={perm} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", backgroundColor: newUser.permissions.includes(perm) ? "#e7f1ff" : "#f8f9fa", borderRadius: "6px", cursor: "pointer", border: newUser.permissions.includes(perm) ? "1px solid #007bff" : "1px solid #dee2e6" }}>
                        <input
                          type="checkbox"
                          checked={newUser.permissions.includes(perm)}
                          onChange={() => setNewUser({ ...newUser, permissions: togglePermission(newUser.permissions, perm) })}
                        />
                        <span style={{ fontSize: "12px", color: "#333" }}>{permissionLabels[perm] || perm}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="submit" style={{ flex: 1, padding: "10px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "14px" }}>
                    Create User
                  </button>
                  <button type="button" onClick={() => setShowCreateUser(false)} style={{ flex: 1, padding: "10px", backgroundColor: "#6c757d", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "14px" }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Configuration Modal */}
        {showConfigModal && selectedNetwork && (
          <div style={{ 
            position: "fixed", 
            top: 0, 
            left: 0, 
            width: "100%", 
            height: "100%", 
            backgroundColor: "rgba(0,0,0,0.5)", 
            display: "flex", 
            justifyContent: "center", 
            alignItems: "center",
            zIndex: 1000
          }}>
            <div style={{ 
              backgroundColor: "white", 
              padding: "30px", 
              borderRadius: "8px", 
              maxWidth: "500px", 
              width: "90%",
              maxHeight: "80vh",
              overflowY: "auto"
            }}>
              <h3 style={{ marginBottom: "20px", color: "#333" }}>Configure {selectedNetwork.name}</h3>
              
              <div style={{ marginBottom: "20px" }}>
                {selectedNetwork.configuration_fields?.map((field: string, index: number) => (
                  <div key={index} style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "14px" }}>
                      {field.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}:
                    </label>
                    <input
                      type={field.toLowerCase().includes('key') || field.toLowerCase().includes('secret') || field.toLowerCase().includes('token') ? "password" : "text"}
                      value={networkConfig[field] || ""}
                      onChange={(e) => setNetworkConfig({...networkConfig, [field]: e.target.value})}
                      style={{ 
                        width: "100%", 
                        padding: "8px", 
                        border: "1px solid #ccc", 
                        borderRadius: "4px",
                        fontSize: "14px"
                      }}
                      placeholder={`Enter your ${field}`}
                    />
                  </div>
                ))}
              </div>

              {/* Compliance Info */}
              <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f8f9fa", borderRadius: "4px" }}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#333" }}>Compliance Requirements:</h4>
                <ul style={{ margin: 0, padding: "0 0 0 16px", fontSize: "12px", color: "#666" }}>
                  {selectedNetwork.compliance_terms?.attribution_required && <li>All links must include proper affiliate tracking</li>}
                  {selectedNetwork.compliance_terms?.data_retention && (
                    <li>Data retention: {selectedNetwork.compliance_terms.data_retention.replace('_', ' ')}</li>
                  )}
                  {selectedNetwork.compliance_terms?.content_restrictions?.map((restriction: string, index: number) => (
                    <li key={index}>{restriction.replace('_', ' ')}</li>
                  ))}
                </ul>
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => setShowConfigModal(false)}
                  style={{ 
                    padding: "10px 20px", 
                    backgroundColor: "#6c757d", 
                    color: "white", 
                    border: "none", 
                    borderRadius: "4px", 
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => configureNetwork(selectedNetwork.network_id, networkConfig)}
                  style={{ 
                    padding: "10px 20px", 
                    backgroundColor: "#007bff", 
                    color: "white", 
                    border: "none", 
                    borderRadius: "4px", 
                    cursor: "pointer"
                  }}
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Deal Modal */}
      {showAddDeal && (
        <div style={{ 
          position: "fixed", 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: "rgba(0,0,0,0.5)", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          zIndex: 1000 
        }}>
          <div style={{ 
            backgroundColor: "white", 
            padding: "30px", 
            borderRadius: "8px", 
            width: "90%", 
            maxWidth: "600px", 
            maxHeight: "90vh", 
            overflowY: "auto" 
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, color: "#333" }}>Add New Deal</h3>
              <button
                onClick={() => setShowAddDeal(false)}
                style={{ 
                  background: "none", 
                  border: "none", 
                  fontSize: "24px", 
                  cursor: "pointer", 
                  color: "#666" 
                }}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateDeal}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Title</label>
                  <input
                    type="text"
                    value={newDeal.title}
                    onChange={(e) => setNewDeal({...newDeal, title: e.target.value})}
                    required
                    style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                  />
                </div>
                
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Description</label>
                  <textarea
                    value={newDeal.description}
                    onChange={(e) => setNewDeal({...newDeal, description: e.target.value})}
                    required
                    rows={3}
                    style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                  />
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Original Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newDeal.original_price}
                    onChange={(e) => setNewDeal({...newDeal, original_price: e.target.value})}
                    required
                    style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                  />
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Sale Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newDeal.sale_price}
                    onChange={(e) => setNewDeal({...newDeal, sale_price: e.target.value})}
                    required
                    style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                  />
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Store</label>
                  <input
                    type="text"
                    value={newDeal.store}
                    onChange={(e) => setNewDeal({...newDeal, store: e.target.value})}
                    required
                    style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                  />
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Category</label>
                  <select
                    value={newDeal.category}
                    onChange={(e) => setNewDeal({...newDeal, category: e.target.value})}
                    required
                    style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Deal Type</label>
                  <select
                    value={newDeal.deal_type}
                    onChange={(e) => setNewDeal({...newDeal, deal_type: e.target.value})}
                    style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                  >
                    {dealTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Affiliate URL</label>
                  <input
                    type="url"
                    value={newDeal.affiliate_url}
                    onChange={(e) => setNewDeal({...newDeal, affiliate_url: e.target.value})}
                    required
                    style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                  />
                </div>
                
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Image URL</label>
                  <input
                    type="url"
                    value={newDeal.image_url}
                    onChange={(e) => setNewDeal({...newDeal, image_url: e.target.value})}
                    style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                  />
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Coupon Code (Optional)</label>
                  <input
                    type="text"
                    value={newDeal.coupon_code}
                    onChange={(e) => setNewDeal({...newDeal, coupon_code: e.target.value})}
                    style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                    placeholder="Enter promo/coupon code"
                  />
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold" }}>
                    <input
                      type="checkbox"
                      checked={newDeal.coupon_required}
                      onChange={(e) => setNewDeal({...newDeal, coupon_required: e.target.checked})}
                    />
                    Coupon Required
                  </label>
                  <span style={{ fontSize: "12px", color: "#666" }}>
                    (Code is mandatory for discount)
                  </span>
                </div>
              </div>
              
              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ 
                    flex: 1, 
                    padding: "12px", 
                    backgroundColor: loading ? "#ccc" : "#28a745", 
                    color: "white", 
                    border: "none", 
                    borderRadius: "4px", 
                    cursor: loading ? "not-allowed" : "pointer" 
                  }}
                >
                  {loading ? "Creating..." : "Create Deal"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddDeal(false)}
                  style={{ 
                    flex: 1, 
                    padding: "12px", 
                    backgroundColor: "#6c757d", 
                    color: "white", 
                    border: "none", 
                    borderRadius: "4px", 
                    cursor: "pointer" 
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JSON Import Modal */}
      {showJsonImport && (
        <div style={{ 
          position: "fixed", 
          top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: "rgba(0,0,0,0.5)", 
          display: "flex", alignItems: "center", justifyContent: "center", 
          zIndex: 1000 
        }}>
          <div style={{ 
            backgroundColor: "white", padding: "30px", borderRadius: "8px", 
            width: "90%", maxWidth: "700px", maxHeight: "90vh", overflowY: "auto" 
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, color: "#333" }}>Import Deals via JSON</h3>
              <button
                onClick={() => setShowJsonImport(false)}
                style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#666" }}
              >×</button>
            </div>
            
            <p style={{ color: "#666", fontSize: "14px", marginBottom: "10px" }}>
              Paste a JSON array of deals. Each deal should have: <strong>title</strong>, <strong>original_price</strong>, <strong>sale_price</strong>, <strong>store</strong>, <strong>category</strong>, <strong>affiliate_url</strong>. Optional: description, image_url, deal_type, coupon_code, coupon_required.
            </p>
            
            <div style={{ marginBottom: "10px" }}>
              <button
                onClick={() => setJsonInput(JSON.stringify([
                  {
                    "title": "Example Product 50% Off",
                    "description": "Great deal on this product",
                    "original_price": 99.99,
                    "sale_price": 49.99,
                    "store": "Amazon",
                    "category": "Electronics",
                    "deal_type": "latest",
                    "affiliate_url": "https://example.com/deal",
                    "image_url": "https://example.com/image.jpg"
                  }
                ], null, 2))}
                style={{ padding: "6px 12px", backgroundColor: "#e9ecef", border: "1px solid #ced4da", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
              >
                Load Example
              </button>
            </div>
            
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='[{"title": "...", "original_price": 99.99, "sale_price": 49.99, "store": "Amazon", "category": "Electronics", "affiliate_url": "https://..."}]'
              rows={15}
              style={{ 
                width: "100%", padding: "12px", border: "1px solid #ddd", borderRadius: "4px", 
                fontFamily: "monospace", fontSize: "13px", resize: "vertical" 
              }}
            />
            
            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
              <button
                onClick={handleJsonImport}
                disabled={jsonImportLoading}
                style={{ 
                  flex: 1, padding: "12px", 
                  backgroundColor: jsonImportLoading ? "#ccc" : "#6f42c1", 
                  color: "white", border: "none", borderRadius: "4px", 
                  cursor: jsonImportLoading ? "not-allowed" : "pointer",
                  fontSize: "14px"
                }}
              >
                {jsonImportLoading ? "Importing..." : "Import Deals"}
              </button>
              <button
                type="button"
                onClick={() => { setShowJsonImport(false); setJsonInput(""); }}
                style={{ 
                  flex: 1, padding: "12px", backgroundColor: "#6c757d", 
                  color: "white", border: "none", borderRadius: "4px", cursor: "pointer" 
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Deal Modal */}
      {editingDeal && (
        <div style={{ 
          position: "fixed", 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: "rgba(0,0,0,0.5)", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          zIndex: 1000 
        }}>
          <div style={{ 
            backgroundColor: "white", 
            padding: "30px", 
            borderRadius: "8px", 
            width: "90%", 
            maxWidth: "600px", 
            maxHeight: "90vh", 
            overflowY: "auto" 
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, color: "#333" }}>Edit Deal</h3>
              <button
                onClick={() => setEditingDeal(null)}
                style={{ 
                  background: "none", 
                  border: "none", 
                  fontSize: "24px", 
                  cursor: "pointer", 
                  color: "#666" 
                }}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleUpdateDeal}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Title</label>
                  <input
                    type="text"
                    value={editingDeal.title}
                    onChange={(e) => setEditingDeal({...editingDeal, title: e.target.value})}
                    required
                    style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                  />
                </div>
                
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Description</label>
                  <textarea
                    value={editingDeal.description}
                    onChange={(e) => setEditingDeal({...editingDeal, description: e.target.value})}
                    required
                    rows={3}
                    style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                  />
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Original Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingDeal.original_price}
                    onChange={(e) => setEditingDeal({...editingDeal, original_price: e.target.value})}
                    required
                    style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                  />
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Sale Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingDeal.sale_price}
                    onChange={(e) => setEditingDeal({...editingDeal, sale_price: e.target.value})}
                    required
                    style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                  />
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Store</label>
                  <input
                    type="text"
                    value={editingDeal.store}
                    onChange={(e) => setEditingDeal({...editingDeal, store: e.target.value})}
                    required
                    style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                  />
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Category</label>
                  <select
                    value={editingDeal.category}
                    onChange={(e) => setEditingDeal({...editingDeal, category: e.target.value})}
                    required
                    style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Deal Type</label>
                  <select
                    value={editingDeal.deal_type || "regular"}
                    onChange={(e) => setEditingDeal({...editingDeal, deal_type: e.target.value})}
                    style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                  >
                    {dealTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Affiliate URL</label>
                  <input
                    type="url"
                    value={editingDeal.affiliate_url}
                    onChange={(e) => setEditingDeal({...editingDeal, affiliate_url: e.target.value})}
                    required
                    style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                  />
                </div>
                
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Image URL</label>
                  <input
                    type="url"
                    value={editingDeal.image_url}
                    onChange={(e) => setEditingDeal({...editingDeal, image_url: e.target.value})}
                    style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                  />
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Coupon Code (Optional)</label>
                  <input
                    type="text"
                    value={editingDeal.coupon_code || ""}
                    onChange={(e) => setEditingDeal({...editingDeal, coupon_code: e.target.value})}
                    style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                    placeholder="Enter promo/coupon code"
                  />
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold" }}>
                    <input
                      type="checkbox"
                      checked={editingDeal.coupon_required || false}
                      onChange={(e) => setEditingDeal({...editingDeal, coupon_required: e.target.checked})}
                    />
                    Coupon Required
                  </label>
                  <span style={{ fontSize: "12px", color: "#666" }}>
                    (Code is mandatory for discount)
                  </span>
                </div>
              </div>
              
              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ 
                    flex: 1, 
                    padding: "12px", 
                    backgroundColor: loading ? "#ccc" : "#007bff", 
                    color: "white", 
                    border: "none", 
                    borderRadius: "4px", 
                    cursor: loading ? "not-allowed" : "pointer" 
                  }}
                >
                  {loading ? "Updating..." : "Update Deal"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingDeal(null)}
                  style={{ 
                    flex: 1, 
                    padding: "12px", 
                    backgroundColor: "#6c757d", 
                    color: "white", 
                    border: "none", 
                    borderRadius: "4px", 
                    cursor: "pointer" 
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Banners Tab */}
      {activeTab === "banners" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ color: "#333" }}>Banner / Ad Management</h2>
            <button
              onClick={() => { resetBannerForm(); setShowBannerForm(true); }}
              style={{ padding: "10px 20px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
            >
              + Add Banner
            </button>
          </div>

          {showBannerForm && (
            <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", marginBottom: "20px" }}>
              <h3 style={{ marginBottom: "15px" }}>{editingBanner ? "Edit Banner" : "Create New Banner"}</h3>
              <form onSubmit={handleSaveBanner}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "13px" }}>Name *</label>
                    <input type="text" required value={bannerForm.name} onChange={e => setBannerForm({...bannerForm, name: e.target.value})}
                      style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "13px" }}>Position *</label>
                    <select value={bannerForm.position} onChange={e => setBannerForm({...bannerForm, position: e.target.value})}
                      style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}>
                      <option value="hero_below">Below Hero (Leaderboard)</option>
                      <option value="between_sections">Between Sections</option>
                      <option value="sidebar">Sidebar</option>
                      <option value="before_footer">Before Footer</option>
                      <option value="deal_detail">Deal Detail Page</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "13px" }}>Banner Type *</label>
                    <select value={bannerForm.banner_type} onChange={e => setBannerForm({...bannerForm, banner_type: e.target.value})}
                      style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}>
                      <option value="custom">Custom (Image + Link)</option>
                      <option value="google_ads">Google Ads (HTML Code)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "13px" }}>Sort Order</label>
                    <input type="number" value={bannerForm.sort_order} onChange={e => setBannerForm({...bannerForm, sort_order: parseInt(e.target.value) || 0})}
                      style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box" }} />
                  </div>
                  {bannerForm.banner_type === "custom" && (
                    <>
                      <div>
                        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "13px" }}>Image URL</label>
                        <input type="url" value={bannerForm.image_url} onChange={e => setBannerForm({...bannerForm, image_url: e.target.value})}
                          placeholder="https://example.com/banner.jpg"
                          style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "13px" }}>Click-Through URL</label>
                        <input type="url" value={bannerForm.link_url} onChange={e => setBannerForm({...bannerForm, link_url: e.target.value})}
                          placeholder="https://example.com/landing"
                          style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "13px" }}>Alt Text</label>
                        <input type="text" value={bannerForm.alt_text} onChange={e => setBannerForm({...bannerForm, alt_text: e.target.value})}
                          style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box" }} />
                      </div>
                    </>
                  )}
                  {bannerForm.banner_type === "google_ads" && (
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "13px" }}>Google Ads HTML Code</label>
                      <textarea value={bannerForm.html_code} onChange={e => setBannerForm({...bannerForm, html_code: e.target.value})}
                        rows={6} placeholder="Paste your Google Ads script/code here..."
                        style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px", fontFamily: "monospace", fontSize: "12px", boxSizing: "border-box" }} />
                    </div>
                  )}
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "13px" }}>Start Date (optional)</label>
                    <input type="datetime-local" value={bannerForm.start_date} onChange={e => setBannerForm({...bannerForm, start_date: e.target.value})}
                      style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "13px" }}>End Date (optional)</label>
                    <input type="datetime-local" value={bannerForm.end_date} onChange={e => setBannerForm({...bannerForm, end_date: e.target.value})}
                      style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input type="checkbox" checked={bannerForm.is_active} onChange={e => setBannerForm({...bannerForm, is_active: e.target.checked})} id="bannerActive" />
                    <label htmlFor="bannerActive" style={{ fontWeight: "bold", fontSize: "13px" }}>Active</label>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                  <button type="submit" style={{ padding: "10px 20px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                    {editingBanner ? "Update Banner" : "Create Banner"}
                  </button>
                  <button type="button" onClick={resetBannerForm} style={{ padding: "10px 20px", backgroundColor: "#6c757d", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8f9fa" }}>
                  <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #dee2e6", fontSize: "13px" }}>Name</th>
                  <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #dee2e6", fontSize: "13px" }}>Position</th>
                  <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #dee2e6", fontSize: "13px" }}>Type</th>
                  <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #dee2e6", fontSize: "13px" }}>Status</th>
                  <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #dee2e6", fontSize: "13px" }}>Impressions</th>
                  <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #dee2e6", fontSize: "13px" }}>Clicks</th>
                  <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #dee2e6", fontSize: "13px" }}>CTR</th>
                  <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #dee2e6", fontSize: "13px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {banners.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: "30px", textAlign: "center", color: "#999" }}>
                      No banners configured. Click "+ Add Banner" to create one.
                    </td>
                  </tr>
                ) : banners.map(banner => (
                  <tr key={banner.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "12px", fontSize: "13px" }}>
                      <div style={{ fontWeight: "bold" }}>{banner.name}</div>
                      {banner.image_url && (
                        <img src={banner.image_url} alt="" style={{ width: "60px", height: "30px", objectFit: "cover", borderRadius: "3px", marginTop: "4px" }} />
                      )}
                    </td>
                    <td style={{ padding: "12px", fontSize: "13px" }}>
                      {banner.position.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </td>
                    <td style={{ padding: "12px", fontSize: "13px" }}>
                      <span style={{
                        padding: "3px 8px", borderRadius: "3px", fontSize: "11px",
                        backgroundColor: banner.banner_type === 'google_ads' ? '#fff3cd' : '#d4edda',
                        color: banner.banner_type === 'google_ads' ? '#856404' : '#155724'
                      }}>
                        {banner.banner_type === 'google_ads' ? 'Google Ads' : 'Custom'}
                      </span>
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <button onClick={() => handleToggleBanner(banner)} style={{
                        padding: "3px 10px", borderRadius: "3px", fontSize: "11px", border: "none", cursor: "pointer",
                        backgroundColor: banner.is_active ? '#28a745' : '#dc3545', color: 'white'
                      }}>
                        {banner.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td style={{ padding: "12px", textAlign: "center", fontSize: "13px" }}>{(banner.impression_count || 0).toLocaleString()}</td>
                    <td style={{ padding: "12px", textAlign: "center", fontSize: "13px" }}>{(banner.click_count || 0).toLocaleString()}</td>
                    <td style={{ padding: "12px", textAlign: "center", fontSize: "13px" }}>
                      {banner.impression_count > 0 ? ((banner.click_count / banner.impression_count) * 100).toFixed(2) + '%' : '0%'}
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <button onClick={() => handleEditBanner(banner)} style={{ padding: "4px 10px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "3px", cursor: "pointer", marginRight: "5px", fontSize: "12px" }}>Edit</button>
                      <button onClick={() => handleDeleteBanner(banner.id)} style={{ padding: "4px 10px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "3px", cursor: "pointer", fontSize: "12px" }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: "20px", backgroundColor: "white", padding: "15px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
            <h3 style={{ fontSize: "14px", color: "#666", marginBottom: "10px" }}>Ad Slot Positions</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
              {["hero_below", "between_sections", "sidebar", "before_footer", "deal_detail"].map(pos => {
                const count = banners.filter(b => b.position === pos && b.is_active).length;
                return (
                  <div key={pos} style={{ padding: "10px", border: "1px solid #eee", borderRadius: "4px", fontSize: "13px" }}>
                    <div style={{ fontWeight: "bold" }}>{pos.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</div>
                    <div style={{ color: count > 0 ? "#28a745" : "#999", fontSize: "12px", marginTop: "4px" }}>
                      {count > 0 ? `${count} active banner${count > 1 ? 's' : ''}` : 'No active banners'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* File Upload Modal */}
      <FileUploadModal
        open={showFileUpload}
        onClose={() => setShowFileUpload(false)}
        onUploadComplete={() => {
          fetchData(); // Refresh deals data after upload
        }}
      />
    </div>
  );
}