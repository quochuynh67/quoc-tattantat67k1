export const isZaloMiniApp = () => {
  return typeof window.zaloGetToken !== 'undefined' && window.zaloGetToken !== null;
};

export const isInsideIframe = () => {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
};

export const getCurrentLocation = (options = {}) => {
  return new Promise((resolve, reject) => {
    // Try Zalo SDK first (for Zalo mini app)
    if (typeof window.zmp !== 'undefined' && window.zmp.apis && window.zmp.apis.getLocation) {
      window.zmp.apis.getLocation({
        failAlways: false,
      }).then((location) => {
        resolve({
          latitude: location.latitude,
          longitude: location.longitude
        });
      }).catch((err) => {
        reject({
          code: err.code || 'zalo_error',
          message: getErrorMessage(err.code || 'zalo_error', true)
        });
      });
      return;
    }

    // Fallback to browser geolocation
    if (!navigator.geolocation) {
      reject({
        code: -1,
        message: getErrorMessage(-1)
      });
      return;
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      ...options
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        });
      },
      (err) => {
        reject({
          code: err.code,
          message: getErrorMessage(err.code)
        });
      },
      defaultOptions
    );
  });
};

export const getErrorMessage = (code, isZaloError = false) => {
  if (isZaloError) {
    return "Không thể lấy vị trí từ Zalo. Vui lòng kiểm tra quyền ứng dụng trong cài đặt Zalo.";
  }

  switch (code) {
    case 1: // PERMISSION_DENIED
      return "Bạn chưa cấp quyền truy cập GPS cho ứng dụng. Vui lòng cho phép trong cài đặt Zalo.";
    case 2: // POSITION_UNAVAILABLE
      return "Không thể xác định vị trí hiện tại. Vui lòng thử lại sau.";
    case 3: // TIMEOUT
      return "Quá thời gian chờ xác định vị trí. Vui lòng kiểm tra kết nối GPS.";
    case -1:
      return "Thiết bị không hỗ trợ GPS";
    default:
      return "Không thể lấy vị trí. Vui lòng thử lại.";
  }
};

export const openCurrentPageInNewTab = () => {
  window.open(window.location.href, "_blank");
};
