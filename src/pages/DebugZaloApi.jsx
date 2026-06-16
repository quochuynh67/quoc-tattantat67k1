import React, { useEffect } from 'react';
import { Container, Paper, Typography, Box, Alert, Code } from '@mui/material';

export default function DebugZaloApi() {
  useEffect(() => {
    // Log environment variables
    console.log('🔍 DEBUG: Environment Variables');
    console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');

    // Calculate endpoint
    const endpoint =
      import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL.includes('supabase')
        ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/zalo-location`
        : import.meta.env.VITE_BACKEND_URL || '/api/zalo-location';

    console.log('📍 Calculated Endpoint:', endpoint);

    // Test endpoint
    console.log('🧪 Testing endpoint...');
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
      },
      body: JSON.stringify({
        userAccessToken: 'test',
        code: 'test',
        secretKey: 'test',
      }),
    })
      .then((res) => {
        console.log('✅ Response Status:', res.status);
        return res.json();
      })
      .then((data) => {
        console.log('📦 Response Data:', data);
      })
      .catch((err) => {
        console.error('❌ Error:', err);
      });
  }, []);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const endpoint =
    supabaseUrl && supabaseUrl.includes('supabase')
      ? `${supabaseUrl}/functions/v1/zalo-location`
      : import.meta.env.VITE_BACKEND_URL || '/api/zalo-location';

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        🔍 Debug Zalo API Endpoint
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Open DevTools Console (F12) to see detailed logs
      </Alert>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Environment Variables
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="caption" color="primary">
              VITE_SUPABASE_URL
            </Typography>
            <Typography
              variant="body2"
              sx={{
                p: 1.5,
                bgcolor: '#f5f5f5',
                fontFamily: 'monospace',
                wordBreak: 'break-all',
              }}
            >
              {supabaseUrl || '❌ NOT SET'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="primary">
              VITE_SUPABASE_ANON_KEY
            </Typography>
            <Typography
              variant="body2"
              sx={{
                p: 1.5,
                bgcolor: '#f5f5f5',
                fontFamily: 'monospace',
              }}
            >
              {anonKey ? '✅ SET (' + anonKey.substring(0, 20) + '...)' : '❌ NOT SET'}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Calculated Endpoint
        </Typography>
        <Typography
          variant="body2"
          sx={{
            p: 2,
            bgcolor: '#e3f2fd',
            borderRadius: 1,
            fontFamily: 'monospace',
            wordBreak: 'break-all',
          }}
        >
          {endpoint}
        </Typography>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Expected Endpoint
        </Typography>
        <Typography
          variant="body2"
          sx={{
            p: 2,
            bgcolor: '#f5f5f5',
            borderRadius: 1,
            fontFamily: 'monospace',
            wordBreak: 'break-all',
          }}
        >
          https://qwgqgqdtgwkqcbosyqtl.supabase.co/functions/v1/zalo-location
        </Typography>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Status
        </Typography>
        {endpoint === 'https://qwgqgqdtgwkqcbosyqtl.supabase.co/functions/v1/zalo-location' ? (
          <Alert severity="success">✅ Endpoint is CORRECT</Alert>
        ) : (
          <Alert severity="error">❌ Endpoint is WRONG - Check .env.local</Alert>
        )}

        {!supabaseUrl && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            ⚠️ VITE_SUPABASE_URL is not set. Check .env.local file.
          </Alert>
        )}

        {!anonKey && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            ⚠️ VITE_SUPABASE_ANON_KEY is not set. Check .env.local file.
          </Alert>
        )}
      </Paper>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          .env.local Content
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
          Should contain:
        </Typography>
        <Box
          sx={{
            p: 2,
            bgcolor: '#f5f5f5',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            borderRadius: 1,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}
        >
{`VITE_SUPABASE_URL=https://qwgqgqdtgwkqcbosyqtl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...`}
        </Box>
      </Paper>
    </Container>
  );
}
