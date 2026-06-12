import React, { useState, useEffect, useRef } from 'react';
import { getProducts, createProduct, deleteProduct } from '../../lib/tradingApi';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => { fetchProducts(); }, []);

  useEffect(() => {
    if (showAdd) setTimeout(() => inputRef.current?.focus(), 50);
  }, [showAdd]);

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await getProducts();
    if (data) setProducts(data);
    setLoading(false);
  };

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    const exists = products.some(p => p.name.toLowerCase() === name.toLowerCase());
    if (exists) return alert(`"${name}" đã có trong danh sách`);
    setIsSubmitting(true);
    const { data, error } = await createProduct(name);
    setIsSubmitting(false);
    if (!error && data) {
      setProducts(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName('');
      inputRef.current?.focus();
    } else {
      alert('Lỗi: ' + (error?.message || 'Không thể thêm mặt hàng'));
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Xoá "${name}" khỏi danh sách?`)) return;
    setDeletingId(id);
    await deleteProduct(id);
    setProducts(prev => prev.filter(p => p.id !== id));
    setDeletingId(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAdd();
    if (e.key === 'Escape') { setShowAdd(false); setNewName(''); }
  };

  const filtered = search.trim()
    ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase().trim()))
    : products;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">Danh mục sản phẩm</h2>
          <p className="text-gray-600 text-sm">Quản lý các loại rau — dùng để gợi ý khi thu mua &amp; bán</p>
        </div>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{products.length} mặt hàng</span>
      </div>

      <div className="card p-4">
        {/* Search + Add */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input
              type="text"
              className="input pl-9"
              placeholder="Tìm kiếm mặt hàng..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={() => { setShowAdd(v => !v); setNewName(''); }}
          >
            <i className={`fas ${showAdd ? 'fa-times' : 'fa-plus'}`}></i>
            <span className="hidden sm:inline">{showAdd ? 'Huỷ' : 'Thêm'}</span>
          </button>
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="flex gap-2 mb-4 p-3 bg-green-50 rounded-lg border border-green-100">
            <input
              ref={inputRef}
              type="text"
              className="input flex-1"
              placeholder="Tên mặt hàng mới (VD: Rau muống, Cải xanh...)"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              className="btn btn-primary"
              onClick={handleAdd}
              disabled={isSubmitting || !newName.trim()}
            >
              {isSubmitting ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-check"></i>}
              <span className="hidden sm:inline">Lưu</span>
            </button>
          </div>
        )}

        {/* Product list */}
        {loading ? (
          <div className="text-center py-8 text-gray-400">
            <i className="fas fa-circle-notch fa-spin text-2xl mb-2"></i>
            <p className="text-sm">Đang tải...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            {search ? (
              <>
                <i className="fas fa-search text-2xl mb-2"></i>
                <p className="text-sm">Không tìm thấy &ldquo;{search}&rdquo;</p>
                <button
                  className="mt-3 btn btn-primary btn-sm"
                  onClick={() => { setNewName(search); setSearch(''); setShowAdd(true); }}
                >
                  <i className="fas fa-plus"></i> Thêm &ldquo;{search}&rdquo; vào danh sách
                </button>
              </>
            ) : (
              <>
                <i className="fas fa-seedling text-2xl mb-2"></i>
                <p className="text-sm">Chưa có mặt hàng nào</p>
                <button className="mt-3 btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
                  <i className="fas fa-plus"></i> Thêm mặt hàng đầu tiên
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filtered.map((product, idx) => (
              <div
                key={product.id}
                className="flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-green-50 rounded-lg border border-transparent hover:border-green-200 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-gray-400 w-5 text-right tabular-nums">{idx + 1}</span>
                  <i className="fas fa-leaf text-green-400 text-xs"></i>
                  <span className="text-sm font-medium text-gray-800">{product.name}</span>
                </div>
                <button
                  className="opacity-0 group-hover:opacity-100 btn btn-secondary btn-sm p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
                  onClick={() => handleDelete(product.id, product.name)}
                  disabled={deletingId === product.id}
                  title="Xoá"
                >
                  {deletingId === product.id
                    ? <i className="fas fa-circle-notch fa-spin text-xs"></i>
                    : <i className="fas fa-trash text-xs"></i>
                  }
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Tip */}
        {products.length > 0 && (
          <p className="text-xs text-gray-400 text-center mt-4">
            <i className="fas fa-info-circle mr-1"></i>
            Các mặt hàng này sẽ gợi ý tự động khi tạo phiếu thu mua &amp; hoá đơn bán hàng
          </p>
        )}
      </div>
    </div>
  );
};

export default Products;
