// src/App.jsx – root component with routing and theme provider
import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "./hooks/useTheme";
import { AdminAuthProvider } from "./contexts/AdminAuthContext";
import { VlogCacheProvider } from "./contexts/VlogCacheContext";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import ScrollRestoration from "./components/ScrollRestoration";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";

// Eagerly loaded — rendered on every page (must stay mounted for state preservation)
import Home from "./pages/Home";
import VlogFeed from "./pages/VlogFeed";

// Route-level lazy chunks
const SectionList   = lazy(() => import("./pages/SectionList"));
const VlogReview    = lazy(() => import("./pages/VlogReview"));
const DetailPage    = lazy(() => import("./pages/DetailPage"));
const NotFound      = lazy(() => import("./pages/NotFound"));

// Admin — separate chunk, rarely visited
const AdminLogin    = lazy(() => import("./pages/AdminLogin"));
const AdminLayout   = lazy(() => import("./components/admin/AdminLayout"));
const AdminSections = lazy(() => import("./pages/admin/Sections"));
const AdminPosts    = lazy(() => import("./pages/admin/Posts"));
const AdminVlogs    = lazy(() => import("./pages/admin/Vlogs"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));

const AppLayout = () => {
  const location = useLocation();
  const isVlogFeed = location.pathname === "/vlogs";
  const isHome = location.pathname === "/";

  return (
    <>
      <ScrollRestoration />
      {!isVlogFeed && <Header />}
      <main style={{ minHeight: isVlogFeed ? "100vh" : "80vh" }}>
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
            <Route path="/news"          element={<SectionList sectionKey="news" />} />
            <Route path="/places"        element={<SectionList sectionKey="places" />} />
            <Route path="/food"          element={<SectionList sectionKey="food" />} />
            <Route path="/beauty-health" element={<SectionList sectionKey="beautyHealth" />} />
            <Route path="/agriculture"   element={<SectionList sectionKey="agriculture" />} />
            <Route path="/health"        element={<SectionList sectionKey="health" />} />
            {/* /vlogs is handled by always-mounted VlogFeed above — no Route needed */}
            <Route path="/vlogs"         element={null} />
            <Route path="/post-detail/:id" element={<VlogReview />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin/*" element={<ProtectedAdminRoute><AdminLayout /></ProtectedAdminRoute>}>
              <Route path="sections" element={<AdminSections />} />
              <Route path="posts"    element={<AdminPosts />} />
              <Route path="vlogs"    element={<AdminVlogs />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
            <Route path="/detail/:id" element={<DetailPage />} />
            <Route path="*"           element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      {!isVlogFeed && <Footer />}
    </>
  );
};

export default function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <AdminAuthProvider>
          <VlogCacheProvider>
            <Router>
              <AppLayout />
            </Router>
          </VlogCacheProvider>
        </AdminAuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}
