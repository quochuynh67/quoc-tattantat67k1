import React, { useState, useEffect, useRef } from 'react';
import { getCustomers, createCustomer, updateCustomer, uploadTradingImage, deleteTradingImage } from '../../lib/tradingApi';

const ImageSlot = ({ url, uploading, editable, onPick, onRemove }) => (
  <div
    className={`flex-1 aspect-square rounded-lg border-2 relative overflow-hidden transition-colors
      ${editable ? 'border-dashed border-gray-300 cursor-pointer hover:bg-gray-100' : 'border-solid border-gray-200'}
      ${url ? '' : 'bg-gray-50'}
    `}
    onClick={() => editable && !uploading && onPick()}
  >
    {url ? (
      <img src={url} alt="" className="w-full h-full object-cover" />
    ) : uploading ? (
      <div className="flex flex-col items-center justify-center h-full text-green-500">
        <i className="fas fa-circle-notch fa-spin text-lg"></i>
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <i className={`fas ${editable ? 'fa-camera' : 'fa-image'} text-xl mb-1 text-gray-300`}></i>
        {editable && <span className="text-[10px]">Thêm ảnh</span>}
      </div>
    )}
    {url && editable && (
      <button
        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow"
        onClick={e => { e.stopPropagation(); onRemove(); }}
      >
        <i className="fas fa-times"></i>
      </button>
    )}
  </div>
);

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({ name: '', phone: '', address: '', type: 'le', latitude: '', longitude: '', images: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState(null);
  const imageRefs = useRef([]);

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    const { data } = await getCustomers();
    if (data) setCustomers(data);
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

  const handleImageSelect = async (idx, file) => {
    setUploadingIdx(idx);
    try {
      const url = await uploadTradingImage(file, 'customers');
      setFormData(prev => {
        const imgs = [...(prev.images || [null, null, null])];
        imgs[idx] = url;
        return { ...prev, images: imgs };
      });
    } catch (e) {
      alert('Lỗi upload ảnh: ' + e.message);
    } finally {
      setUploadingIdx(null);
    }
  };

  const handleRemoveImage = async (idx) => {
    const url = formData.images?.[idx];
    setFormData(prev => {
      const imgs = [...(prev.images || [null, null, null])];
      imgs[idx] = null;
      return { ...prev, images: imgs };
    });
    if (url) deleteTradingImage(url).catch(() => {});
  };

  const handleCreate = async () => {
    if (!formData.name) return alert("Vui lòng nhập tên khách hàng");
    setIsSubmitting(true);
    const { data, error } = await createCustomer({ ...formData, images: (formData.images || []).filter(Boolean) });
    setIsSubmitting(false);
    if (!error && data) {
      setCustomers([data, ...customers]);
      setShowAddForm(false);
      setFormData({ name: '', phone: '', address: '', type: 'le', latitude: '', longitude: '', images: [] });
    } else {
      alert("Lỗi: " + (error?.message || "Không thể tạo khách hàng"));
    }
  };

  const handleUpdate = async () => {
    if (!selectedCustomer || !formData.name) return;
    setIsSubmitting(true);
    const { data, error } = await updateCustomer(selectedCustomer.id, { ...formData, images: (formData.images || []).filter(Boolean) });
    setIsSubmitting(false);
    if (!error && data) {
      setCustomers(customers.map(c => c.id === data.id ? data : c));
      setSelectedCustomer(data);
      setIsEditing(false);
    } else {
      alert("Lỗi: " + (error?.message || "Không thể cập nhật khách hàng"));
    }
  };

  const handleView = (customer) => {
    setSelectedCustomer(customer);
    const imgs = customer.images || [];
    setFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      address: customer.address || '',
      type: customer.type || 'le',
      latitude: customer.latitude || '',
      longitude: customer.longitude || '',
      images: [imgs[0] || null, imgs[1] || null, imgs[2] || null],
    });
    setIsEditing(false);
    setShowAddForm(false);
  };

  const handleBack = () => {
    setSelectedCustomer(null);
    setIsEditing(false);
  };

  const renderImageSlots = (editable) => (
    <div className="flex gap-2">
      {[0, 1, 2].map(idx => (
        <React.Fragment key={idx}>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={el => imageRefs.current[idx] = el}
            onChange={e => e.target.files?.[0] && handleImageSelect(idx, e.target.files[0])}
          />
          <ImageSlot
            url={formData.images?.[idx]}
            uploading={uploadingIdx === idx}
            editable={editable}
            onPick={() => imageRefs.current[idx]?.click()}
            onRemove={() => handleRemoveImage(idx)}
          />
        </React.Fragment>
      ))}
    </div>
  );

  if (selectedCustomer) {
    const viewImages = selectedCustomer.images || [];
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
              <input type="text" name="name" className={`input ${!isEditing ? 'bg-gray-50' : ''}`} value={isEditing ? formData.name : selectedCustomer.name} onChange={handleInputChange} readOnly={!isEditing} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Số điện thoại</label>
              <input type="tel" name="phone" className={`input ${!isEditing ? 'bg-gray-50' : ''}`} value={isEditing ? formData.phone : (selectedCustomer.phone || '')} onChange={handleInputChange} readOnly={!isEditing} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Địa chỉ</label>
              <input type="text" name="address" className={`input ${!isEditing ? 'bg-gray-50' : ''}`} value={isEditing ? formData.address : (selectedCustomer.address || '')} onChange={handleInputChange} readOnly={!isEditing} />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Hình ảnh đính kèm</label>
              {isEditing ? (
                renderImageSlots(true)
              ) : (
                <div className="flex gap-2">
                  {[0, 1, 2].map(idx => (
                    viewImages[idx] ? (
                      <a key={idx} href={viewImages[idx]} target="_blank" rel="noopener noreferrer" className="flex-1 aspect-square rounded-lg overflow-hidden border border-gray-200">
                        <img src={viewImages[idx]} alt="" className="w-full h-full object-cover" />
                      </a>
                    ) : (
                      <div key={idx} className="flex-1 aspect-square rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-300">
                        <i className="fas fa-image text-xl"></i>
                      </div>
                    )
                  ))}
                </div>
              )}
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
                  {selectedCustomer.latitude && selectedCustomer.longitude ? (
                    <a
                      href={`https://www.google.com/maps?q=${selectedCustomer.latitude},${selectedCustomer.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary w-full bg-white border border-gray-300 text-sm"
                    >
                      <i className="fas fa-map-marker-alt text-red-500"></i> Xem trên bản đồ
                    </a>
                  ) : (
                    <div className="text-xs text-gray-400 italic mt-1">Chưa có vị trí</div>
                  )}
                  {selectedCustomer.latitude && selectedCustomer.longitude && (
                    <div className="text-xs text-green-600 mt-1">
                      <i className="fas fa-check-circle"></i> {Number(selectedCustomer.latitude).toFixed(5)}, {Number(selectedCustomer.longitude).toFixed(5)}
                    </div>
                  )}
                </>
              )}
            </div>

            {isEditing && (
              <div className="flex gap-2 pt-3 border-t mt-4">
                <button className="btn btn-secondary flex-1" onClick={() => setIsEditing(false)}>Hủy</button>
                <button className="btn btn-primary flex-1" onClick={handleUpdate} disabled={isSubmitting || uploadingIdx !== null}>
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
              <input type="text" name="name" className="input" placeholder="Tên khách hàng / Đơn vị (*)" value={formData.name} onChange={handleInputChange} />
              <input type="tel" name="phone" className="input" placeholder="Số điện thoại" value={formData.phone} onChange={handleInputChange} />
              <input type="text" name="address" className="input" placeholder="Địa chỉ" value={formData.address} onChange={handleInputChange} />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hình ảnh (Tối đa 3 ảnh)</label>
                {renderImageSlots(true)}
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
                <button className="btn btn-primary flex-1" onClick={handleCreate} disabled={isSubmitting || uploadingIdx !== null}>
                  <i className="fas fa-save mr-1"></i> {isSubmitting ? 'Đang lưu...' : 'Lưu thông tin'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-4 text-gray-500"><i className="fas fa-circle-notch fa-spin mr-2"></i> Đang tải...</div>
          ) : customers.length === 0 ? (
            <div className="text-center py-4 text-gray-500">Chưa có dữ liệu khách hàng.</div>
          ) : customers.map(customer => (
            <div key={customer.id} className="p-3 bg-gray-50 rounded-lg border border-transparent hover:border-green-200 transition-colors cursor-pointer" onClick={() => handleView(customer)}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {customer.images?.[0] && (
                    <img src={customer.images[0]} alt="" className="w-9 h-9 rounded-full object-cover border border-gray-200 flex-shrink-0" />
                  )}
                  <div className="font-medium text-gray-800">{customer.name}</div>
                </div>
                <button className="btn btn-secondary btn-sm bg-white" onClick={(e) => { e.stopPropagation(); handleView(customer); }}>
                  <i className="fas fa-eye text-green-600"></i>
                </button>
              </div>
              <div className="text-sm text-gray-600"><i className="fas fa-phone w-4 text-center text-gray-400"></i> {customer.phone}</div>
              <div className="text-sm text-gray-500"><i className="fas fa-map-marker-alt w-4 text-center text-gray-400"></i> {customer.address}</div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 text-sm">
                <div className="text-gray-500">{customer.transactions || 0} đơn hàng</div>
                <div className="font-bold text-green-700">{customer.total || 0} đ</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Customers;
