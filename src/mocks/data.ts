export const mockHero = {
  title: "Câu chuyện về Phú Tân",
  subtitle: "Khám phá nét đẹp và tiềm năng của huyện Phú Tân",
  image: "https://picsum.photos/seed/hero/1200/600",
  description: "Phú Tân – nơi giao thoa của truyền thống và hiện đại, với những lễ hội rực rỡ, cảnh quan thiên nhiên hữu tình và cộng đồng nông dân năng động."
};

export const mockNews = [
  {
    id: 1,
    title: "Lễ hội Cải Ngọt – Sự kiện năm mới của huyện Phú Tân",
    excerpt: "Hàng nghìn người đã tụ họp tại trung tâm thị trấn để cùng chào đón mùa xuân với những điệu múa truyền thống và ẩm thực đặc sắc.",
    date: "2026-06-01",
    image: "https://picsum.photos/seed/news1/800/400"
  },
  {
    id: 2,
    title: "Dự án Hạ tầng Đường nông thôn – Tiến độ 75%",
    excerpt: "Chính quyền địa phương đang đẩy mạnh công tác cải thiện giao thông nông thôn, nối liền các làng mạc xa xôi.",
    date: "2026-05-28",
    image: "https://picsum.photos/seed/news2/800/400"
  },
  {
    id: 3,
    title: "Cảnh báo dịch bệnh thủy triều mới – Khiến nông dân cảnh giác",
    excerpt: "Các chuyên gia y tế khuyến cáo người dân tăng cường vệ sinh và tiêm phòng sớm.",
    date: "2026-05-20",
    image: "https://picsum.photos/seed/news3/800/400"
  },
  {
    id: 4,
    title: "Khánh thành trung tâm văn hóa mới",
    excerpt: "Trung tâm văn hóa huyện đã chính thức đi vào hoạt động với nhiều phòng chức năng hiện đại.",
    date: "2026-05-15",
    image: "https://picsum.photos/seed/news4/800/400"
  },
  {
    id: 5,
    title: "Hội thảo phát triển du lịch sinh thái",
    excerpt: "Các chuyên gia và chính quyền địa phương thảo luận về định hướng phát triển du lịch bền vững.",
    date: "2026-05-10",
    image: "https://picsum.photos/seed/news5/800/400"
  },
  {
    id: 6,
    title: "Ra mắt tuyến tham quan làng nghề cuối tuần",
    excerpt: "Du khách có thể trải nghiệm làm sản phẩm thủ công và trò chuyện cùng nghệ nhân địa phương.",
    date: "2026-05-08",
    image: "https://picsum.photos/seed/news6/800/400"
  },
  {
    id: 7,
    title: "Chương trình trồng cây ven sông",
    excerpt: "Thanh niên huyện tham gia phủ xanh các tuyến đường ven sông nhằm cải thiện cảnh quan.",
    date: "2026-05-03",
    image: "https://picsum.photos/seed/news7/800/400"
  },
  {
    id: 8,
    title: "Tập huấn chuyển đổi số cho hộ kinh doanh",
    excerpt: "Các hộ kinh doanh nhỏ được hướng dẫn bán hàng trực tuyến và quảng bá sản phẩm địa phương.",
    date: "2026-04-28",
    image: "https://picsum.photos/seed/news8/800/400"
  }
];

