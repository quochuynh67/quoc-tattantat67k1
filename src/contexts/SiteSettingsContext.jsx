import React, { createContext, useContext, useEffect, useState } from "react";
import { getFeatureFlags } from "../lib/phuTanApi";

const SiteSettingsContext = createContext({
  canChatWithAi: false,
  canExplore: false,
  showOtherTab: true,
});

export const useSiteSettings = () => useContext(SiteSettingsContext);

export const SiteSettingsProvider = ({ children }) => {
  const [flags, setFlags] = useState({
    canChatWithAi: false,
    canExplore: false,
    showOtherTab: false,
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
