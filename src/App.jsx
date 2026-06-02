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

// Future pages (placeholders) – they will be added later
// import Article from "./pages/Article";
// import Place from "./pages/Place";
// import FoodReview from "./pages/FoodReview";
// import Agriculture from "./pages/Agriculture";
// import Health from "./pages/Health";
// import Search from "./pages/Search";

const AppLayout = () => {
  const location = useLocation();
  const isVlogFeed = location.pathname === "/vlogs";

  return (
    <>
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
          <Route path="/vlog/:id" element={<VlogReview />} />
          {/* Future routes */}
          {/* <Route path="/article/:slug" element={<Article />} /> */}
          {/* <Route path="/places" element={<Place />} /> */}
          {/* <Route path="/food" element={<FoodReview />} /> */}
          {/* <Route path="/agriculture" element={<Agriculture />} /> */}
          {/* <Route path="/health" element={<Health />} /> */}
          {/* <Route path="/search" element={<Search />} /> */}
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
