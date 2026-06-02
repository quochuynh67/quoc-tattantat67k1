// src/components/sections/HeroSection.jsx
import React from "react";
import { Box, Typography, Button, Container } from "@mui/material";
import { mockHero } from "../../mocks/data";

const HeroSection = () => (
  <Box
    sx={{
      position: 'relative',
      color: '#fff',
      mb: 4,
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundImage: `url(${mockHero.image})`,
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center'
    }}
  >
    {/* Overlay for better text readability */}
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        right: 0,
        left: 0,
        backgroundColor: 'rgba(0,0,0,.58)',
      }}
    />
    <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
      <Typography
        component="h1"
        variant="h2"
        gutterBottom
        sx={{
          fontFamily: "var(--font-display)",
          fontWeight: 'bold',
          color: '#fff',
          textShadow: '0 2px 12px rgba(0,0,0,0.65)',
        }}
      >
        {mockHero.title}
      </Typography>
      <Typography
        variant="h5"
        paragraph
        sx={{
          fontFamily: "var(--font-body)",
          mb: 3,
          color: '#fff',
          textShadow: '0 2px 10px rgba(0,0,0,0.65)',
        }}
      >
        {mockHero.subtitle}
      </Typography>
      <Typography
        variant="body1"
        paragraph
        sx={{
          fontFamily: "var(--font-body)",
          mb: 4,
          color: '#fff',
          fontWeight: 500,
          textShadow: '0 2px 10px rgba(0,0,0,0.75)',
        }}
      >
        {mockHero.description}
      </Typography>
      <Button variant="contained" color="secondary" size="large" sx={{ fontFamily: "var(--font-body)", fontWeight: 'bold' }}>
        Khám phá ngay
      </Button>
    </Container>
  </Box>
);

export default HeroSection;
