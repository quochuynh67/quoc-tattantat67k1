import React, { useState, useEffect } from 'react';
import { getPurchases, createPurchase, getFarmers, getProducts, createProduct } from '../../lib/tradingApi';
import ProductAutocomplete from './ProductAutocomplete';

const DATE_FILTERS = [
  { label: 'Hôm nay', value: 'today' },
  { label: 'Hôm qua', value: 'yesterday' },
  { label: '7 ngày', value: '7days' },
  { label: '30 ngày', value: '30days' },
  { label: 'Ngày cụ thể', value: 'custom' },
];

const getDateRange = (filter, customDate) => {
  const now = new Date();
  const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  switch (filter) {
    case 'today':
      return { from: startOfDay(now).toISOString(), to: null };
    case 'yesterday': {
      const y = new Date(now); y.setDate(y.getDate() - 1);
      const end = new Date(y); end.setHours(23, 59, 59, 999);
      return { from: startOfDay(y).toISOString(), to: end.toISOString() };
    }
    case '7days': {
      const d = new Date(now); d.setDate(d.getDate() - 6);
      return { from: startOfDay(d).toISOString(), to: null };
    }
    case '30days': {
      const d = new Date(now); d.setDate(d.getDate() - 29);
      return { from: startOfDay(d).toISOString(), to: null };
    }
    case 'custom': {
      if (!customDate) return { from: startOfDay(now).toISOString(), to: null };
      const d = new Date(customDate);
      const end = new Date(d); end.setHours(23, 59, 59, 999);
      return { from: startOfDay(d).toISOString(), to: end.toISOString() };
    }
    default:
      return { from: startOfDay(now).toISOString(), to: null };
  }
};

