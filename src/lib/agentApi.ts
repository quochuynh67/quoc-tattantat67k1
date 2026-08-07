export type { AgentConfig } from "./promptBuilder";
import { buildChatAgentPrompt, buildWishPrompt, buildNewspaperPrompt } from "./promptBuilder";
import type { AgentConfig } from "./promptBuilder";
// Re-exported for any existing consumers: import { AgentConfig } from "./agentApi"

export const DEFAULT_AGENTS: Record<string, AgentConfig> = {
  news: { name: "Cậu Út Tin Tức", greeting: "Ê cưng! Có gì muốn biết về tin tức Phú Tân thì hỏi Cậu Út nha~", color: "#1565c0", emoji: "📰" },
  places: { name: "Út Miền Tây", greeting: "Chào cưng! Muốn khám phá đâu ở Phú Tân thì hỏi Út nha~", color: "#2e7d32", emoji: "🗺️" },
  food: { name: "Cô Út Bếp Núc", greeting: "Ê cưng ơi! Hỏi Cô Út món ăn gì ngon ở Phú Tân nha, Cô biết hết á~", color: "#a85800", emoji: "🍜" },
  beautyHealth: { name: "Chị Út Spa", greeting: "Hi cưng! Cần tư vấn làm đẹp hay sức khỏe thì cứ hỏi Chị Út nha~", color: "#c2185b", emoji: "💆" },
  agriculture: { name: "Chú Út Nông Dân", greeting: "Chào bà con! Có gì về nông nghiệp, mùa vụ Phú Tân thì hỏi Chú Út nha~", color: "#5d4037", emoji: "🌾" },
  health: { name: "Bác Út Y Tế", greeting: "Xin chào cưng! Có gì liên quan sức khỏe, dịch bệnh thì hỏi Bác Út nha~", color: "#b71c1c", emoji: "🏥" },
};

const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-pro"];
let _currentGeminiModelIdx = 0;
let _geminiFailureCount = 0;
const FAILURE_THRESHOLD = 5;

export interface Message {
  role: "user" | "assistant";
  content: string;
}

const RATE_LIMIT_MS = 60_000;
let _blockedUntil = 0;

function buildGeminiContents(messages: Message[], section: string, agent: AgentConfig) {
  return [
    { role: "user", parts: [{ text: buildChatAgentPrompt(section, agent) }] },
    ...messages.map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    })),
  ];
}

function parseGeminiError(body: any, status: number, agent: AgentConfig): string {
  const errorCode = body?.error?.code;
  if (errorCode === 429) {
    const retryInfo = (body?.error?.details as any[])?.find(
      (d) => d["@type"] === "type.googleapis.com/google.rpc.RetryInfo"
    );
    const delaySecs = retryInfo?.retryDelay ? parseInt(retryInfo.retryDelay) : 60;
    _blockedUntil = Date.now() + delaySecs * 1000;
    return `[ERROR_429] ${agent.name} đang bận, cưng đợi xíu ${delaySecs} giây rồi nhắn lại nha~`;
  }
  if (body?.error?.status === "UNAVAILABLE" || status === 503) {
    return `[ERROR_503] ${agent.name} đang bận lắm, cưng đợi xíu rồi nhắn lại nha~`;
  }
  if (errorCode === 401) return `[ERROR_401] API key không hợp lệ`;
  if (errorCode === 403) return `[ERROR_403] Không có quyền sử dụng API này`;
  return `[ERROR_${errorCode ?? status}] ${body?.error?.message ?? `HTTP ${status}`}`;
}

// ── Streaming (SSE) ───────────────────────────────────────────────────────────

async function streamGeminiAgent(
  messages: Message[],
  section: string,
  agent: AgentConfig,
  onChunk: (text: string) => void,
  modelIdx: number = 0
): Promise<void> {
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API key chưa được cấu hình");

  const model = GEMINI_MODELS[modelIdx] || GEMINI_MODELS[GEMINI_MODELS.length - 1];
  const contents = buildGeminiContents(messages, section, agent);

  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: { maxOutputTokens: 400, temperature: 0.7 },
        }),
      }
    );
  } catch {
    throw new Error("Hỏng kết nối được, thử lại sau nha cưng~");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.error(`[Gemini:${model}] Error:`, res.status, body);
    throw new Error(parseGeminiError(body, res.status, agent));
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  _geminiFailureCount = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (!jsonStr || jsonStr === "[DONE]") continue;
      try {
        const data = JSON.parse(jsonStr);
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) onChunk(text);
      } catch {
        // malformed SSE chunk — skip
      }
    }
  }
}

