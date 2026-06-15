import supabase, { isSupabaseConfigured } from "./supabaseClient";

// Products (vegetable catalogue)
export async function getProducts() {
  if (!isSupabaseConfigured) return { data: [], error: null };
  return supabase.from("trading_products").select("*").order("name", { ascending: true });
}

export async function createProduct(name: string) {
  if (!isSupabaseConfigured) return { data: null, error: { message: "Supabase not configured" } };
  const user_id = (await supabase.auth.getUser()).data.user?.id;
  if (!user_id) return { data: null, error: { message: "Unauthorized" } };
  return supabase.from("trading_products").insert([{ name: name.trim(), user_id }]).select().single();
}

export async function deleteProduct(id: string) {
  if (!isSupabaseConfigured) return { error: null };
  return supabase.from("trading_products").delete().eq("id", id);
}

// Storage
export async function uploadTradingImage(file: File, folder: 'farmers' | 'customers'): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${folder}/${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const { error } = await supabase.storage.from('trading').upload(fileName, file);
  if (error) throw error;
  const { data } = supabase.storage.from('trading').getPublicUrl(fileName);
  return data.publicUrl;
}

export async function deleteTradingImage(url: string): Promise<void> {
  const path = url.split('/trading/')[1];
  if (!path) return;
  await supabase.storage.from('trading').remove([path]);
}

// Farmers
export async function getFarmers() {
  if (!isSupabaseConfigured) return { data: [], error: { message: "Supabase not configured" } };
  const [farmersRes, purchasesRes] = await Promise.all([
    supabase.from("trading_farmers").select("*").order("created_at", { ascending: false }),
    supabase.from("trading_purchases").select("farmer_id, total_amount"),
  ]);
  if (farmersRes.error) return farmersRes;
  // Aggregate transactions & total per farmer
  const statsMap: Record<string, { transactions: number; total: number }> = {};
  (purchasesRes.data || []).forEach((p: any) => {
    if (!p.farmer_id) return;
    if (!statsMap[p.farmer_id]) statsMap[p.farmer_id] = { transactions: 0, total: 0 };
    statsMap[p.farmer_id].transactions += 1;
    statsMap[p.farmer_id].total += Number(p.total_amount) || 0;
  });
  const data = (farmersRes.data || []).map((f: any) => ({
    ...f,
    transactions: statsMap[f.id]?.transactions || 0,
    total: statsMap[f.id]?.total || 0,
  }));
  return { data, error: null };
}

export async function createFarmer(payload) {
  if (!isSupabaseConfigured) return { data: null, error: { message: "Supabase not configured" } };
  // payload: { name, phone, address, latitude, longitude, images }
  const user_id = (await supabase.auth.getUser()).data.user?.id;
  if (!user_id) return { data: null, error: { message: "Unauthorized" } };
  
  return supabase.from("trading_farmers").insert([{ ...payload, user_id }]).select().single();
}

export async function updateFarmer(id, payload) {
  if (!isSupabaseConfigured) return { data: null, error: { message: "Supabase not configured" } };
  return supabase.from("trading_farmers").update(payload).eq("id", id).select().single();
}

// Customers
export async function getCustomers() {
  if (!isSupabaseConfigured) return { data: [], error: { message: "Supabase not configured" } };
  const [customersRes, salesRes] = await Promise.all([
    supabase.from("trading_customers").select("*").order("created_at", { ascending: false }),
    supabase.from("trading_sales").select("customer_id, total_amount"),
  ]);
  if (customersRes.error) return customersRes;
  // Aggregate transactions & total per customer
  const statsMap: Record<string, { transactions: number; total: number }> = {};
  (salesRes.data || []).forEach((s: any) => {
    if (!s.customer_id) return;
    if (!statsMap[s.customer_id]) statsMap[s.customer_id] = { transactions: 0, total: 0 };
    statsMap[s.customer_id].transactions += 1;
    statsMap[s.customer_id].total += Number(s.total_amount) || 0;
  });
  const data = (customersRes.data || []).map((c: any) => ({
    ...c,
    transactions: statsMap[c.id]?.transactions || 0,
    total: statsMap[c.id]?.total || 0,
  }));
  return { data, error: null };
}

export async function createCustomer(payload) {
  if (!isSupabaseConfigured) return { data: null, error: { message: "Supabase not configured" } };
  const user_id = (await supabase.auth.getUser()).data.user?.id;
  if (!user_id) return { data: null, error: { message: "Unauthorized" } };
  
  return supabase.from("trading_customers").insert([{ ...payload, user_id }]).select().single();
}

