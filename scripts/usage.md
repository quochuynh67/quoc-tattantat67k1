Cách dùng:

  Chuyển 1 file cụ thể:
  node convert-videos-to-hls-local.mjs video.mp4
  # output mặc định cùng thư mục với file

  node convert-videos-to-hls-local.mjs video.mp4 ./output
  # output vào ./output/video/index.m3u8

  Chuyển cả folder (đệ quy):
  node convert-videos-to-hls-local.mjs ./videos
  # mỗi file output cùng thư mục chứa nó

  node convert-videos-to-hls-local.mjs ./videos ./hls-output
  # toàn bộ output vào ./hls-output/<tên-file>/index.m3u8

  Mỗi video sẽ tạo ra một thư mục con theo tên file, chứa index.m3u8 và các segment seg_00000.ts, seg_00001.ts, v.v.
  — cùng cấu hình ffmpeg với file gốc (baseline, hls_time 6s).
