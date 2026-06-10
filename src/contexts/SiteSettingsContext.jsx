import React, { createContext, useContext, useEffect, useState } from "react";
import { getFeatureFlags } from "../lib/phuTanApi";

const SiteSettingsContext = createContext({
  canChatWithAi: true,
  canExplore: true,
  showOtherTab: true,
});

export const useSiteSettings = () => useContext(SiteSettingsContext);

export const SiteSettingsProvider = ({ children }) => {
  const [flags, setFlags] = useState({
    canChatWithAi: true,
    canExplore: true,
    showOtherTab: true,
  });

  useEffect(() => {
    getFeatureFlags().then((f) => {
      setFlags({
        canChatWithAi: f.can_chat_with_ai,
        canExplore: f.can_explore,
        showOtherTab: f.show_other_tab,
      });
    });
  }, []);

  return (
    <SiteSettingsContext.Provider value={flags}>
      {children}
    </SiteSettingsContext.Provider>
  );
};
