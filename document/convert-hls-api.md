# POST /api/convert-hls

**Server:** `https://quoc-67k1-video-creator.onrender.com`

One-shot: upload file MP4 → convert sang HLS → trả về file `.tar.gz` chứa toàn bộ segments → xóa sạch trên server.

---

## Request

`Content-Type: multipart/form-data`

### Field bắt buộc

| Field | Type | Mô tả |
|-------|------|--------|
| `file` | File (MP4) | File video cần convert |

### Field tuỳ chọn (form fields, dạng string)

| Field | Default | Mô tả |
|-------|---------|--------|
| `maxSizeMb` | `10` | Kích thước tối đa mỗi segment `.ts` (MB). Nếu segment nào vượt quá, server giảm `hls_time` và thử lại. |
| `startHlsTime` | `10` | Thời lượng mỗi segment ban đầu (giây). |
| `minHlsTime` | `1` | Thời lượng segment tối thiểu (giây). Server không giảm xuống dưới giá trị này. |
| `stepDown` | `1` | Mỗi lần retry giảm `hls_time` đi bao nhiêu giây. |
| `maxRetries` | `10` | Số lần thử tối đa trước khi báo lỗi. |
| `width` | _(giữ nguyên)_ | Scale width (px). Height tự tính theo tỷ lệ. Ví dụ: `1280`. |
| `fps` | _(giữ nguyên)_ | Frame rate output. Ví dụ: `30`. |
| `crf` | `23` | Chất lượng video (0–51, thấp hơn = chất lượng cao hơn, file lớn hơn). |
| `preset` | `veryfast` | ffmpeg preset: `ultrafast` `superfast` `veryfast` `faster` `fast` `medium` `slow` `slower` `veryslow` |
| `videoBitrateK` | _(không giới hạn)_ | Bitrate video tối đa (kbps). Ví dụ: `2500`. |
| `audioBitrateK` | `128` | Bitrate audio (kbps). |
| `videoCodec` | `libx264` | Codec video. |
| `audioCodec` | `aac` | Codec audio. |
| `profile` | `main` | H.264 profile: `baseline` `main` `high`. |
| `level` | `4.0` | H.264 level. |

---

## Response

### Thành công — `200 OK`

Trả về file binary `.tar.gz`.

**Headers:**

| Header | Ví dụ | Mô tả |
|--------|-------|--------|
| `Content-Type` | `application/gzip` | |
| `Content-Disposition` | `attachment; filename="abc123.tar.gz"` | |
| `X-Hls-Time` | `6` | `hls_time` cuối cùng dùng để convert thành công |
| `X-Hls-Attempt` | `2` | Số lần thử ffmpeg |
| `X-Hls-Largest-Mb` | `4.21` | Segment lớn nhất (MB) |

**Cấu trúc file tar.gz sau khi giải nén:**

```
<hash>/
  index.m3u8       ← playlist chính, dùng URL này để play HLS
  seg_00000.ts
  seg_00001.ts
  seg_00002.ts
  ...
```

### Lỗi — `422 Unprocessable Entity`

ffmpeg không thể đạt `maxSizeMb` dù đã thử hết `maxRetries` lần:

```json
{
  "ok": false,
  "inputFile": "/tmp/abc123.mp4",
  "reason": "Cannot satisfy max segment size 8MB",
  "largestMb": 12.4,
  "oversizedCount": 3
}
```

→ Tăng `maxSizeMb` hoặc giảm `startHlsTime` / `width`.

### Lỗi — `500 Internal Server Error`

ffmpeg crash hoặc lỗi hệ thống:

```json
{
  "ok": false,
  "error": "ffmpeg failed (attempt 1, hls_time=10s): <stderr ffmpeg>"
}
```

---

## Sử dụng trong tattantat-phutan

Xem file `src/lib/hlsApi.ts`.

```ts
import { convertVideoToHls } from "@/lib/hlsApi";

// Upload file và nhận lại Blob tar.gz
const blob = await convertVideoToHls(file, {
  maxSizeMb: 8,
  width: 1280,
  startHlsTime: 6,
});

// Tuỳ mục đích: download thẳng hoặc upload lên Supabase Storage
```

---

## Giới hạn thực tế trên Render (free tier)

| Giới hạn | Giá trị |
|----------|---------|
| RAM | ~512 MB |
| Thời gian request tối đa | ~30 phút |
| File tạm | `/tmp` (xóa sau khi xong) |
| ffmpeg | Có sẵn trên image |
