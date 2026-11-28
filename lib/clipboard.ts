/**
 * Clipboard helper for the small copy interactions on the case-study pages.
 *
 * The Clipboard API is preferred. When it is unavailable (older browser, a
 * non-secure origin or a denied permission) the legacy selection method is tried
 * once; if that also fails the caller surfaces a readable failure state rather
 * than pretending the copy happened.
 */
export async function copyText(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  if (typeof document === "undefined") {
    throw new Error("Clipboard is unavailable");
  }

  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.top = "-9999px";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  const copied = document.execCommand("copy");
  area.remove();

  if (!copied) throw new Error("Clipboard is unavailable");
}
