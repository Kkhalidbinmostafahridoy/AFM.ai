/** Strip markdown fences and parse JSON from Gemini text output. */
export function parseGeminiJson<T>(raw: string): T {
  let text = raw.trim();
  const fence = text.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  if (fence) text = fence[1].trim();
  return JSON.parse(text) as T;
}
