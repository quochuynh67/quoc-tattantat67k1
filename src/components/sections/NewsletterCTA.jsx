// src/components/sections/NewsletterCTA.jsx
import React, { useEffect, useState } from "react";
import { Container, Typography, TextField, Button, Box, Paper, Alert } from "@mui/material";
import { mockNewsletter } from "../../mocks/data";
import { getNewsletterConfig, subscribeNewsletter } from "../../lib/phuTanApi";

const NewsletterCTA = () => {
  const [config, setConfig] = useState(mockNewsletter);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    let isMounted = true;
    getNewsletterConfig().then((data) => {
      if (isMounted) setConfig(data);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email.trim()) return;

    const { error } = await subscribeNewsletter(email.trim());
    if (error) {
      setStatus(error.code === "23505" ? "Email này đã được đăng ký." : "Chưa thể đăng ký, vui lòng thử lại sau.");
      return;
    }

    setEmail("");
    setStatus("Đăng ký nhận tin thành công.");
  };

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
            {config.title}
          </Typography>
          <Typography
            variant="body1"
            sx={{ fontFamily: "var(--font-body)", mb: 4, opacity: 0.9 }}
          >
            {config.description}
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
            onSubmit={handleSubmit}
          >
            <TextField
              variant="outlined"
              placeholder={config.placeholder}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
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
              type="submit"
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
          {status && (
            <Alert severity={status.includes("thành công") ? "success" : "warning"} sx={{ mt: 3, textAlign: "left" }}>
              {status}
            </Alert>
          )}
        </Paper>
      </Container>
    </section>
  );
};

export default NewsletterCTA;
