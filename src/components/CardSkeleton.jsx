import React from "react";
import { Box, Card, CardContent, Skeleton } from "@mui/material";

const GRID_SX = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" },
  gap: 4,
  alignItems: "stretch",
};

export function CardSkeleton({ imageHeight = 200, hasRating = false, hasChip = false }) {
  return (
    <Card elevation={2} sx={{ height: "100%", minHeight: 350, display: "flex", flexDirection: "column", borderRadius: 2, overflow: "hidden", backgroundColor: "var(--color-surface)" }}>
      <Skeleton variant="rectangular" height={imageHeight} animation="wave" />
      <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 1 }}>
        {hasChip && <Skeleton variant="rounded" width={80} height={24} animation="wave" />}
        <Skeleton variant="text" width="85%" sx={{ fontSize: "1.25rem" }} animation="wave" />
        <Skeleton variant="text" width="95%" animation="wave" />
        <Skeleton variant="text" width="80%" animation="wave" />
        <Skeleton variant="text" width="60%" animation="wave" />
        {hasRating && <Skeleton variant="rounded" width={120} height={20} animation="wave" sx={{ mt: "auto" }} />}
      </CardContent>
    </Card>
  );
}

export function CardSkeletonGrid({ count = 4, imageHeight = 200, hasRating = false, hasChip = false }) {
  return (
    <Box sx={GRID_SX}>
      {Array.from({ length: count }).map((_, i) => (
        <Box key={i} sx={{ minWidth: 0 }}>
          <CardSkeleton imageHeight={imageHeight} hasRating={hasRating} hasChip={hasChip} />
        </Box>
      ))}
    </Box>
  );
}

export function AlertSkeleton({ count = 4 }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant="rounded" height={80} animation="wave" />
      ))}
    </Box>
  );
}

export function DetailSkeleton() {
  return (
    <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
      <Card sx={{ maxWidth: 600, width: "100%" }}>
        <Skeleton variant="rectangular" height={340} animation="wave" />
        <CardContent>
          <Skeleton variant="text" width="70%" sx={{ fontSize: "2rem" }} animation="wave" />
          <Skeleton variant="text" width="100%" animation="wave" />
          <Skeleton variant="text" width="95%" animation="wave" />
          <Skeleton variant="text" width="85%" animation="wave" />
          <Skeleton variant="text" width="60%" animation="wave" />
          <Skeleton variant="rounded" width={120} height={36} animation="wave" sx={{ mt: 2 }} />
        </CardContent>
      </Card>
    </Box>
  );
}
