import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFarmers, createFarmer, updateFarmer, uploadTradingImage, deleteTradingImage, getPurchasesByFarmer } from '../../lib/tradingApi';

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

const TX_DATE_FILTERS = [
  { label: 'Hôm nay', value: 'today' },
  { label: '7 ngày', value: '7days' },
  { label: '30 ngày', value: '30days' },
  { label: 'Tất cả', value: 'all' },
  { label: 'Ngày cụ thể', value: 'custom' },
];

const getTxDateRange = (filter, customDate) => {
  const now = new Date();
  const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  switch (filter) {
    case 'today':
      return { from: startOfDay(now).toISOString(), to: null };
    case '7days': {
      const d = new Date(now); d.setDate(d.getDate() - 6);
      return { from: startOfDay(d).toISOString(), to: null };
    }
    case '30days': {
      const d = new Date(now); d.setDate(d.getDate() - 29);
      return { from: startOfDay(d).toISOString(), to: null };
    }
    case 'all':
      return { from: null, to: null };
    case 'custom': {
      if (!customDate) return { from: startOfDay(now).toISOString(), to: null };
      const d = new Date(customDate);
      const end = new Date(d); end.setHours(23, 59, 59, 999);
      return { from: startOfDay(d).toISOString(), to: end.toISOString() };
    }
    default:
      return { from: null, to: null };
  }
};

