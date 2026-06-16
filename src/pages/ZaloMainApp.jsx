import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Button,
  Divider,
} from '@mui/material';
import { useGlobalToast } from '../contexts/ToastContext';
import { getZaloLocation } from '../lib/zaloApi';

/**
 * Main Zalo Mini App Component
 * Automatically fetches user location from Zalo when page loads
 * Use this page for actual Zalo Mini App deployment
 */
export default function ZaloMainApp() {
  const toast = useGlobalToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    const initZaloApp = async () => {
      try {
        console.log('🚀 Zalo Mini App Started');
        console.log('📱 Getting Zalo credentials...');

        // Get Zalo SDK credentials
        // In real Zalo Mini App, use Zalo SDK to get these
        const userAccessToken = await getZaloAccessToken();
        const code = await getZaloAuthCode();
        const secretKey = import.meta.env.VITE_ZALO_SECRET_KEY || '';

        console.log('✅ Credentials obtained');
        console.log('📍 Fetching location from Zalo...');

        // Call our backend function
        const result = await getZaloLocation(userAccessToken, code, secretKey);

        if (result.success && result.data) {
          console.log('✅ Location fetched:', result.data);
          setLocation(result.data);
          toast.success(`Xin chào ${result.data.name}!`);
        } else {
          const errorMsg = result.error || 'Unknown error';
          console.error('❌ Error:', errorMsg);
          setError(errorMsg);

          if (errorMsg === 'GPS_PERMISSION_DENIED') {
            toast.error('❌ Bạn chưa cấp quyền GPS.\nVui lòng cho phép trong cài đặt Zalo.');
          } else {
            toast.error(`❌ Lỗi: ${errorMsg}`);
          }
        }
      } catch (err) {
        console.error('❌ Initialization Error:', err);
        setError(err.message);
        toast.error(`❌ ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    initZaloApp();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography>Đang lấy thông tin vị trí...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper sx={{ p: 3, textAlign: 'center', mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          🗺️ Ứng Dụng Zalo Mini App
        </Typography>
        <Divider sx={{ my: 2 }} />
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {location && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              👤 Thông Tin Người Dùng
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 2 }}>
              <Box>
                <Typography variant="caption" color="primary">
                  Tên
                </Typography>
                <Typography variant="body2">{location.name}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="primary">
                  Số Điện Thoại
                </Typography>
                <Typography variant="body2">{location.phone}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="primary">
                  Giới Tính
                </Typography>
                <Typography variant="body2">{location.gender || 'N/A'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="primary">
                  Ngày Sinh
                </Typography>
                <Typography variant="body2">{location.birthdate || 'N/A'}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {location && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📍 Vị Trí GPS
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 2 }}>
              <Box>
                <Typography variant="caption" color="primary">
                  Latitude (Vĩ độ)
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {location.latitude || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="primary">
                  Longitude (Kinh độ)
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {location.longitude || 'N/A'}
                </Typography>
              </Box>
            </Box>

            {location.latitude && location.longitude && (
              <Button
                variant="outlined"
                size="small"
                href={`https://maps.google.com/?q=${location.latitude},${location.longitude}`}
                target="_blank"
                sx={{ mt: 2 }}
              >
                📍 Xem trên Google Maps
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {location && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              ℹ️ Thông Tin Raw
            </Typography>
            <Box
              sx={{
                p: 1.5,
                bgcolor: '#f5f5f5',
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {JSON.stringify(location, null, 2)}
            </Box>
          </CardContent>
        </Card>
      )}

      <Paper sx={{ p: 3, mt: 3, bgcolor: '#f9f9f9' }}>
        <Typography variant="caption" display="block" gutterBottom>
          🔧 Debug Info
        </Typography>
        <Typography variant="body2">
          Endpoint: {import.meta.env.VITE_SUPABASE_URL}/functions/v1/zalo-location
        </Typography>
        <Typography variant="body2">Status: {loading ? 'Loading...' : error ? 'Error' : 'Success'}</Typography>
      </Paper>
    </Container>
  );
}

/**
 * Mock functions - Replace with real Zalo SDK calls
 * In real Zalo Mini App, use Zalo SDK methods
 */
async function getZaloAccessToken() {
  // In real Zalo Mini App:
  // return window.ZaloSDK.getAccessToken();

  // For testing, get from URL params or localStorage
  const params = new URLSearchParams(window.location.search);
  const token = params.get('userAccessToken') || localStorage.getItem('zalo_access_token');

  if (!token) {
    throw new Error('Zalo Access Token not found. Make sure Zalo SDK is initialized.');
  }

  return token;
}

async function getZaloAuthCode() {
  // In real Zalo Mini App:
  // return window.ZaloSDK.getAuthCode();

  const params = new URLSearchParams(window.location.search);
  const code = params.get('code') || localStorage.getItem('zalo_auth_code');

  if (!code) {
    throw new Error('Zalo Auth Code not found. Make sure user is authenticated.');
  }

  return code;
}
