import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  CircularProgress,
  TextField,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import { useZaloLocation, useZaloLocationFromUrl } from '../hooks/useZaloLocation';
import { getZaloCredentialsFromUrl } from '../lib/zaloApi';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';
import { logUrlParams, logZaloLocation, logError } from '../utils/debugLog';

export default function ZaloLocation() {
  const { location, loading, error, refetch: refetchUrl } = useZaloLocationFromUrl();
  const [manualMode, setManualMode] = useState(false);
  const [credentials, setCredentials] = useState({
    userAccessToken: '',
    code: '',
    secretKey: '',
  });

  const toast = useToast();

  const { location: manualLocation, loading: manualLoading, error: manualError, refetch: refetchManual } = useZaloLocation({
    autoFetch: false,
    userAccessToken: credentials.userAccessToken,
    code: credentials.code,
    secretKey: credentials.secretKey,
  });

  const urlCredentials = getZaloCredentialsFromUrl();
  const hasUrlCredentials = !!(urlCredentials.userAccessToken && urlCredentials.code && urlCredentials.secretKey);

  // Log URL params on mount
  useEffect(() => {
    logUrlParams();
  }, []);

  // Log location data when available
  useEffect(() => {
    if (displayLocation) {
      logZaloLocation(displayLocation);
    }
  }, [displayLocation]);

  // Log errors when they occur
  useEffect(() => {
    if (displayError) {
      logError('Zalo Location Error', displayError);
    }
  }, [displayError]);

  const handleCredentialChange = (field, value) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleManualFetch = () => {
    if (!credentials.userAccessToken || !credentials.code || !credentials.secretKey) {
      toast.warning('Vui lòng điền đầy đủ các thông tin đăng nhập');
      return;
    }
    refetchManual();
  };

  const displayLocation = manualMode ? manualLocation : location;
  const displayLoading = manualMode ? manualLoading : loading;
  const displayError = manualMode ? manualError : error;

  // Show error toast when error occurs
  useEffect(() => {
    if (displayError) {
      const errorMessage = getErrorMessage(displayError);
      toast.error(errorMessage, 5000);
    }
  }, [displayError]);

  const getErrorMessage = (error) => {
    if (!error) return '';

    const errorText = error.toLowerCase();

    // GPS Permission Error
    if (errorText.includes('gps_permission_denied') || errorText.includes('gps') || errorText.includes('location') || errorText.includes('permission')) {
      return '❌ Bạn chưa cấp quyền truy cập GPS cho ứng dụng.\nVui lòng cho phép trong cài đặt Zalo.';
    }

    // Unauthorized
    if (errorText.includes('401') || errorText.includes('unauthorized')) {
      return '❌ Thông tin đăng nhập không hợp lệ hoặc đã hết hạn.';
    }

    // Forbidden
    if (errorText.includes('403') || errorText.includes('forbidden')) {
      return '❌ Bạn không có quyền truy cập tài nguyên này.';
    }

    // Missing Credentials
    if (errorText.includes('missing') || errorText.includes('required')) {
      return '❌ Thiếu thông tin đăng nhập cần thiết.';
    }

    // Network Error
    if (errorText.includes('network') || errorText.includes('fetch')) {
      return '❌ Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.';
    }

    return `❌ Lỗi: ${error}`;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Zalo Mini App Location Service
      </Typography>

      {/* Mode Selection */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f5f5f5' }}>
        <Typography variant="h6" gutterBottom>
          Choose Mode:
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant={!manualMode ? 'contained' : 'outlined'}
            onClick={() => setManualMode(false)}
            disabled={!hasUrlCredentials}
          >
            URL Parameters {hasUrlCredentials ? '✓' : '✗'}
          </Button>
          <Button
            variant={manualMode ? 'contained' : 'outlined'}
            onClick={() => setManualMode(true)}
          >
            Manual Input
          </Button>
        </Box>
      </Paper>

      {/* URL Parameters Mode */}
      {!manualMode && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            URL Parameters Mode
          </Typography>
          {hasUrlCredentials ? (
            <>
              <Alert severity="success" sx={{ mb: 2 }}>
                ✓ Zalo credentials detected in URL
              </Alert>
              <Typography variant="body2" sx={{ mb: 2, fontFamily: 'monospace' }}>
                <strong>Detected Credentials:</strong>
                <br />
                userAccessToken: {urlCredentials.userAccessToken.substring(0, 20)}...
                <br />
                code: {urlCredentials.code.substring(0, 20)}...
                <br />
                secretKey: {urlCredentials.secretKey.substring(0, 20)}...
              </Typography>
            </>
          ) : (
            <Alert severity="warning">
              No Zalo credentials in URL. Use:
              <br />
              ?userAccessToken=xxx&code=yyy&secretKey=zzz
              <br />
              or
              <br />
              ?accessToken=xxx&authCode=yyy&zaloSecretKey=zzz
            </Alert>
          )}
        </Paper>
      )}

      {/* Manual Input Mode */}
      {manualMode && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Manual Credential Input
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
            <TextField
              label="User Access Token"
              placeholder="Enter user access token"
              fullWidth
              value={credentials.userAccessToken}
              onChange={(e) => handleCredentialChange('userAccessToken', e.target.value)}
              size="small"
            />
            <TextField
              label="Auth Code"
              placeholder="Enter auth code"
              fullWidth
              value={credentials.code}
              onChange={(e) => handleCredentialChange('code', e.target.value)}
              size="small"
            />
            <TextField
              label="Secret Key"
              placeholder="Enter secret key"
              fullWidth
              type="password"
              value={credentials.secretKey}
              onChange={(e) => handleCredentialChange('secretKey', e.target.value)}
              size="small"
            />
          </Box>
          <Button
            variant="contained"
            onClick={handleManualFetch}
            disabled={manualLoading}
            fullWidth
          >
            {manualLoading ? <CircularProgress size={24} /> : 'Fetch Location'}
          </Button>
        </Paper>
      )}

      {/* Loading State */}
      {displayLoading && (
        <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Đang tải dữ liệu vị trí...</Typography>
        </Paper>
      )}

      {/* Location Data */}
      {displayLocation && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Location Data
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      User ID
                    </Typography>
                    <Typography variant="body2">
                      {displayLocation.userId || 'N/A'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Name
                    </Typography>
                    <Typography variant="body2">
                      {displayLocation.name || 'N/A'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Phone
                    </Typography>
                    <Typography variant="body2">
                      {displayLocation.phone || 'N/A'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Gender
                    </Typography>
                    <Typography variant="body2">
                      {displayLocation.gender || 'N/A'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Birthdate
                    </Typography>
                    <Typography variant="body2">
                      {displayLocation.birthdate || 'N/A'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Avatar
                    </Typography>
                    <Typography variant="body2">
                      {displayLocation.avatar ? '✓ Available' : 'N/A'}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={manualMode ? refetchManual : refetchUrl}
                  >
                    Refresh
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Documentation */}
      <Paper sx={{ p: 3, backgroundColor: '#f9f9f9' }}>
        <Typography variant="h6" gutterBottom>
          Usage Guide
        </Typography>
        <Typography component="div" variant="body2" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.85rem' }}>
          {`// Using URL parameters (automatic)
import { useZaloLocationFromUrl } from '@/hooks/useZaloLocation';

function Component() {
  const { location, loading, error } = useZaloLocationFromUrl();
  return <div>{location?.name}</div>;
}

// Using manual credentials
import { useZaloLocation } from '@/hooks/useZaloLocation';

function Component() {
  const { location, loading, error, refetch } = useZaloLocation({
    autoFetch: true,
    userAccessToken: 'xxx',
    code: 'yyy',
    secretKey: 'zzz'
  });
  return <button onClick={refetch}>Refresh</button>;
}

// Direct function call
import { getZaloLocation } from '@/lib/zaloApi';

const response = await getZaloLocation(token, code, secret);

// Example URL
https://tattantat67k1.web.app/zalo-location?userAccessToken=xxx&code=yyy&secretKey=zzz`}
        </Typography>
      </Paper>

      {/* Toast Notification */}
      <Toast
        open={toast.open}
        onClose={toast.close}
        message={toast.message}
        type={toast.type}
        position="top-center"
        duration={toast.duration}
      />
    </Container>
  );
}
