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
