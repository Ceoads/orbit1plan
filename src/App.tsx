import { OrbitSpinner as Loader2 } from "@/components/ui/orbit-spinner";
import { lazy, Suspense } from "react";
import { ConfirmHost } from "@/components/ConfirmHost";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
const AuthPage = lazy(() => import("./pages/AuthPage"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const CourseHubPage = lazy(() => import("./pages/CourseHubPage").then((m) => ({ default: m.CourseHubPage })));
const StudyHubPage = lazy(() => import("./pages/StudyHubPage").then((m) => ({ default: m.StudyHubPage })));
const NotFound = lazy(() => import("./pages/NotFound"));
const GoogleDriveReturn = lazy(() => import("./pages/GoogleDriveReturn"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const UnsubscribePage = lazy(() => import("./pages/UnsubscribePage"));
const OAuthConsent = lazy(() => import("./pages/OAuthConsent"));
const DeleteAccountPage = lazy(() => import("./pages/DeleteAccountPage"));
import { CookieConsent } from "./components/CookieConsent";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { safeNext } from "./lib/safeNext";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false, retry: 1 } },
});

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen mesh-background flex items-center justify-center">
        <Loader2 className="w-8 h-8" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/landing" replace />;
  }
  
  return <>{children}</>;
};

// Public route that redirects authenticated users
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen mesh-background flex items-center justify-center">
        <Loader2 className="w-8 h-8" />
      </div>
    );
  }
  
  // Don't redirect authenticated users from auth page
  // Let them proceed if they intentionally visit /auth
  if (user) {
    return <Navigate to={safeNext(new URLSearchParams(window.location.search).get("next"))} replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Suspense fallback={<div className="min-h-screen mesh-background flex items-center justify-center"><Loader2 className="w-10 h-10" /></div>}>
    <Routes>
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/unsubscribe" element={<UnsubscribePage />} />
      <Route path="/delete-account" element={<DeleteAccountPage />} />
      <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
      <Route path="/auth" element={
        <PublicRoute>
          <AuthPage />
        </PublicRoute>
      } />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/oauth/google-drive/return" element={<GoogleDriveReturn />} />
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
      <ConfirmHost />
      <ErrorBoundary>
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
            <CookieConsent />
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
