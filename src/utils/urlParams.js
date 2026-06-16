export function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    accessToken: params.get('accessToken'),
    locationToken: params.get('locationToken'),
    lat: params.get('lat') ? parseFloat(params.get('lat')) : null,
    long: params.get('long') ? parseFloat(params.get('long')) : null,
    allParams: Object.fromEntries(params),
  };
}

export function hasLocationParams() {
  const { lat, long } = getUrlParams();
  return !!(lat && long);
}
