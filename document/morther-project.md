# Tài liệu: Sub-feature Quản lý thu mua & bán lại rau củ quả

Một module quản lý thu mua hàng ngày từ nông dân, ghi lại hoạt động thu và bán, kèm thống kê chi tiết và lưu vị trí nông dân để tra cứu lịch sử.

## 1. Mục tiêu

- Quản lý thu mua rau củ quả hàng ngày từ nông dân.
- Ghi lại:
  - Thông tin nông dân.
  - Vị trí nông dân khi thu mua.
  - Chi tiết từng mặt hàng thu mua.
  - Lịch sử mua bán với từng nông dân.
- Quản lý bán lại trong ngày:
  - 1 hoá đơn cho 1 người mua có thể có nhiều món.
  - Lịch sử hoá đơn của từng người mua.
- Thống kê chi tiết:
  - Theo ngày / tuần / tháng.
  - Theo nông dân.
  - Theo mặt hàng.
  - Theo người mua.
  - Lời / lỗ.

## 2. Cấu trúc chức năng

### 2.1. Quản lý nông dân

- Lưu thông tin:
  - `name`: tên
  - `phone`: số điện thoại
  - `address`: địa chỉ (nếu có)
  - `notes`: ghi chú
- Tạo nông dân mới hoặc chọn từ danh sách.
- Xem vị trí trung bình của nông dân (nếu lưu nhiều lần, lấy trung bình hoặc vị trí lần cuối).
- Xem lịch sử vị trí của nông dân trên bản đồ.

### 2.2. Phiếu thu mua (`purchases`)

Ghi mỗi lần mua rau củ quả:

- Ngày giờ: `purchased_at`
- Nông dân: `farmer_id`
- Vị trí:
  - `location_lat` (latitude)
  - `location_lng` (longitude)
  - `location_text` (ghi chú địa chỉ)
- Chi tiết mặt hàng: trong `purchase_items`
- Tổng tiền: `total_amount`
- Trạng thái: `status` (ví dụ: `pending`, `confirmed`)

### 2.3. Chi tiết phiếu thu mua (`purchase_items`)

Mỗi phiếu có nhiều mặt hàng:

- `product_name`: tên rau củ quả
- `unit`: đơn vị (`kg`, `bó`)
- `quantity`: số lượng
- `unit_price`: đơn giá mua
- `subtotal`: `quantity * unit_price`

### 2.4. Hoá đơn bán (`sales`)

1 hoá đơn cho 1 người mua, có thể nhiều món:

- Ngày giờ bán: `sold_at`
- Khách:
  - `customer_id` (nếu có khách lưu trong hệ thống)
  - `customer_name` (nếu khách lẻ)
  - `phone` (optional)
- Tổng tiền: `total_amount`
- Lợi nhuận: `profit` (có thể tính tự động)
- Trạng thái: `status` (`pending`, `confirmed`, `cancelled`)
- Ghi chú: `note`

### 2.5. Chi tiết hoá đơn bán (`sale_items`)

- `product_name`: tên mặt hàng bán
- `unit`: đơn vị (`kg`, `bó`)
- `quantity`: số lượng bán
- `unit_price`: đơn giá bán
- `subtotal`: `quantity * unit_price`

### 2.6. Khách hàng (`customers`)

Quản lý người mua lâu dài:

- `name`: tên
- `phone`: số điện thoại
- `address`: địa chỉ
- `notes`: ghi chú

### 2.7. Báo cáo thống kê

Thống kê theo:

- Ngày / tuần / tháng
- Nông dân
- Mặt hàng
- Người mua
- Lời / lỗ

Các chỉ số:

- Tổng thu mua, tổng bán
- Lợi nhuận = tổng bán – tổng thu mua
- Top nông dân cung cấp nhiều nhất / mang lại lợi nhuận cao nhất
- Top mặt hàng bán nhiều nhất
- Top người mua (tổng tiền, số lần mua)

Có thể lưu bảng tổng hợp `daily_summaries` để tăng tốc report, hoặc tính query trực tiếp.

## 3. Mô hình dữ liệu (Supabase / Postgres)

### 3.1. Bảng `farmers`

```sql
CREATE TABLE farmers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3.2. Bảng `purchases`

```sql
CREATE TYPE purchase_status AS ENUM ('pending', 'confirmed');

CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id),
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  location_text TEXT,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  status purchase_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3.3. Bảng `purchase_items`

