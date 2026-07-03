export function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    accessToken: params.get('accessToken'),
    locationToken: params.get('locationToken'),
    lat: params.get('lat') ? parseFloat(params.get('lat')) : null,
    long: params.get('long') ? parseFloat(params.get('long')) : null,
    v: params.get('v'),
    map: params.get('map') === '1',
    allParams: Object.fromEntries(params),
  };
}

export function hasLocationParams() {
  const { lat, long } = getUrlParams();
  return !!(lat && long);
}

const ZALO_MINI_APP_ID = import.meta.env.VITE_ZALO_MINI_APP_ID || '3293420563489699112';

export function getZaloVlogShareUrl(vlogId) {
  return `https://zalo.me/s/${ZALO_MINI_APP_ID}?type=vlog&id=${vlogId}`;
}
