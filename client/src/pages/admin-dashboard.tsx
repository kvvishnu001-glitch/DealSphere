import React, { useState, useEffect } from "react";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [metrics, setMetrics] = useState<any>(null);
  const [deals, setDeals] = useState<any[]>([]);
  const [filteredDeals, setFilteredDeals] = useState<any[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddDeal, setShowAddDeal] = useState(false);
  const [editingDeal, setEditingDeal] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [newDeal, setNewDeal] = useState({
    title: "",
    description: "",
    original_price: "",
    sale_price: "",
    discount_percentage: "",
    store: "",
    category: "",
    affiliate_url: "",
    image_url: "",
    deal_type: "regular"
  });

  const categories = ["Electronics", "Clothing", "Home & Garden", "Sports", "Books", "Toys", "Beauty", "Automotive", "Food", "Health"];
  const dealTypes = ["regular", "hot", "top"];

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      window.location.href = "/admin";
      return;
    }
    fetchData();
  }, []);

  useEffect(() => {
    filterDeals();
  }, [deals, searchTerm, selectedCategory, statusFilter]);

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
      const response = await fetch("/api/admin/deals", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDeals(data);
      }
    } catch (error) {
      console.error("Error fetching deals:", error);
    }
  };

  const filterDeals = () => {
    let filtered = deals;

    if (searchTerm) {
      filtered = filtered.filter(deal =>
        deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.store.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(deal => deal.category === selectedCategory);
    }

    if (statusFilter !== "all") {
      if (statusFilter === "approved") {
        filtered = filtered.filter(deal => deal.is_ai_approved === true);
      } else if (statusFilter === "pending") {
        filtered = filtered.filter(deal => deal.is_ai_approved === false);
      } else if (statusFilter === "rejected") {
        filtered = filtered.filter(deal => deal.status === "rejected");
      }
    }

    setFilteredDeals(filtered);
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
          sale_price: parseFloat(newDeal.sale_price),
          discount_percentage: parseFloat(newDeal.discount_percentage)
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
          discount_percentage: "",
          store: "",
          category: "",
          affiliate_url: "",
          image_url: "",
          deal_type: "regular"
        });
        fetchData();
      } else {
        alert("Failed to create deal");
      }
    } catch (error) {
      alert("Error creating deal: " + error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDeal) return;
    setLoading(true);

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/deals/${editingDeal.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...editingDeal,
          original_price: parseFloat(editingDeal.original_price),
          sale_price: parseFloat(editingDeal.sale_price),
          discount_percentage: parseFloat(editingDeal.discount_percentage)
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
            </div>

            {/* Filters */}
            <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", marginBottom: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 200px 200px", gap: "15px", alignItems: "end" }}>
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
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Deals Table */}
            {filteredDeals.length > 0 ? (
              <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead style={{ backgroundColor: "#f8f9fa" }}>
                      <tr>
                        <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #dee2e6" }}>Deal</th>
                        <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #dee2e6" }}>Store</th>
                        <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #dee2e6" }}>Category</th>
                        <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #dee2e6" }}>Price</th>
                        <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #dee2e6" }}>Status</th>
                        <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #dee2e6" }}>Stats</th>
                        <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #dee2e6" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDeals.map((deal) => (
                        <tr key={deal.id} style={{ borderBottom: "1px solid #dee2e6" }}>
                          <td style={{ padding: "12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <img 
                                src={deal.image_url || "/placeholder.jpg"} 
                                alt={deal.title}
                                style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "4px" }}
                              />
                              <div>
                                <div style={{ fontWeight: "bold", fontSize: "14px", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
                            <span style={{ 
                              fontSize: "12px", 
                              padding: "4px 8px", 
                              borderRadius: "12px", 
                              backgroundColor: deal.status === "rejected" ? "#dc3545" : deal.is_ai_approved ? "#28a745" : "#6c757d", 
                              color: "white" 
                            }}>
                              {deal.status === "rejected" ? "Rejected" : deal.is_ai_approved ? "Approved" : "Pending"}
                            </span>
                          </td>
                          <td style={{ padding: "12px", fontSize: "12px", color: "#666" }}>
                            <div>{deal.click_count || 0} clicks</div>
                            <div>{deal.share_count || 0} shares</div>
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
    </div>
  );
}