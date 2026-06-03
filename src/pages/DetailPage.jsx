// src/pages/DetailPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import { Box, Card, CardContent, CardMedia, Typography, Button } from "@mui/material";
import { supabase } from "../lib/supabaseClient";
import { DetailSkeleton } from "../components/CardSkeleton";

export default function DetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      const { data, error } = await supabase
        .from('content_items')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error || !data) {
        console.error(error || 'Item not found');
        setItem(null);
      } else {
        setItem(data);
      }
      setLoading(false);
    };
    fetchPost();
  }, [id]);

  if (loading) return <DetailSkeleton />;

  if (!item) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h5" color="text.secondary">
          Không tìm thấy mục với ID {id}
        </Typography>
        <Button component={RouterLink} to="/" variant="contained" sx={{ mt: 2 }}>
          Quay lại danh sách
        </Button>
      </Box>
    );
  }

  const getTitle = () => item.title || item.name || "Chi tiết";
  const getDescription = () => item.excerpt || item.description || item.content || "";

  return (
    <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
      <Card sx={{ maxWidth: 600 }}>
        {item.image && (
          <CardMedia component="img" image={item.image} alt={getTitle()} />
        )}
        <CardContent>
          <Typography variant="h4" gutterBottom>
            {getTitle()}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {getDescription()}
          </Typography>
          <Button component={RouterLink} to="/" variant="contained">
            Quay lại
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