export async function updateCustomer(id, payload) {
  if (!isSupabaseConfigured) return { data: null, error: { message: "Supabase not configured" } };
  return supabase.from("trading_customers").update(payload).eq("id", id).select().single();
}

// Purchases
export async function getPurchases(startDate, endDate) {
  if (!isSupabaseConfigured) return { data: [], error: { message: "Supabase not configured" } };
  let query = supabase.from("trading_purchases").select("*, farmer:farmer_id(name)").order("created_at", { ascending: false });
  if (startDate) query = query.gte("created_at", startDate);
  if (endDate) query = query.lte("created_at", endDate);
  return query;
}

export async function createPurchase(payload) {
  if (!isSupabaseConfigured) return { data: null, error: { message: "Supabase not configured" } };
  const user_id = (await supabase.auth.getUser()).data.user?.id;
  if (!user_id) return { data: null, error: { message: "Unauthorized" } };
  
  return supabase.from("trading_purchases").insert([{ ...payload, user_id }]).select().single();
}

export async function updatePurchase(id, payload) {
  if (!isSupabaseConfigured) return { data: null, error: { message: "Supabase not configured" } };
  return supabase.from("trading_purchases").update(payload).eq("id", id).select().single();
}

export async function getPurchasesByFarmer(farmerId: string, startDate?: string, endDate?: string) {
  if (!isSupabaseConfigured) return { data: [], error: null };
  let query = supabase.from("trading_purchases").select("*").eq("farmer_id", farmerId).order("created_at", { ascending: false });
  if (startDate) query = query.gte("created_at", startDate);
  if (endDate) query = query.lte("created_at", endDate);
  return query;
}

export async function getSalesByCustomer(customerId: string, startDate?: string, endDate?: string) {
  if (!isSupabaseConfigured) return { data: [], error: null };
  let query = supabase.from("trading_sales").select("*").eq("customer_id", customerId).order("created_at", { ascending: false });
  if (startDate) query = query.gte("created_at", startDate);
  if (endDate) query = query.lte("created_at", endDate);
  return query;
}

// Sales
export async function getSales(startDate, endDate) {
  if (!isSupabaseConfigured) return { data: [], error: { message: "Supabase not configured" } };
  let query = supabase.from("trading_sales").select("*, customer:customer_id(name)").order("created_at", { ascending: false });
  if (startDate) query = query.gte("created_at", startDate);
  if (endDate) query = query.lte("created_at", endDate);
  return query;
}

export async function createSale(payload) {
  if (!isSupabaseConfigured) return { data: null, error: { message: "Supabase not configured" } };
  const user_id = (await supabase.auth.getUser()).data.user?.id;
  if (!user_id) return { data: null, error: { message: "Unauthorized" } };
  
  return supabase.from("trading_sales").insert([{ ...payload, user_id }]).select().single();
}

export async function updateSale(id, payload) {
  if (!isSupabaseConfigured) return { data: null, error: { message: "Supabase not configured" } };
  return supabase.from("trading_sales").update(payload).eq("id", id).select().single();
}

// Product P&L Analysis
export async function getProductPnL(startDate, endDate) {
  if (!isSupabaseConfigured) return { data: null, error: { message: "Supabase not configured" } };

  let purchasesQ = supabase.from("trading_purchases").select("items, created_at");
  let salesQ = supabase.from("trading_sales").select("items, created_at");

  if (startDate) { purchasesQ = purchasesQ.gte("created_at", startDate); salesQ = salesQ.gte("created_at", startDate); }
  if (endDate)   { purchasesQ = purchasesQ.lte("created_at", endDate);   salesQ = salesQ.lte("created_at", endDate); }

  const [purchasesRes, salesRes] = await Promise.all([purchasesQ, salesQ]);

  type ProductEntry = {
    name: string;
    buyQty: number; buyTotal: number;
    sellQty: number; sellTotal: number;
  };
  const map: Record<string, ProductEntry> = {};

  const key = (name: string) => name.trim().toLowerCase();

  purchasesRes.data?.forEach(p => {
    (p.items as any[])?.forEach(item => {
      const k = key(item.name);
      if (!map[k]) map[k] = { name: item.name, buyQty: 0, buyTotal: 0, sellQty: 0, sellTotal: 0 };
      map[k].buyQty += Number(item.quantity) || 0;
      map[k].buyTotal += (Number(item.quantity) || 0) * (Number(item.price) || 0);
    });
  });

  salesRes.data?.forEach(s => {
    (s.items as any[])?.forEach(item => {
      const k = key(item.name);
      if (!map[k]) map[k] = { name: item.name, buyQty: 0, buyTotal: 0, sellQty: 0, sellTotal: 0 };
      map[k].sellQty += Number(item.quantity) || 0;
      map[k].sellTotal += (Number(item.quantity) || 0) * (Number(item.price) || 0);
    });
  });

  const products = Object.values(map).map(p => {
    const avgBuyPrice = p.buyQty > 0 ? p.buyTotal / p.buyQty : 0;
    const avgSellPrice = p.sellQty > 0 ? p.sellTotal / p.sellQty : 0;
    const matchedQty = Math.min(p.buyQty, p.sellQty);
    const unsoldQty = Math.max(0, p.buyQty - p.sellQty);
    const profitOnSold = matchedQty * (avgSellPrice - avgBuyPrice);
    const unsoldCost = unsoldQty * avgBuyPrice;
    const net = profitOnSold - unsoldCost;
    return { ...p, avgBuyPrice, avgSellPrice, matchedQty, unsoldQty, profitOnSold, unsoldCost, net };
  }).sort((a, b) => a.net - b.net);

  return { data: products, error: null };
}

