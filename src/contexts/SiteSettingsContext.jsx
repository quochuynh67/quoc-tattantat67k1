import React, { createContext, useContext, useEffect, useState } from "react";
import { getFeatureFlags } from "../lib/phuTanApi";
import { getSections } from "../lib/supabaseClient";

const FALLBACK_SLUGS = ["news", "places", "food", "beautyHealth", "agriculture", "health"];

const SiteSettingsContext = createContext({
  canChatWithAi: false,
  canExplore: false,
  showOtherTab: true,
  visibleSectionSlugs: null,
  // Ordered array of visible sections from DB: [{id, slug, title, description, sort_order}]
  orderedSections: null,
});

export const useSiteSettings = () => useContext(SiteSettingsContext);

export const SiteSettingsProvider = ({ children }) => {
  const [flags, setFlags] = useState({
    canChatWithAi: false,
    canExplore: false,
    showOtherTab: false,
    visibleSectionSlugs: null,
    orderedSections: null,
  });

  useEffect(() => {
    Promise.all([
      getFeatureFlags(),
      getSections(),
    ]).then(([f, sections]) => {
      const ordered = sections && sections.length > 0
        ? sections
        : FALLBACK_SLUGS.map((slug, i) => ({ slug, title: slug, sort_order: i }));

      setFlags({
        canChatWithAi: f.can_chat_with_ai,
        canExplore: f.can_explore,
        showOtherTab: f.show_other_tab,
        visibleSectionSlugs: new Set(ordered.map((s) => s.slug)),
        orderedSections: ordered,
      });
    }).catch(() => {
      const fallback = FALLBACK_SLUGS.map((slug, i) => ({ slug, title: slug, sort_order: i }));
      setFlags((prev) => ({
        ...prev,
        visibleSectionSlugs: new Set(FALLBACK_SLUGS),
        orderedSections: fallback,
      }));
    });
  }, []);

  return (
    <SiteSettingsContext.Provider value={flags}>
      {children}
    </SiteSettingsContext.Provider>
  );
};
