import React from 'react';

const Farmers = () => {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-1">Nông dân</h2>
        <p className="text-gray-600 text-sm">Quản lý danh sách nông dân cung cấp</p>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <input type="text" className="select" placeholder="Search nông dân..." />
          <button className="btn btn-primary">
            <i className="fas fa-search"></i>
          </button>
        </div>
        <button className="btn btn-primary w-full mb-3">
          <i className="fas fa-plus"></i> Thêm nông dân
        </button>

        <div className="space-y-2">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <div className="font-medium">Nguyễn Văn A</div>
              <button className="btn btn-secondary btn-sm">
                <i className="fas fa-eye"></i>
              </button>
            </div>
            <div className="text-sm text-gray-600">0912345678</div>
            <div className="text-sm text-gray-500">Làng X, Huyện Y</div>
            <div className="flex items-center justify-between mt-2 text-sm">
              <div>8 lần</div>
              <div className="font-bold">1,250,000 VND</div>
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <div className="font-medium">Trần Thị B</div>
              <button className="btn btn-secondary btn-sm">
                <i className="fas fa-eye"></i>
              </button>
            </div>
            <div className="text-sm text-gray-600">0923456789</div>
            <div className="text-sm text-gray-500">Làng Z, Huyện W</div>
            <div className="flex items-center justify-between mt-2 text-sm">
              <div>6 lần</div>
              <div className="font-bold">980,000 VND</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Farmers;
