import React from 'react';

const Sales = () => {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-1">Bán hàng</h2>
        <p className="text-gray-600 text-sm">Tạo hoá đơn bán cho khách hàng</p>
      </div>

      <div className="card p-4 mb-6">
        <h3 className="text-lg font-bold mb-3">Tạo hoá đơn</h3>
        <div className="space-y-3">
          <div className="flex gap-2">
            <select className="select flex-1">
              <option>Khách vãng lai</option>
              <option>Nguyễn Minh D</option>
            </select>
            <button className="btn btn-secondary px-3">
              <i className="fas fa-user-plus"></i>
            </button>
          </div>

          <div className="item-row">
            <div className="flex justify-between items-center mb-1 md:hidden">
              <span className="font-medium text-sm">Mặt hàng 1</span>
              <i className="fas fa-times text-red-500"></i>
            </div>
            <select className="select">
              <option>Chọn mặt hàng có sẵn...</option>
              <option>Rau cải (Tồn: 15kg)</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" className="input" placeholder="Số lượng" />
              <input type="text" className="input bg-gray-100" value="kg" disabled />
            </div>
            <input type="number" className="input" placeholder="Đơn giá bán (VND)" />
            <div className="text-right text-gray-500 font-medium md:text-left md:mt-2">
              <span className="md:hidden">Thành tiền: </span>0 VND
            </div>
          </div>

          <button className="btn btn-secondary w-full">
            <i className="fas fa-plus"></i> Thêm mặt hàng
          </button>

          <div className="pt-3 border-t">
            <textarea className="input" placeholder="Ghi chú hoá đơn..."></textarea>
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <div>
              <span className="text-gray-600">Tổng tiền:</span>
              <span className="text-xl font-bold ml-2">105,000 VND</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button className="btn btn-secondary w-full">
              <i className="fas fa-save"></i> Lưu pending
            </button>
            <button className="btn btn-primary w-full">
              <i className="fas fa-check"></i> Lưu & Confirm
            </button>
          </div>
        </div>
      </div>

      {/* Danh sách hoá đơn */}
      <div className="card p-4 mt-4">
        <h3 className="text-lg font-bold mb-3">Hoá đơn hôm nay</h3>
        <div className="space-y-2">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-success">Confirm</span>
              <span className="text-sm text-gray-500">14:00</span>
            </div>
            <div className="font-medium">Nguyễn Minh D</div>
            <div className="text-sm text-gray-600">Rau cải 3kg</div>
            <div className="text-sm font-bold mt-1">105,000 VND</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sales;
