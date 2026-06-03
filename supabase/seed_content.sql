-- Seed visible content and vlogs. Run after schema.sql and seed.sql.

with rows(section_slug, legacy_id, title, excerpt, description, image_url, category, address, rating, severity, published_date, display_order) as (
  values
  ('news', 1, 'Lễ hội Cải Ngọt – Sự kiện năm mới của Phú Tân 67K1 AG', 'Hàng nghìn người đã tụ họp tại trung tâm thị trấn để cùng chào đón mùa xuân với những điệu múa truyền thống và ẩm thực đặc sắc.', null, 'https://picsum.photos/seed/news1/800/400', null, null, null, null, '2026-06-01'::date, 1),
  ('news', 2, 'Dự án Hạ tầng Đường nông thôn – Tiến độ 75%', 'Chính quyền địa phương đang đẩy mạnh công tác cải thiện giao thông nông thôn, nối liền các làng mạc xa xôi.', null, 'https://picsum.photos/seed/news2/800/400', null, null, null, null, '2026-05-28'::date, 2),
  ('news', 3, 'Cảnh báo dịch bệnh thủy triều mới – Khiến nông dân cảnh giác', 'Các chuyên gia y tế khuyến cáo người dân tăng cường vệ sinh và tiêm phòng sớm.', null, 'https://picsum.photos/seed/news3/800/400', null, null, null, null, '2026-05-20'::date, 3),
  ('news', 4, 'Khánh thành trung tâm văn hóa mới', 'Trung tâm văn hóa huyện đã chính thức đi vào hoạt động với nhiều phòng chức năng hiện đại.', null, 'https://picsum.photos/seed/news4/800/400', null, null, null, null, '2026-05-15'::date, 4),
  ('news', 5, 'Hội thảo phát triển du lịch sinh thái', 'Các chuyên gia và chính quyền địa phương thảo luận về định hướng phát triển du lịch bền vững.', null, 'https://picsum.photos/seed/news5/800/400', null, null, null, null, '2026-05-10'::date, 5),
  ('news', 6, 'Ra mắt tuyến tham quan làng nghề cuối tuần', 'Du khách có thể trải nghiệm làm sản phẩm thủ công và trò chuyện cùng nghệ nhân địa phương.', null, 'https://picsum.photos/seed/news6/800/400', null, null, null, null, '2026-05-08'::date, 6),
  ('news', 7, 'Chương trình trồng cây ven sông', 'Thanh niên huyện tham gia phủ xanh các tuyến đường ven sông nhằm cải thiện cảnh quan.', null, 'https://picsum.photos/seed/news7/800/400', null, null, null, null, '2026-05-03'::date, 7),
  ('news', 8, 'Tập huấn chuyển đổi số cho hộ kinh doanh', 'Các hộ kinh doanh nhỏ được hướng dẫn bán hàng trực tuyến và quảng bá sản phẩm địa phương.', null, 'https://picsum.photos/seed/news8/800/400', null, null, null, null, '2026-04-28'::date, 8),

  ('places', 1, 'Đảo Cồn Sơn', null, 'Điểm du lịch sinh thái miệt vườn, trải nghiệm làm nông dân và thưởng thức trái cây tại vườn.', 'https://picsum.photos/seed/place1/400/300', null, null, null, null, null, 1),
  ('places', 2, 'Cầu Bãi Thủy', null, 'Cây cầu lịch sử vắt qua dòng sông hiền hòa, nơi ngắm hoàng hôn tuyệt đẹp của người dân địa phương.', 'https://picsum.photos/seed/place2/400/300', null, null, null, null, null, 2),
  ('places', 3, 'Khu di tích Lịch sử', null, 'Nơi lưu giữ những kỷ vật chiến tranh và câu chuyện về lòng dũng cảm của các anh hùng liệt sĩ.', 'https://picsum.photos/seed/place3/400/300', null, null, null, null, null, 3),
  ('places', 4, 'Bảo tàng Nông nghiệp', null, 'Trưng bày các nông cụ truyền thống và lịch sử phát triển nghề nông của vùng Đồng bằng sông Cửu Long.', 'https://picsum.photos/seed/place4/400/300', null, null, null, null, null, 4),
  ('places', 5, 'Chợ nổi Phú Tân', null, 'Khu chợ sầm uất trên sông với hàng trăm ghe thuyền buôn bán tấp nập mỗi buổi sáng sớm.', 'https://picsum.photos/seed/place5/400/300', null, null, null, null, null, 5),
  ('places', 6, 'Làng nghề mộc truyền thống', null, 'Khám phá nghệ thuật điêu khắc gỗ tinh xảo từ bàn tay của những nghệ nhân lâu năm.', 'https://picsum.photos/seed/place6/400/300', null, null, null, null, null, 6),

  ('food', 1, 'Bánh xèo Phú Tân', null, 'Món bánh giòn tan, nhân tôm, thịt và giá đỗ, ăn kèm nước chấm đậm đà.', 'https://picsum.photos/seed/food1/400/300', null, null, 4.5, null, null, 1),
  ('food', 2, 'Cá kho tộ', null, 'Cá chép kho trong nồi đất, thơm mùi thảo mộc và hạt tiêu.', 'https://picsum.photos/seed/food2/400/300', null, null, 4.7, null, null, 2),
  ('food', 3, 'Bún riêu cua', null, 'Bún tươi hương vị cua, ăn cùng chanh và ớt tươi.', 'https://picsum.photos/seed/food3/400/300', null, null, 4.6, null, null, 3),
  ('food', 4, 'Lẩu mắm', null, 'Hương vị đặc trưng của miền Tây với nhiều loại rau xanh tươi ngon.', 'https://picsum.photos/seed/food4/400/300', null, null, 4.8, null, null, 4),
  ('food', 5, 'Bánh bò thốt nốt', null, 'Bánh xốp mềm, vị ngọt thanh đặc trưng từ đường thốt nốt tự nhiên.', 'https://picsum.photos/seed/food5/400/300', null, null, 4.9, null, null, 5),

  ('beautyHealth', 1, 'Sen Spa Phú Tân', null, 'Liệu trình chăm sóc da mặt, massage thư giãn và xông thảo mộc cho người cần phục hồi năng lượng.', 'https://picsum.photos/seed/beauty-spa1/400/300', 'Spa', 'Trung tâm thị trấn Phú Tân', 4.8, null, null, 1),
  ('beautyHealth', 2, 'Mộc Hair Studio', null, 'Cắt, uốn, nhuộm và phục hồi tóc với phong cách gọn gàng, hiện đại, phù hợp nhịp sống địa phương.', 'https://picsum.photos/seed/beauty-hair1/400/300', 'Hair', 'Đường ven chợ Phú Tân', 4.7, null, null, 2),
  ('beautyHealth', 3, 'An Nhiên Trị Liệu', null, 'Bấm huyệt, massage vai gáy và chăm sóc cơ xương khớp nhẹ nhàng cho dân văn phòng và người lao động.', 'https://picsum.photos/seed/beauty-therapy1/400/300', 'Trị liệu', 'Khu dân cư Phú Mỹ', 4.9, null, null, 3),
  ('beautyHealth', 4, 'Lụa Nail & Beauty', null, 'Dịch vụ nail, chăm sóc tay chân, gội đầu dưỡng sinh và các gói làm đẹp nhanh trong ngày.', 'https://picsum.photos/seed/beauty-nail1/400/300', 'Spa', 'Gần trung tâm văn hóa huyện', 4.6, null, null, 4),
  ('beautyHealth', 5, 'Tóc Việt Barber', null, 'Cắt tóc nam, tạo kiểu, cạo mặt và chăm sóc tóc cơ bản với không gian thân thiện.', 'https://picsum.photos/seed/beauty-barber1/400/300', 'Hair', 'Ấp Phú Thuận', 4.5, null, null, 5),
  ('beautyHealth', 6, 'Dưỡng Sinh Hương Quê', null, 'Gội đầu dưỡng sinh, ngâm chân thảo dược và massage thư giãn sau ngày làm việc.', 'https://picsum.photos/seed/beauty-wellness1/400/300', 'Trị liệu', 'Đường vào khu sinh thái ven sông', 4.8, null, null, 6),

  ('agriculture', 1, 'Lúa cao mắt mới', null, 'Giải pháp canh tác giảm nước, năng suất cao, thích hợp cho vùng ven sông.', 'https://picsum.photos/seed/agri1/400/300', null, null, null, null, null, 1),
  ('agriculture', 2, 'Vụ trồng sắn', null, 'Sắn đường chất lượng cao, xuất khẩu sang châu Á.', 'https://picsum.photos/seed/agri2/400/300', null, null, null, null, null, 2),
  ('agriculture', 3, 'Mô hình nuôi tôm càng xanh', null, 'Kỹ thuật nuôi mới giúp tăng sản lượng và đảm bảo chất lượng xuất khẩu.', 'https://picsum.photos/seed/agri3/400/300', null, null, null, null, null, 3),
  ('agriculture', 4, 'Chương trình OCOP', null, 'Hỗ trợ các sản phẩm nông nghiệp địa phương vươn xa ra thị trường quốc tế.', 'https://picsum.photos/seed/agri4/400/300', null, null, null, null, null, 4),
  ('agriculture', 5, 'Vườn rau an toàn ven đô', null, 'Mô hình canh tác hữu cơ giúp tăng giá trị nông sản và giảm sử dụng hóa chất.', 'https://picsum.photos/seed/agri5/400/300', null, null, null, null, null, 5),
  ('agriculture', 6, 'Tưới tiết kiệm cho cây ăn trái', null, 'Ứng dụng cảm biến độ ẩm để tối ưu lượng nước trong mùa khô.', 'https://picsum.photos/seed/agri6/400/300', null, null, null, null, null, 6),
  ('agriculture', 7, 'Tổ hợp tác nuôi cá sạch', null, 'Liên kết hộ nuôi để chuẩn hóa quy trình và ổn định đầu ra.', 'https://picsum.photos/seed/agri7/400/300', null, null, null, null, null, 7),
  ('agriculture', 8, 'Sàn giao dịch nông sản địa phương', null, 'Kết nối thương lái, hợp tác xã và người tiêu dùng qua kênh số.', 'https://picsum.photos/seed/agri8/400/300', null, null, null, null, null, 8),

  ('health', 1, 'Chiến dịch tiêm phòng cúm mùa', null, 'Địa điểm tiêm: trung tâm y tế xã Phú Tân, thời gian: 10h-16h, miễn phí.', null, null, null, null, 'info', null, 1),
  ('health', 2, 'Lời khuyên dinh dưỡng cho nông dân', null, 'Bổ sung protein, vitamin A và khoáng chất để tăng sức đề kháng.', null, null, null, null, 'warning', null, 2),
  ('health', 3, 'Lịch khám lưu động tại các xã', null, 'Đội y tế lưu động sẽ khám tổng quát tại Phú Mỹ, Phú Thuận và Phú An trong tuần này.', null, null, null, null, 'info', null, 3),
  ('health', 4, 'Khuyến cáo phòng bệnh mùa mưa', null, 'Dọn dẹp vật chứa nước đọng, ngủ màn và theo dõi triệu chứng sốt kéo dài.', null, null, null, null, 'warning', null, 4),
  ('health', 5, 'Cập nhật điểm cấp thuốc bảo hiểm', null, 'Người dân có thể nhận thuốc theo toa tại trạm y tế xã trong giờ hành chính.', null, null, null, null, 'success', null, 5),
  ('health', 6, 'Đường dây nóng tư vấn sức khỏe', null, 'Liên hệ trung tâm y tế huyện khi cần tư vấn triệu chứng hoặc hỗ trợ cấp cứu ban đầu.', null, null, null, null, 'error', null, 6)
)
insert into public.content_items (
  section_slug, legacy_id, title, excerpt, description, image_url, category, address, rating, severity, published_date, display_order
)
select section_slug, legacy_id, title, excerpt, description, image_url, category, address, rating, severity, published_date, display_order
from rows
on conflict (section_slug, legacy_id) do update set
  title = excluded.title,
  excerpt = excluded.excerpt,
  description = excluded.description,
  image_url = excluded.image_url,
  category = excluded.category,
  address = excluded.address,
  rating = excluded.rating,
  severity = excluded.severity,
  published_date = excluded.published_date,
  display_order = excluded.display_order,
  is_published = true;

