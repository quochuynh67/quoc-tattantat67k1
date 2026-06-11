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
  return supabase.from("trading_farmers").select("*").order("created_at", { ascending: false });
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
  return supabase.from("trading_customers").select("*").order("created_at", { ascending: false });
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
