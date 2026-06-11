import React from 'react';

const Purchases = () => {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-1">Thu mua</h2>
        <p className="text-gray-600 text-sm">Ghi nhận phiếu thu mua từ nông dân</p>
      </div>

      {/* Form tạo phiếu thu mua */}
      <div className="card p-4 mb-6">
        <h3 className="text-lg font-bold mb-3">Tạo phiếu thu mua</h3>
        <div className="space-y-3">
          <select className="select">
            <option>Chọn nông dân...</option>
            <option>Nguyễn Văn A</option>
            <option>Trần Thị B</option>
          </select>
          
          <div className="item-row">
            <div className="flex justify-between items-center mb-1 md:hidden">
              <span className="font-medium text-sm">Mặt hàng 1</span>
              <i className="fas fa-times text-red-500"></i>
            </div>
            <input type="text" className="input" placeholder="Tên mặt hàng (VD: Rau cải)" />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" className="input" placeholder="Số lượng" />
              <select className="select">
                <option>kg</option>
                <option>bó</option>
              </select>
            </div>
            <input type="number" className="input" placeholder="Đơn giá (VND)" />
            <div className="text-right text-gray-500 font-medium md:text-left md:mt-2">
              <span className="md:hidden">Thành tiền: </span>0 VND
            </div>
          </div>

          <button className="btn btn-secondary w-full">
            <i className="fas fa-plus"></i> Thêm mặt hàng
          </button>

          <div className="pt-3 border-t">
            <div className="flex items-center gap-2 mb-2">
              <button className="btn btn-secondary btn-sm flex-1">
                <i className="fas fa-map-marker-alt"></i> Lấy vị trí
              </button>
              <div className="text-xs text-gray-500 flex-1 text-right">Chưa có vị trí</div>
            </div>
          </div>

          <div className="pt-3 border-t space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-gray-600">Tổng tiền:</span>
                <span className="text-xl font-bold ml-2">250,000 VND</span>
              </div>
            </div>
            
            <div className="bg-white p-3 rounded border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Thanh toán cho nông dân:</span>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="paidFull" className="w-4 h-4 text-green-600 rounded focus:ring-green-500" />
                  <label htmlFor="paidFull" className="text-sm text-gray-700 cursor-pointer">Đã trả đủ</label>
                </div>
              </div>
              <input type="number" className="input text-sm w-full" placeholder="Hoặc nhập số tiền đã trả (VND)..." />
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

      {/* Danh sách phiếu hôm nay */}
      <div className="card p-4">
        <h3 className="text-lg font-bold mb-3">Phiếu hôm nay</h3>
        <div className="space-y-2">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-success">Confirm</span>
              <span className="text-sm text-gray-500">14:30</span>
            </div>
            <div className="font-medium">Nguyễn Văn A</div>
            <div className="text-sm text-gray-600">Rau cải 5kg, Cà phê 10 bó</div>
            <div className="flex items-center justify-between mt-1">
              <div className="text-sm font-bold">250,000 VND</div>
              <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
                <i className="fas fa-check-circle"></i> Đã trả đủ
              </div>
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-warning">Pending</span>
              <span className="text-sm text-gray-500">13:15</span>
            </div>
            <div className="font-medium">Trần Thị B</div>
            <div className="text-sm text-gray-600">Khoai lang 8kg</div>
            <div className="flex items-center justify-between mt-1">
              <div className="text-sm font-bold">120,000 VND</div>
              <div className="flex items-center gap-1 text-orange-500 text-xs font-medium">
                <i className="fas fa-clock"></i> Đã trả 50k
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Purchases;
