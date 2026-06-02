// src/components/sections/NewsletterCTA.jsx
import React from "react";
import { Container, Typography, TextField, Button, Box, Paper } from "@mui/material";
import { mockNewsletter } from "../../mocks/data";

const NewsletterCTA = () => {
  return (
    <section style={{ padding: "var(--spacing-xl) 0" }}>
      <Container maxWidth="md">
        <Paper
          elevation={3}
          sx={{
            padding: "4rem 2rem",
            textAlign: "center",
            backgroundColor: "primary.main",
            color: "primary.contrastText",
            borderRadius: 4,
          }}
        >
          <Typography
            variant="h4"
            component="h2"
            gutterBottom
            sx={{ fontFamily: "var(--font-display)", fontWeight: 'bold' }}
          >
            {mockNewsletter.title}
          </Typography>
          <Typography
            variant="body1"
            sx={{ fontFamily: "var(--font-body)", mb: 4, opacity: 0.9 }}
          >
            {mockNewsletter.description}
          </Typography>
          <Box
            component="form"
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
              justifyContent: "center",
              alignItems: "center",
            }}
            noValidate
            autoComplete="off"
          >
            <TextField
              variant="outlined"
              placeholder={mockNewsletter.placeholder}
              sx={{
                width: { xs: "100%", sm: "400px" },
                backgroundColor: "background.paper",
                borderRadius: 1,
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { border: "none" },
                },
              }}
            />
            <Button
              variant="contained"
              color="secondary"
              size="large"
              sx={{
                padding: "0.9rem 2rem",
                fontFamily: "var(--font-body)",
                fontWeight: "bold",
                width: { xs: "100%", sm: "auto" }
              }}
            >
              Đăng ký
            </Button>
          </Box>
        </Paper>
      </Container>
    </section>
  );
};

export default NewsletterCTA;
