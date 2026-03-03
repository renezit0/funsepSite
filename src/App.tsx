import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { FeedbackProvider } from "@/contexts/FeedbackContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import { ViewReportByToken } from "@/components/pages/ViewReportByToken";
import { DesktopAdminEntry } from "@/components/desktop/DesktopAdminEntry";

const queryClient = new QueryClient();

const isDesktopApp = typeof window !== "undefined" && !!window.funsepDesktop;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <FeedbackProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <HashRouter>
            <Routes>
              {isDesktopApp ? (
                <>
                  <Route path="/admin" element={<DesktopAdminEntry />} />
                  <Route path="*" element={<Navigate to="/admin" replace />} />
                </>
              ) : (
                <>
                  <Route path="/" element={<Index />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/relatorio/:token" element={<ViewReportByToken />} />
                  <Route path="*" element={<NotFound />} />
                </>
              )}
            </Routes>
          </HashRouter>
        </TooltipProvider>
      </FeedbackProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
