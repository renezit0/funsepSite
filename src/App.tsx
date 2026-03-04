import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { FeedbackProvider } from "@/contexts/FeedbackContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import ResetPassword from "./pages/ResetPassword";
import { ViewReportByToken } from "@/components/pages/ViewReportByToken";
import { DesktopAdminEntry } from "@/components/desktop/DesktopAdminEntry";
import { Navigate } from "react-router-dom";

const queryClient = new QueryClient();

const isDesktopApp =
  typeof window !== "undefined" &&
  (Boolean(window.funsepDesktop) || window.location.protocol === "file:");
const AppRouter = isDesktopApp ? HashRouter : BrowserRouter;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <FeedbackProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppRouter>
            <Routes>
              {isDesktopApp ? (
                <>
                  <Route path="/admin" element={<DesktopAdminEntry />} />
                  <Route path="*" element={<Navigate to="/admin" replace />} />
                </>
              ) : (
                <>
                  <Route path="/" element={<Index />} />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute requireAdmin={true} allowedCargos={['GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS']}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/relatorio/:token" element={<ViewReportByToken />} />
                  <Route path="/valida-token" element={<Index />} />
                  <Route path="/redefinir-senha" element={<ResetPassword />} />
                  <Route path="/redefinir-senha/:token" element={<ResetPassword />} />
                  <Route path="*" element={<NotFound />} />
                </>
              )}
            </Routes>
          </AppRouter>
        </TooltipProvider>
      </FeedbackProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
