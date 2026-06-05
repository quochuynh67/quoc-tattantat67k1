// src/pages/Home.jsx – homepage with placeholder sections
import React from "react";
import { Helmet } from "react-helmet-async";
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
import SEOIntroSection from "../components/sections/SEOIntroSection";

const Home = () => {
  return (
    <div className="home-page">
      <Helmet>
        <title>Tất tần tật Phú Tân – An Giang | Tin tức, Ẩm thực &amp; Khám phá 67K1</title>
        <meta
          name="description"
          content="Cổng thông tin địa phương An Giang – Phú Tân 67K1. Khám phá di tích lịch sử, hệ sinh thái rừng tràm trà sư, miếu bà chúa xứ núi sam, lăng thoại ngọc hầu, văn hóa và ẩm thực An Giang."
        />
      </Helmet>
      <HeroSection />
      <NewsSection />
      <PlacesSection />
      <FoodSection />
      <BeautyHealthSection />
      <AgricultureSection />
      <HealthSection />
      <VlogsMapSection />
      <SEOIntroSection />
      <NewsletterCTA />
      <AgentChatDashboard />
    </div>
  );
};

export default Home;
