import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useAppContext } from "@/context/AppContext";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import CreateBucket from "./pages/CreateBucket";
import BucketDetail from "./pages/BucketDetail";
import NotFound from "./pages/NotFound";
import GenericPage from "./pages/GenericPage";

const queryClient = new QueryClient();

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