```sql
CREATE TYPE product_unit AS ENUM ('kg', 'bó');

CREATE TABLE purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  unit product_unit NOT NULL,
  quantity NUMERIC NOT NULL,
  unit_price NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3.4. Bảng `customers`

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3.5. Bảng `sales` (hoá đơn)

```sql
CREATE TYPE sale_status AS ENUM ('pending', 'confirmed', 'cancelled');

CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  customer_name TEXT,              -- nếu không có customer_id
  phone TEXT,                      -- optional
  sold_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_amount NUMERIC NOT NULL DEFAULT 0,
  profit NUMERIC,
  status sale_status NOT NULL DEFAULT 'pending',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3.6. Bảng `sale_items`

```sql
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  unit TEXT NOT NULL,              -- 'kg', 'bó', ...
  quantity NUMERIC NOT NULL,
  unit_price NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3.7. (Optional) Bảng `daily_summaries`

```sql
CREATE TABLE daily_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day DATE NOT NULL,
  total_purchase_amount NUMERIC NOT NULL DEFAULT 0,
  total_sale_amount NUMERIC NOT NULL DEFAULT 0,
  total_profit NUMERIC,
  total_purchase_quantity NUMERIC NOT NULL DEFAULT 0,
  total_sale_quantity NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX ON daily_summaries (day);
```

## 4. Row Level Security (RLS)

Bật RLS cho các bảng:

```sql
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;
```

Chính sách mẫu (coi như user đã login, có `auth.uid()`):

```sql
CREATE POLICY "allow_authenticated_all" ON farmers
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "allow_authenticated_all" ON purchases
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "allow_authenticated_all" ON purchase_items
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "allow_authenticated_all" ON customers
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "allow_authenticated_all" ON sales
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "allow_authenticated_all" ON sale_items
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "allow_authenticated_all" ON daily_summaries
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
```

Nếu có phân quyền (admin / nhân viên), cần thêm cột `role` hoặc `team_id` và viết chính sách phức tạp hơn.

## 5. Luồng sử dụng (User flow)

### 5.1. Thu mua

1. Mở trang “Thu mua”.
2. Chọn nông dân:
   - Chọn từ danh sách.
   - Hoặc tạo nông dân mới (name, phone, address).
3. Nhập chi tiết mặt hàng:
   - product_name, unit (`kg`, `bó`), quantity, unit_price.
   - Tự tính subtotal.
4. Ghi vị trí:
   - Dùng GPS từ device (nếu có).
   - Hoặc chọn vị trí trên map.
   - Lưu: `location_lat`, `location_lng`, `location_text`.
5. Lưu phiếu thu mua:
   - Tạo `purchase` với `status = 'pending'`.
   - Tạo các `purchase_items`.
   - Tính `total_amount` = tổng `subtotal`.
6. Nếu cần, confirm phiếu: `status = 'confirmed'`.

### 5.2. Bán hàng (tạo hoá đơn)

1. Mở trang “Bán hàng”.
2. Chọn khách:
   - Chọn từ danh sách `customers`.
   - Hoặc nhập name, phone cho khách lẻ.
3. Nhập nhiều món trong 1 hoá đơn:
   - product_name, unit (`kg`, `bó`), quantity, unit_price.
   - Tự tính subtotal.
4. Tự tính:
   - `total_amount` = tổng `subtotal`.
   - `profit` = `total_amount` – (chi phí nguyên món, nếu bạn lưu giá mua).
5. Lưu:
   - Tạo `sales` với `status = 'pending'`.
   - Tạo các `sale_items`.
6. Confirm hoá đơn: `status = 'confirmed'`.

### 5.3. Lịch sử & tra cứu

- Trang “Lịch sử giao dịch”:
  - Show danh sách `purchases` và `sales`.
  - Filter theo ngày, nông dân, khách, loại giao dịch.
  - Click vào phiếu để xem chi tiết.
- Trang “Lịch sử nông dân”:
  - Show danh sách các lần mua từ nông dân đó.
  - Hiển thị vị trí từng lần (lat, lng, text).
  - Có thể map các điểm vị trí trên bản đồ.
- Trang “Thông tin khách”:
  - Show thông tin khách.
  - Show danh sách tất giả hoá đơn của khách này.
  - Click vào hoá đơn → xem chi tiết `sale_items`.

### 5.4. Báo cáo thống kê

- Trang “Dashboard / Báo cáo”:
  - Filter theo ngày / tuần / tháng.
  - Hiển thị:
    - Tổng thu mua, tổng bán.
    - Lời/lỗ.
    - Top nông dân.
    - Top mặt hàng.
    - Top người mua.
  - Có thể vẽ chart:
    - Doanh thu theo ngày.
    - Lợi nhuận theo ngày.
    - Tỉ lệ mặt hàng.

## 6. Vị trí nông dân trên bản đồ

### 6.1. Thiết kế dữ liệu vị trí

- Mỗi lần thu mua: lưu `location_lat`, `location_lng`, `location_text` trong `purchases`.
- Nếu `lat` hoặc `lng` `NULL`, bỏ qua điểm đó khi vẽ map.

### 6.2. Query lấy tất cả vị trí

```ts
// src/api/purchases.ts
export async function getPurchaseLocations() {
  const { data, error } = await supabase
    .from('purchases')
    .select(`
      id,
      purchased_at,
      location_lat,
      location_lng,
      location_text,
      total_amount,
      farmer_id,
      farmers:name
    `)
    .is('location_lat', null, false)
    .is('location_lng', null, false);

  if (error) throw error;
  return data;
}
```

### 6.3. Query lấy vị trí lần cuối của mỗi nông dân

```sql
SELECT DISTINCT ONET (p.farmer_id) AS farmer_id,
  p.location_lat,
  p.location_lng,
  p.location_text,
  p.purchased_at