// Dashboard Stats
export async function getDashboardStats(startDate, endDate) {
  if (!isSupabaseConfigured) return { data: null, error: { message: "Supabase not configured" } };

  let purchasesQuery = supabase
    .from("trading_purchases")
    .select("total_amount, id, farmer_id, farmer:farmer_id(name), created_at");
  let salesQuery = supabase
    .from("trading_sales")
    .select("total_amount, id, customer_id, customer:customer_id(name), created_at");
  let farmersQuery = supabase.from("trading_farmers").select("id", { count: 'exact', head: true });

  if (startDate) {
    purchasesQuery = purchasesQuery.gte("created_at", startDate);
    salesQuery = salesQuery.gte("created_at", startDate);
  }
  if (endDate) {
    purchasesQuery = purchasesQuery.lte("created_at", endDate);
    salesQuery = salesQuery.lte("created_at", endDate);
  }

  const [purchasesRes, salesRes, farmersRes] = await Promise.all([
    purchasesQuery,
    salesQuery,
    farmersQuery,
  ]);

  const totalPurchases = purchasesRes.data?.reduce((sum, p) => sum + Number(p.total_amount), 0) || 0;
  const totalSales = salesRes.data?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;
  const purchasesCount = purchasesRes.data?.length || 0;
  const salesCount = salesRes.data?.length || 0;

  // Top farmers
  const purchasesByFarmer: Record<string, any> = {};
  purchasesRes.data?.forEach(p => {
    if (p.farmer_id) {
      if (!purchasesByFarmer[p.farmer_id])
        purchasesByFarmer[p.farmer_id] = { id: p.farmer_id, name: p.farmer?.name || 'Nông dân', total: 0, count: 0 };
      purchasesByFarmer[p.farmer_id].total += Number(p.total_amount);
      purchasesByFarmer[p.farmer_id].count += 1;
    }
  });
  const topFarmers = Object.values(purchasesByFarmer).sort((a, b) => b.total - a.total).slice(0, 5);

  // Top customers
  const salesByCustomer: Record<string, any> = {};
  salesRes.data?.forEach(s => {
    const key = s.customer_id || '__walkin__';
    if (!salesByCustomer[key])
      salesByCustomer[key] = { id: key, name: s.customer?.name || 'Khách vãng lai', total: 0, count: 0 };
    salesByCustomer[key].total += Number(s.total_amount);
    salesByCustomer[key].count += 1;
  });
  const topCustomers = Object.values(salesByCustomer).sort((a, b) => b.total - a.total).slice(0, 5);

  // Chart data: group by day (YYYY-MM-DD)
  const dayMap: Record<string, { date: string; purchases: number; sales: number }> = {};
  purchasesRes.data?.forEach(p => {
    const day = p.created_at.slice(0, 10);
    if (!dayMap[day]) dayMap[day] = { date: day, purchases: 0, sales: 0 };
    dayMap[day].purchases += Number(p.total_amount);
  });
  salesRes.data?.forEach(s => {
    const day = s.created_at.slice(0, 10);
    if (!dayMap[day]) dayMap[day] = { date: day, purchases: 0, sales: 0 };
    dayMap[day].sales += Number(s.total_amount);
  });
  const chartData = Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));

  return {
    data: {
      totalPurchases,
      totalSales,
      purchasesCount,
      salesCount,
      profit: totalSales - totalPurchases,
      farmersCount: farmersRes.count || 0,
      topFarmers,
      topCustomers,
      chartData,
    },
    error: null,
  };
}
