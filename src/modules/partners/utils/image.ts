export function getStorageImageUrl(url?: string | null): string {
  if (!url) return "";
  if (url.startsWith("blob:") || url.startsWith("data:")) return url;

  const currentHost = typeof window !== "undefined" && window.location.hostname
    ? window.location.hostname
    : "127.0.0.1";

  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      const parsed = new URL(url);
      if (parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost") {
        parsed.hostname = currentHost;
        return parsed.toString();
      }
      return url;
    } catch {
      return url;
    }
  }

  let cleanPath = url.replace(/^\/+/, "");
  if (!cleanPath.startsWith("storage/")) {
    cleanPath = `storage/${cleanPath}`;
  }

  return `http://${currentHost}:8000/${cleanPath}`;
}