FROM purchases p
WHERE p.status = 'confirmed'
  AND p.location_lat IS NOT NULL
  AND p.location_lng IS NOT NULL
ORDER BY p.farmer_id, p.purchased_at DESC;
```

(Tuy nhiên, nếu Supabase JS không hỗ trợ `DISTINCT ON`, lấy tất cả purchases đã confirm, sort theo `purchased_at DESC`, lọc trong JS để lấy lần cuối mỗi `farmer_id`.)

### 6.4. Component MapPicker (chọn vị trí)

Dùng Leaflet + `react-leaflet`:

- Cài:
  ```bash
  npm install react-leaflet leaflet
  ```
- Thêm CSS:
  ```ts
  import 'leaflet/dist/leaflet.css';
  ```
- Component:
  - Hiển thị map.
  - Cho phép chọn điểm.
  - Trả về `lat`, `lng`, và có thể `location_text` (nếu có reverse geocode).

### 6.5. Component FarmerLocationsMap (hiển thị tất vị trí)

- Lấy tất vị trí từ `getPurchaseLocations()`.
- Hiển thị marker cho mỗi điểm.
- Popup:
  - Tên nông dân.
  - Ngày mua.
  - Địa chỉ.
  - Tổng tiền.

### 6.6. Component FarmerHistoryMap (lịch sử vị trí 1 nông dân)

- Query:
  ```ts
  export async function getPurchaseLocationsByFarmer(farmerId: string)
  ```
- Hiển thị:
  - Marker cho mỗi điểm.
  - Đường nối các điểm (Polyline).
  - Popup: ngày mua, địa chỉ, tổng tiền.

### 6.7. Tích hợp vào trang

- `HistoryPage`:
  - Lịch sử giao dịch + map chung tất vị trí.
- `FarmersPage`:
  - Danh sách nông dân + link vào `FarmerDetailPage`.
- `FarmerDetailPage`:
  - Info nông dân + `FarmerHistoryMap`.

## 7. Quản lý hoá đơn cho người mua

### 7.1. Mô hình

- 1 người mua có thể mua nhiều món trong 1 lần → 1 hoá đơn (`sales`) với nhiều món (`sale_items`).
- `sales`:
  - `customer_id` (nếu có khách lưu).
  - `customer_name` (nếu khách lẻ).
  - `total_amount`, `profit`, `note`.

### 7.2. Luồng

- Tạo hoá đơn:
  - Chọn khách hoặc nhập khách lẻ.
  - Nhập nhiều món.
  - Tự tính `total_amount`, `profit`.
  - Lưu `sales` + `sale_items`.
- Lịch sử hoá đơn của 1 khách:
  - Query theo `customer_id` hoặc `customer_name`.
  - Show danh sách `sales`.
  - Click vào hoá đơn → xem chi tiết.

### 7.3. Báo cáo theo người mua

- Tổng tiền mua của từng khách:
  ```sql
  SELECT
    COALESCE(c.name, s.customer_name) AS customer_name,
    SUM(s.total_amount) AS total_spent,
    COUNT(s.id) AS sale_count
  FROM sales s
  LEFT JOIN customers c ON c.id = s.customer_id
  WHERE s.status = 'confirmed'
  GROUP BY COALESCE(c.name, s.customer_name)
  ORDER BY total_spent DESC;
  ```
- Món mua thường xuyên của 1 khách:
  ```sql
  SELECT
    si.product_name,
    SUM(si.quantity) AS total_quantity,
    COUNT(*) AS times_bought
  FROM sale_items si
  JOIN sales s ON s.id = si.sale_id
  WHERE s.customer_id = :customer_id
    AND s.status = 'confirmed'
  GROUP BY si.product_name
  ORDER BY total_quantity DESC;
  ```

## 8. Cấu trúc thư mục Vite (React / TypeScript)

```bash
src/
  api/
    supabase.ts
    farmers.ts
    purchases.ts
    purchaseItems.ts
    customers.ts
    sales.ts
    saleItems.ts
    dailySummaries.ts
  components/
    farmers/
      FarmerForm.tsx
      FarmerList.tsx
    purchases/
      PurchaseForm.tsx
      PurchaseList.tsx
      PurchaseDetail.tsx
    sales/
      SaleForm.tsx
      SaleList.tsx
      SaleDetail.tsx
    customers/
      CustomerForm.tsx
      CustomerList.tsx
      CustomerDetail.tsx
    dashboard/
      DashboardStats.tsx
      DashboardCharts.tsx
    common/
      MapPicker.tsx
      FarmerLocationsMap.tsx
      FarmerHistoryMap.tsx
      DateFilter.tsx
      Table.tsx
      PurchaseItemRow.tsx
  pages/
    FarmersPage.tsx
    PurchasesPage.tsx
    SalesPage.tsx
    CustomersPage.tsx
    CustomerDetailPage.tsx
    HistoryPage.tsx
    DashboardPage.tsx
    SaleDetailPage.tsx
  types/
    farmer.ts
    purchase.ts
    customer.ts
    sale.ts
    summary.ts
    database.ts
  utils/
    currency.ts
    date.ts
  App.tsx
  main.tsx
