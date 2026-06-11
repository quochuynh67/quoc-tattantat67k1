import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import './Trading.css';

const TradingLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const getPageTitle = () => {
    if (location.pathname === '/trading') return 'Dashboard';
    if (location.pathname.includes('purchases')) return 'Thu mua';
    if (location.pathname.includes('sales')) return 'Bán hàng';
    if (location.pathname.includes('farmers')) return 'Nông dân';
    if (location.pathname.includes('customers')) return 'Khách hàng';
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
        </nav>
      </aside>

      {/* Mobile Bottom Nav */}
      <div className="bottom-nav md:hidden relative flex items-center">
        <NavLink to="/trading" end className={({ isActive }) => `bottom-nav-item flex-1 ${isActive ? 'active' : ''}`}>
          <i className="fas fa-home"></i>
          <span style={{ fontSize: '10px' }}>Home</span>
        </NavLink>
        <NavLink to="/trading/purchases" className={({ isActive }) => `bottom-nav-item flex-1 ${isActive ? 'active' : ''}`}>
          <i className="fas fa-shopping-cart"></i>
          <span style={{ fontSize: '10px' }}>Mua</span>
        </NavLink>
        
        {/* Floating Action Button */}
        <div className="relative flex-1 flex justify-center h-full">
          <button className="absolute -top-8 bg-green-500 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-[0_4px_10px_rgba(34,197,94,0.4)] border-4 border-[#fff] z-50 transition-transform active:scale-95">
            <i className="fas fa-plus text-xl"></i>
          </button>
        </div>

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
        {/* Header */}
        <div className="header shadow-sm">
          <div className="flex items-center gap-3">
            <button className="header-menu-btn btn btn-secondary btn-sm" onClick={toggleSidebar}>
              <i className="fas fa-bars"></i>
            </button>
            <div className="header-title m-0">{getPageTitle()}</div>
          </div>
          <div className="hidden md:block">
            {/* Header Plus Button only on Desktop */}
            <button className="btn btn-primary btn-sm rounded-full w-8 h-8 p-0 flex items-center justify-center shadow-md">
              <i className="fas fa-plus"></i>
            </button>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 md:p-6 flex-1 bg-[#f8fafc]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default TradingLayout;
