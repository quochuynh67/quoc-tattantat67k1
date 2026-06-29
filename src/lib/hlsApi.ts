const HLS_API_BASE = "https://quoc-67k1-video-creator.onrender.com";

export interface ConvertHlsOptions {
  /** Max size per .ts segment in MB. Server retries with smaller hls_time if exceeded. Default: 10 */
  maxSizeMb?: number;
  /** Initial segment duration in seconds. Default: 10 */
  startHlsTime?: number;
  /** Minimum segment duration in seconds. Default: 1 */
  minHlsTime?: number;
  /** Seconds to reduce hls_time per retry. Default: 1 */
  stepDown?: number;
  /** Max ffmpeg attempts before giving up. Default: 10 */
  maxRetries?: number;
  /** Scale width in px, height auto. e.g. 1280 */
  width?: number;
  /** Output frame rate. e.g. 30 */
  fps?: number;
  /** Video quality (0–51, lower = better). Default: 23 */
  crf?: number;
  /** ffmpeg preset: ultrafast | superfast | veryfast | faster | fast | medium | slow. Default: veryfast */
  preset?: string;
  /** Max video bitrate (kbps). e.g. 2500 */
  videoBitrateK?: number;
  /** Audio bitrate (kbps). Default: 128 */
  audioBitrateK?: number;
  /** Video codec. Default: libx264 */
  videoCodec?: string;
  /** Audio codec. Default: aac */
  audioCodec?: string;
  /** H.264 profile: baseline | main | high. Default: main */
  profile?: string;
  /** H.264 level. Default: 4.0 */
  level?: string;
}

export interface ConvertHlsMeta {
  /** Final hls_time used */
  hlsTime: number;
  /** Number of ffmpeg attempts */
  attempt: number;
  /** Largest segment size in MB */
  largestMb: number;
  /** Filename of the tar.gz */
  filename: string;
}

/**
 * Upload an MP4 file to the HLS conversion API.
 * Returns a Blob (tar.gz) containing index.m3u8 + .ts segments.
 * The server deletes all temp files after responding.
 *
 * @throws Error with message from server on failure
 */
export async function convertVideoToHls(
  file: File,
  options: ConvertHlsOptions = {},
  onProgress?: (phase: "uploading" | "converting") => void
): Promise<{ blob: Blob; meta: ConvertHlsMeta }> {
  const form = new FormData();
  form.append("file", file);

  for (const [key, value] of Object.entries(options)) {
    if (value !== undefined && value !== null) {
      form.append(key, String(value));
    }
  }

  onProgress?.("uploading");

  const res = await fetch(`${HLS_API_BASE}/api/convert-hls`, {
    method: "POST",
    body: form,
  });

  onProgress?.("converting");

  if (!res.ok) {
    let message = `Server error ${res.status}`;
    try {
      const json = await res.json();
      message = json.error ?? json.reason ?? message;
    } catch { }
    throw new Error(message);
  }

  const blob = await res.blob();

  const disposition = res.headers.get("Content-Disposition") ?? "";
  const filenameMatch = disposition.match(/filename="([^"]+)"/);

  const meta: ConvertHlsMeta = {
    hlsTime: Number(res.headers.get("X-Hls-Time") ?? 0),
    attempt: Number(res.headers.get("X-Hls-Attempt") ?? 0),
    largestMb: Number(res.headers.get("X-Hls-Largest-Mb") ?? 0),
    filename: filenameMatch?.[1] ?? "hls-output.tar.gz",
  };

  return { blob, meta };
}

/**
 * Trigger a browser download of the tar.gz returned by convertVideoToHls.
 */
export function downloadHlsBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export interface ExtractedTarFile {
  name: string;
  data: Uint8Array;
}

/**
 * Extract a .tar.gz blob into an array of files using native browser APIs.
 * Requires DecompressionStream (Chrome 80+, Firefox 113+, Safari 16.4+).
 */
export async function extractTarGz(blob: Blob): Promise<ExtractedTarFile[]> {
  // pipeThrough handles backpressure automatically — avoids deadlock with large files
  const stream = blob.stream().pipeThrough(new DecompressionStream("gzip"));
  const reader = stream.getReader();

  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const tar = new Uint8Array(totalLength);
  let off = 0;
  for (const c of chunks) { tar.set(c, off); off += c.length; }

  const decoder = new TextDecoder();
  const readStr = (hdr: Uint8Array, start: number, len: number) => {
    const bytes = hdr.subarray(start, start + len);
    const nullIdx = bytes.indexOf(0);
    return decoder.decode(nullIdx === -1 ? bytes : bytes.subarray(0, nullIdx));
  };

  const files: ExtractedTarFile[] = [];
  let pos = 0;

  while (pos + 512 <= tar.length) {
    const hdr = tar.subarray(pos, pos + 512);
    if (hdr.every((b) => b === 0)) break;

    const name = readStr(hdr, 0, 100);
    const prefix = readStr(hdr, 345, 155);
    const fullName = prefix ? `${prefix}/${name}` : name;
    const size = parseInt(readStr(hdr, 124, 12).trim() || "0", 8);
    const typeFlag = String.fromCharCode(hdr[156]);

    pos += 512;

    if ((typeFlag === "0" || typeFlag === "\0") && size > 0) {
      files.push({ name: fullName, data: tar.slice(pos, pos + size) });
    }

    pos += Math.ceil(size / 512) * 512;
  }

  return files;
}
