import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

// Lazy-loaded pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const CourseHubPage = lazy(() => import("./pages/CourseHubPage").then(m => ({ default: m.CourseHubPage })));
const StudyHubPage = lazy(() => import("./pages/StudyHubPage").then(m => ({ default: m.StudyHubPage })));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Shared loading spinner
const PageLoader = () => (
  <div className="min-h-screen mesh-background flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/landing" replace />;
  
  return <>{children}</>;
};

// Public route that redirects authenticated users
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <PageLoader />;
  if (user) return <Navigate to="/" replace />;
  
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/auth" element={
          <PublicRoute>
            <AuthPage />
          </PublicRoute>
        } />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/settings" element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } />
        <Route path="/" element={
          <ProtectedRoute>
            <Index />
          </ProtectedRoute>
        } />
        <Route path="/app" element={
          <ProtectedRoute>
            <Index />
          </ProtectedRoute>
        } />
        <Route path="/course/:eventId" element={
          <ProtectedRoute>
            <CourseHubPage />
          </ProtectedRoute>
        } />
        <Route path="/study/:fileId" element={
          <ProtectedRoute>
            <StudyHubPage />
          </ProtectedRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
