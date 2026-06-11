import supabase, { isSupabaseConfigured } from "./supabaseClient";

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
  
  let purchasesQuery = supabase.from("trading_purchases").select("total_amount, id, farmer_id, farmer:farmer_id(name)");
  let salesQuery = supabase.from("trading_sales").select("total_amount, id");
  let farmersQuery = supabase.from("trading_farmers").select("id", { count: 'exact', head: true });

  if (startDate) {
    purchasesQuery.gte("created_at", startDate);
    salesQuery.gte("created_at", startDate);
  }
  if (endDate) {
    purchasesQuery.lte("created_at", endDate);
    salesQuery.lte("created_at", endDate);
  }

  const [purchasesRes, salesRes, farmersRes] = await Promise.all([
    purchasesQuery,
    salesQuery,
    farmersQuery
  ]);

  const totalPurchases = purchasesRes.data?.reduce((sum, p) => sum + Number(p.total_amount), 0) || 0;
  const totalSales = salesRes.data?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;
  const purchasesCount = purchasesRes.data?.length || 0;
  const salesCount = salesRes.data?.length || 0;

  const purchasesByFarmer = {};
  purchasesRes.data?.forEach(p => {
    if (p.farmer_id) {
       if (!purchasesByFarmer[p.farmer_id]) {
         purchasesByFarmer[p.farmer_id] = { id: p.farmer_id, name: p.farmer?.name || 'Nông dân', total: 0, count: 0 };
       }
       purchasesByFarmer[p.farmer_id].total += Number(p.total_amount);
       purchasesByFarmer[p.farmer_id].count += 1;
    }
  });
  const topFarmers = Object.values(purchasesByFarmer).sort((a,b) => b.total - a.total).slice(0, 5);
  
  return {
    data: {
      totalPurchases,
      totalSales,
      purchasesCount,
      salesCount,
      profit: totalSales - totalPurchases,
      farmersCount: farmersRes.count || 0,
      topFarmers
    },
    error: null
  };
}
