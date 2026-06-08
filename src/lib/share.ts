"use client";

// #E シェア: Web Share API（対応端末はネイティブ共有シート、非対応はクリップボード）
export async function shareLink(opts: {
  title: string;
  text: string;
  path: string;
}): Promise<"shared" | "copied" | "failed"> {
  const url =
    typeof window !== "undefined" ? window.location.origin + opts.path : opts.path;
  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({ title: opts.title, text: opts.text, url });
      return "shared";
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(`${opts.text} ${url}`);
      return "copied";
    }
    return "failed";
  } catch {
    return "failed";
  }
}
