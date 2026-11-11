import React, { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import "./CommunityHub.css";

const TABS = [
  ["today", "☀️", "Hôm nay"], ["directory", "☎️", "Danh bạ"],
  ["market", "🧺", "Chợ quê"], ["report", "📍", "Phản ánh"], ["farm", "🌾", "Sổ mùa vụ"],
];

const DIRECTORY = [
  { group: "Khẩn cấp", name: "Công an", phone: "113", note: "An ninh, trật tự" },
  { group: "Khẩn cấp", name: "Cứu hỏa", phone: "114", note: "Cháy nổ, cứu hộ" },
  { group: "Khẩn cấp", name: "Cấp cứu", phone: "115", note: "Hỗ trợ y tế" },
  { group: "Hỗ trợ", name: "Tổng đài bảo vệ trẻ em", phone: "111", note: "Miễn phí 24/7" },
  { group: "Hỗ trợ", name: "Điện lực miền Nam", phone: "19001006", note: "Báo mất điện, sự cố điện" },
  { group: "Hỗ trợ", name: "Tổng đài hành chính công", phone: "1022", note: "Hỏi thủ tục hành chính" },
];

const DEFAULT_MARKET = [
  { id: 1, type: "Bán", title: "Rau cải vườn mới cắt", place: "Phú Tân", price: "Liên hệ", phone: "", age: "Hôm nay" },
  { id: 2, type: "Cần thuê", title: "Máy gặt cho 3 công lúa", place: "Tân Trung", price: "Thỏa thuận", phone: "", age: "Hôm nay" },
  { id: 3, type: "Cho tặng", title: "Cây giống còn dư", place: "Phú An", price: "Miễn phí", phone: "", age: "Hôm qua" },
];

const DEFAULT_REPORTS = [
  { id: 1, type: "Đường sá", place: "Tuyến đường liên xã", detail: "Có đoạn ổ gà, bà con đi buổi tối chú ý.", status: "Mới ghi nhận" },
  { id: 2, type: "Thất lạc", place: "Khu vực chợ", detail: "Nhặt được chùm chìa khóa, xin liên hệ để nhận lại.", status: "Đang tìm chủ" },
];

const readLocal = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
};