export const mockVlogReviews = [
  {
    id: 1,
    newsId: 1,
    title: "Review vlog: Không khí Lễ hội Cải Ngọt",
    subtitle: "Theo chân người dân Phú Tân qua những khoảnh khắc nổi bật trong ngày hội.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    poster: "https://picsum.photos/seed/vlog-news1/900/1200",
    host: "Phú Tân Review",
    durationLabel: "00:45",
    locations: [
      {
        time: 0,
        name: "Cổng chào trung tâm thị trấn",
        note: "Mở đầu vlog với không khí chuẩn bị lễ hội.",
        image: "https://picsum.photos/seed/vlog-spot1/200/140"
      },
      {
        time: 8,
        name: "Sân khấu chính",
        note: "Các tiết mục văn nghệ và phần khai mạc.",
        image: "https://picsum.photos/seed/vlog-spot2/200/140"
      },
      {
        time: 18,
        name: "Khu ẩm thực địa phương",
        note: "Gian hàng món ăn dân dã, đông khách nhất buổi sáng.",
        image: "https://picsum.photos/seed/vlog-spot3/200/140"
      },
      {
        time: 32,
        name: "Tuyến đường hoa ven sông",
        note: "Điểm check-in cuối vlog với cảnh sông nước Phú Tân.",
        image: "https://picsum.photos/seed/vlog-spot4/200/140"
      }
    ]
  },
  {
    id: 2,
    newsId: 2,
    title: "Review vlog: Tuyến đường nông thôn mới",
    subtitle: "Một vòng ghi nhận tiến độ hạ tầng và các điểm kết nối dân sinh.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    poster: "https://picsum.photos/seed/vlog-news2/900/1200",
    host: "Hạ tầng Phú Tân",
    durationLabel: "00:40",
    locations: [
      {
        time: 0,
        name: "Điểm đầu tuyến xã Phú Mỹ",
        note: "Tổng quan đoạn đường vừa hoàn thiện nền.",
        image: "https://picsum.photos/seed/vlog-road1/200/140"
      },
      {
        time: 12,
        name: "Cầu dân sinh mới",
        note: "Khu vực kết nối giữa hai ấp sản xuất nông nghiệp.",
        image: "https://picsum.photos/seed/vlog-road2/200/140"
      },
      {
        time: 26,
        name: "Khu ruộng ven tuyến",
        note: "Ghi nhận tác động tích cực tới vận chuyển nông sản.",
        image: "https://picsum.photos/seed/vlog-road3/200/140"
      }
    ]
  },
  {
    id: 3,
    newsId: 3,
    title: "Review vlog: Điểm tư vấn y tế cộng đồng",
    subtitle: "Các mốc trong vlog giúp người dân nhận diện khu vực kiểm tra và tư vấn.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    poster: "https://picsum.photos/seed/vlog-news3/900/1200",
    host: "Y tế cộng đồng",
    durationLabel: "00:35",
    locations: [
      {
        time: 0,
        name: "Trung tâm y tế xã",
        note: "Nơi tiếp nhận và hướng dẫn người dân.",
        image: "https://picsum.photos/seed/vlog-health1/200/140"
      },
      {
        time: 10,
        name: "Khu tư vấn phòng bệnh",
        note: "Cán bộ y tế chia sẻ khuyến cáo vệ sinh.",
        image: "https://picsum.photos/seed/vlog-health2/200/140"
      },
      {
        time: 22,
        name: "Bảng thông tin cộng đồng",
        note: "Các khuyến nghị được cập nhật theo ngày.",
        image: "https://picsum.photos/seed/vlog-health3/200/140"
      }
    ]
  },
  {
    id: 4,
    newsId: 4,
    title: "Review vlog: Trung tâm văn hóa mới",
    subtitle: "Khám phá các khu chức năng vừa đưa vào hoạt động.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    poster: "https://picsum.photos/seed/vlog-news4/900/1200",
    host: "Văn hóa Phú Tân",
    durationLabel: "00:50",
    locations: [
      {
        time: 0,
        name: "Sảnh đón trung tâm",
        note: "Không gian tiếp nhận khách và khu trưng bày đầu tiên.",
        image: "https://picsum.photos/seed/vlog-culture1/200/140"
      },
      {
        time: 14,
        name: "Phòng sinh hoạt cộng đồng",
        note: "Nơi tổ chức lớp học, câu lạc bộ và hội nghị nhỏ.",
        image: "https://picsum.photos/seed/vlog-culture2/200/140"
      },
      {
        time: 31,
        name: "Sân khấu ngoài trời",
        note: "Khu vực biểu diễn và sự kiện cuối tuần.",
        image: "https://picsum.photos/seed/vlog-culture3/200/140"
      }
    ]
  }
];

