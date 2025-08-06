import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit, Plus, BarChart3, Users, DollarSign, TrendingUp, CheckCircle, XCircle, LogOut } from "lucide-react";

interface AdminUser {
  id: string;
  username: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

interface Deal {
  id: string;
  title: string;
  description: string;
  store: string;
  category: string;
  original_price: number;
  sale_price: number;
  discount_percentage: number;
  image_url: string;
  affiliate_url: string;
  is_ai_approved: boolean;
  deal_type: string;
  click_count: number;
  share_count: number;
  created_at: string;
}

interface AdminMetrics {
  total_deals: number;
  ai_approved_deals: number;
  pending_deals: number;
  total_clicks: number;
  total_shares: number;
  revenue_estimate: number;
  top_categories: Array<{category: string; deals_count: number; clicks: number}>;
  top_stores: Array<{store: string; deals_count: number; clicks: number}>;
  recent_activity: Array<{id: string; title: string; store: string; category: string; created_at: string; clicks: number; ai_approved: boolean}>;
}

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showAddDeal, setShowAddDeal] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [dealForm, setDealForm] = useState({
    title: "",
    description: "",
    store: "",
    category: "",
    original_price: "",
    sale_price: "",
    discount_percentage: "",
    image_url: "",
    affiliate_url: "",
    deal_type: "latest"
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (token) {
      setIsLoggedIn(true);
      fetchCurrentAdmin();
    }
  }, []);

  const fetchCurrentAdmin = async () => {
    const token = localStorage.getItem("admin_token");
    if (!token) return;

    try {
      const response = await fetch("/api/admin/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const admin = await response.json();
        setCurrentAdmin(admin);
      } else {
        localStorage.removeItem("admin_token");
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error("Error fetching admin:", error);
    }
  };

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: {username: string; password: string}) => {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Login failed");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("admin_token", data.access_token);
      setCurrentAdmin(data.admin);
      setIsLoggedIn(true);
      toast({ title: "Login successful", description: `Welcome back, ${data.admin.username}!` });
    },
    onError: (error: Error) => {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    }
  });

  // Metrics query
  const { data: metrics } = useQuery<AdminMetrics>({
    queryKey: ["admin-metrics"],
    queryFn: async () => {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin/metrics", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to fetch metrics");
      return response.json();
    },
    enabled: isLoggedIn
  });

  // Deals query
  const { data: deals, refetch: refetchDeals } = useQuery<Deal[]>({
    queryKey: ["admin-deals"],
    queryFn: async () => {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin/deals", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to fetch deals");
      return response.json();
    },
    enabled: isLoggedIn && activeTab === "deals"
  });

  // Create deal mutation
  const createDealMutation = useMutation({
    mutationFn: async (dealData: any) => {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin/deals", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...dealData,
          original_price: parseFloat(dealData.original_price),
          sale_price: parseFloat(dealData.sale_price),
          discount_percentage: parseInt(dealData.discount_percentage)
        })
      });
      if (!response.ok) throw new Error("Failed to create deal");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-deals"] });
      queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
      setShowAddDeal(false);
      resetDealForm();
      toast({ title: "Deal created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create deal", description: error.message, variant: "destructive" });
    }
  });

  // Delete deal mutation
  const deleteDealMutation = useMutation({
    mutationFn: async (dealId: string) => {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/deals/${dealId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to delete deal");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-deals"] });
      queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
      toast({ title: "Deal deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete deal", description: error.message, variant: "destructive" });
    }
  });

  // Approve/reject deal mutations
  const approveDealMutation = useMutation({
    mutationFn: async (dealId: string) => {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/deals/${dealId}/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to approve deal");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-deals"] });
      toast({ title: "Deal approved successfully" });
    }
  });

  const rejectDealMutation = useMutation({
    mutationFn: async (dealId: string) => {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/deals/${dealId}/reject`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to reject deal");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-deals"] });
      toast({ title: "Deal rejected successfully" });
    }
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setIsLoggedIn(false);
    setCurrentAdmin(null);
    setActiveTab("dashboard");
  };

  const resetDealForm = () => {
    setDealForm({
      title: "",
      description: "",
      store: "",
      category: "",
      original_price: "",
      sale_price: "",
      discount_percentage: "",
      image_url: "",
      affiliate_url: "",
      deal_type: "latest"
    });
    setEditingDeal(null);
  };

  const handleCreateDeal = (e: React.FormEvent) => {
    e.preventDefault();
    createDealMutation.mutate(dealForm);
  };

  // Login form
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">DealSphere Admin</CardTitle>
            <CardDescription className="text-center">Sign in to access the admin dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={loginData.username}
                  onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            
            <Alert className="mt-4">
              <AlertDescription>
                <strong>Demo Credentials:</strong><br />
                Username: admin<br />
                Password: admin123
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main admin dashboard
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">DealSphere Admin</h1>
              <nav className="flex space-x-4">
                <Button
                  variant={activeTab === "dashboard" ? "default" : "ghost"}
                  onClick={() => setActiveTab("dashboard")}
                >
                  Dashboard
                </Button>
                <Button
                  variant={activeTab === "deals" ? "default" : "ghost"}
                  onClick={() => setActiveTab("deals")}
                >
                  Manage Deals
                </Button>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {currentAdmin?.username}</span>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && metrics && (
          <div className="space-y-8">
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.total_deals}</div>
                  <p className="text-xs text-muted-foreground">
                    {metrics.ai_approved_deals} AI approved
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.total_clicks}</div>
                  <p className="text-xs text-muted-foreground">
                    {metrics.total_shares} shares
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue Estimate</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${metrics.revenue_estimate.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">
                    Based on clicks
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.pending_deals}</div>
                  <p className="text-xs text-muted-foreground">
                    Awaiting approval
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts and Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Top Categories */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.top_categories.map((category, index) => (
                      <div key={category.category} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{category.category}</span>
                        <div className="text-right">
                          <div className="text-sm font-bold">{category.deals_count} deals</div>
                          <div className="text-xs text-gray-500">{category.clicks} clicks</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Stores */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Stores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.top_stores.map((store, index) => (
                      <div key={store.store} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{store.store}</span>
                        <div className="text-right">
                          <div className="text-sm font-bold">{store.deals_count} deals</div>
                          <div className="text-xs text-gray-500">{store.clicks} clicks</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.recent_activity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{activity.title}</div>
                        <div className="text-xs text-gray-500">{activity.store} • {activity.category}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={activity.ai_approved ? "default" : "secondary"}>
                          {activity.ai_approved ? "Approved" : "Pending"}
                        </Badge>
                        <span className="text-xs text-gray-500">{activity.clicks} clicks</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Deals Management Tab */}
        {activeTab === "deals" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Manage Deals</h2>
              <Dialog open={showAddDeal} onOpenChange={setShowAddDeal}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Deal
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Deal</DialogTitle>
                    <DialogDescription>
                      Create a new deal for the platform
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateDeal} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          value={dealForm.title}
                          onChange={(e) => setDealForm({...dealForm, title: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="store">Store</Label>
                        <Input
                          id="store"
                          value={dealForm.store}
                          onChange={(e) => setDealForm({...dealForm, store: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={dealForm.description}
                        onChange={(e) => setDealForm({...dealForm, description: e.target.value})}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="original_price">Original Price</Label>
                        <Input
                          id="original_price"
                          type="number"
                          step="0.01"
                          value={dealForm.original_price}
                          onChange={(e) => setDealForm({...dealForm, original_price: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="sale_price">Sale Price</Label>
                        <Input
                          id="sale_price"
                          type="number"
                          step="0.01"
                          value={dealForm.sale_price}
                          onChange={(e) => setDealForm({...dealForm, sale_price: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="discount_percentage">Discount %</Label>
                        <Input
                          id="discount_percentage"
                          type="number"
                          value={dealForm.discount_percentage}
                          onChange={(e) => setDealForm({...dealForm, discount_percentage: e.target.value})}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Input
                          id="category"
                          value={dealForm.category}
                          onChange={(e) => setDealForm({...dealForm, category: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="deal_type">Deal Type</Label>
                        <Select value={dealForm.deal_type} onValueChange={(value) => setDealForm({...dealForm, deal_type: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="latest">Latest</SelectItem>
                            <SelectItem value="hot">Hot</SelectItem>
                            <SelectItem value="top">Top</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="image_url">Image URL</Label>
                      <Input
                        id="image_url"
                        type="url"
                        value={dealForm.image_url}
                        onChange={(e) => setDealForm({...dealForm, image_url: e.target.value})}
                      />
                    </div>

                    <div>
                      <Label htmlFor="affiliate_url">Affiliate URL</Label>
                      <Input
                        id="affiliate_url"
                        type="url"
                        value={dealForm.affiliate_url}
                        onChange={(e) => setDealForm({...dealForm, affiliate_url: e.target.value})}
                        required
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setShowAddDeal(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createDealMutation.isPending}>
                        {createDealMutation.isPending ? "Creating..." : "Create Deal"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Deals Table */}
            {deals && (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deal</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stats</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {deals.map((deal) => (
                          <tr key={deal.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <img className="h-10 w-10 rounded-lg object-cover mr-4" src={deal.image_url || "/placeholder.jpg"} alt={deal.title} />
                                <div>
                                  <div className="text-sm font-medium text-gray-900 truncate max-w-xs">{deal.title}</div>
                                  <div className="text-sm text-gray-500">{deal.category}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{deal.store}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">${deal.sale_price}</div>
                              <div className="text-sm text-gray-500 line-through">${deal.original_price}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant={deal.is_ai_approved ? "default" : "secondary"}>
                                {deal.is_ai_approved ? "Approved" : "Pending"}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div>{deal.click_count} clicks</div>
                              <div>{deal.share_count} shares</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                {!deal.is_ai_approved && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => approveDealMutation.mutate(deal.id)}
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => rejectDealMutation.mutate(deal.id)}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteDealMutation.mutate(deal.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}