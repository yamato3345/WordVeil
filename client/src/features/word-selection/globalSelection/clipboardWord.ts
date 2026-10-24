// Keep internal apostrophes and hyphens, including Ukrainian words and contractions.
// Ignore phrases, URLs, code and binary/oversized clipboard data.
export function extractClipboardWord(raw: string): string {
  if (raw.length > 256) return "";
  const text = raw.trim().replace(/^[“”‘’"'«»([{]+|[“”‘’"'«»)\]},.!?;:]+$/gu, "");
  return /^[\p{L}\p{M}]+(?:['’ʼ\-][\p{L}\p{M}]+)*$/u.test(text) ? text : "";
}
