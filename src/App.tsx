import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { FeedbackProvider } from "@/contexts/FeedbackContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import ResetPassword from "./pages/ResetPassword";
import { ViewReportByToken } from "@/components/pages/ViewReportByToken";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <FeedbackProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
                 <HashRouter>
            <Routes>
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
              <Route path="/redefinir-senha/:token" element={<ResetPassword />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
                 </HashRouter>
        </TooltipProvider>
      </FeedbackProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
