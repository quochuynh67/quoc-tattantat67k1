// src/contexts/VlogCacheContext.jsx
// Persists vlog data + UI state so navigating to a detail page and
// pressing back does not trigger a new API fetch or lose scroll position.
import React, { createContext, useContext, useRef, useState } from "react";
import { getVlogReviews, getSectionItems } from "../lib/phuTanApi";

const VlogCacheContext = createContext(null);

/** Fisher-Yates shuffle — returns a new shuffled array. */
const shuffleArray = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const VlogCacheProvider = ({ children }) => {
  // Cached data — set once, never cleared
  const [vlogs, setVlogs] = useState(null);          // null = not yet loaded
  const [newsItems, setNewsItems] = useState(null);
  const [loading, setLoading] = useState(false);

  // UI state that must survive navigation
  const [activeSpotByVlog, setActiveSpotByVlog] = useState({});
  const [playingByVlog, setPlayingByVlog] = useState({});
  const [visibleVlogIdx, setVisibleVlogIdx] = useState(0);
  const [sheetHeight, setSheetHeight] = useState(null); // null = use default
  const [hasInteracted, setHasInteracted] = useState(false);

  // Scroll position (px) to restore on back
  const scrollTopRef = useRef(0);

  const ensureLoaded = async () => {
    if (vlogs !== null || loading) return;
    setLoading(true);
    try {
      const [vlogData, newsData] = await Promise.all([
        getVlogReviews(),
        getSectionItems("news"),
      ]);
      // Shuffle once on load — order is random each session but stable across navigation
      setVlogs(shuffleArray(vlogData));
      setNewsItems(newsData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <VlogCacheContext.Provider
      value={{
        vlogs,
        newsItems,
        loading,
        ensureLoaded,
        activeSpotByVlog,
        setActiveSpotByVlog,
        playingByVlog,
        setPlayingByVlog,
        visibleVlogIdx,
        setVisibleVlogIdx,
        sheetHeight,
        setSheetHeight,
        hasInteracted,
        setHasInteracted,
        scrollTopRef,
      }}
    >
      {children}
    </VlogCacheContext.Provider>
  );
};

export const useVlogCache = () => {
  const ctx = useContext(VlogCacheContext);
  if (!ctx) throw new Error("useVlogCache must be used within VlogCacheProvider");
  return ctx;
};
