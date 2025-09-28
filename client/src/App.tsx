import { Route, Switch, Router } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Home from "@/pages/home";
import SimpleTest from "@/pages/simple-test";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/test" component={SimpleTest} />
          <Route component={NotFound} />
        </Switch>
      </Router>
    </QueryClientProvider>
  );
}

export default App;