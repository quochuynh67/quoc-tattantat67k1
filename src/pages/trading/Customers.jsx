import React, { useState } from 'react';

const DUMMY_CUSTOMERS = [
  { id: 1, name: 'Chị Lan (Chợ đầu mối)', phone: '0933445566', address: 'Quận 1, TP.HCM', transactions: 12, total: '5,450,000' },
  { id: 2, name: 'Anh Hải (Siêu thị mini)', phone: '0988776655', address: 'Quận 3, TP.HCM', transactions: 5, total: '2,100,000' }
];

const Customers = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleView = (customer) => {
    setSelectedCustomer(customer);
    setIsEditing(false);
    setShowAddForm(false);
  };

  const handleBack = () => {
    setSelectedCustomer(null);
    setIsEditing(false);
  };

  if (selectedCustomer) {
    return (
      <div className="animate-fade-in">
        <div className="mb-4 flex items-center gap-3">
          <button className="btn btn-secondary btn-sm rounded-full w-8 h-8 p-0 flex items-center justify-center shadow-sm" onClick={handleBack}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <div>
            <h2 className="text-xl font-bold m-0 leading-tight">Chi tiết Khách hàng</h2>
            <p className="text-xs text-gray-500 m-0">{selectedCustomer.name}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-bold text-lg text-green-800">{isEditing ? 'Sửa thông tin' : 'Thông tin chung'}</h3>
            {!isEditing && (
              <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(true)}>
                <i className="fas fa-edit mr-1"></i> Sửa
              </button>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tên khách hàng</label>
              <input type="text" className={`input ${!isEditing ? 'bg-gray-50' : ''}`} defaultValue={selectedCustomer.name} readOnly={!isEditing} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Số điện thoại</label>
              <input type="tel" className={`input ${!isEditing ? 'bg-gray-50' : ''}`} defaultValue={selectedCustomer.phone} readOnly={!isEditing} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Địa chỉ</label>
              <input type="text" className={`input ${!isEditing ? 'bg-gray-50' : ''}`} defaultValue={selectedCustomer.address} readOnly={!isEditing} />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Hình ảnh đính kèm</label>
              <div className="flex gap-2">
                {[1, 2, 3].map((idx) => (
                  <div key={idx} className={`flex-1 aspect-square rounded-lg border-2 ${isEditing ? 'border-dashed border-gray-300 hover:bg-gray-100 cursor-pointer' : 'border-solid border-gray-200'} flex flex-col items-center justify-center bg-gray-50 text-gray-400 transition-colors`}>
                    <i className="fas fa-image text-xl mb-1 text-gray-300"></i>
                    {isEditing && <span className="text-[10px]">Thêm ảnh {idx}</span>}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Vị trí bản đồ</label>
              <div className="flex items-center gap-2">
                <button className="btn btn-secondary flex-1 bg-white border border-gray-300" disabled={!isEditing}>
                  <i className="fas fa-map-marker-alt text-red-500"></i> {isEditing ? 'Chọn trên bản đồ' : 'Xem trên bản đồ'}
                </button>
                {isEditing && (
                  <button className="btn btn-secondary w-12 h-10 flex items-center justify-center bg-white border border-gray-300" title="Lấy vị trí hiện tại">
                    <i className="fas fa-location-arrow text-blue-500"></i>
                  </button>
                )}
              </div>
              {!isEditing && <div className="text-xs text-green-600 mt-1"><i className="fas fa-check-circle"></i> Đã có vị trí (Nhấn để xem)</div>}
            </div>

            {isEditing && (
              <div className="flex gap-2 pt-3 border-t mt-4">
                <button className="btn btn-secondary flex-1" onClick={() => setIsEditing(false)}>Hủy</button>
                <button className="btn btn-primary flex-1" onClick={() => setIsEditing(false)}>
                  <i className="fas fa-save mr-1"></i> Lưu thay đổi
                </button>
              </div>
            )}
          </div>
        </div>

        {!isEditing && (
          <div className="bg-white p-4 rounded-lg border shadow-sm mt-4">
            <h3 className="font-bold text-lg mb-3">Lịch sử giao dịch</h3>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg mb-3">
              <div className="text-center flex-1 border-r border-green-200">
                <div className="text-xs text-green-800">Tổng hóa đơn</div>
                <div className="font-bold text-lg text-green-700">{selectedCustomer.transactions}</div>
              </div>
              <div className="text-center flex-1">
                <div className="text-xs text-green-800">Tổng thu</div>
                <div className="font-bold text-lg text-green-700">{selectedCustomer.total}đ</div>
              </div>
            </div>
            <div className="text-center text-sm text-gray-500 py-4 italic">
              (Chưa có dữ liệu chi tiết hóa đơn)
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-1">Khách hàng</h2>
        <p className="text-gray-600 text-sm">Quản lý danh sách khách hàng</p>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <input type="text" className="select" placeholder="Tìm kiếm khách hàng..." />
          <button className="btn btn-primary">
            <i className="fas fa-search"></i>
          </button>
        </div>
        {!showAddForm ? (
          <button className="btn btn-primary w-full mb-3 shadow-md" onClick={() => setShowAddForm(true)}>
            <i className="fas fa-plus"></i> Thêm khách hàng
          </button>
        ) : (
          <div className="bg-white p-4 rounded-lg border border-green-100 mb-4 shadow-md">
            <h3 className="font-bold mb-3 text-lg text-green-800">Thêm khách hàng mới</h3>
            <div className="space-y-3">
              <input type="text" className="input" placeholder="Tên khách hàng / Đơn vị" />
              <input type="tel" className="input" placeholder="Số điện thoại" />
              <input type="text" className="input" placeholder="Địa chỉ" />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hình ảnh (Tối đa 3 ảnh)</label>
                <div className="flex gap-2">
                  {[1, 2, 3].map((idx) => (
                    <div key={idx} className="flex-1 aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-gray-50 text-gray-400 cursor-pointer hover:bg-gray-100 transition-colors">
                      <i className="fas fa-camera text-xl mb-1"></i>
                      <span className="text-[10px]">Ảnh {idx}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vị trí bản đồ</label>
                <div className="flex items-center gap-2">
                  <button className="btn btn-secondary flex-1 bg-white border border-gray-300">
                    <i className="fas fa-map-marker-alt text-red-500"></i> Chọn trên bản đồ
                  </button>
                  <button className="btn btn-secondary w-12 h-10 flex items-center justify-center bg-white border border-gray-300" title="Lấy vị trí hiện tại">
                    <i className="fas fa-location-arrow text-blue-500"></i>
                  </button>
                </div>
                <div className="text-xs text-gray-500 mt-1 italic">Chưa có vị trí nào được chọn</div>
              </div>

              <div className="flex gap-2 pt-3 border-t mt-4">
                <button className="btn btn-secondary flex-1" onClick={() => setShowAddForm(false)}>Hủy</button>
                <button className="btn btn-primary flex-1" onClick={() => setShowAddForm(false)}>
                  <i className="fas fa-save mr-1"></i> Lưu thông tin
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {DUMMY_CUSTOMERS.map(customer => (
            <div key={customer.id} className="p-3 bg-gray-50 rounded-lg border border-transparent hover:border-green-200 transition-colors cursor-pointer" onClick={() => handleView(customer)}>
              <div className="flex items-center justify-between mb-1">
                <div className="font-medium text-gray-800">{customer.name}</div>
                <button className="btn btn-secondary btn-sm bg-white" onClick={(e) => { e.stopPropagation(); handleView(customer); }}>
                  <i className="fas fa-eye text-green-600"></i>
                </button>
              </div>
              <div className="text-sm text-gray-600"><i className="fas fa-phone w-4 text-center text-gray-400"></i> {customer.phone}</div>
              <div className="text-sm text-gray-500"><i className="fas fa-map-marker-alt w-4 text-center text-gray-400"></i> {customer.address}</div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 text-sm">
                <div className="text-gray-500">{customer.transactions} đơn hàng</div>
                <div className="font-bold text-green-700">{customer.total} đ</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Customers;