export async function streamAgent(
  messages: Message[],
  section: string,
  agent: AgentConfig,
  onChunk: (text: string) => void
): Promise<void> {
  const now = Date.now();
  if (now < _blockedUntil) {
    const wait = Math.ceil((_blockedUntil - now) / 1000);
    throw new Error(`Chờ ${wait} giây nữa mới nhắn được nha cưng~`);
  }
  _blockedUntil = now + RATE_LIMIT_MS;

  try {
    await streamGeminiAgent(messages, section, agent, onChunk, _currentGeminiModelIdx);
  } catch (err) {
    _geminiFailureCount++;
    console.warn(`[Gemini] Failure #${_geminiFailureCount} with model ${GEMINI_MODELS[_currentGeminiModelIdx]}:`, err);

    if (_geminiFailureCount >= FAILURE_THRESHOLD && _currentGeminiModelIdx < GEMINI_MODELS.length - 1) {
      _currentGeminiModelIdx++;
      _geminiFailureCount = 0;
      console.log(`[Gemini] Switched to model: ${GEMINI_MODELS[_currentGeminiModelIdx]}`);
    }

    if (_currentGeminiModelIdx < GEMINI_MODELS.length - 1) {
      try {
        console.log(`[Gemini] Retrying with fallback model: ${GEMINI_MODELS[_currentGeminiModelIdx + 1]}`);
        await streamGeminiAgent(messages, section, agent, onChunk, _currentGeminiModelIdx + 1);
        return;
      } catch (fallbackErr) {
        console.error("[Gemini] Fallback model also failed:", fallbackErr);
      }
    }

    throw err;
  }
}

// Non-streaming wrapper (kept for any non-chat callers)
export async function callAgent(messages: Message[], section: string, agent: AgentConfig): Promise<string> {
  let result = "";
  await streamAgent(messages, section, agent, (chunk) => { result += chunk; });
  return result;
}

// ── Wish Generator ───────────────────────────────────────────────────────────

export interface WishResult {
  text: string;
}

export async function generateWishes(
  occasion: string,
  description: string,
  count: number,
  onChunk?: (partial: string) => void
): Promise<WishResult[]> {
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API key chưa được cấu hình");

  const model = GEMINI_MODELS[_currentGeminiModelIdx] ?? GEMINI_MODELS[0];
  const prompt = buildWishPrompt(occasion, description, count);

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1200, temperature: 0.85 },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Lỗi tạo lời chúc: ${body?.error?.message ?? `HTTP ${res.status}`}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (!jsonStr || jsonStr === "[DONE]") continue;
      try {
        const data = JSON.parse(jsonStr);
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) { full += text; onChunk?.(full); }
      } catch { /* skip malformed */ }
    }
  }

  const wishes = full
    .split("---WISH---")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, count)
    .map((text) => ({ text }));

  return wishes.length > 0 ? wishes : [{ text: full.trim() }];
}

// ── Newspaper Generator ──────────────────────────────────────────────────────

export interface NewspaperContent {
  newspaperName: string;
  headline: string;
  date: string;
  price: string;
  subHeading1: string;
  text1: string;
  subHeading2: string;
  text2: string;
  sidebarTitle?: string;
  sidebarText?: string;
  quote?: string;
  photoCaption?: string;
}

export async function generateNewspaperContent(
  topic: string,
  language: string,
  templateStyle: string,
  layoutName?: string
): Promise<NewspaperContent> {
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API key chưa được cấu hình");

  const model = GEMINI_MODELS[_currentGeminiModelIdx] ?? GEMINI_MODELS[0];
  const prompt = buildNewspaperPrompt(topic, language, templateStyle, layoutName);

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 4096, temperature: 0.7 },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Lỗi tạo báo: ${body?.error?.message ?? ("HTTP " + res.status)}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  
  // Extract JSON from response (in case Gemini wraps it in markdown)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Không thể trích xuất JSON từ phản hồi của AI.");
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return parsed as NewspaperContent;
  } catch (err) {
    throw new Error("AI trả về định dạng JSON không hợp lệ.");
  }
}

// ── Claude (non-streaming, proxy-based) ──────────────────────────────────────

function getClaudeEndpoint(): string | null {
  const env = (import.meta as any).env ?? {};
  if (env.VITE_AI_PROXY_URL) return env.VITE_AI_PROXY_URL;
  if (env.DEV) return "/api/claude/v1/messages";
  const supabaseUrl = env.VITE_SUPABASE_URL as string | undefined;
  if (supabaseUrl) return `${supabaseUrl}/functions/v1/claude-proxy`;
  return null;
}

export async function callClaudeAgent(messages: Message[], section: string, agent: AgentConfig): Promise<string> {
  const endpoint = getClaudeEndpoint();
  if (!endpoint) throw new Error("Claude endpoint chưa được cấu hình");

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        system: buildChatAgentPrompt(section, agent),
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });
  } catch {
    throw new Error("Claude: Lỗi mạng");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Claude: ${body?.error?.message ?? `HTTP ${res.status}`}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text ?? "Hỏng hiểu ý cưng rồi, hỏi lại nha~";
}
