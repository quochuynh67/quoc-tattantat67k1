import React, { useState, useEffect } from 'react';

import { getFarmers, createFarmer, updateFarmer } from '../../lib/tradingApi';

const Farmers = () => {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', latitude: '', longitude: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    fetchFarmers();
  }, []);

  const fetchFarmers = async () => {
    setLoading(true);
    const { data } = await getFarmers();
    if (data) setFarmers(data);
    setLoading(false);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) return alert('Thiết bị không hỗ trợ GPS');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData(prev => ({ ...prev, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
        setLocating(false);
      },
      () => {
        alert('Không thể lấy vị trí. Hãy cấp quyền truy cập GPS cho trình duyệt.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleCreate = async () => {
    if (!formData.name) return alert("Vui lòng nhập tên");
    setIsSubmitting(true);
    const { data, error } = await createFarmer(formData);
    setIsSubmitting(false);
    if (!error && data) {
      setFarmers([data, ...farmers]);
      setShowAddForm(false);
      setFormData({ name: '', phone: '', address: '', latitude: '', longitude: '' });
    } else {
      alert("Lỗi: " + (error?.message || "Không thể tạo nông dân"));
    }
  };

  const handleUpdate = async () => {
    if (!selectedFarmer || !formData.name) return;
    setIsSubmitting(true);
    const { data, error } = await updateFarmer(selectedFarmer.id, formData);
    setIsSubmitting(false);
    if (!error && data) {
      setFarmers(farmers.map(f => f.id === data.id ? data : f));
      setSelectedFarmer(data);
      setIsEditing(false);
    } else {
      alert("Lỗi: " + (error?.message || "Không thể cập nhật nông dân"));
    }
  };

  const handleView = (farmer) => {
    setSelectedFarmer(farmer);
    setFormData({ name: farmer.name || '', phone: farmer.phone || '', address: farmer.address || '', latitude: farmer.latitude || '', longitude: farmer.longitude || '' });
    setIsEditing(false);
    setShowAddForm(false);
  };

  const handleBack = () => {
    setSelectedFarmer(null);
    setIsEditing(false);
  };

  if (selectedFarmer) {
    return (
      <div className="animate-fade-in">
        <div className="mb-4 flex items-center gap-3">
          <button className="btn btn-secondary btn-sm rounded-full w-8 h-8 p-0 flex items-center justify-center shadow-sm" onClick={handleBack}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <div>
            <h2 className="text-xl font-bold m-0 leading-tight">Chi tiết Nông dân</h2>
            <p className="text-xs text-gray-500 m-0">{selectedFarmer.name}</p>
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
              <label className="block text-xs font-medium text-gray-500 mb-1">Tên nông dân</label>
              <input type="text" name="name" className={`input ${!isEditing ? 'bg-gray-50' : ''}`} value={isEditing ? formData.name : selectedFarmer.name} onChange={handleInputChange} readOnly={!isEditing} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Số điện thoại</label>
              <input type="tel" name="phone" className={`input ${!isEditing ? 'bg-gray-50' : ''}`} value={isEditing ? formData.phone : (selectedFarmer.phone || '')} onChange={handleInputChange} readOnly={!isEditing} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Địa chỉ</label>
              <input type="text" name="address" className={`input ${!isEditing ? 'bg-gray-50' : ''}`} value={isEditing ? formData.address : (selectedFarmer.address || '')} onChange={handleInputChange} readOnly={!isEditing} />
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
              {isEditing ? (
                <>
                  <div className="flex items-center gap-2">
                    <button
                      className={`btn ${formData.latitude ? 'btn-primary' : 'btn-secondary'} flex-1 bg-white border border-gray-300`}
                      onClick={handleGetLocation}
                      disabled={locating}
                    >
                      <i className={`fas ${locating ? 'fa-circle-notch fa-spin' : 'fa-location-arrow'} text-blue-500`}></i>
                      {locating ? 'Đang lấy...' : 'Lấy vị trí GPS'}
                    </button>
                  </div>
                  <div className="text-xs mt-1">
                    {formData.latitude && formData.longitude ? (
                      <span className="text-green-600"><i className="fas fa-check-circle"></i> {Number(formData.latitude).toFixed(5)}, {Number(formData.longitude).toFixed(5)}</span>
                    ) : (
                      <span className="text-gray-400 italic">Chưa có vị trí nào được chọn</span>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {selectedFarmer.latitude && selectedFarmer.longitude ? (
                    <a
                      href={`https://www.google.com/maps?q=${selectedFarmer.latitude},${selectedFarmer.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary w-full bg-white border border-gray-300 text-sm"
                    >
                      <i className="fas fa-map-marker-alt text-red-500"></i> Xem trên bản đồ
                    </a>
                  ) : (
                    <div className="text-xs text-gray-400 italic mt-1">Chưa có vị trí</div>
                  )}
                  {selectedFarmer.latitude && selectedFarmer.longitude && (
                    <div className="text-xs text-green-600 mt-1">
                      <i className="fas fa-check-circle"></i> {Number(selectedFarmer.latitude).toFixed(5)}, {Number(selectedFarmer.longitude).toFixed(5)}
                    </div>
                  )}
                </>
              )}
            </div>

            {isEditing && (
              <div className="flex gap-2 pt-3 border-t mt-4">
                <button className="btn btn-secondary flex-1" onClick={() => setIsEditing(false)}>Hủy</button>
                <button className="btn btn-primary flex-1" onClick={handleUpdate} disabled={isSubmitting}>
                  <i className="fas fa-save mr-1"></i> {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
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
                <div className="text-xs text-green-800">Tổng số phiếu</div>
                <div className="font-bold text-lg text-green-700">{selectedFarmer.transactions}</div>
              </div>
              <div className="text-center flex-1">
                <div className="text-xs text-green-800">Tổng giá trị</div>
                <div className="font-bold text-lg text-green-700">{selectedFarmer.total}đ</div>
              </div>
            </div>
            <div className="text-center text-sm text-gray-500 py-4 italic">
              (Chưa có dữ liệu chi tiết phiếu thu mua)
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-1">Nông dân</h2>
        <p className="text-gray-600 text-sm">Quản lý danh sách nông dân cung cấp</p>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <input type="text" className="select" placeholder="Tìm kiếm nông dân..." />
          <button className="btn btn-primary">
            <i className="fas fa-search"></i>
          </button>
        </div>
        {!showAddForm ? (
          <button className="btn btn-primary w-full mb-3 shadow-md" onClick={() => setShowAddForm(true)}>
            <i className="fas fa-plus"></i> Thêm nông dân
          </button>
        ) : (
          <div className="bg-white p-4 rounded-lg border border-green-100 mb-4 shadow-md">
            <h3 className="font-bold mb-3 text-lg text-green-800">Thêm nông dân mới</h3>
            <div className="space-y-3">
              <input type="text" name="name" className="input" placeholder="Tên nông dân (*)" value={formData.name} onChange={handleInputChange} />
              <input type="tel" name="phone" className="input" placeholder="Số điện thoại" value={formData.phone} onChange={handleInputChange} />
              <input type="text" name="address" className="input" placeholder="Địa chỉ" value={formData.address} onChange={handleInputChange} />
              
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
                  <button
                    className={`btn ${formData.latitude ? 'btn-primary' : 'btn-secondary'} flex-1 bg-white border border-gray-300`}
                    onClick={handleGetLocation}
                    disabled={locating}
                  >
                    <i className={`fas ${locating ? 'fa-circle-notch fa-spin' : 'fa-location-arrow'} text-blue-500`}></i>
                    {locating ? 'Đang lấy...' : 'Lấy vị trí GPS'}
                  </button>
                </div>
                <div className="text-xs mt-1">
                  {formData.latitude && formData.longitude ? (
                    <span className="text-green-600"><i className="fas fa-check-circle"></i> {Number(formData.latitude).toFixed(5)}, {Number(formData.longitude).toFixed(5)}</span>
                  ) : (
                    <span className="text-gray-500 italic">Chưa có vị trí nào được chọn</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t mt-4">
                <button className="btn btn-secondary flex-1" onClick={() => setShowAddForm(false)}>Hủy</button>
                <button className="btn btn-primary flex-1" onClick={handleCreate} disabled={isSubmitting}>
                  <i className="fas fa-save mr-1"></i> {isSubmitting ? 'Đang lưu...' : 'Lưu thông tin'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-4 text-gray-500"><i className="fas fa-circle-notch fa-spin mr-2"></i> Đang tải...</div>
          ) : farmers.length === 0 ? (
            <div className="text-center py-4 text-gray-500">Chưa có dữ liệu nông dân.</div>
          ) : farmers.map(farmer => (
            <div key={farmer.id} className="p-3 bg-gray-50 rounded-lg border border-transparent hover:border-green-200 transition-colors cursor-pointer" onClick={() => handleView(farmer)}>
              <div className="flex items-center justify-between mb-1">
                <div className="font-medium text-gray-800">{farmer.name}</div>
                <button className="btn btn-secondary btn-sm bg-white" onClick={(e) => { e.stopPropagation(); handleView(farmer); }}>
                  <i className="fas fa-eye text-green-600"></i>
                </button>
              </div>
              <div className="text-sm text-gray-600"><i className="fas fa-phone w-4 text-center text-gray-400"></i> {farmer.phone}</div>
              <div className="text-sm text-gray-500"><i className="fas fa-map-marker-alt w-4 text-center text-gray-400"></i> {farmer.address}</div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 text-sm">
                <div className="text-gray-500">{farmer.transactions || 0} lần giao dịch</div>
                <div className="font-bold text-green-700">{farmer.total || 0} đ</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Farmers;
