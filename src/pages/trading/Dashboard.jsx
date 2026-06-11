import React, { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { getDashboardStats } from '../../lib/tradingApi';

// ── helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return n.toLocaleString();
};

const fmtDate = (iso) => {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
};

const FILTERS = [
  { value: 'today',       label: 'Hôm nay' },
  { value: 'yesterday',   label: 'Hôm qua' },
  { value: 'last_week',   label: '7 ngày' },
  { value: 'last_30_days',label: '30 ngày' },
  { value: 'custom',      label: 'Tuỳ chọn' },
];

const getDateRange = (filter, customStart, customEnd) => {
  const now = new Date();
  if (filter === 'today') {
    const s = new Date(now); s.setHours(0, 0, 0, 0);
    return { startDate: s.toISOString(), endDate: null };
  }
  if (filter === 'yesterday') {
    const s = new Date(now); s.setDate(s.getDate() - 1); s.setHours(0, 0, 0, 0);
    const e = new Date(s); e.setHours(23, 59, 59, 999);
    return { startDate: s.toISOString(), endDate: e.toISOString() };
  }
  if (filter === 'last_week') {
    const s = new Date(now); s.setDate(s.getDate() - 6); s.setHours(0, 0, 0, 0);
    return { startDate: s.toISOString(), endDate: null };
  }
  if (filter === 'last_30_days') {
    const s = new Date(now); s.setDate(s.getDate() - 29); s.setHours(0, 0, 0, 0);
    return { startDate: s.toISOString(), endDate: null };
  }
  if (filter === 'custom' && customStart && customEnd) {
    const e = new Date(customEnd); e.setHours(23, 59, 59, 999);
    return { startDate: new Date(customStart).toISOString(), endDate: e.toISOString() };
  }
  return { startDate: null, endDate: null };
};

// ── custom tooltip ────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }}></span>
          <span className="text-gray-600">{p.name}:</span>
          <span className="font-medium">{Number(p.value).toLocaleString()} đ</span>
        </div>
      ))}
    </div>
  );
};

// ── rank bar row ──────────────────────────────────────────────────────────────
const RankRow = ({ rank, name, total, count, maxTotal, color }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 min-w-0">
        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white`}
          style={{ background: rank === 1 ? '#f59e0b' : rank === 2 ? '#94a3b8' : rank === 3 ? '#b45309' : '#d1d5db', color: rank > 3 ? '#6b7280' : undefined }}>
          {rank}
        </span>
        <span className="truncate font-medium text-gray-800">{name}</span>
      </div>
      <div className="text-right flex-shrink-0 ml-2">
        <span className="font-bold text-gray-900">{fmt(total)}đ</span>
        <span className="text-xs text-gray-400 ml-1">({count})</span>
      </div>
    </div>
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(total / maxTotal) * 100}%`, background: color }}></div>
    </div>
  </div>
);

