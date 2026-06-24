// src/contexts/VlogCacheContext.jsx
// Persists vlog data + UI state so navigating to a detail page and
// pressing back does not trigger a new API fetch or lose scroll position.
import React, { createContext, useCallback, useContext, useRef, useState } from "react";
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

/**
 * Read ?v= from the URL and return the priority vlog ID, or null.
 * Reads window.location directly so it works outside React.
 */
const getPriorityVlogId = () => {
  try {
    return new URLSearchParams(window.location.search).get("v") || null;
  } catch {
    return null;
  }
};

export const VlogCacheProvider = ({ children }) => {
  // Cached data — set once, never cleared
  const [vlogs, setVlogs] = useState(null);          // null = not yet loaded
  const [newsItems, setNewsItems] = useState(null);
  const [loading, setLoading] = useState(false);

  // UI state that must survive navigation
  const [activeSpotByVlog, setActiveSpotByVlog] = useState({});
  // playingByVlog is intentionally NOT cached — it's ephemeral per-session
  // and caching it causes stale "playing" state that triggers duplicate playback
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

      let ordered = shuffleArray(vlogData);

      // If the page was opened with ?v=ID, move that vlog to index 0
      // so the user immediately sees the shared video at the top of the feed.
      const priorityId = getPriorityVlogId();
      if (priorityId) {
        const idx = ordered.findIndex((v) => String(v.id) === String(priorityId));
        if (idx > 0) {
          const [priority] = ordered.splice(idx, 1);
          ordered = [priority, ...ordered];
        }
      }

      setVlogs(ordered);
      setNewsItems(newsData);
    } finally {
      setLoading(false);
    }
  };

  const refreshVlogs = useCallback(async () => {
    setVlogs(null);
    setLoading(true);
    try {
      const [vlogData, newsData] = await Promise.all([
        getVlogReviews(),
        getSectionItems("news"),
      ]);
      setVlogs(shuffleArray(vlogData));
      setNewsItems(newsData);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Prepend a vlog to the top of the list (used when opening a shared URL).
   * If the vlog is already in the list, it is moved to position 0.
   */
  const prependVlog = useCallback((vlog) => {
    setVlogs((prev) => {
      if (!prev) return [vlog];
      const filtered = prev.filter((v) => String(v.id) !== String(vlog.id));
      return [vlog, ...filtered];
    });
  }, []);

  return (
    <VlogCacheContext.Provider
      value={{
        vlogs,
        newsItems,
        loading,
        ensureLoaded,
        refreshVlogs,
        prependVlog,
        activeSpotByVlog,
        setActiveSpotByVlog,
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
