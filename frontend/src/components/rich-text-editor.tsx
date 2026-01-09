"use client";

import { useEffect, useRef, useState } from "react";

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

const toolbarButton =
  "rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/70 transition hover:border-white/30";

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Nhập nội dung...",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [htmlView, setHtmlView] = useState(false);

  useEffect(() => {
    if (!htmlView && editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value, htmlView]);

  const emitChange = () => {
    if (!editorRef.current) {
      return;
    }
    onChange(editorRef.current.innerHTML);
  };

  const handleCommand = (command: string, arg?: string) => {
    if (!editorRef.current) {
      return;
    }
    editorRef.current.focus();
    document.execCommand(command, false, arg);
    emitChange();
  };

  const handleLink = () => {
    const url = window.prompt("Nhap link");
    if (!url) {
      return;
    }
    handleCommand("createLink", url);
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#111b26] p-3">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/5 pb-2 text-xs text-white/40">
        <button
          type="button"
          className={`${toolbarButton} font-semibold`}
          onClick={() => handleCommand("bold")}
        >
          B
        </button>
        <button
          type="button"
          className={`${toolbarButton} italic`}
          onClick={() => handleCommand("italic")}
        >
          I
        </button>
        <button
          type="button"
          className={`${toolbarButton} underline`}
          onClick={() => handleCommand("underline")}
        >
          U
        </button>
        <button type="button" className={toolbarButton} onClick={handleLink}>
          Link
        </button>
        <button
          type="button"
          className={toolbarButton}
          onClick={() => setHtmlView((prev) => !prev)}
        >
          HTML View
        </button>
      </div>

      {htmlView ? (
        <textarea
          className="mt-3 min-h-[140px] w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <div className="relative mt-3 min-h-[140px]">
          {value ? null : (
            <div className="pointer-events-none absolute left-0 top-0 text-sm text-white/40">
              {placeholder}
            </div>
          )}
          <div
            ref={editorRef}
            className="min-h-[140px] w-full bg-transparent text-sm text-white focus:outline-none"
            contentEditable
            onInput={emitChange}
            suppressContentEditableWarning
          />
        </div>
      )}
    </div>
  );
}
