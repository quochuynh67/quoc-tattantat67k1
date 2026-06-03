export interface AgentConfig {
  name: string;
  greeting: string;
  color: string;
  emoji: string;
}

export const DEFAULT_AGENTS: Record<string, AgentConfig> = {
  news:         { name: "Cậu Út Tin Tức",   greeting: "Ê cưng! Có gì muốn biết về tin tức Phú Tân thì hỏi Cậu Út nha~",              color: "#1976d2", emoji: "📰" },
  places:       { name: "Út Miền Tây",       greeting: "Chào cưng! Muốn khám phá đâu ở Phú Tân thì hỏi Út nha~",                     color: "#388e3c", emoji: "🗺️" },
  food:         { name: "Cô Út Bếp Núc",    greeting: "Ê cưng ơi! Hỏi Cô Út món ăn gì ngon ở Phú Tân nha, Cô biết hết á~",         color: "#f57c00", emoji: "🍜" },
  beautyHealth: { name: "Chị Út Spa",        greeting: "Hi cưng! Cần tư vấn làm đẹp hay sức khỏe thì cứ hỏi Chị Út nha~",           color: "#c2185b", emoji: "💆" },
  agriculture:  { name: "Chú Út Nông Dân",   greeting: "Chào bà con! Có gì về nông nghiệp, mùa vụ Phú Tân thì hỏi Chú Út nha~",     color: "#5d4037", emoji: "🌾" },
  health:       { name: "Bác Út Y Tế",       greeting: "Xin chào cưng! Có gì liên quan sức khỏe, dịch bệnh thì hỏi Bác Út nha~",    color: "#d32f2f", emoji: "🏥" },
};

const SECTION_TOPICS: Record<string, string> = {
  news:         "tin tức địa phương, sự kiện, hoạt động cộng đồng tại huyện Phú Tân",
  places:       "địa điểm tham quan, du lịch, di tích lịch sử tại Phú Tân",
  food:         "ẩm thực, món ăn đặc sản, quán ăn ngon tại Phú Tân",
  beautyHealth: "dịch vụ làm đẹp, spa, chăm sóc sức khỏe tại Phú Tân",
  agriculture:  "nông nghiệp, canh tác, mùa vụ, phát triển nông thôn tại Phú Tân",
  health:       "y tế cộng đồng, cảnh báo dịch bệnh, biện pháp phòng ngừa tại Phú Tân",
};

export interface Message {
  role: "user" | "assistant";
  content: string;
}

function getEndpoint(): string | null {
  const env = (import.meta as any).env ?? {};

  // 1. Explicit override (e.g. VITE_AI_PROXY_URL=https://your-backend.com/...)
  if (env.VITE_AI_PROXY_URL) return env.VITE_AI_PROXY_URL;

  // 2. Dev: Vite proxy → no CORS
  if (env.DEV) return "/api/claude/v1/messages";

  // 3. Production: Supabase Edge Function
  const supabaseUrl = env.VITE_SUPABASE_URL as string | undefined;
  if (supabaseUrl) return `${supabaseUrl}/functions/v1/claude-proxy`;

  return null;
}

export async function callAgent(messages: Message[], section: string, agent: AgentConfig): Promise<string> {
  const endpoint = getEndpoint();

  if (!endpoint) {
    return "Proxy chưa được cấu hình nha cưng~";
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
    console.error("[AgentAPI] Network error:", err);
    throw new Error("Lỗi mạng — kiểm tra kết nối nha cưng~");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = body?.error?.message ?? `HTTP ${res.status}`;
    console.error("[AgentAPI] Error:", res.status, body);
    throw new Error(msg);
  }

  const data = await res.json();
  return data.content?.[0]?.text ?? "Hỏng hiểu ý cưng rồi, hỏi lại nha~";
}