const CommunityHub = () => {
  const [tab, setTab] = useState("today");
  const [query, setQuery] = useState("");
  const [market, setMarket] = useState(() => readLocal("pt-market", DEFAULT_MARKET));
  const [reports, setReports] = useState(() => readLocal("pt-reports", DEFAULT_REPORTS));
  const [farmRows, setFarmRows] = useState(() => readLocal("pt-farm-log", []));
  const [toast, setToast] = useState("");
  const today = new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date());

  const save = (key, value, setter) => { localStorage.setItem(key, JSON.stringify(value)); setter(value); setToast("Đã lưu an toàn trên thiết bị này"); setTimeout(() => setToast(""), 2500); };
  const filteredDirectory = DIRECTORY.filter((x) => `${x.name} ${x.note}`.toLowerCase().includes(query.toLowerCase()));
  const totals = useMemo(() => farmRows.reduce((a, x) => ({ income: a.income + Number(x.income || 0), cost: a.cost + Number(x.cost || 0) }), { income: 0, cost: 0 }), [farmRows]);

  const submitMarket = (e) => {
    e.preventDefault(); const f = new FormData(e.currentTarget);
    const item = { id: Date.now(), type: f.get("type"), title: f.get("title"), place: f.get("place"), price: f.get("price") || "Liên hệ", phone: f.get("phone"), age: "Vừa đăng" };
    save("pt-market", [item, ...market], setMarket); e.currentTarget.reset();
  };
  const submitReport = (e) => {
    e.preventDefault(); const f = new FormData(e.currentTarget);
    const item = { id: Date.now(), type: f.get("type"), place: f.get("place"), detail: f.get("detail"), status: "Mới ghi nhận" };
    save("pt-reports", [item, ...reports], setReports); e.currentTarget.reset();
  };
  const submitFarm = (e) => {
    e.preventDefault(); const f = new FormData(e.currentTarget);
    const row = { id: Date.now(), date: f.get("date"), activity: f.get("activity"), cost: f.get("cost"), income: f.get("income") };
    save("pt-farm-log", [row, ...farmRows], setFarmRows); e.currentTarget.reset();
  };

  return <main className="community-page">
    <Helmet><title>Phú Tân hôm nay | Tiện ích cho bà con</title><meta name="description" content="Bản tin, danh bạ, chợ quê, phản ánh cộng đồng và sổ mùa vụ dành cho bà con Phú Tân." /></Helmet>
    <section className="community-hero">
      <div className="community-shell">
        <span className="community-kicker">TRUNG TÂM CỘNG ĐỒNG</span>
        <h1>Phú Tân hôm nay</h1>
        <p>Mọi thông tin thiết thực cho bà con, gọn trong một nơi.</p>
        <div className="community-date">📅 {today}</div>
      </div>
    </section>
    <div className="community-shell community-layout">
      <nav className="community-tabs" aria-label="Tiện ích cộng đồng">
        {TABS.map(([id, icon, label]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}><span>{icon}</span>{label}</button>)}
      </nav>

      {tab === "today" && <section className="hub-panel">
        <div className="hub-heading"><div><span className="eyebrow">NHÌN NHANH</span><h2>Thông tin bà con cần hôm nay</h2></div><button className="listen-button" onClick={() => speechSynthesis.speak(new SpeechSynthesisUtterance("Bản tin Phú Tân hôm nay. Trời có nắng xen mây, bà con chú ý theo dõi mưa chiều. Giá nông sản là giá tham khảo và cần xác nhận với thương lái trước khi giao dịch."))}>🔊 Nghe bản tin</button></div>
        <div className="today-grid">
          <article className="big-status"><span>🌤️</span><div><small>THỜI TIẾT THAM KHẢO</small><strong>Nắng xen mây</strong><p>Nên kiểm tra dự báo thực tế trước khi phun thuốc hoặc thu hoạch.</p></div></article>
          <article><small>🌾 GIÁ NÔNG SẢN</small><strong>Giá tham khảo</strong><p>Đối chiếu thương lái địa phương trước khi chốt bán.</p><button onClick={() => setTab("market")}>Xem chợ quê →</button></article>
          <article><small>⚡ ĐIỆN & NƯỚC</small><strong>Kiểm tra sự cố</strong><p>Gọi điện lực khi mất điện kéo dài hoặc có nguy cơ mất an toàn.</p><a href="tel:19001006">Gọi 1900 1006</a></article>
          <article><small>📣 CẢNH BÁO</small><strong>Đi chậm khi trời mưa</strong><p>Chú ý đoạn đường trơn, ngập và khu vực đang thi công.</p><button onClick={() => setTab("report")}>Xem phản ánh →</button></article>
        </div>
        <div className="notice"><b>ℹ️ Lưu ý:</b> Dữ liệu thời tiết và giá trên bản thử nghiệm chỉ mang tính tham khảo. Không dùng thay cho thông báo chính thức.</div>
      </section>}

      {tab === "directory" && <section className="hub-panel">
        <div className="hub-heading"><div><span className="eyebrow">GỌI NHANH</span><h2>Danh bạ thiết yếu</h2></div><input className="hub-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm điện lực, cấp cứu…" /></div>
        <div className="directory-grid">{filteredDirectory.map((x) => <article key={x.phone}><div className="directory-icon">{x.group === "Khẩn cấp" ? "🆘" : "☎️"}</div><div><small>{x.group}</small><h3>{x.name}</h3><p>{x.note}</p></div><a href={`tel:${x.phone}`}>Gọi {x.phone}</a></article>)}</div>
      </section>}

      {tab === "market" && <section className="hub-panel">
        <div className="hub-heading"><div><span className="eyebrow">MUA BÁN GẦN NHÀ</span><h2>Chợ quê</h2><p>Tin lưu trên thiết bị; gọi trực tiếp, không chuyển tiền khi chưa xác minh.</p></div></div>
        <div className="split-layout"><form className="hub-form" onSubmit={submitMarket}><h3>Đăng tin nhanh</h3><label>Nhu cầu<select name="type"><option>Bán</option><option>Mua</option><option>Cần thuê</option><option>Cho tặng</option></select></label><label>Nội dung<input required name="title" placeholder="Ví dụ: Bán 50kg xoài…" /></label><div className="form-row"><label>Khu vực<input required name="place" /></label><label>Giá<input name="price" placeholder="Thỏa thuận" /></label></div><label>Số điện thoại<input name="phone" inputMode="tel" placeholder="Tùy chọn" /></label><button className="primary-action">Lưu tin trên máy</button></form><div className="feed-list">{market.map(x => <article key={x.id}><span className="listing-type">{x.type}</span><div><h3>{x.title}</h3><p>📍 {x.place} · {x.age}</p><strong>{x.price}</strong></div>{x.phone && <a href={`tel:${x.phone}`}>Gọi</a>}</article>)}</div></div>
      </section>}

      {tab === "report" && <section className="hub-panel">
        <div className="hub-heading"><div><span className="eyebrow">VIỆC QUANH TA</span><h2>Phản ánh cộng đồng</h2><p>Ghi nhận trên thiết bị để theo dõi; trường hợp khẩn cấp hãy gọi cơ quan chức năng.</p></div></div>
        <div className="split-layout"><form className="hub-form" onSubmit={submitReport}><h3>Ghi nhận sự việc</h3><label>Loại<select name="type"><option>Đường sá</option><option>Điện nước</option><option>Rác thải</option><option>Thất lạc</option><option>Cần hỗ trợ</option></select></label><label>Địa điểm<input required name="place" placeholder="Ấp, xã hoặc mốc gần nhất" /></label><label>Mô tả<textarea required name="detail" rows="4" /></label><button className="primary-action">Lưu ghi nhận</button></form><div className="feed-list">{reports.map(x => <article key={x.id}><span className="report-dot">!</span><div><span className="listing-type">{x.type}</span><h3>{x.place}</h3><p>{x.detail}</p><small>{x.status}</small></div></article>)}</div></div>
      </section>}

      {tab === "farm" && <section className="hub-panel">
        <div className="hub-heading"><div><span className="eyebrow">NHỚ VIỆC · BIẾT LỜI LỖ</span><h2>Sổ mùa vụ cá nhân</h2><p>Dữ liệu riêng tư chỉ lưu trong trình duyệt trên thiết bị này.</p></div></div>
        <div className="farm-summary"><article><small>TỔNG CHI</small><strong>{totals.cost.toLocaleString("vi-VN")}đ</strong></article><article><small>TỔNG THU</small><strong>{totals.income.toLocaleString("vi-VN")}đ</strong></article><article className={totals.income - totals.cost < 0 ? "negative" : ""}><small>TẠM TÍNH</small><strong>{(totals.income - totals.cost).toLocaleString("vi-VN")}đ</strong></article></div>
        <div className="split-layout"><form className="hub-form" onSubmit={submitFarm}><h3>Ghi một công việc</h3><label>Ngày<input required type="date" name="date" /></label><label>Công việc<input required name="activity" placeholder="Bón phân, thu hoạch…" /></label><div className="form-row"><label>Chi phí<input type="number" min="0" name="cost" placeholder="0" /></label><label>Thu vào<input type="number" min="0" name="income" placeholder="0" /></label></div><button className="primary-action">Lưu vào sổ</button></form><div className="farm-log">{farmRows.length === 0 ? <div className="empty-state">🌱<b>Chưa có ghi chép</b><p>Bắt đầu ghi chi phí nhỏ nhất để cuối vụ biết lời lỗ chính xác.</p></div> : farmRows.map(x => <article key={x.id}><div><small>{x.date}</small><h3>{x.activity}</h3></div><div><span className="cost">−{Number(x.cost || 0).toLocaleString("vi-VN")}đ</span><span className="income">+{Number(x.income || 0).toLocaleString("vi-VN")}đ</span></div></article>)}</div></div>
      </section>}
    </div>{toast && <div className="hub-toast">✓ {toast}</div>}
  </main>;
};

export default CommunityHub;
