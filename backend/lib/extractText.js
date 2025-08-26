// backend/lib/extractText.js
export async function extractText(buffer, filePath) {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".txt") || lower.endsWith(".md") || lower.endsWith(".csv") || lower.endsWith(".json")) {
    try {
      return buffer.toString("utf8").slice(0, 20000); // cap for safety
    } catch {
      return "";
    }
  }
  // TODO: add pdf/docx extraction later
  return "";
}