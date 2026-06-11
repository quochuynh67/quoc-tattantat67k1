import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../../lib/tradingApi';

const Dashboard = () => {
  const [dateFilter, setDateFilter] = useState('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  
  const [stats, setStats] = useState({
    totalPurchases: 0,
    totalSales: 0,
    purchasesCount: 0,
    salesCount: 0,
    profit: 0,
    farmersCount: 0,
    topFarmers: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (dateFilter !== 'custom') {
      fetchStats();
    }
  }, [dateFilter]);

  const fetchStats = async () => {
    setLoading(true);
    let startDate = null;
    let endDate = null;
    const now = new Date();

    if (dateFilter === 'today') {
      now.setHours(0,0,0,0);
      startDate = now.toISOString();
    } else if (dateFilter === 'yesterday') {
      now.setDate(now.getDate() - 1);
      now.setHours(0,0,0,0);
      startDate = now.toISOString();
      now.setHours(23,59,59,999);
      endDate = now.toISOString();
    } else if (dateFilter === 'last_week') {
      now.setDate(now.getDate() - 7);
      now.setHours(0,0,0,0);
      startDate = now.toISOString();
    } else if (dateFilter === 'last_30_days') {
      now.setDate(now.getDate() - 30);
      now.setHours(0,0,0,0);
      startDate = now.toISOString();
    } else if (dateFilter === 'custom' && customStart && customEnd) {
      startDate = new Date(customStart).toISOString();
      const end = new Date(customEnd);
      end.setHours(23,59,59,999);
      endDate = end.toISOString();
    }

    const { data } = await getDashboardStats(startDate, endDate);
    if (data) {
      setStats(data);
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Tổng quan</h2>
        <select 
          className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        >
          <option value="today">Hôm nay</option>
          <option value="yesterday">Hôm qua</option>
          <option value="last_week">Tuần qua</option>
          <option value="last_30_days">30 ngày qua</option>
          <option value="custom">Chọn ngày...</option>
        </select>
      </div>

      {dateFilter === 'custom' && (
        <div className="flex gap-2 mb-6 items-center bg-white p-3 rounded-lg shadow-sm">
          <input type="date" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
          <span className="text-gray-500">-</span>
          <input type="date" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium" onClick={fetchStats}>Lọc</button>
        </div>
      )}

      {/* Stats */}
      {loading ? (
        <div className="text-center py-10"><i className="fas fa-circle-notch fa-spin text-green-500 text-2xl"></i></div>
      ) : (
        <div className="grid grid-cols-mobile gap-4 mb-6">
          <div className="stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <i className="fas fa-shopping-cart text-green-600"></i>
              </div>
              <span className="text-gray-600 font-medium text-sm">Tổng thu mua</span>
            </div>
            <div className="stat-value">{stats.totalPurchases.toLocaleString()} đ</div>
            <div className="text-sm text-gray-500 mt-1">{stats.purchasesCount} phiếu</div>
          </div>

          <div className="stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <i className="fas fa-cash-register text-blue-600"></i>
              </div>
              <span className="text-gray-600 font-medium text-sm">Tổng bán hàng</span>
            </div>
            <div className="stat-value">{stats.totalSales.toLocaleString()} đ</div>
            <div className="text-sm text-gray-500 mt-1">{stats.salesCount} hoá đơn</div>
          </div>

          <div className="stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <i className="fas fa-chart-line text-emerald-600"></i>
              </div>
              <span className="text-gray-600 font-medium text-sm">Lợi nhuận gộp</span>
            </div>
            <div className={`stat-value ${stats.profit < 0 ? 'text-red-500' : ''}`}>{stats.profit.toLocaleString()} đ</div>
            <div className="text-sm text-gray-500 mt-1">Ước tính</div>
          </div>

          <div className="stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <i className="fas fa-users text-purple-600"></i>
              </div>
              <span className="text-gray-600 font-medium text-sm">Nông dân</span>
            </div>
            <div className="stat-value">{stats.farmersCount}</div>
            <div className="text-sm text-gray-500 mt-1">Tổng hệ thống</div>
          </div>
        </div>
      )}

      {/* Charts & Tables */}
      <div className="space-y-4">
        <div className="card p-4">
          <h3 className="text-lg font-bold mb-3">Top nông dân (Thu mua)</h3>
          <div className="table overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="bg-gray-50 text-gray-600 p-3 border-b">Nông dân</th>
                  <th className="bg-gray-50 text-gray-600 p-3 border-b">Số phiếu</th>
                  <th className="bg-gray-50 text-gray-600 p-3 border-b">Tổng tiền</th>
                </tr>
              </thead>
              <tbody>
                {stats.topFarmers?.length > 0 ? (
                  stats.topFarmers.map(farmer => (
                    <tr key={farmer.id}>
                      <td className="p-3 border-b">{farmer.name}</td>
                      <td className="p-3 border-b">{farmer.count}</td>
                      <td className="p-3 border-b text-green-600 font-medium">{farmer.total.toLocaleString()} đ</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="p-3 border-b text-center text-gray-500">Chưa có dữ liệu giao dịch</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
