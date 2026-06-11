import React, { useState, useEffect } from 'react';

const ProductAutocomplete = ({ value, onChange, products, onCreateProduct, placeholder }) => {
  const [query, setQuery] = useState(value || '');
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => { setQuery(value || ''); }, [value]);

  const trimmed = query.trim();
  const filtered = trimmed
    ? products.filter(p => p.name.toLowerCase().includes(trimmed.toLowerCase()))
    : products;

  const exactMatch = products.some(p => p.name.toLowerCase() === trimmed.toLowerCase());
  const showAddOption = trimmed.length > 0 && !exactMatch;
  const showDropdown = open && (filtered.length > 0 || showAddOption);

  const handleSelect = (name) => {
    setQuery(name);
    onChange(name);
    setOpen(false);
  };

  const handleAdd = async () => {
    if (!trimmed || adding) return;
    setAdding(true);
    await onCreateProduct(trimmed);
    setAdding(false);
    onChange(trimmed);
    setOpen(false);
  };

  return (
    <div className="relative flex-1">
      <input
        type="text"
        className="input w-full"
        placeholder={placeholder || 'Tên mặt hàng'}
        value={query}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        autoComplete="off"
      />
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl z-50 mt-1 overflow-hidden">
          <div className="max-h-52 overflow-y-auto">
            {filtered.map(p => (
              <div
                key={p.id}
                className="px-3 py-2.5 hover:bg-green-50 active:bg-green-100 cursor-pointer text-sm flex items-center gap-2"
                onMouseDown={() => handleSelect(p.name)}
              >
                <i className="fas fa-leaf text-green-400 text-xs w-3"></i>
                <span>{p.name}</span>
              </div>
            ))}
          </div>
          {showAddOption && (
            <div
              className="px-3 py-2.5 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 cursor-pointer text-sm text-blue-700 border-t border-blue-100 flex items-center gap-2 font-medium"
              onMouseDown={handleAdd}
            >
              {adding ? (
                <><i className="fas fa-circle-notch fa-spin text-xs w-3"></i> Đang thêm...</>
              ) : (
                <><i className="fas fa-plus-circle text-xs w-3"></i> Thêm &ldquo;{trimmed}&rdquo; vào danh sách</>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductAutocomplete;
