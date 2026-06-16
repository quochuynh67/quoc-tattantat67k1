import React, { useEffect, useRef, useState } from 'react';
import { useUrlParams } from '../hooks/useUrlParams';
import { Box, CircularProgress, Alert } from '@mui/material';

export default function IframeLoader({ src, style = {}, ...props }) {
  const { locationToken, accessToken } = useUrlParams();
  const iframeRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!iframeRef.current) return;

    const iframe = iframeRef.current;

    if (!src) {
      setError('Iframe src is required');
      setIsLoading(false);
      return;
    }

    // Build iframe URL with tokens
    const url = new URL(src, window.location.origin);
    if (locationToken) {
      url.searchParams.set('locationToken', locationToken);
    }
    if (accessToken) {
      url.searchParams.set('accessToken', accessToken);
    }

    iframe.src = url.toString();
    setIsLoading(false);
  }, [src, locationToken, accessToken]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setError('Failed to load iframe');
    setIsLoading(false);
  };

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '400px',
        ...style,
      }}
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {isLoading && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            position: 'absolute',
            width: '100%',
            zIndex: 1,
          }}
        >
          <CircularProgress />
        </Box>
      )}
      <iframe
        ref={iframeRef}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: '8px',
          ...style,
        }}
        {...props}
      />
    </Box>
  );
}
