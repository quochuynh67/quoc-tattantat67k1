// src/components/sections/HeroSection.jsx
import React, { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Typography, Button, Container } from "@mui/material";
import { mockHero } from "../../mocks/data";
import { getHero } from "../../lib/phuTanApi";

const HeroSection = () => {
  const [hero, setHero] = useState(mockHero);

  useEffect(() => {
    let isMounted = true;
    getHero().then((data) => {
      if (isMounted) setHero(data);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Box
      sx={{
        position: 'relative',
        color: '#fff',
        mb: 4,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundImage: `url(${hero.image})`,
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center'
      }}
    >
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
        <Typography component="h1" variant="h2" gutterBottom sx={{ fontFamily: "var(--font-display)", fontWeight: 'bold', color: '#fff', textShadow: '0 2px 12px rgba(0,0,0,0.65)' }}>
          {hero.title}
        </Typography>
        <Typography variant="h5" paragraph sx={{ fontFamily: "var(--font-body)", mb: 3, color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.65)' }}>
          {hero.subtitle}
        </Typography>
        <Typography variant="body1" paragraph sx={{ fontFamily: "var(--font-body)", mb: 4, color: '#fff', fontWeight: 500, textShadow: '0 2px 10px rgba(0,0,0,0.75)' }}>
          {hero.description}
        </Typography>
        <Button component={RouterLink} to="/vlogs" variant="contained" color="secondary" size="large" sx={{ fontFamily: "var(--font-body)", fontWeight: 'bold' }}>
          Khám phá ngay
        </Button>
      </Container>
    </Box>
  );
};

export default HeroSection;