```

## 9. API mẫu (Supabase)

### 9.1. Supabase client

```ts
// src/api/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### 9.2. Farmers

```ts
// src/api/farmers.ts
export async function getFarmers() {
  const { data, error } = await supabase
    .from('farmers')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createFarmer(farmer: {
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
}) {
  const { data, error } = await supabase
    .from('farmers')
    .insert(farmer)
    .select()
    .single();
  if (error) throw error;
  return data;
}
```

### 9.3. Purchases

```ts
// src/api/purchases.ts
export async function getPurchaseLocations() {
  const { data, error } = await supabase
    .from('purchases')
    .select(`
      id,
      purchased_at,
      location_lat,
      location_lng,
      location_text,
      total_amount,
      farmer_id,
      farmers:name
    `)
    .is('location_lat', null, false)
    .is('location_lng', null, false);
  if (error) throw error;
  return data;
}

export async function getPurchaseLocationsByFarmer(farmerId: string) {
  const { data, error } = await supabase
    .from('purchases')
    .select(`
      id,
      purchased_at,
      location_lat,
      location_lng,
      location_text,
      total_amount
    `)
    .eq('farmer_id', farmerId)
    .is('location_lat', null, false)
    .is('location_lng', null, false)
    .order('purchased_at', { ascending: false });
  if (error) throw error;
  return data;
}
```

### 9.4. Customers

```ts
// src/api/customers.ts
export async function getCustomers() {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createCustomer(customer: {
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
}) {
  const { data, error } = await supabase
    .from('customers')
    .insert(customer)
    .select()
    .single();
  if (error) throw error;
  return data;
}
```

### 9.5. Sales (hoá đơn)

```ts
// src/api/sales.ts
export async function getSales({
  customerId,
  customerName,
  from,
  to,
}: {
  customerId?: string;
  customerName?: string;
  from?: string;
  to?: string;
}) {
  let query = supabase
    .from('sales')
    .select('*, customers:name')
    .order('sold_at', { ascending: false });

  if (customerId) query = query.eq('customer_id', customerId);
  if (customerName) query = query.eq('customer_name', customerName);
  if (from) query = query.gte('sold_at', from);
  if (to) query = query.lte('sold_at', to);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createSaleAndItems({
  sale,
  items,
}: {
  sale: {
    customer_id?: string;
    customer_name?: string;
    phone?: string;
    sold_at?: string;
    total_amount: number;
    profit?: number;
    status?: 'pending' | 'confirmed';
    note?: string;
  };
  items: Array<{
    product_name: string;
    unit: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }>;
}) {
  // 1. Tạo sale
  const { data: saleData, error: saleError } = await supabase
    .from('sales')
    .insert({
      customer_id: sale.customer_id,
      customer_name: sale.customer_name,
      phone: sale.phone,
      sold_at: sale.sold_at || new Date().toISOString(),
      total_amount: sale.total_amount,
      profit: sale.profit,
      status: sale.status || 'pending',
      note: sale.note,
    })
    .select()
    .single();
  if (saleError) throw saleError;

  // 2. Tạo sale_items
  const itemsToInsert = items.map((item) => ({
    sale_id: saleData.id,
    product_name: item.product_name,
    unit: item.unit,
    quantity: item.quantity,
    unit_price: item.unit_price,
    subtotal: item.subtotal,
  }));

  const { error: itemsError } = await supabase
    .from('sale_items')
    .insert(itemsToInsert);
  if (itemsError) throw itemsError;

  return saleData;
}
```

