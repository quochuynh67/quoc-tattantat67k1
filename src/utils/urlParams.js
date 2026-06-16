/**
 * Get URL parameters from current location
 * Usage: const { locationToken, accessToken } = getUrlParams();
 */
export function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    locationToken: params.get('locationToken'),
    accessToken: params.get('accessToken'),
    allParams: Object.fromEntries(params),
  };
}

/**
 * Build URL with tokens
 * Usage: const url = buildUrlWithTokens('https://example.com/app', params);
 */
export function buildUrlWithTokens(baseUrl, params = {}) {
  const { locationToken, accessToken, allParams } = getUrlParams();
  const url = new URL(baseUrl, window.location.origin);

  const tokenParams = {
    locationToken,
    accessToken,
    ...allParams,
    ...params,
  };

  Object.entries(tokenParams).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}

/**
 * Check if tokens are present in URL
 */
export function hasTokens() {
  const { locationToken, accessToken } = getUrlParams();
  return !!(locationToken || accessToken);
}

/**
 * Fetch location data from Zalo using tokens
 * @param {string} accessToken - User access token
 * @param {string} code - Location token (code)
 * @returns {Promise<Object>} Location data from API
 */
export async function fetchLocationFromTokens(accessToken, code) {
  try {
    const response = await fetch(
      'https://qwgqgqdtgwkqcbosyqtl.supabase.co/functions/v1/zalo-location',
      {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer sb_publishable_v8c3BSG8zSmBYRwzG7mGgg_EK45Plrj',
          'apikey': 'sb_publishable_v8c3BSG8zSmBYRwzG7mGgg_EK45Plrj',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAccessToken: accessToken,
          code: code,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch location:', error);
    throw error;
  }
}
