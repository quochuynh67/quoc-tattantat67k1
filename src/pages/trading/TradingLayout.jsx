import React, { useState, Suspense } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import './Trading.css';

const TradingLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAdminAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/trading/login');
  };

  const getUserInitials = () => {
    if (!user?.email) return '?';
    return user.email.charAt(0).toUpperCase();
  };

  const getUserDisplayName = () => {
    if (!user?.email) return 'Người dùng';
    return user.email;
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const getPageTitle = () => {
    if (location.pathname === '/trading') return 'Dashboard';
    if (location.pathname.includes('purchases')) return 'Thu mua';
    if (location.pathname.includes('sales')) return 'Bán hàng';
    if (location.pathname.includes('farmers')) return 'Nông dân';
    if (location.pathname.includes('customers')) return 'Khách hàng';
    if (location.pathname.includes('products')) return 'Danh mục sản phẩm';
    return 'Quản lý';
  };

  return (
    <div className="trading-app pb-20 md:pb-0 min-h-screen">
      {/* Sidebar Overlay */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} 
        onClick={toggleSidebar}
      ></div>

      {/* Sidebar (Desktop) */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
              <i className="fas fa-leaf text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg m-0 leading-tight">Rau Củ Farm</h1>
              <p className="text-gray-400 text-xs m-0 mt-1">Quản lý thu mua & bán</p>
            </div>
          </div>
        </div>
        <nav className="px-4 space-y-2">
          <NavLink to="/trading" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
            <i className="fas fa-home w-5 text-center"></i>
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/trading/purchases" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
            <i className="fas fa-shopping-cart w-5 text-center"></i>
            <span>Thu mua</span>
          </NavLink>
          <NavLink to="/trading/sales" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
            <i className="fas fa-cash-register w-5 text-center"></i>
            <span>Bán hàng</span>
          </NavLink>
          <NavLink to="/trading/farmers" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
            <i className="fas fa-users w-5 text-center"></i>
            <span>Nông dân</span>
          </NavLink>
          <NavLink to="/trading/customers" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
            <i className="fas fa-user-tag w-5 text-center"></i>
            <span>Khách hàng</span>
          </NavLink>
          <div className="my-2 border-t border-gray-700"></div>
          <NavLink to="/trading/products" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
            <i className="fas fa-seedling w-5 text-center"></i>
            <span>Danh mục rau</span>
          </NavLink>
        </nav>

        {/* User info at bottom of sidebar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">{getUserInitials()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{getUserDisplayName()}</p>
              <p className="text-gray-400 text-xs">Đang hoạt động</p>
            </div>
            <button
              onClick={handleLogout}
              title="Đăng xuất"
              className="text-gray-400 hover:text-red-400 transition-colors p-1"
            >
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <div className="bottom-nav md:hidden flex items-center">
        <NavLink to="/trading" end className={({ isActive }) => `bottom-nav-item flex-1 ${isActive ? 'active' : ''}`}>
          <i className="fas fa-home"></i>
          <span style={{ fontSize: '10px' }}>Home</span>
        </NavLink>
        <NavLink to="/trading/purchases" className={({ isActive }) => `bottom-nav-item flex-1 ${isActive ? 'active' : ''}`}>
          <i className="fas fa-shopping-cart"></i>
          <span style={{ fontSize: '10px' }}>Mua</span>
        </NavLink>
        <NavLink to="/trading/sales" className={({ isActive }) => `bottom-nav-item flex-1 ${isActive ? 'active' : ''}`}>
          <i className="fas fa-cash-register"></i>
          <span style={{ fontSize: '10px' }}>Bán</span>
        </NavLink>
        <NavLink to="/trading/farmers" className={({ isActive }) => `bottom-nav-item flex-1 ${isActive ? 'active' : ''}`}>
          <i className="fas fa-users"></i>
          <span style={{ fontSize: '10px' }}>Nông</span>
        </NavLink>
        <NavLink to="/trading/customers" className={({ isActive }) => `bottom-nav-item flex-1 ${isActive ? 'active' : ''}`}>
          <i className="fas fa-user-tag"></i>
          <span style={{ fontSize: '10px' }}>Khách</span>
        </NavLink>
      </div>

      {/* Main content */}
      <div className="main-content flex flex-col min-h-screen">
        {/* Header (desktop only, hidden on mobile via CSS) */}
        <div className="header shadow-sm">
          <button className="header-menu-btn btn btn-secondary btn-sm flex-shrink-0" onClick={toggleSidebar}>
            <i className="fas fa-bars"></i>
          </button>
          <div className="header-title flex-1 m-0 mx-3">{getPageTitle()}</div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800 leading-tight truncate max-w-[160px]">{getUserDisplayName()}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">{getUserInitials()}</span>
            </div>
          </div>
        </div>

        {/* Mobile user info bar (shown on mobile only) */}
        <div className="flex md:hidden items-center gap-3 px-4 py-2 bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">{getUserInitials()}</span>
          </div>
          <span className="text-sm font-semibold text-gray-800 truncate">{getUserDisplayName()}</span>
        </div>

        {/* Page content */}
        <main className="p-4 md:p-6 flex-1 bg-[#f8fafc]">
          <Suspense fallback={
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <i className="fas fa-circle-notch fa-spin text-green-500 text-3xl"></i>
                <p className="text-sm text-gray-400 mt-2">Đang tải...</p>
              </div>
            </div>
          }>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default TradingLayout;
