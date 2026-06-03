// src/App.jsx – root component with routing and theme provider
import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "./hooks/useTheme";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import SectionList from "./pages/SectionList";
import VlogFeed from "./pages/VlogFeed";
import VlogReview from "./pages/VlogReview";
import NotFound from "./pages/NotFound";
import DetailPage from "./pages/DetailPage";
import ScrollRestoration from "./components/ScrollRestoration";
// Admin UI imports
import AdminLayout from "./components/admin/AdminLayout";
import AdminSections from "./pages/admin/Sections";
import AdminPosts from "./pages/admin/Posts";
import AdminVlogs from "./pages/admin/Vlogs";
import AdminSettings from "./pages/admin/Settings";

const AppLayout = () => {
  const location = useLocation();
  const isVlogFeed = location.pathname === "/vlogs";

  return (
    <>
      <ScrollRestoration />
      {!isVlogFeed && <Header />}
      <main style={{ minHeight: isVlogFeed ? "100vh" : "80vh" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/news" element={<SectionList sectionKey="news" />} />
          <Route path="/places" element={<SectionList sectionKey="places" />} />
          <Route path="/food" element={<SectionList sectionKey="food" />} />
          <Route path="/beauty-health" element={<SectionList sectionKey="beautyHealth" />} />
          <Route path="/agriculture" element={<SectionList sectionKey="agriculture" />} />
          <Route path="/health" element={<SectionList sectionKey="health" />} />
          <Route path="/vlogs" element={<VlogFeed />} />
          <Route path="/post-detail/:id" element={<VlogReview />} />
          <Route path="/admin/*" element={<AdminLayout />}>
            <Route path="sections" element={<AdminSections />} />
            <Route path="posts" element={<AdminPosts />} />
            <Route path="vlogs" element={<AdminVlogs />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
          {/* Future routes */}
          {/* <Route path="/article/:slug" element={<Article />} /> */}
          {/* <Route path="/places" element={<Place />} /> */}
          {/* <Route path="/food" element={<FoodReview />} /> */}
          {/* <Route path="/agriculture" element={<Agriculture />} /> */}
          {/* <Route path="/health" element={<Health />} /> */}
          {/* <Route path="/search" element={<Search />} /> */}
          <Route path="/detail/:id" element={<DetailPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isVlogFeed && <Footer />}
    </>
  );
};

export default function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <Router>
          <AppLayout />
        </Router>
      </ThemeProvider>
    </HelmetProvider>
  );
}
