import { useState, useEffect } from 'react';
import {
  getZaloLocation,
  getZaloCredentialsFromUrl,
  fetchZaloLocationFromUrl,
  extractLocationFromZaloResponse,
} from '../lib/zaloApi';

/**
 * Hook to fetch and manage Zalo location data
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoFetch - Auto fetch on mount (default: true)
 * @param {string} options.userAccessToken - Explicit token (overrides URL)
 * @param {string} options.code - Explicit auth code (overrides URL)
 * @param {string} options.secretKey - Explicit secret key (overrides URL)
 * @returns {Object} Location state and functions
 */
export function useZaloLocation(options = {}) {
  const { autoFetch = true, userAccessToken, code, secretKey } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);
  const [rawResponse, setRawResponse] = useState(null);

  const fetchLocation = async (tokenOverride, codeOverride, secretOverride) => {
    try {
      setLoading(true);
      setError(null);

      const token = tokenOverride || userAccessToken;
      const authCode = codeOverride || code;
      const secret = secretOverride || secretKey;

      if (!token || !authCode || !secret) {
        const urlCreds = getZaloCredentialsFromUrl();
        if (!urlCreds.userAccessToken || !urlCreds.code || !urlCreds.secretKey) {
          throw new Error(
            'Missing Zalo credentials. Provide via props or URL parameters'
          );
        }
      }

      const response = await getZaloLocation(
        token || getZaloCredentialsFromUrl().userAccessToken,
        authCode || getZaloCredentialsFromUrl().code,
        secret || getZaloCredentialsFromUrl().secretKey
      );

      if (response.success) {
        const extractedLocation = extractLocationFromZaloResponse(response);
        setLocation(extractedLocation);
        setRawResponse(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch location');
      }
    } catch (err) {
      setError(err.message);
      setLocation(null);
      console.error('useZaloLocation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => fetchLocation();

  useEffect(() => {
    if (autoFetch) {
      fetchLocation();
    }
  }, [autoFetch, userAccessToken, code, secretKey]);

  return {
    location,
    loading,
    error,
    rawResponse,
    refetch,
    hasLocation: !!location,
  };
}

/**
 * Hook for simple URL-based Zalo location fetching
 * @returns {Object} Location state and functions
 */
export function useZaloLocationFromUrl() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);

  const fetch = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchZaloLocationFromUrl();

      if (response.success) {
        const extractedLocation = extractLocationFromZaloResponse(response);
        setLocation(extractedLocation);
      } else {
        throw new Error(response.error);
      }
    } catch (err) {
      setError(err.message);
      setLocation(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  return {
    location,
    loading,
    error,
    refetch: fetch,
    hasLocation: !!location,
  };
}
