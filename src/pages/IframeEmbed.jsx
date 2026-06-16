import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Alert, Paper } from '@mui/material';
import IframeLoader from '../components/IframeLoader';
import { useUrlParams } from '../hooks/useUrlParams';
import { useLocation } from '../hooks/useLocation';
import { getUrlParams, hasTokens } from '../utils/urlParams';

export default function IframeEmbed() {
  const { locationToken, accessToken } = useUrlParams();
  const { locationData, loading, error } = useLocation();
  const [iframeUrl, setIframeUrl] = useState('');

  useEffect(() => {
    // Sử dụng URL từ prop nếu có, nếu không dùng mặc định
    // Change this URL to your actual iframe source
    const baseUrl = 'https://your-iframe-url.com/app';
    setIframeUrl(baseUrl);
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Iframe Embed with Tokens
        </Typography>

        {hasTokens() ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            ✓ Tokens detected in URL
          </Alert>
        ) : (
          <Alert severity="warning" sx={{ mb: 2 }}>
            No tokens found. Use URL: ?locationToken=xxx&accessToken=yyy
          </Alert>
        )}
      </Box>

      <Paper sx={{ p: 2, mb: 4, backgroundColor: '#f5f5f5' }}>
        <Typography variant="subtitle2" gutterBottom>
          Current URL Parameters:
        </Typography>
        <Typography variant="body2" component="pre" sx={{ overflow: 'auto' }}>
          {JSON.stringify(getUrlParams(), null, 2)}
        </Typography>
      </Paper>

      {loading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Fetching location data...
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error fetching location: {error}
        </Alert>
      )}

      {locationData && (
        <Paper sx={{ p: 2, mb: 4, backgroundColor: '#e8f5e9' }}>
          <Typography variant="subtitle2" gutterBottom>
            Location Data:
          </Typography>
          <Typography variant="body2" component="pre" sx={{ overflow: 'auto' }}>
            {JSON.stringify(locationData, null, 2)}
          </Typography>
        </Paper>
      )}

      <Paper sx={{ p: 3, height: '600px' }}>
        {iframeUrl ? (
          <IframeLoader src={iframeUrl} />
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#999',
            }}
          >
            <Typography>Loading iframe...</Typography>
          </Box>
        )}
      </Paper>

      <Box sx={{ mt: 4, p: 2, backgroundColor: '#f9f9f9', borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>
          How to use:
        </Typography>
        <Typography component="div" variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {`1. Access tokens from URL:
   const { locationToken, accessToken } = useUrlParams();

2. Or use utility function:
   import { getUrlParams } from '@/utils/urlParams';
   const params = getUrlParams();

3. Use IframeLoader component:
   <IframeLoader src="https://your-app.com/embed" />
   (tokens are automatically passed)

4. Example URL:
   https://tattantat67k1.web.app/embed?locationToken=xxx&accessToken=yyy`}
        </Typography>
      </Box>
    </Container>
  );
}
