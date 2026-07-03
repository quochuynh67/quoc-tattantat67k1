// src/App.jsx – root component with routing and theme provider
import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, NavLink } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "./hooks/useTheme";
import { AdminAuthProvider } from "./contexts/AdminAuthContext";
import { VlogCacheProvider } from "./contexts/VlogCacheContext";
import { SiteSettingsProvider, useSiteSettings } from "./contexts/SiteSettingsContext";
import { ToastProvider } from "./contexts/ToastContext";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import ScrollRestoration from "./components/ScrollRestoration";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";

// Eagerly loaded — rendered on every page (must stay mounted for state preservation)
import Home from "./pages/Home";
import VlogFeed from "./pages/VlogFeed";

// Route-level lazy chunks
const SectionList = lazy(() => import("./pages/SectionList"));
const VlogReview = lazy(() => import("./pages/VlogReview"));
const DetailPage = lazy(() => import("./pages/DetailPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const GuestSubmit = lazy(() => import("./pages/GuestSubmit"));
const WishGenerator = lazy(() => import("./pages/WishGenerator"));
const MenuCreator   = lazy(() => import("./pages/MenuCreator"));
const PhotoRestore  = lazy(() => import("./pages/PhotoRestore"));

// Admin — separate chunk, rarely visited
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminSections = lazy(() => import("./pages/admin/Sections"));
const AdminPosts = lazy(() => import("./pages/admin/Posts"));
const AdminVlogs = lazy(() => import("./pages/admin/Vlogs"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminAiAgents = lazy(() => import("./pages/admin/AiAgents"));

// Trading module
const TradingLayout = lazy(() => import("./pages/trading/TradingLayout"));
const TradingDashboard = lazy(() => import("./pages/trading/Dashboard"));
const TradingFarmers = lazy(() => import("./pages/trading/Farmers"));
const TradingPurchases = lazy(() => import("./pages/trading/Purchases"));
const TradingSales = lazy(() => import("./pages/trading/Sales"));
const TradingCustomers = lazy(() => import("./pages/trading/Customers"));
const TradingProducts = lazy(() => import("./pages/trading/Products"));
const TradingLogin = lazy(() => import("./pages/trading/TradingLogin"));
const ProtectedTradingRoute = lazy(() => import("./components/trading/ProtectedTradingRoute"));

const AppLayout = () => {
  const location = useLocation();
  const { canChatWithAi } = useSiteSettings();
  const isVlogFeed = location.pathname === "/vlogs";
  const isHome = location.pathname === "/";
  const isTrading = location.pathname.startsWith("/trading");
  const isAdmin = location.pathname.startsWith("/admin");
  const showSubmitFab = !isTrading && !isAdmin && canChatWithAi;

  return (
    <>
      <ScrollRestoration />
      {!isVlogFeed && !isTrading && <Header />}
      {showSubmitFab && (
        <NavLink to="/submit" className="submit-fab-button" title="Đăng bài / video">
          ✍️
        </NavLink>
      )}
      <main style={{ minHeight: isVlogFeed || isTrading ? "100vh" : "80vh", padding: isTrading ? 0 : undefined }}>
        {/* Home: always mounted, hidden when not active */}
        <div style={{ display: isHome ? "block" : "none" }}>
          <Home />
        </div>

        {/* VlogFeed: always mounted to preserve video DOM state, hidden when not active */}
        <div style={{ display: isVlogFeed ? "block" : "none", position: isVlogFeed ? undefined : "fixed", top: isVlogFeed ? undefined : "-9999px", visibility: isVlogFeed ? undefined : "hidden" }}>
          <VlogFeed />
        </div>

        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={null} />
            <Route path="/news" element={<SectionList sectionKey="news" />} />
            <Route path="/places" element={<SectionList sectionKey="places" />} />
            <Route path="/food" element={<SectionList sectionKey="food" />} />
            <Route path="/beauty-health" element={<SectionList sectionKey="beautyHealth" />} />
            <Route path="/agriculture" element={<SectionList sectionKey="agriculture" />} />
            <Route path="/health" element={<SectionList sectionKey="health" />} />
            {/* /vlogs is handled by always-mounted VlogFeed above — no Route needed */}
            <Route path="/vlogs" element={null} />
            <Route path="/post-detail/:id" element={<VlogReview />} />
            <Route path="/submit" element={<GuestSubmit />} />
            <Route path="/wishes" element={<WishGenerator />} />
            <Route path="/menu"   element={<MenuCreator />} />
            <Route path="/photo-restore" element={<PhotoRestore />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin/*" element={<ProtectedAdminRoute><AdminLayout /></ProtectedAdminRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="sections" element={<AdminSections />} />
              <Route path="posts" element={<AdminPosts />} />
              <Route path="vlogs" element={<AdminVlogs />} />
              <Route path="ai-agents" element={<AdminAiAgents />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
            <Route path="/trading-login" element={<TradingLogin />} />
            <Route path="/trading" element={<ProtectedTradingRoute><TradingLayout /></ProtectedTradingRoute>}>
              <Route index element={<TradingDashboard />} />
              <Route path="farmers" element={<TradingFarmers />} />
              <Route path="purchases" element={<TradingPurchases />} />
              <Route path="sales" element={<TradingSales />} />
              <Route path="customers" element={<TradingCustomers />} />
              <Route path="products" element={<TradingProducts />} />
            </Route>
            <Route path="/detail/:id" element={<DetailPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      {!isVlogFeed && !isTrading && <Footer />}
    </>
  );
};

export default function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <ToastProvider>
          <SiteSettingsProvider>
            <AdminAuthProvider>
              <VlogCacheProvider>
                <Router>
                  <AppLayout />
                </Router>
              </VlogCacheProvider>
            </AdminAuthProvider>
          </SiteSettingsProvider>
        </ToastProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}
