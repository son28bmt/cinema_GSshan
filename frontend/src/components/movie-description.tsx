"use client";

import { useMemo, useState } from "react";

export default function MovieDescription({
  description,
  maxLength = 240,
}: {
  description: string | null;
  maxLength?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const content = description || "Chua co mo ta cho phim nay.";
  const plainText = useMemo(() => content.replace(/<[^>]*>/g, ""), [content]);
  const shouldTrim = plainText.length > maxLength;
  const displayText = useMemo(() => {
    if (!shouldTrim || expanded) {
      return plainText;
    }
    return `${plainText.slice(0, maxLength)}...`;
  }, [plainText, expanded, maxLength, shouldTrim]);

  return (
    <div className="space-y-3">
      {expanded ? (
        <div
          className="text-sm text-white/60"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      ) : (
        <p className="text-sm text-white/60">{displayText}</p>
      )}
      {shouldTrim ? (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="text-xs text-[var(--accent-2)]"
        >
          {expanded ? "Thu gọn" : "Xem thêm"}
        </button>
      ) : null}
    </div>
  );
}