export const mockPlaces = [
  { id: 1, name: "Đảo Cồn Sơn", description: "Điểm du lịch sinh thái miệt vườn, trải nghiệm làm nông dân và thưởng thức trái cây tại vườn.", image: "https://picsum.photos/seed/place1/400/300" },
  { id: 2, name: "Cầu Bãi Thủy", description: "Cây cầu lịch sử vắt qua dòng sông hiền hòa, nơi ngắm hoàng hôn tuyệt đẹp của người dân địa phương.", image: "https://picsum.photos/seed/place2/400/300" },
  { id: 3, name: "Khu di tích Lịch sử", description: "Nơi lưu giữ những kỷ vật chiến tranh và câu chuyện về lòng dũng cảm của các anh hùng liệt sĩ.", image: "https://picsum.photos/seed/place3/400/300" },
  { id: 4, name: "Bảo tàng Nông nghiệp", description: "Trưng bày các nông cụ truyền thống và lịch sử phát triển nghề nông của vùng Đồng bằng sông Cửu Long.", image: "https://picsum.photos/seed/place4/400/300" },
  { id: 5, name: "Chợ nổi Phú Tân", description: "Khu chợ sầm uất trên sông với hàng trăm ghe thuyền buôn bán tấp nập mỗi buổi sáng sớm.", image: "https://picsum.photos/seed/place5/400/300" },
  { id: 6, name: "Làng nghề mộc truyền thống", description: "Khám phá nghệ thuật điêu khắc gỗ tinh xảo từ bàn tay của những nghệ nhân lâu năm.", image: "https://picsum.photos/seed/place6/400/300" }
];

export const mockFood = [
  {
    id: 1,
    name: "Bánh xèo Phú Tân",
    description: "Món bánh giòn tan, nhân tôm, thịt và giá đỗ, ăn kèm nước chấm đậm đà.",
    rating: 4.5,
    image: "https://picsum.photos/seed/food1/400/300"
  },
  {
    id: 2,
    name: "Cá kho tộ",
    description: "Cá chép kho trong nồi đất, thơm mùi thảo mộc và hạt tiêu.",
    rating: 4.7,
    image: "https://picsum.photos/seed/food2/400/300"
  },
  {
    id: 3,
    name: "Bún riêu cua",
    description: "Bún tươi hương vị cua, ăn cùng chanh và ớt tươi.",
    rating: 4.6,
    image: "https://picsum.photos/seed/food3/400/300"
  },
  {
    id: 4,
    name: "Lẩu mắm",
    description: "Hương vị đặc trưng của miền Tây với nhiều loại rau xanh tươi ngon.",
    rating: 4.8,
    image: "https://picsum.photos/seed/food4/400/300"
  },
  {
    id: 5,
    name: "Bánh bò thốt nốt",
    description: "Bánh xốp mềm, vị ngọt thanh đặc trưng từ đường thốt nốt tự nhiên.",
    rating: 4.9,
    image: "https://picsum.photos/seed/food5/400/300"
  }
];

export const mockAgriculture = [
  {
    id: 1,
    title: "Lúa cao mắt mới",
    description: "Giải pháp canh tác giảm nước, năng suất cao, thích hợp cho vùng ven sông.",
    image: "https://picsum.photos/seed/agri1/400/300"
  },
  {
    id: 2,
    title: "Vụ trồng sắn",
    description: "Sắn đường chất lượng cao, xuất khẩu sang châu Á.",
    image: "https://picsum.photos/seed/agri2/400/300"
  },
  {
    id: 3,
    title: "Mô hình nuôi tôm càng xanh",
    description: "Kỹ thuật nuôi mới giúp tăng sản lượng và đảm bảo chất lượng xuất khẩu.",
    image: "https://picsum.photos/seed/agri3/400/300"
  },
  {
    id: 4,
    title: "Chương trình OCOP",
    description: "Hỗ trợ các sản phẩm nông nghiệp địa phương vươn xa ra thị trường quốc tế.",
    image: "https://picsum.photos/seed/agri4/400/300"
  },
  {
    id: 5,
    title: "Vườn rau an toàn ven đô",
    description: "Mô hình canh tác hữu cơ giúp tăng giá trị nông sản và giảm sử dụng hóa chất.",
    image: "https://picsum.photos/seed/agri5/400/300"
  },
  {
    id: 6,
    title: "Tưới tiết kiệm cho cây ăn trái",
    description: "Ứng dụng cảm biến độ ẩm để tối ưu lượng nước trong mùa khô.",
    image: "https://picsum.photos/seed/agri6/400/300"
  },
  {
    id: 7,
    title: "Tổ hợp tác nuôi cá sạch",
    description: "Liên kết hộ nuôi để chuẩn hóa quy trình và ổn định đầu ra.",
    image: "https://picsum.photos/seed/agri7/400/300"
  },
  {
    id: 8,
    title: "Sàn giao dịch nông sản địa phương",
    description: "Kết nối thương lái, hợp tác xã và người tiêu dùng qua kênh số.",
    image: "https://picsum.photos/seed/agri8/400/300"
  }
];

