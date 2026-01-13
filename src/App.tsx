import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import PoliciaisPage from "./pages/PoliciaisPage";
import NovoPolicialPage from "./pages/NovoPolicialPage";
import EditarPolicialPage from "./pages/EditarPolicialPage";
import DetalhesPolicialPage from "./pages/DetalhesPolicialPage";
import AfastamentosPage from "./pages/AfastamentosPage";
import NovoAfastamentoPage from "./pages/NovoAfastamentoPage";
import AuditoriaPage from "./pages/AuditoriaPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/policiais" element={<PoliciaisPage />} />
            <Route path="/policiais/novo" element={<NovoPolicialPage />} />
            <Route path="/policiais/:id" element={<DetalhesPolicialPage />} />
            <Route path="/policiais/:id/editar" element={<EditarPolicialPage />} />
            <Route path="/afastamentos" element={<AfastamentosPage />} />
            <Route path="/afastamentos/novo" element={<NovoAfastamentoPage />} />
            <Route path="/auditoria" element={<AuditoriaPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
