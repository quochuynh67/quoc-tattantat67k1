// src/pages/Home.jsx – homepage with placeholder sections
import React from "react";
import HeroSection from "../components/sections/HeroSection";
import NewsSection from "../components/sections/NewsSection";
import PlacesSection from "../components/sections/PlacesSection";
import FoodSection from "../components/sections/FoodSection";
import BeautyHealthSection from "../components/sections/BeautyHealthSection";
import AgricultureSection from "../components/sections/AgricultureSection";
import HealthSection from "../components/sections/HealthSection";
import VlogsMapSection from "../components/sections/VlogsMapSection";
import NewsletterCTA from "../components/sections/NewsletterCTA";
import AgentChatDashboard from "../components/AgentChatDashboard";

const Home = () => {
  return (
    <div className="home-page">
      <HeroSection />
      <NewsSection />
      <PlacesSection />
      <FoodSection />
      <BeautyHealthSection />
      <AgricultureSection />
      <HealthSection />
      <VlogsMapSection />
      <NewsletterCTA />
      <AgentChatDashboard />
    </div>
  );
};

export default Home;
