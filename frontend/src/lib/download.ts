/** Downloads a (same-origin) file URL under a chosen, human-readable filename. */
export async function downloadFile(url: string, filename: string): Promise<void> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  const blob = await res.blob();
  const objUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objUrl), 2000);
}

/** Strips characters that don't belong in a filename. */
export function safeFileName(s: string | null | undefined, fallback = "file"): string {
  const cleaned = (s ?? "")
    .replace(/[^a-zA-Z0-9 _.-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || fallback;
}