// ── main component ────────────────────────────────────────────────────────────
const Dashboard = () => {
  const [dateFilter, setDateFilter] = useState('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [stats, setStats] = useState({
    totalPurchases: 0, totalSales: 0,
    purchasesCount: 0, salesCount: 0,
    profit: 0, farmersCount: 0,
    topFarmers: [], topCustomers: [], chartData: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    const { startDate, endDate } = getDateRange(dateFilter, customStart, customEnd);
    if (dateFilter === 'custom' && (!customStart || !customEnd)) return;
    setLoading(true);
    const { data } = await getDashboardStats(startDate, endDate);
    if (data) setStats(data);
    setLoading(false);
  }, [dateFilter, customStart, customEnd]);

  useEffect(() => {
    if (dateFilter !== 'custom') fetchStats();
  }, [dateFilter]);

  const maxPurchase = Math.max(...(stats.topFarmers.map(f => f.total)), 1);
  const maxSale = Math.max(...(stats.topCustomers.map(c => c.total)), 1);
  const showChart = stats.chartData.length > 0;

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold">Tổng quan</h2>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {FILTERS.map(f => (
            <button
              key={f.value}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                dateFilter === f.value
                  ? 'bg-white text-green-700 shadow-sm font-semibold'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setDateFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Custom date picker ── */}
      {dateFilter === 'custom' && (
        <div className="flex gap-2 items-center bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex-wrap">
          <input
            type="date" className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-0"
            value={customStart} onChange={e => setCustomStart(e.target.value)}
          />
          <span className="text-gray-400 text-sm">→</span>
          <input
            type="date" className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-0"
            value={customEnd} onChange={e => setCustomEnd(e.target.value)}
          />
          <button
            className="btn btn-primary btn-sm"
            onClick={fetchStats}
            disabled={!customStart || !customEnd}
          >
            <i className="fas fa-search"></i> Lọc
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <i className="fas fa-circle-notch fa-spin text-green-500 text-3xl"></i>
            <p className="text-sm text-gray-400 mt-2">Đang tải dữ liệu...</p>
          </div>
        </div>
      ) : (
        <>
          {/* ── Stat cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <i className="fas fa-shopping-cart text-green-600 text-sm"></i>
                </div>
                <span className="text-gray-500 text-xs font-medium">Thu mua</span>
              </div>
              <div className="text-xl font-bold text-green-700">{fmt(stats.totalPurchases)}đ</div>
              <div className="text-xs text-gray-400 mt-0.5">{stats.purchasesCount} phiếu</div>
            </div>

            <div className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <i className="fas fa-cash-register text-blue-600 text-sm"></i>
                </div>
                <span className="text-gray-500 text-xs font-medium">Bán hàng</span>
              </div>
              <div className="text-xl font-bold text-blue-700">{fmt(stats.totalSales)}đ</div>
              <div className="text-xs text-gray-400 mt-0.5">{stats.salesCount} hoá đơn</div>
            </div>

            <div className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stats.profit >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
                  <i className={`fas fa-chart-line text-sm ${stats.profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}></i>
                </div>
                <span className="text-gray-500 text-xs font-medium">Lợi nhuận</span>
              </div>
              <div className={`text-xl font-bold ${stats.profit >= 0 ? 'text-emerald-700' : 'text-red-500'}`}>
                {stats.profit >= 0 ? '+' : ''}{fmt(stats.profit)}đ
              </div>
              <div className="text-xs text-gray-400 mt-0.5">Gộp ước tính</div>
            </div>

            <div className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <i className="fas fa-users text-purple-600 text-sm"></i>
                </div>
                <span className="text-gray-500 text-xs font-medium">Nông dân</span>
              </div>
              <div className="text-xl font-bold text-purple-700">{stats.farmersCount}</div>
              <div className="text-xs text-gray-400 mt-0.5">Tổng hệ thống</div>
            </div>
          </div>

          {/* ── Chart ── */}
          <div className="card p-4">
            <h3 className="text-base font-bold mb-4 flex items-center gap-2">
              <i className="fas fa-chart-area text-green-500 text-sm"></i>
              Biểu đồ doanh thu
            </h3>
            {showChart ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={stats.chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gPurchase" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gSale" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={fmtDate}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={v => fmt(v)}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    width={42}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    formatter={(val) => <span className="text-xs text-gray-600">{val}</span>}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Area
                    type="monotone" dataKey="purchases" name="Thu mua"
                    stroke="#22c55e" strokeWidth={2}
                    fill="url(#gPurchase)" dot={false} activeDot={{ r: 4 }}
                  />
                  <Area
                    type="monotone" dataKey="sales" name="Bán hàng"
                    stroke="#3b82f6" strokeWidth={2}
                    fill="url(#gSale)" dot={false} activeDot={{ r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-36 text-gray-400">
                <i className="fas fa-chart-area text-3xl mb-2 text-gray-200"></i>
                <p className="text-sm">Chưa có dữ liệu trong khoảng thời gian này</p>
              </div>
            )}
          </div>

          {/* ── Top Farmers + Top Customers ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Farmers */}
            <div className="card p-4">
              <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                <i className="fas fa-tractor text-green-500 text-sm"></i>
                Top nông dân thu mua
              </h3>
              {stats.topFarmers.length > 0 ? (
                <div className="space-y-3">
                  {stats.topFarmers.map((farmer, i) => (
                    <RankRow
                      key={farmer.id} rank={i + 1}
                      name={farmer.name} total={farmer.total} count={farmer.count}
                      maxTotal={maxPurchase} color="#22c55e"
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <i className="fas fa-tractor text-2xl mb-2 text-gray-200"></i>
                  <p className="text-sm">Chưa có giao dịch</p>
                </div>
              )}
            </div>

            {/* Top Customers */}
            <div className="card p-4">
              <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                <i className="fas fa-star text-blue-500 text-sm"></i>
                Top khách hàng
              </h3>
              {stats.topCustomers.length > 0 ? (
                <div className="space-y-3">
                  {stats.topCustomers.map((customer, i) => (
                    <RankRow
                      key={customer.id} rank={i + 1}
                      name={customer.name} total={customer.total} count={customer.count}
                      maxTotal={maxSale} color="#3b82f6"
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <i className="fas fa-users text-2xl mb-2 text-gray-200"></i>
                  <p className="text-sm">Chưa có giao dịch</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