const Purchases = () => {
  const [farmers, setFarmers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [dateFilter, setDateFilter] = useState('today');
  const [customDate, setCustomDate] = useState('');

  // Form state
  const [farmerId, setFarmerId] = useState('');
  const [items, setItems] = useState([{ id: Date.now(), name: '', quantity: '', unit: 'kg', price: '' }]);
  const [paidAmount, setPaidAmount] = useState('');
  const [isPaidFull, setIsPaidFull] = useState(false);
  const [location, setLocation] = useState(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (dateFilter !== 'custom') fetchPurchases();
  }, [dateFilter]);

  useEffect(() => {
    if (dateFilter === 'custom' && customDate) fetchPurchases();
  }, [customDate]);

  const fetchPurchases = async () => {
    setLoading(true);
    const { from, to } = getDateRange(dateFilter, customDate);
    const res = await getPurchases(from, to);
    if (res.data) setPurchases(res.data);
    setLoading(false);
  };

  const fetchData = async () => {
    setLoading(true);
    const { from, to } = getDateRange(dateFilter, customDate);
    const [farmersRes, purchasesRes, productsRes] = await Promise.all([
      getFarmers(),
      getPurchases(from, to),
      getProducts(),
    ]);
    if (farmersRes.data) setFarmers(farmersRes.data);
    if (purchasesRes.data) setPurchases(purchasesRes.data);
    if (productsRes.data) setProducts(productsRes.data);
    setLoading(false);
  };

  const handleCreateProduct = async (name) => {
    const { data, error } = await createProduct(name);
    if (!error && data) setProducts(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.price) || 0;
      return sum + (qty * price);
    }, 0);
  };

  const totalAmount = calculateTotal();

  const handleAddItem = () => {
    setItems([...items, { id: Date.now(), name: '', quantity: '', unit: 'kg', price: '' }]);
  };

  const handleRemoveItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleItemChange = (id, field, value) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) return alert('Thiết bị không hỗ trợ GPS');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        alert('Không thể lấy vị trí. Hãy cấp quyền truy cập GPS cho trình duyệt.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (status) => {
    if (!farmerId) return alert('Vui lòng chọn nông dân');
    const validItems = items.filter(i => i.name && i.quantity && i.price);
    if (validItems.length === 0) return alert('Vui lòng nhập ít nhất 1 mặt hàng hợp lệ');

    setIsSubmitting(true);
    const payload = {
      farmer_id: farmerId,
      items: validItems.map(({name, quantity, unit, price}) => ({name, quantity, unit, price, total: quantity * price})),
      total_amount: totalAmount,
      paid_amount: isPaidFull ? totalAmount : (parseFloat(paidAmount) || 0),
      status,
      ...(location && { latitude: location.lat, longitude: location.lng }),
    };

    const { data, error } = await createPurchase(payload);
    setIsSubmitting(false);

    if (error) {
      alert("Lỗi: " + error.message);
    } else {
      setFarmerId('');
      setItems([{ id: Date.now(), name: '', quantity: '', unit: 'kg', price: '' }]);
      setPaidAmount('');
      setIsPaidFull(false);
      setLocation(null);
      fetchPurchases();
    }
  };

  const filterLabel = DATE_FILTERS.find(f => f.value === dateFilter)?.label || '';

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
          <select className="select" value={farmerId} onChange={(e) => setFarmerId(e.target.value)}>
            <option value="">Chọn nông dân...</option>
            {farmers.map(f => (
              <option key={f.id} value={f.id}>{f.name} - {f.phone}</option>
            ))}
          </select>

          {items.map((item, index) => (
            <div key={item.id} className="item-row">
              <div className="flex justify-between items-center mb-1 md:hidden">
                <span className="font-medium text-sm">Mặt hàng {index + 1}</span>
                {items.length > 1 && (
                  <i className="fas fa-times text-red-500 cursor-pointer" onClick={() => handleRemoveItem(item.id)}></i>
                )}
              </div>
              <div className="flex items-center gap-2">
                <ProductAutocomplete
                  value={item.name}
                  onChange={(val) => handleItemChange(item.id, 'name', val)}
                  products={products}
                  onCreateProduct={handleCreateProduct}
                  placeholder="Tên mặt hàng (VD: Rau cải)"
                />
                {items.length > 1 && (
                  <button className="hidden md:block btn btn-secondary btn-sm p-2 text-red-500" onClick={() => handleRemoveItem(item.id)}>
                    <i className="fas fa-trash"></i>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 md:mt-0">
                <input type="number" className="input" placeholder="Số lượng" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)} />
                <select className="select" value={item.unit} onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}>
                  <option value="kg">kg</option>
                  <option value="bó">bó</option>
                  <option value="con">con</option>
                </select>
              </div>
              <input type="number" className="input mt-2 md:mt-0" placeholder="Đơn giá (VND)" value={item.price} onChange={(e) => handleItemChange(item.id, 'price', e.target.value)} />
              <div className="text-right text-gray-500 font-medium md:text-left md:mt-2">
                <span className="md:hidden">Thành tiền: </span>{((parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0)).toLocaleString()} đ
              </div>
            </div>
          ))}

          <button className="btn btn-secondary w-full" onClick={handleAddItem}>
            <i className="fas fa-plus"></i> Thêm mặt hàng
          </button>

          <div className="pt-3 border-t">
            <div className="flex items-center gap-2 mb-2">
              <button
                className={`btn ${location ? 'btn-primary' : 'btn-secondary'} btn-sm flex-1`}
                onClick={handleGetLocation}
                disabled={locating}
              >
                <i className={`fas ${locating ? 'fa-circle-notch fa-spin' : 'fa-location-arrow'}`}></i>
                {locating ? 'Đang lấy...' : location ? 'Cập nhật vị trí' : 'Lấy vị trí'}
              </button>
              <div className="text-xs flex-1 text-right">
                {location ? (
                  <span className="text-green-600 font-medium">
                    <i className="fas fa-check-circle"></i> {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                  </span>
                ) : (
                  <span className="text-gray-400">Chưa có vị trí</span>
                )}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-gray-600">Tổng tiền:</span>
                <span className="text-xl font-bold ml-2 text-green-700">{totalAmount.toLocaleString()} đ</span>
              </div>
            </div>

            <div className="bg-white p-3 rounded border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Thanh toán cho nông dân:</span>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="paidFull" className="w-4 h-4 text-green-600 rounded focus:ring-green-500" checked={isPaidFull} onChange={(e) => setIsPaidFull(e.target.checked)} />
                  <label htmlFor="paidFull" className="text-sm text-gray-700 cursor-pointer">Đã trả đủ</label>
                </div>
              </div>
              {!isPaidFull && (
                <input type="number" className="input text-sm w-full" placeholder="Hoặc nhập số tiền đã trả (VND)..." value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} />
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button className="btn btn-secondary w-full" onClick={() => handleSubmit('pending')} disabled={isSubmitting}>
              <i className="fas fa-save"></i> Lưu pending
            </button>
            <button className="btn btn-primary w-full" onClick={() => handleSubmit('confirmed')} disabled={isSubmitting}>
              <i className="fas fa-check"></i> Lưu & Confirm
            </button>
          </div>
        </div>
      </div>

      {/* Danh sách phiếu */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold">Phiếu {filterLabel}</h3>
          <span className="text-sm text-gray-500">{purchases.length} phiếu</span>
        </div>

        {/* Date filter */}
        <div className="flex gap-1.5 flex-wrap mb-3">
          {DATE_FILTERS.map(f => (
            <button
              key={f.value}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                dateFilter === f.value
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
              }`}
              onClick={() => setDateFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
        {dateFilter === 'custom' && (
          <input
            type="date"
            className="input mb-3 text-sm"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
          />
        )}

        <div className="space-y-2">
          {loading ? (
             <div className="text-center py-4 text-gray-500"><i className="fas fa-circle-notch fa-spin mr-2"></i> Đang tải...</div>
          ) : purchases.length === 0 ? (
             <div className="text-center py-4 text-gray-500">Chưa có phiếu thu mua nào.</div>
          ) : purchases.map(purchase => (
            <div key={purchase.id} className="bg-gray-50 rounded-lg overflow-hidden">
              <div
                className="p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setExpandedId(prev => prev === purchase.id ? null : purchase.id)}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`badge ${purchase.status === 'confirmed' ? 'badge-success' : 'badge-warning'}`}>
                      {purchase.status === 'confirmed' ? 'Confirm' : 'Pending'}
                    </span>
                    <span className="text-sm text-gray-500">{new Date(purchase.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    {dateFilter !== 'today' && (
                      <span className="text-xs text-gray-400">{new Date(purchase.created_at).toLocaleDateString('vi-VN')}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-gray-400">#{purchase.id.slice(0, 8)}</div>
                    <i className={`fas fa-chevron-${expandedId === purchase.id ? 'up' : 'down'} text-xs text-gray-400`}></i>
                  </div>
                </div>
                <div className="font-medium text-gray-800">{purchase.farmer?.name || 'Nông dân không rõ'}</div>
                <div className="text-sm text-gray-500">
                  {purchase.items.map(i => `${i.name} ${i.quantity}${i.unit}`).join(', ')}
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                  <div className="text-sm font-bold text-green-700">{Number(purchase.total_amount).toLocaleString()} đ</div>
                  <div className="flex items-center gap-1 text-xs font-medium">
                    {Number(purchase.paid_amount) >= Number(purchase.total_amount) ? (
                      <span className="text-green-600"><i className="fas fa-check-circle"></i> Đã trả đủ</span>
                    ) : (
                      <span className="text-orange-500"><i className="fas fa-clock"></i> Đã trả {Number(purchase.paid_amount).toLocaleString()}đ</span>
                    )}
                  </div>
                </div>
              </div>
              {expandedId === purchase.id && (
                <div className="px-3 pb-3 border-t border-gray-200 bg-white">
                  <div className="pt-2 space-y-1">
                    <div className="grid grid-cols-4 gap-1 text-xs font-semibold text-gray-500 uppercase pb-1 border-b">
                      <span className="col-span-2">Mặt hàng</span>
                      <span className="text-right">Số lượng</span>
                      <span className="text-right">Thành tiền</span>
                    </div>
                    {purchase.items.map((item, idx) => (
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
                      <span className="text-green-700">{Number(purchase.total_amount).toLocaleString()} đ</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Purchases;
