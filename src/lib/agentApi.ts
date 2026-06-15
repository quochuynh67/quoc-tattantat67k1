export interface AgentConfig {
  name: string;
  greeting: string;
  color: string;
  emoji: string;
}

export const DEFAULT_AGENTS: Record<string, AgentConfig> = {
  news: { name: "Cậu Út Tin Tức", greeting: "Ê cưng! Có gì muốn biết về tin tức Phú Tân thì hỏi Cậu Út nha~", color: "#1565c0", emoji: "📰" },
  places: { name: "Út Miền Tây", greeting: "Chào cưng! Muốn khám phá đâu ở Phú Tân thì hỏi Út nha~", color: "#2e7d32", emoji: "🗺️" },
  food: { name: "Cô Út Bếp Núc", greeting: "Ê cưng ơi! Hỏi Cô Út món ăn gì ngon ở Phú Tân nha, Cô biết hết á~", color: "#a85800", emoji: "🍜" },
  beautyHealth: { name: "Chị Út Spa", greeting: "Hi cưng! Cần tư vấn làm đẹp hay sức khỏe thì cứ hỏi Chị Út nha~", color: "#c2185b", emoji: "💆" },
  agriculture: { name: "Chú Út Nông Dân", greeting: "Chào bà con! Có gì về nông nghiệp, mùa vụ Phú Tân thì hỏi Chú Út nha~", color: "#5d4037", emoji: "🌾" },
  health: { name: "Bác Út Y Tế", greeting: "Xin chào cưng! Có gì liên quan sức khỏe, dịch bệnh thì hỏi Bác Út nha~", color: "#b71c1c", emoji: "🏥" },
};

const SECTION_TOPICS: Record<string, string> = {
  news: "tin tức địa phương, sự kiện, hoạt động cộng đồng tại huyện Phú Tân",
  places: "địa điểm tham quan, du lịch, di tích lịch sử tại Phú Tân",
  food: "ẩm thực, món ăn đặc sản, quán ăn ngon tại Phú Tân",
  beautyHealth: "dịch vụ làm đẹp, spa, chăm sóc sức khỏe tại Phú Tân",
  agriculture: "nông nghiệp, canh tác, mùa vụ, phát triển nông thôn tại Phú Tân",
  health: "y tế cộng đồng, cảnh báo dịch bệnh, biện pháp phòng ngừa tại Phú Tân",
};

// Gemini model fallback chain
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-pro"];
let _currentGeminiModelIdx = 0;
let _geminiFailureCount = 0;
const FAILURE_THRESHOLD = 5;

export interface Message {
  role: "user" | "assistant";
  content: string;
}

function getClaudeEndpoint(): string | null {
  const env = (import.meta as any).env ?? {};

  // 1. Explicit override
  if (env.VITE_AI_PROXY_URL) return env.VITE_AI_PROXY_URL;

  // 2. Dev: Vite proxy
  if (env.DEV) return "/api/claude/v1/messages";

  // 3. Production: Supabase Edge Function
  const supabaseUrl = env.VITE_SUPABASE_URL as string | undefined;
  if (supabaseUrl) return `${supabaseUrl}/functions/v1/claude-proxy`;

  return null;
}

