import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useAppContext } from "@/context/AppContext";
import { ApiException } from "@/lib/api";
import { toast } from "sonner";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import CreateBucket from "./pages/CreateBucket";
import BucketDetail from "./pages/BucketDetail";
import NotFound from "./pages/NotFound";
import GenericPage from "./pages/GenericPage";

// Create QueryClient with global error handling
const createQueryClient = (logout: () => void) => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          // Don't retry on 401 (unauthorized) errors
          if (error instanceof ApiException && error.status === 401) {
            return false;
          }
          return failureCount < 2;
        },
        onError: (error) => {
          // Handle 401 errors globally - logout user
          if (error instanceof ApiException && error.status === 401) {
            logout();
            toast.error("Session expired. Please login again.");
          }
        },
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 5 * 60 * 1000, // 5 minutes
      },
      mutations: {
        onError: (error) => {
          // Handle 401 errors globally - logout user
          if (error instanceof ApiException && error.status === 401) {
            logout();
            toast.error("Session expired. Please login again.");
          }
        },
      },
    },
  });
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAppContext();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAppContext();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/create-bucket" element={<ProtectedRoute><CreateBucket /></ProtectedRoute>} />
      <Route path="/bucket/:bucketId" element={<ProtectedRoute><BucketDetail /></ProtectedRoute>} />

      {/* Sidebar Pages */}
      <Route path="/directory-buckets" element={<ProtectedRoute><GenericPage title="Directory buckets" /></ProtectedRoute>} />
      <Route path="/table-buckets" element={<ProtectedRoute><GenericPage title="Table buckets" /></ProtectedRoute>} />
      <Route path="/access-points" element={<ProtectedRoute><GenericPage title="Access Points" /></ProtectedRoute>} />
      <Route path="/access-grants" element={<ProtectedRoute><GenericPage title="Access Grants" /></ProtectedRoute>} />
      <Route path="/iam-access-analyzer" element={<ProtectedRoute><GenericPage title="IAM Access Analyzer" /></ProtectedRoute>} />
      <Route path="/storage-lens" element={<ProtectedRoute><GenericPage title="Storage Lens" /></ProtectedRoute>} />
      <Route path="/batch-operations" element={<ProtectedRoute><GenericPage title="Batch Operations" /></ProtectedRoute>} />

      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const AppContent = () => {
  const { logout, user } = useAppContext();
  const [queryClient] = React.useState(() => createQueryClient(logout));
  
  // Clear cache when user logs out
  React.useEffect(() => {
    if (!user) {
      queryClient.clear();
    }
  }, [user, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <AppProvider>
      <AppContent />
    </AppProvider>
  </TooltipProvider>
);

export default App;
