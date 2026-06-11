import React from 'react';

const Dashboard = () => {
  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-mobile gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <i className="fas fa-shopping-cart text-green-600"></i>
            </div>
            <span className="text-gray-600 font-medium text-sm">Tổng thu mua</span>
          </div>
          <div className="stat-value">2,450,000 VND</div>
          <div className="text-sm text-gray-500 mt-1">12 phiếu hôm nay</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <i className="fas fa-cash-register text-blue-600"></i>
            </div>
            <span className="text-gray-600 font-medium text-sm">Tổng bán hàng</span>
          </div>
          <div className="stat-value">3,890,000 VND</div>
          <div className="text-sm text-gray-500 mt-1">8 hoá đơn hôm nay</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <i className="fas fa-chart-line text-emerald-600"></i>
            </div>
            <span className="text-gray-600 font-medium text-sm">Lợi nhuận</span>
          </div>
          <div className="stat-value">1,440,000 VND</div>
          <div className="text-sm text-gray-500 mt-1">58.8% lợi nhuận</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <i className="fas fa-users text-purple-600"></i>
            </div>
            <span className="text-gray-600 font-medium text-sm">Nông dân</span>
          </div>
          <div className="stat-value">24</div>
          <div className="text-sm text-gray-500 mt-1">5 nông dân mới</div>
        </div>
      </div>

      {/* Charts & Tables */}
      <div className="space-y-4">
        <div className="card p-4">
          <h3 className="text-lg font-bold mb-3">Doanh thu theo ngày</h3>
          <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
            [Chart: Doanh thu theo ngày]
          </div>
        </div>

        <div className="card p-4">
          <h3 className="text-lg font-bold mb-3">Top nông dân</h3>
          <div className="table overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="bg-gray-50 text-gray-600 p-3 border-b">Nông dân</th>
                  <th className="bg-gray-50 text-gray-600 p-3 border-b">Số lần</th>
                  <th className="bg-gray-50 text-gray-600 p-3 border-b">Tổng tiền</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3 border-b">Nguyễn Văn A</td>
                  <td className="p-3 border-b">5</td>
                  <td className="p-3 border-b text-green-600 font-medium">1,200,000 VND</td>
                </tr>
                <tr>
                  <td className="p-3 border-b">Trần Thị B</td>
                  <td className="p-3 border-b">3</td>
                  <td className="p-3 border-b text-green-600 font-medium">850,000 VND</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