with rows(legacy_id, news_legacy_id, title, subtitle, video_url, poster_url, host, duration_label, display_order) as (
  values
  (1, 1, 'Review vlog: Không khí Lễ hội Cải Ngọt', 'Theo chân người dân Phú Tân qua những khoảnh khắc nổi bật trong ngày hội.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'https://picsum.photos/seed/vlog-news1/900/1200', 'Phú Tân Review', '00:45', 1),
  (2, 2, 'Review vlog: Tuyến đường nông thôn mới', 'Một vòng ghi nhận tiến độ hạ tầng và các điểm kết nối dân sinh.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'https://picsum.photos/seed/vlog-news2/900/1200', 'Hạ tầng Phú Tân', '00:40', 2),
  (3, 3, 'Review vlog: Điểm tư vấn y tế cộng đồng', 'Các mốc trong vlog giúp người dân nhận diện khu vực kiểm tra và tư vấn.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'https://picsum.photos/seed/vlog-news3/900/1200', 'Y tế cộng đồng', '00:35', 3),
  (4, 4, 'Review vlog: Trung tâm văn hóa mới', 'Khám phá các khu chức năng vừa đưa vào hoạt động.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'https://picsum.photos/seed/vlog-news4/900/1200', 'Văn hóa Phú Tân', '00:50', 4)
)
insert into public.vlog_reviews (legacy_id, news_legacy_id, title, subtitle, video_url, poster_url, host, duration_label, display_order)
select legacy_id, news_legacy_id, title, subtitle, video_url, poster_url, host, duration_label, display_order
from rows
on conflict (legacy_id) do update set
  news_legacy_id = excluded.news_legacy_id,
  title = excluded.title,
  subtitle = excluded.subtitle,
  video_url = excluded.video_url,
  poster_url = excluded.poster_url,
  host = excluded.host,
  duration_label = excluded.duration_label,
  display_order = excluded.display_order,
  is_published = true;

delete from public.vlog_locations
where vlog_review_id in (select id from public.vlog_reviews where legacy_id in (1, 2, 3, 4));

with rows(vlog_legacy_id, time_seconds, name, note, image_url, display_order) as (
  values
  (1, 0, 'Cổng chào trung tâm thị trấn', 'Mở đầu vlog với không khí chuẩn bị lễ hội.', 'https://picsum.photos/seed/vlog-spot1/200/140', 1),
  (1, 8, 'Sân khấu chính', 'Các tiết mục văn nghệ và phần khai mạc.', 'https://picsum.photos/seed/vlog-spot2/200/140', 2),
  (1, 18, 'Khu ẩm thực địa phương', 'Gian hàng món ăn dân dã, đông khách nhất buổi sáng.', 'https://picsum.photos/seed/vlog-spot3/200/140', 3),
  (1, 32, 'Tuyến đường hoa ven sông', 'Điểm check-in cuối vlog với cảnh sông nước Phú Tân.', 'https://picsum.photos/seed/vlog-spot4/200/140', 4),
  (2, 0, 'Điểm đầu tuyến xã Phú Mỹ', 'Tổng quan đoạn đường vừa hoàn thiện nền.', 'https://picsum.photos/seed/vlog-road1/200/140', 1),
  (2, 12, 'Cầu dân sinh mới', 'Khu vực kết nối giữa hai ấp sản xuất nông nghiệp.', 'https://picsum.photos/seed/vlog-road2/200/140', 2),
  (2, 26, 'Khu ruộng ven tuyến', 'Ghi nhận tác động tích cực tới vận chuyển nông sản.', 'https://picsum.photos/seed/vlog-road3/200/140', 3),
  (3, 0, 'Trung tâm y tế xã', 'Nơi tiếp nhận và hướng dẫn người dân.', 'https://picsum.photos/seed/vlog-health1/200/140', 1),
  (3, 10, 'Khu tư vấn phòng bệnh', 'Cán bộ y tế chia sẻ khuyến cáo vệ sinh.', 'https://picsum.photos/seed/vlog-health2/200/140', 2),
  (3, 22, 'Bảng thông tin cộng đồng', 'Các khuyến nghị được cập nhật theo ngày.', 'https://picsum.photos/seed/vlog-health3/200/140', 3),
  (4, 0, 'Sảnh đón trung tâm', 'Không gian tiếp nhận khách và khu trưng bày đầu tiên.', 'https://picsum.photos/seed/vlog-culture1/200/140', 1),
  (4, 14, 'Phòng sinh hoạt cộng đồng', 'Nơi tổ chức lớp học, câu lạc bộ và hội nghị nhỏ.', 'https://picsum.photos/seed/vlog-culture2/200/140', 2),
  (4, 31, 'Sân khấu ngoài trời', 'Khu vực biểu diễn và sự kiện cuối tuần.', 'https://picsum.photos/seed/vlog-culture3/200/140', 3)
)
insert into public.vlog_locations (vlog_review_id, time_seconds, name, note, image_url, display_order)
select reviews.id, rows.time_seconds, rows.name, rows.note, rows.image_url, rows.display_order
from rows
join public.vlog_reviews reviews on reviews.legacy_id = rows.vlog_legacy_id;
