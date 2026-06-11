import React, { createContext, useContext, useEffect, useState } from "react";
import { getFeatureFlags } from "../lib/phuTanApi";
import { getSections } from "../lib/supabaseClient";

// All possible sections in display order
const ALL_SECTION_SLUGS = ["news", "places", "food", "beautyHealth", "agriculture", "health"];

const SiteSettingsContext = createContext({
  canChatWithAi: false,
  canExplore: false,
  showOtherTab: true,
  // Set of visible section slugs (hide=false); null = not loaded yet (show all)
  visibleSectionSlugs: null,
});

export const useSiteSettings = () => useContext(SiteSettingsContext);

export const SiteSettingsProvider = ({ children }) => {
  const [flags, setFlags] = useState({
    canChatWithAi: false,
    canExplore: false,
    showOtherTab: false,
    visibleSectionSlugs: null, // null = loading, show all as fallback
  });

  useEffect(() => {
    Promise.all([
      getFeatureFlags(),
      getSections(), // already filters neq('hide', true)
    ]).then(([f, sections]) => {
      // Build set of visible slugs; fallback to all if fetch returns nothing
      const slugSet =
        sections && sections.length > 0
          ? new Set(sections.map((s) => s.slug))
          : new Set(ALL_SECTION_SLUGS);

      setFlags({
        canChatWithAi: f.can_chat_with_ai,
        canExplore: f.can_explore,
        showOtherTab: f.show_other_tab,
        visibleSectionSlugs: slugSet,
      });
    }).catch(() => {
      // On error: keep defaults, show all sections
      setFlags((prev) => ({ ...prev, visibleSectionSlugs: new Set(ALL_SECTION_SLUGS) }));
    });
  }, []);

  return (
    <SiteSettingsContext.Provider value={flags}>
      {children}
    </SiteSettingsContext.Provider>
  );
};