async function callClaudeAgent(messages: Message[], section: string, agent: AgentConfig): Promise<string> {
  const endpoint = getClaudeEndpoint();

  if (!endpoint) {
    throw new Error("Claude endpoint chưa được cấu hình");
  }

  const system = `Bạn là ${agent.name}, trợ lý AI thân thiện của trang thông tin huyện Phú Tân, tỉnh An Giang.
Bạn chuyên về ${SECTION_TOPICS[section] || "thông tin huyện Phú Tân"}.
Luôn trả lời bằng tiếng Việt, giọng thân thiện, gần gũi theo phong cách miền Tây Nam Bộ (dùng từ "cưng", "nha", "á", "nè"...).
Câu trả lời ngắn gọn, dưới 150 từ, không dùng markdown.`;

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        system,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });
  } catch (err) {
    console.error("[Claude] Network error:", err);
    throw new Error("Claude: Lỗi mạng");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = body?.error?.message ?? `HTTP ${res.status}`;
    console.error("[Claude] Error:", res.status, body);
    throw new Error(`Claude: ${msg}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text ?? "Hỏng hiểu ý cưng rồi, hỏi lại nha~";
}

async function callGeminiAgent(messages: Message[], section: string, agent: AgentConfig, modelIdx: number = 0): Promise<string> {
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Gemini API key chưa được cấu hình");
  }

  const model = GEMINI_MODELS[modelIdx] || GEMINI_MODELS[GEMINI_MODELS.length - 1];

  const system = `Bạn là ${agent.name}, trợ lý AI thân thiện của trang thông tin huyện Phú Tân, tỉnh An Giang.
Bạn chuyên về ${SECTION_TOPICS[section] || "thông tin huyện Phú Tân"}.
Luôn trả lời bằng tiếng Việt, giọng thân thiện, gần gũi theo phong cách miền Tây Nam Bộ (dùng từ "cưng", "nha", "á", "nè"...).
Câu trả lời ngắn gọn, dưới 150 từ, không dùng markdown.`;

  const contents = [
    {
      role: "user",
      parts: [{ text: system }],
    },
    ...messages.map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    })),
  ];

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            maxOutputTokens: 400,
            temperature: 0.7,
          },
        }),
      }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const errorCode = body?.error?.code;
      let msg = body?.error?.message ?? `HTTP ${res.status}`;

      if (errorCode === 429) {
        const retryInfo = (body?.error?.details as any[])?.find(
          (d) => d["@type"] === "type.googleapis.com/google.rpc.RetryInfo"
        );
        const delaySecs = retryInfo?.retryDelay ? parseInt(retryInfo.retryDelay) : 60;
        _blockedUntil = Date.now() + delaySecs * 1000;
        msg = `${agent.name} đang bận, cưng đợi xíu ${delaySecs} giây rồi nhắn lại nha~`;
      } else if (body?.error?.status === "UNAVAILABLE" || res.status === 503) {
        msg = `${agent.name} đang bận lắm, cưng đợi xíu rồi nhắn lại nha~`;
      } else if (errorCode === 401) {
        msg = "API key không hợp lệ";
      } else if (errorCode === 403) {
        msg = "Không có quyền sử dụng API này";
      }

      console.error(`[Gemini:${model}] Error:`, res.status, body);
      const err = new Error(`[ERROR_${errorCode}] ${msg}`);
      throw err;
    }

    // Success: reset failure counter
    _geminiFailureCount = 0;

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return text ?? "Hỏng hiểu ý cưng rồi, hỏi lại nha~";
  } catch (err) {
    console.error(`[Gemini:${model}] Network error:`, err);
    throw err;
  }
}

const RATE_LIMIT_MS = 60_000;
let _blockedUntil = 0;

export async function callAgent(messages: Message[], section: string, agent: AgentConfig): Promise<string> {
  const now = Date.now();
  if (now < _blockedUntil) {
    const wait = Math.ceil((_blockedUntil - now) / 1000);
    throw new Error(`Chờ ${wait} giây nữa mới nhắn được nha cưng~`);
  }
  _blockedUntil = now + RATE_LIMIT_MS;

  try {
    return await callGeminiAgent(messages, section, agent, _currentGeminiModelIdx);
  } catch (err) {
    _geminiFailureCount++;
    console.warn(`[Gemini] Failure #${_geminiFailureCount} with model ${GEMINI_MODELS[_currentGeminiModelIdx]}:`, err);

    // Switch to next model after 5 failures
    if (_geminiFailureCount >= FAILURE_THRESHOLD && _currentGeminiModelIdx < GEMINI_MODELS.length - 1) {
      _currentGeminiModelIdx++;
      _geminiFailureCount = 0;
      console.log(`[Gemini] Switched to model: ${GEMINI_MODELS[_currentGeminiModelIdx]}`);
    }

    // Try fallback models if current fails
    if (_currentGeminiModelIdx < GEMINI_MODELS.length - 1) {
      try {
        console.log(`[Gemini] Retrying with fallback model: ${GEMINI_MODELS[_currentGeminiModelIdx + 1]}`);
        return await callGeminiAgent(messages, section, agent, _currentGeminiModelIdx + 1);
      } catch (fallbackErr) {
        console.error("[Gemini] Fallback model also failed:", fallbackErr);
      }
    }

    throw err;
  }
}
