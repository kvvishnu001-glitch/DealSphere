import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Shield, 
  Bot, 
  Clock, 
  MousePointer, 
  Tag, 
  CheckCircle, 
  XCircle,
  LogOut,
  Percent
} from "lucide-react";
import type { Deal, User } from "@shared/schema";

interface Analytics {
  totalDeals: number;
  aiApproved: number;
  pendingReview: number;
  clicksToday: number;
}

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [minAiScore, setMinAiScore] = useState([6.5]);
  const [autoApproveScore, setAutoApproveScore] = useState([8.5]);

  // Fetch analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery<Analytics>({
    queryKey: ['/api/admin/analytics'],
    retry: false,
  });

  // Fetch pending deals
  const { data: pendingDeals, isLoading: pendingLoading } = useQuery<Deal[]>({
    queryKey: ['/api/admin/deals/pending'],
    retry: false,
  });

  // Approve deal mutation
  const approveMutation = useMutation({
    mutationFn: async (dealId: string) => {
      await apiRequest('POST', `/api/admin/deals/${dealId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/deals/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/analytics'] });
      toast({
        title: "Deal Approved",
        description: "Deal has been approved and published.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to approve deal",
        variant: "destructive",
      });
    },
  });

  // Reject deal mutation
  const rejectMutation = useMutation({
    mutationFn: async (dealId: string) => {
      await apiRequest('POST', `/api/admin/deals/${dealId}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/deals/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/analytics'] });
      toast({
        title: "Deal Rejected",
        description: "Deal has been rejected and removed.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to reject deal",
        variant: "destructive",
      });
    },
  });

  // Update popularity mutation
  const updatePopularityMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/admin/update-popularity');
    },
    onSuccess: () => {
      toast({
        title: "Popularity Updated",
        description: "Deal popularity scores have been recalculated.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update popularity",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="w-32 h-8 mx-auto mb-4" />
          <Skeleton className="w-48 h-4 mx-auto" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Percent className="text-red-600 text-2xl mr-2" />
              <h1 className="text-2xl font-bold text-gray-800">DealSphere Admin</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {user && (
                <div className="flex items-center space-x-2">
                  <img 
                    src={(user as User).profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&w=32&h=32&fit=crop&crop=face"} 
                    alt="Profile"
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="text-sm text-gray-700">{(user as User).firstName} {(user as User).lastName}</span>
                </div>
              )}
              <Button 
                onClick={() => window.location.href = '/api/logout'}
                variant="outline"
                size="sm"
                className="text-gray-600 hover:text-gray-800"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Total Deals</p>
                  <p className="text-3xl font-bold">
                    {analyticsLoading ? <Skeleton className="w-12 h-8" /> : analytics?.totalDeals || 0}
                  </p>
                </div>
                <Tag className="text-blue-200 text-2xl" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">AI Approved</p>
                  <p className="text-3xl font-bold">
                    {analyticsLoading ? <Skeleton className="w-12 h-8" /> : analytics?.aiApproved || 0}
                  </p>
                </div>
                <Bot className="text-green-200 text-2xl" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100">Pending Review</p>
                  <p className="text-3xl font-bold">
                    {analyticsLoading ? <Skeleton className="w-12 h-8" /> : analytics?.pendingReview || 0}
                  </p>
                </div>
                <Clock className="text-yellow-200 text-2xl" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100">Clicks Today</p>
                  <p className="text-3xl font-bold">
                    {analyticsLoading ? <Skeleton className="w-12 h-8" /> : analytics?.clicksToday || 0}
                  </p>
                </div>
                <MousePointer className="text-red-200 text-2xl" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Deal Management */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-blue-600" />
                  Deal Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">Pending AI Review</h4>
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                    {analytics?.pendingReview || 0} items
                  </Badge>
                </div>

                <div className="space-y-3">
                  {pendingLoading ? (
                    [...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Skeleton className="w-12 h-12 rounded-lg" />
                          <div>
                            <Skeleton className="w-48 h-4 mb-2" />
                            <Skeleton className="w-32 h-3" />
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Skeleton className="w-20 h-4" />
                          <Skeleton className="w-16 h-8" />
                          <Skeleton className="w-16 h-8" />
                        </div>
                      </div>
                    ))
                  ) : (pendingDeals && pendingDeals.length > 0) ? (
                    pendingDeals.map((deal: Deal) => (
                      <div key={deal.id} className="flex items-center justify-between bg-white p-4 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <img
                            src={deal.imageUrl || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&w=100&h=100&fit=crop"}
                            alt={deal.title}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div>
                            <h5 className="font-medium text-gray-900 line-clamp-1">{deal.title}</h5>
                            <p className="text-sm text-gray-600">Source: {deal.sourceApi || 'Manual'}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">
                            AI Score: {deal.aiScore ? parseFloat(deal.aiScore.toString()).toFixed(1) : 'N/A'}/10
                          </span>
                          <Button
                            onClick={() => approveMutation.mutate(deal.id)}
                            disabled={approveMutation.isPending}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => rejectMutation.mutate(deal.id)}
                            disabled={rejectMutation.isPending}
                            size="sm"
                            variant="destructive"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No pending deals to review</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t">
                  <Button
                    onClick={() => updatePopularityMutation.mutate()}
                    disabled={updatePopularityMutation.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Update Deal Popularity
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Configuration */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bot className="w-5 h-5 mr-2 text-green-600" />
                  AI Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Quality Thresholds</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum AI Score
                      </label>
                      <Slider
                        value={minAiScore}
                        onValueChange={setMinAiScore}
                        max={10}
                        min={0}
                        step={0.1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-gray-600 mt-1">
                        <span>0</span>
                        <span className="font-medium">{minAiScore[0]}</span>
                        <span>10</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Auto-Approve Score
                      </label>
                      <Slider
                        value={autoApproveScore}
                        onValueChange={setAutoApproveScore}
                        max={10}
                        min={0}
                        step={0.1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-gray-600 mt-1">
                        <span>0</span>
                        <span className="font-medium">{autoApproveScore[0]}</span>
                        <span>10</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">API Sources</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">TechDeals API</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Fashion Deals</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Home & Garden</span>
                      <Switch />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