export const mockHealth = [
  {
    id: 1,
    title: "Chiến dịch tiêm phòng cúm mùa",
    content: "Địa điểm tiêm: trung tâm y tế xã Phú Tân, thời gian: 10h-16h, miễn phí.",
    severity: "info"
  },
  {
    id: 2,
    title: "Lời khuyên dinh dưỡng cho nông dân",
    content: "Bổ sung protein, vitamin A và khoáng chất để tăng sức đề kháng.",
    severity: "warning"
  },
  {
    id: 3,
    title: "Lịch khám lưu động tại các xã",
    content: "Đội y tế lưu động sẽ khám tổng quát tại Phú Mỹ, Phú Thuận và Phú An trong tuần này.",
    severity: "info"
  },
  {
    id: 4,
    title: "Khuyến cáo phòng bệnh mùa mưa",
    content: "Dọn dẹp vật chứa nước đọng, ngủ màn và theo dõi triệu chứng sốt kéo dài.",
    severity: "warning"
  },
  {
    id: 5,
    title: "Cập nhật điểm cấp thuốc bảo hiểm",
    content: "Người dân có thể nhận thuốc theo toa tại trạm y tế xã trong giờ hành chính.",
    severity: "success"
  },
  {
    id: 6,
    title: "Đường dây nóng tư vấn sức khỏe",
    content: "Liên hệ trung tâm y tế huyện khi cần tư vấn triệu chứng hoặc hỗ trợ cấp cứu ban đầu.",
    severity: "error"
  }
];

export const mockBeautyHealth = [
  {
    id: 1,
    name: "Sen Spa Phú Tân",
    category: "Spa",
    description: "Liệu trình chăm sóc da mặt, massage thư giãn và xông thảo mộc cho người cần phục hồi năng lượng.",
    address: "Trung tâm thị trấn Phú Tân",
    rating: 4.8,
    image: "https://picsum.photos/seed/beauty-spa1/400/300"
  },
  {
    id: 2,
    name: "Mộc Hair Studio",
    category: "Hair",
    description: "Cắt, uốn, nhuộm và phục hồi tóc với phong cách gọn gàng, hiện đại, phù hợp nhịp sống địa phương.",
    address: "Đường ven chợ Phú Tân",
    rating: 4.7,
    image: "https://picsum.photos/seed/beauty-hair1/400/300"
  },
  {
    id: 3,
    name: "An Nhiên Trị Liệu",
    category: "Trị liệu",
    description: "Bấm huyệt, massage vai gáy và chăm sóc cơ xương khớp nhẹ nhàng cho dân văn phòng và người lao động.",
    address: "Khu dân cư Phú Mỹ",
    rating: 4.9,
    image: "https://picsum.photos/seed/beauty-therapy1/400/300"
  },
  {
    id: 4,
    name: "Lụa Nail & Beauty",
    category: "Spa",
    description: "Dịch vụ nail, chăm sóc tay chân, gội đầu dưỡng sinh và các gói làm đẹp nhanh trong ngày.",
    address: "Gần trung tâm văn hóa huyện",
    rating: 4.6,
    image: "https://picsum.photos/seed/beauty-nail1/400/300"
  },
  {
    id: 5,
    name: "Tóc Việt Barber",
    category: "Hair",
    description: "Cắt tóc nam, tạo kiểu, cạo mặt và chăm sóc tóc cơ bản với không gian thân thiện.",
    address: "Ấp Phú Thuận",
    rating: 4.5,
    image: "https://picsum.photos/seed/beauty-barber1/400/300"
  },
  {
    id: 6,
    name: "Dưỡng Sinh Hương Quê",
    category: "Trị liệu",
    description: "Gội đầu dưỡng sinh, ngâm chân thảo dược và massage thư giãn sau ngày làm việc.",
    address: "Đường vào khu sinh thái ven sông",
    rating: 4.8,
    image: "https://picsum.photos/seed/beauty-wellness1/400/300"
  }
];

export const mockNewsletter = {
  title: "Đăng ký nhận tin tức",
  description: "Cập nhật tin tức, sự kiện và ưu đãi mới nhất của Phú Tân ngay vào hộp thư của bạn.",
  placeholder: "Nhập email của bạn..."
};
