import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "../../contexts/AdminAuthContext";

export default function TradingLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, error: authError } = useAdminAuth();

  const from = location.state?.from?.pathname || "/trading";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    let success = false;
    if (isRegisterMode) {
      success = await register(email, password);
    } else {
      success = await login(email, password);
    }

    if (success) {
      navigate(from, { replace: true });
    } else {
      setPassword("");
      setError(authError || "Đăng nhập thất bại, vui lòng thử lại");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
            <i className="fas fa-leaf text-green-600 text-2xl"></i>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Rau Farm
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Đăng nhập để quản lý dữ liệu mua bán
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <i className="fas fa-exclamation-circle text-red-400"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error === "Invalid login credentials" ? "Email hoặc mật khẩu không đúng" : error}
                </p>
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email-address" className="sr-only">Email</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="Địa chỉ Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Mật khẩu</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center">
                  <i className="fas fa-circle-notch fa-spin mr-2"></i>
                  Đang xử lý...
                </span>
              ) : (
                isRegisterMode ? "Đăng ký" : "Đăng nhập"
              )}
            </button>
          </div>
          
          <div className="text-center mt-4">
            <button 
              type="button" 
              onClick={() => setIsRegisterMode(!isRegisterMode)}
              className="text-sm font-medium text-green-600 hover:text-green-500"
            >
              {isRegisterMode ? "Đã có tài khoản? Đăng nhập" : "Chưa có tài khoản? Đăng ký ngay"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