## 10. Query thống kê mẫu

### 10.1. Tổng thu mua + bán theo ngày

```sql
SELECT
  DATE(p.purchased_at) AS day,
  SUM(p.total_amount) AS total_purchase
FROM purchases p
WHERE p.status = 'confirmed'
GROUP BY DATE(p.purchased_at);
```

```sql
SELECT
  DATE(s.sold_at) AS day,
  SUM(s.total_amount) AS total_sale
FROM sales s
WHERE s.status = 'confirmed'
GROUP BY DATE(s.sold_at);
```

### 10.2. Lợi nhuận theo ngày

```sql
SELECT
  d.day,
  d.total_sale_amount - d.total_purchase_amount AS profit
FROM daily_summaries d;
```

### 10.3. Top nông dân theo tổng thu mua

```sql
SELECT
  f.id,
  f.name,
  SUM(p.total_amount) AS total_purchase_amount,
  COUNT(p.id) AS purchase_count
FROM farmers f
JOIN purchases p ON p.farmer_id = f.id
WHERE p.status = 'confirmed'
GROUP BY f.id, f.name
ORDER BY total_purchase_amount DESC
LIMIT 10;
```

### 10.4. Lịch sử vị trí của một nông dân

```sql
SELECT
  p.purchased_at,
  p.location_lat,
  p.location_lng,
  p.location_text,
  p.total_amount
FROM purchases p
WHERE p.farmer_id = :farmer_id
ORDER BY p.purchased_at DESC;
```

## 11. Lưu ý triển khai

- Dùng TypeScript và define `Database` type từ Supabase để có type safety.
- Dùng query riêng hoặc view để tính thống kê, tránh tính toán nặng trên mỗi request.
- Nếu dữ liệu lớn:
  - Tạo `daily_summaries` bằng cron job hoặc trigger mỗi khi có giao dịch mới.
- Dùng Supabase Realtime để dashboard cập nhật tự động khi có giao dịch mới.
- Map:
  - Leaflet + OpenStreetMap (miễn phí).
  - Hoặc Google Maps / Mapbox nếu có API key và cần reverse geocode.
- Đơn vị:
  - Chỉ hỗ trợ `kg`, `bó` (có thể dùng `ENUM` hoặc kiểm tra ở frontend).

## 12. Bước triển khai gợi ý

1. Tạo schema trong Supabase (các bảng + RLS).
2. Viết API client (các file trong `src/api`).
3. Làm trang:
   - FarmersPage (quản lý nông dân).
   - PurchasesPage (thu mua).
   - SalesPage (bán hàng / hoá đơn).
   - CustomersPage (quản lý khách).
   - CustomerDetailPage (lịch sử hoá đơn của 1 khách).
4. Làm HistoryPage (lịch sử giao dịch + map vị trí nông dân).
5. Làm DashboardPage (báo cáo thống kê + chart).
6. Test CRUD + filter + thống kê.
7. Tối ưu query và thêm real-time nếu cần.

## 13. Tóm tắt

- Mỗi lần thu mua:
  - Lưu nông dân, vị trí (`lat`, `lng`, `text`), chi tiết mặt hàng (`kg`, `bó`).
- Bán hàng:
  - 1 hoá đơn cho 1 người mua, có nhiều món.
  - Lưu `customer_id` hoặc `customer_name`.
- Vị trí:
  - Hiển thị tất vị trí trên map.
  - Hiển thị lịch sử vị trí của từng nông dân trên map.
- Thống kê:
  - Theo ngày, nông dân, mặt hàng, người mua.
  - Lời/lỗ, top nông dân, top mặt hàng, top người mua.

Tài liệu này đủ để một AI agent khác:
- Tạo schema Supabase.
- Viết API client.
- Làm các trang và component frontend (Vite + React).
- Xây dựng báo cáo và map vị trí.