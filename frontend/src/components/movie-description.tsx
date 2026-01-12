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
  const content = description || "Chưa có mô tả cho phim này.";
  const plainText = useMemo(() => content.replace(/<[^>]*>/g, ""), [content]);
  const shouldTrim = plainText.length > maxLength;
  // Ensure we don't break HTML structure when slicing, so we prefer CSS line-clamp
  // dependent on length heuristics to show the button.
  // Default to ~3-4 lines (approx 150 chars) for mobile friendliness.
  const threshold = maxLength || 150;
  const isLongText = plainText.length > threshold;

  return (
    <div className="space-y-2">
      <div
        className={`text-sm text-white/60 ${
          expanded ? "" : "line-clamp-3 md:line-clamp-none"
        }`}
        dangerouslySetInnerHTML={{ __html: content }}
      />
      {isLongText ? (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="text-xs font-medium text-[var(--accent-2)] hover:underline md:hidden"
        >
          {expanded ? "Thu gọn" : "Xem thêm"}
        </button>
      ) : null}
    </div>
  );
}
