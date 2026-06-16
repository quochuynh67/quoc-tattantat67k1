import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Typography,
  Divider,
} from '@mui/material';

const FUNCTION_URL = 'https://qwgqgqdtgwkqcbosyqtl.supabase.co/functions/v1/zalo-location';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3Z3FncWR0Z3drcWNib3N5cXRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNTUxMzcsImV4cCI6MjA4NDczMTEzN30.zvmsRLxGTUsFCaQor-b-Rby7Rk3MX4f3RV8DCP1Wf70';

export default function ZaloFunctionTest() {
  const [credentials, setCredentials] = useState({
    userAccessToken: '',
    code: '',
    secretKey: '',
  });
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (field) => (e) => {
    setCredentials((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleTest = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      console.log('🧪 Testing Zalo Location Function');
      console.log('📍 URL:', FUNCTION_URL);
      console.log('📤 Sending:', credentials);

      const res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`,
        },
        body: JSON.stringify(credentials),
      });

      console.log('📨 Response Status:', res.status);

      const data = await res.json();
      console.log('📦 Response Data:', data);

      if (res.ok && data.success) {
        setResponse(data);
        console.log('✅ Success:', data);
      } else {
        setError(data.error || 'Function returned error');
        console.log('❌ Error:', data);
      }
    } catch (err) {
      setError(`Network Error: ${err.message}`);
      console.error('❌ Network Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        🧪 Test Zalo Location Function
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Function URL
        </Typography>
        <Typography
          variant="body2"
          sx={{
            p: 2,
            bgcolor: '#f5f5f5',
            borderRadius: 1,
            fontFamily: 'monospace',
            overflow: 'auto',
            wordBreak: 'break-all',
          }}
        >
          {FUNCTION_URL}
        </Typography>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Test Credentials
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="User Access Token"
            placeholder="Paste Zalo userAccessToken here"
            fullWidth
            value={credentials.userAccessToken}
            onChange={handleChange('userAccessToken')}
            multiline
            rows={2}
          />
          <TextField
            label="Code"
            placeholder="Paste Zalo code here"
            fullWidth
            value={credentials.code}
            onChange={handleChange('code')}
            multiline
            rows={2}
          />
          <TextField
            label="Secret Key"
            placeholder="Paste Zalo secretKey here"
            fullWidth
            type="password"
            value={credentials.secretKey}
            onChange={handleChange('secretKey')}
            multiline
            rows={2}
          />
          <Button
            variant="contained"
            onClick={handleTest}
            disabled={loading || !credentials.userAccessToken || !credentials.code || !credentials.secretKey}
            sx={{ alignSelf: 'flex-start' }}
          >
            {loading ? <CircularProgress size={24} sx={{ mr: 1 }} /> : null}
            {loading ? 'Testing...' : 'Test Function'}
          </Button>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            ❌ Error
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
            {error}
          </Typography>
        </Alert>
      )}

      {response && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            ✅ Success
          </Typography>
          <Box
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              bgcolor: '#f5f5f5',
              p: 2,
              borderRadius: 1,
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {JSON.stringify(response, null, 2)}
          </Box>
        </Alert>
      )}

      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Response Data
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body2" color="textSecondary" paragraph>
            If successful, the response will include:
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box>
              <Typography variant="caption" color="primary">
                userId
              </Typography>
              <Typography variant="body2">User Zalo ID</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="primary">
                name
              </Typography>
              <Typography variant="body2">Full name</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="primary">
                phone
              </Typography>
              <Typography variant="body2">Phone number</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="primary">
                latitude
              </Typography>
              <Typography variant="body2">GPS latitude</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="primary">
                longitude
              </Typography>
              <Typography variant="body2">GPS longitude</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="primary">
                avatar
              </Typography>
              <Typography variant="body2">Avatar URL</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
