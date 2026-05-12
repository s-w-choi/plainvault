"use client";

import { useCallback, useState } from "react";

interface CopyableCodeBlockProps {
  code: string;
  className?: string;
}

export function CopyableCodeBlock({ code, className = "" }: CopyableCodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [code]);

  return (
    <div className={`relative group ${className}`}>
      <pre
        className="bg-gray-900 text-white text-xs rounded-lg p-4 pr-12 overflow-x-auto font-mono"
        style={{ whiteSpace: "pre", wordBreak: "break-all", userSelect: "all" }}
      >
        {code}
      </pre>
      <button
        type="button"
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
        title={copied ? "Copied!" : "Copy to clipboard"}
        aria-label={copied ? "Copied!" : "Copy to clipboard"}
      >
        {copied ? (
          <svg
            className="w-4 h-4 text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <title>Checkmark</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <title>Copy</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
