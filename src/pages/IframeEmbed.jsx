import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Alert, Paper } from '@mui/material';
import IframeLoader from '../components/IframeLoader';
import { getUrlParams, hasLocationParams } from '../utils/urlParams';

export default function IframeEmbed() {
  const [iframeUrl, setIframeUrl] = useState('');

  useEffect(() => {
    const baseUrl = 'https://your-iframe-url.com/app';
    setIframeUrl(baseUrl);
  }, []);

  const params = getUrlParams();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Iframe Embed
        </Typography>

        {hasLocationParams() ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            ✓ Location params detected (lat: {params.lat}, long: {params.long})
          </Alert>
        ) : (
          <Alert severity="warning" sx={{ mb: 2 }}>
            No location params found. Use URL: ?lat=10.766765&long=106.726142
          </Alert>
        )}
      </Box>

      <Paper sx={{ p: 2, mb: 4, backgroundColor: '#f5f5f5' }}>
        <Typography variant="subtitle2" gutterBottom>
          Current URL Parameters:
        </Typography>
        <Typography variant="body2" component="pre" sx={{ overflow: 'auto' }}>
          {JSON.stringify(params, null, 2)}
        </Typography>
      </Paper>

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
    </Container>
  );
}
