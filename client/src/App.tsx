import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import Home from "@/pages/home";
import DealDetail from "@/pages/deal-detail";
import CategoryPage from "@/pages/category";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import Blog from "@/pages/blog";
import BlogArticle from "@/pages/blog-article";
import AdminLogin from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin-dashboard";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsConditions from "@/pages/terms-conditions";
import AffiliateDisclosure from "@/pages/affiliate-disclosure";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/deals/:id" component={DealDetail} />
      <Route path="/category/:slug" component={CategoryPage} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/blog/:articleId" component={BlogArticle} />
      <Route path="/blog" component={Blog} />
      <Route path="/admin" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-conditions" component={TermsConditions} />
      <Route path="/affiliate-disclosure" component={AffiliateDisclosure} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
    </QueryClientProvider>
  );
}

export default App;
