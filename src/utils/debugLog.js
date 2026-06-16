/**
 * Debug logging utilities
 */

export function logUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const locationToken = params.get('locationToken');
  const accessToken = params.get('accessToken');
  const userAccessToken = params.get('userAccessToken');
  const code = params.get('code');
  const secretKey = params.get('secretKey');

  console.group('📍 URL Parameters');
  console.log('URL:', window.location.href);
  console.log('---');
  console.log('locationToken:', locationToken);
  console.log('accessToken:', accessToken);
  console.log('---');
  console.log('userAccessToken (Zalo):', userAccessToken);
  console.log('code (Zalo):', code);
  console.log('secretKey (Zalo):', secretKey);
  console.log('---');
  console.log('Full Params:', Object.fromEntries(params));
  console.groupEnd();

  return {
    locationToken,
    accessToken,
    userAccessToken,
    code,
    secretKey,
  };
}

export function logZaloLocation(location) {
  if (!location) {
    console.warn('❌ Zalo Location is null');
    return;
  }

  console.group('👤 Zalo User Location');
  console.log('Name:', location.name);
  console.log('Phone:', location.phone);
  console.log('User ID:', location.userId);
  console.log('Gender:', location.gender);
  console.log('Birthdate:', location.birthdate);
  console.log('Avatar:', location.avatar);
  console.log('Full Object:', location);
  console.groupEnd();
}

export function logError(title, error) {
  console.group(`❌ ${title}`);
  console.error('Error:', error);
  console.groupEnd();
}

export function logSuccess(title, data) {
  console.group(`✅ ${title}`);
  console.log('Data:', data);
  console.groupEnd();
}
