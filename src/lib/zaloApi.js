/**
 * Zalo Mini App API Service
 * Handles location data retrieval and authentication with Zalo
 * Calls backend endpoint for security (don't expose secrets on client)
 */

const BACKEND_ENDPOINT =
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL.includes('supabase')
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/zalo-location`
    : import.meta.env.VITE_BACKEND_URL || '/api/zalo-location';

/**
 * Get user location from Zalo Mini App via backend
 * @param {string} userAccessToken - Zalo user access token
 * @param {string} code - Zalo auth code
 * @param {string} secretKey - Zalo app secret key
 * @returns {Promise<Object>} User location and info
 */
export async function getZaloLocation(userAccessToken, code, secretKey) {
  try {
    console.log('📍 Calling backend endpoint:', BACKEND_ENDPOINT);

    const response = await fetch(BACKEND_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
      },
      body: JSON.stringify({
        userAccessToken,
        code,
        secretKey,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      const errorMsg = data.error || 'Unknown error';

      // Check for GPS permission error
      if (errorMsg === 'GPS_PERMISSION_DENIED' || errorMsg.toLowerCase().includes('gps') || errorMsg.toLowerCase().includes('permission')) {
        throw new Error('GPS_PERMISSION_DENIED');
      }

      throw new Error(errorMsg);
    }

    console.log('✅ Zalo location fetched:', data.data);

    return {
      success: true,
      data: data.data,
      rawData: data.rawData,
      statusCode: response.status,
    };
  } catch (error) {
    console.error('❌ Error fetching Zalo location:', error);
    return {
      success: false,
      error: error.message,
      statusCode: null,
    };
  }
}

/**
 * Extract Zalo credentials from URL parameters
 * @returns {Object} Zalo credentials from URL
 */
export function getZaloCredentialsFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return {
    userAccessToken: params.get('userAccessToken') || params.get('accessToken'),
    code: params.get('code') || params.get('authCode'),
    secretKey: params.get('secretKey') || params.get('zaloSecretKey'),
  };
}

/**
 * Fetch location with URL parameters
 * @returns {Promise<Object>} Location data
 */
export async function fetchZaloLocationFromUrl() {
  const creds = getZaloCredentialsFromUrl();

  if (!creds.userAccessToken || !creds.code || !creds.secretKey) {
    return {
      success: false,
      error: 'Missing Zalo credentials in URL. Provide: userAccessToken, code, secretKey',
    };
  }

  return getZaloLocation(creds.userAccessToken, creds.code, creds.secretKey);
}

/**
 * Build Zalo auth URL with location token
 * @param {string} locationToken - Location token to include
 * @returns {string} Full URL with tokens
 */
export function buildZaloAuthUrl(locationToken = null) {
  const params = new URLSearchParams(window.location.search);
  const baseUrl = window.location.origin;

  if (locationToken) {
    params.set('locationToken', locationToken);
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Validate Zalo API response
 * @param {Object} response - API response object
 * @returns {boolean} Is response valid
 */
export function isValidZaloResponse(response) {
  return response && response.success && response.data;
}

/**
 * Get location info from Zalo response
 * @param {Object} response - Zalo API response
 * @returns {Object|null} Location info or null
 */
export function extractLocationFromZaloResponse(response) {
  if (!isValidZaloResponse(response)) {
    return null;
  }

  const data = response.data;
  return {
    userId: data.id || null,
    name: data.name || null,
    avatar: data.avatar || null,
    phone: data.phone || null,
    birthdate: data.birthdate || null,
    gender: data.gender || null,
    // Add more fields as needed based on Zalo API response
  };
}
