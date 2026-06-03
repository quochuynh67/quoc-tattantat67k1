-- Seed content for local/prototype Supabase data.

insert into public.site_settings (row_key, value) values
('hero', jsonb_build_object(
  'title', 'Câu chuyện về Phú Tân',
  'subtitle', 'Khám phá nét đẹp và tiềm năng của Phú Tân 67K1 AG',
  'description', 'Phú Tân – nơi giao thoa của truyền thống và hiện đại, với những lễ hội rực rỡ, cảnh quan thiên nhiên hữu tình và cộng đồng nông dân năng động.',
  'image', 'https://picsum.photos/seed/hero/1200/600'
)),
('newsletter', jsonb_build_object(
  'title', 'Đăng ký nhận tin tức',
  'description', 'Cập nhật tin tức, sự kiện và ưu đãi mới nhất của Phú Tân ngay vào hộp thư của bạn.',
  'placeholder', 'Nhập email của bạn...'
))
on conflict (row_key) do update set value = excluded.value;

insert into public.content_sections (slug, title, description, route, display_order) values
('news', 'Tin tức địa phương', 'Toàn bộ sự kiện, hoạt động cộng đồng và thông tin mới nhất tại Phú Tân 67K1 AG.', '/news', 10),
('places', 'Địa điểm nổi bật', 'Khám phá đầy đủ các địa danh, điểm đến và không gian trải nghiệm tại Phú Tân.', '/places', 20),
('food', 'Ẩm thực địa phương', 'Danh sách món ngon, đặc sản và trải nghiệm ẩm thực nên thử khi ghé Phú Tân.', '/food', 30),
('beautyHealth', 'Làm đẹp & Sức khỏe', 'Danh sách spa, hair salon và dịch vụ trị liệu giúp chăm sóc vẻ ngoài, thư giãn và phục hồi năng lượng.', '/beauty-health', 40),
('agriculture', 'Nông nghiệp & Phát triển nông thôn', 'Các mô hình, dự án và sáng kiến đang thúc đẩy nông nghiệp địa phương.', '/agriculture', 50),
('health', 'Sức khỏe & Y tế', 'Thông báo y tế, cảnh báo dịch bệnh và nguồn lực chăm sóc sức khỏe cộng đồng.', '/health', 60)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  route = excluded.route,
  display_order = excluded.display_order;

insert into public.admin_settings (row_key, value)
values ('admin_delete_password', 'phutan-admin')
on conflict (row_key) do nothing;
