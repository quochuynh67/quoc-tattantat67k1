// src/pages/DetailPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import { Box, Card, CardContent, CardMedia, Typography, Button } from "@mui/material";
import { supabase } from "../lib/supabaseClient";
import {
  mockNews,
  mockPlaces,
  mockFood,
  mockBeautyHealth,
  mockAgriculture,
  mockHealth,
} from "../mocks/data";

// Combine all mock items for fallback when no DB record is found
const allMockItems = [
  ...mockNews,
  ...mockPlaces,
  ...mockFood,
  ...mockBeautyHealth,
  ...mockAgriculture,
  ...mockHealth,
];


export default function DetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      const { data, error } = await supabase
        .from('content_items')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error || !data) {
        // Fallback to mock data if not found in DB
        const fallback = allMockItems.find((it) => String(it.id) === String(id));
        if (fallback) {
          setItem(fallback);
        } else {
          console.error(error || 'Item not found');
          setItem(null);
        }
      } else {
        setItem(data);
      }
    };
    fetchPost();
  }, [id]);

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

  const getTitle = () => {
    return item.title || item.name || "Chi tiết";
  };
  const getDescription = () => {
    return item.excerpt || item.description || item.content || "";
  };

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