const Farmers = () => {
  const navigate = useNavigate();
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({ name: '', phone: '', address: '', latitude: '', longitude: '', images: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState(null);
  const imageRefs = useRef([]);

  // Transaction list state
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txDateFilter, setTxDateFilter] = useState('all');
  const [txCustomDate, setTxCustomDate] = useState('');
  const [txExpandedId, setTxExpandedId] = useState(null);

  useEffect(() => { fetchFarmers(); }, []);

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

  const handleImageSelect = async (idx, file) => {
    setUploadingIdx(idx);
    try {
      const url = await uploadTradingImage(file, 'farmers');
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
    if (!formData.name) return alert("Vui lòng nhập tên");
    setIsSubmitting(true);
    const { data, error } = await createFarmer({ ...formData, images: (formData.images || []).filter(Boolean) });
    setIsSubmitting(false);
    if (!error && data) {
      setFarmers([data, ...farmers]);
      setShowAddForm(false);
      setFormData({ name: '', phone: '', address: '', latitude: '', longitude: '', images: [] });
    } else {
      alert("Lỗi: " + (error?.message || "Không thể tạo nông dân"));
    }
  };

  const handleUpdate = async () => {
    if (!selectedFarmer || !formData.name) return;
    setIsSubmitting(true);
    const { data, error } = await updateFarmer(selectedFarmer.id, { ...formData, images: (formData.images || []).filter(Boolean) });
    setIsSubmitting(false);
    if (!error && data) {
      setFarmers(farmers.map(f => f.id === data.id ? data : f));
      setSelectedFarmer(data);
      setIsEditing(false);
    } else {
      alert("Lỗi: " + (error?.message || "Không thể cập nhật nông dân"));
    }
  };

  const fetchFarmerTransactions = async (farmerId, filter, custom) => {
    setTxLoading(true);
    const { from, to } = getTxDateRange(filter || txDateFilter, custom || txCustomDate);
    const { data } = await getPurchasesByFarmer(farmerId, from, to);
    setTransactions(data || []);
    setTxLoading(false);
  };

  const handleTxDateFilterChange = (val) => {
    setTxDateFilter(val);
    if (selectedFarmer && val !== 'custom') {
      fetchFarmerTransactions(selectedFarmer.id, val, txCustomDate);
    }
  };

  const handleTxCustomDateChange = (val) => {
    setTxCustomDate(val);
    if (selectedFarmer && val) {
      fetchFarmerTransactions(selectedFarmer.id, 'custom', val);
    }
  };

  const handleView = (farmer) => {
    setSelectedFarmer(farmer);
    const imgs = farmer.images || [];
    setFormData({
      name: farmer.name || '',
      phone: farmer.phone || '',
      address: farmer.address || '',
      latitude: farmer.latitude || '',
      longitude: farmer.longitude || '',
      images: [imgs[0] || null, imgs[1] || null, imgs[2] || null],
    });
    setIsEditing(false);
    setShowAddForm(false);
    setTxDateFilter('all');
    setTxCustomDate('');
    setTxExpandedId(null);
    fetchFarmerTransactions(farmer.id, 'all', '');
  };

  const handleBack = () => {
    setSelectedFarmer(null);
    setIsEditing(false);
    setTransactions([]);
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

  if (selectedFarmer) {
    const viewImages = selectedFarmer.images || [];
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
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg">Lịch sử giao dịch</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{transactions.length} phiếu</span>
                <button
                  className="btn btn-primary btn-sm ml-2"
                  onClick={() => navigate(`/trading/purchases?farmerId=${selectedFarmer.id}`)}
                >
                  <i className="fas fa-plus"></i> Tạo phiếu thu
                </button>
              </div>
            </div>

            {/* Summary stats */}
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg mb-3">
              <div className="text-center flex-1 border-r border-green-200">
                <div className="text-xs text-green-800">Số phiếu</div>
                <div className="font-bold text-lg text-green-700">{transactions.length}</div>
              </div>
              <div className="text-center flex-1">
                <div className="text-xs text-green-800">Tổng giá trị</div>
                <div className="font-bold text-lg text-green-700">
                  {transactions.reduce((s, t) => s + Number(t.total_amount || 0), 0).toLocaleString()}đ
                </div>
              </div>
            </div>

            {/* Date filter */}
            <div className="flex gap-1.5 flex-wrap mb-3">
              {TX_DATE_FILTERS.map(f => (
                <button
                  key={f.value}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    txDateFilter === f.value
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
                  }`}
                  onClick={() => handleTxDateFilterChange(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {txDateFilter === 'custom' && (
              <input
                type="date"
                className="input mb-3 text-sm"
                value={txCustomDate}
                onChange={(e) => handleTxCustomDateChange(e.target.value)}
              />
            )}

            {/* Transaction list */}
            <div className="space-y-2">
              {txLoading ? (
                <div className="text-center py-4 text-gray-500"><i className="fas fa-circle-notch fa-spin mr-2"></i> Đang tải...</div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-4 text-gray-500 italic">Không có phiếu thu mua nào.</div>
              ) : transactions.map(tx => (
                <div key={tx.id} className="bg-gray-50 rounded-lg overflow-hidden">
                  <div
                    className="p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => setTxExpandedId(prev => prev === tx.id ? null : tx.id)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          tx.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {tx.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(tx.created_at).toLocaleDateString('vi-VN')}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(tx.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-gray-400">#{tx.id.slice(0, 8)}</div>
                        <i className={`fas fa-chevron-${txExpandedId === tx.id ? 'up' : 'down'} text-xs text-gray-400`}></i>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {(tx.items || []).map(i => `${i.name} ${i.quantity}${i.unit}`).join(', ')}
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                      <div className="text-sm font-bold text-green-700">{Number(tx.total_amount).toLocaleString()} đ</div>
                      <div className="flex items-center gap-1 text-xs font-medium">
                        {Number(tx.paid_amount) >= Number(tx.total_amount) ? (
                          <span className="text-green-600"><i className="fas fa-check-circle"></i> Đã trả đủ</span>
                        ) : (
                          <span className="text-orange-500"><i className="fas fa-clock"></i> Đã trả {Number(tx.paid_amount || 0).toLocaleString()}đ</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {txExpandedId === tx.id && (
                    <div className="px-3 pb-3 border-t border-gray-200 bg-white">
                      <div className="pt-2 space-y-1">
                        <div className="grid grid-cols-4 gap-1 text-xs font-semibold text-gray-500 uppercase pb-1 border-b">
                          <span className="col-span-2">Mặt hàng</span>
                          <span className="text-right">Số lượng</span>
                          <span className="text-right">Thành tiền</span>
                        </div>
                        {(tx.items || []).map((item, idx) => (
                          <div key={idx} className="grid grid-cols-4 gap-1 text-sm py-1.5 border-b border-gray-100 last:border-0">
                            <div className="col-span-2">
                              <div className="font-medium text-gray-800">{item.name}</div>
                              <div className="text-xs text-gray-400">{Number(item.price).toLocaleString()} đ/{item.unit}</div>
                            </div>
                            <div className="text-right text-gray-600 self-center">{item.quantity} {item.unit}</div>
                            <div className="text-right font-semibold text-green-700 self-center">
                              {(Number(item.quantity) * Number(item.price)).toLocaleString()} đ
                            </div>
                          </div>
                        ))}
                        <div className="flex justify-between pt-1.5 text-sm font-bold border-t border-gray-200">
                          <span className="text-gray-700">Tổng cộng</span>
                          <span className="text-green-700">{Number(tx.total_amount).toLocaleString()} đ</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
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
          ) : farmers.length === 0 ? (
            <div className="text-center py-4 text-gray-500">Chưa có dữ liệu nông dân.</div>
          ) : farmers.map(farmer => (
            <div key={farmer.id} className="p-3 bg-gray-50 rounded-lg border border-transparent hover:border-green-200 transition-colors cursor-pointer" onClick={() => handleView(farmer)}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {farmer.images?.[0] && (
                    <img src={farmer.images[0]} alt="" className="w-9 h-9 rounded-full object-cover border border-gray-200 flex-shrink-0" />
                  )}
                  <div className="font-medium text-gray-800">{farmer.name}</div>
                </div>
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
