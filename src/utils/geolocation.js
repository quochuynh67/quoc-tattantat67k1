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

// Message types for the postMessage bridge with the host app (Zalo Mini App shell)
// that embeds this site inside an <iframe>. The host listens for the request type
// and replies with the result type once it has resolved location via zmp-sdk.
export const LOCATION_BRIDGE_REQUEST_TYPE = "TATTANTAT_GET_CURRENT_LOCATION";
export const LOCATION_BRIDGE_RESULT_TYPE = "TATTANTAT_LOCATION_RESULT";

const LOCATION_BRIDGE_TIMEOUT_MS = 8000;

let bridgeRequestSeq = 0;

// Asks the parent frame (the Zalo Mini App shell) to resolve the user's current
// location via its native zmp-sdk getLocation(), since geolocation permission
// cannot be requested from inside a cross-origin iframe directly. If the parent
// doesn't reply within the timeout (e.g. we're embedded in a plain iframe that
// doesn't implement this bridge), the caller should fall back to browser geolocation.
const requestLocationFromParent = () => {
  return new Promise((resolve, reject) => {
    const requestId = `loc_${Date.now()}_${bridgeRequestSeq++}`;

    console.debug("[geolocation] requesting location from parent frame", { requestId });

    let settled = false;

    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      clearTimeout(timer);
    };

    const onMessage = (event) => {
      const data = event.data;
      if (!data || data.type !== LOCATION_BRIDGE_RESULT_TYPE || data.requestId !== requestId) return;

      console.debug("[geolocation] received location result from parent frame", data);
      settled = true;
      cleanup();

      if (data.success) {
        resolve({ latitude: data.latitude, longitude: data.longitude });
      } else {
        reject({
          code: data.code || 1,
          message: data.message || getErrorMessage(1, true),
        });
      }
    };

    const timer = setTimeout(() => {
      if (settled) return;
      console.debug("[geolocation] parent frame did not respond in time, falling back", { requestId });
      cleanup();
      reject({ code: "TIMEOUT", message: "Parent frame did not respond" });
    }, LOCATION_BRIDGE_TIMEOUT_MS);

    window.addEventListener("message", onMessage);
    window.parent.postMessage({ type: LOCATION_BRIDGE_REQUEST_TYPE, requestId }, "*");
  });
};

const getBrowserLocation = (options = {}) => {
  return new Promise((resolve, reject) => {
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

export const getCurrentLocation = (options = {}) => {
  // Try Zalo SDK first (only true when running directly as a Zalo mini app page,
  // not when embedded cross-origin inside one — see requestLocationFromParent below
  // for that case).
  if (typeof window.zmp !== 'undefined' && window.zmp.apis && window.zmp.apis.getLocation) {
    return new Promise((resolve, reject) => {
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
    });
  }

  // Embedded cross-origin inside the Zalo Mini App shell's iframe: ask the parent
  // to resolve location on our behalf via a user-gesture-triggered permission dialog,
  // since the browser/webview won't let us prompt for permission ourselves here.
  if (isInsideIframe()) {
    return requestLocationFromParent().catch((err) => {
      if (err.code !== "TIMEOUT") throw err;
      return getBrowserLocation(options);
    });
  }

  return getBrowserLocation(options);
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
