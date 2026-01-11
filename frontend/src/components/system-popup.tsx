"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

type PopupNotification = {
  id: number;
  title: string;
  message: string;
  created_at: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function SystemPopup() {
  const [popup, setPopup] = useState<PopupNotification | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const fetchPopup = async () => {
      try {
        const token = localStorage.getItem("cinema_token");
        if (!token) return;

        const response = await fetch(`${API_URL}/api/notifications/popup`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) return;

        const data = await response.json();
        if (data.popup) {
          // Check if already dismissed
          const dismissedId = localStorage.getItem("dismissed_popup_id");
          if (dismissedId !== data.popup.id.toString()) {
            setPopup(data.popup);
            setVisible(true);
          }
        }
      } catch (error) {
        console.error("Failed to fetch popup", error);
      }
    };

    fetchPopup();
  }, []);

  const handleClose = () => {
    if (popup) {
      localStorage.setItem("dismissed_popup_id", popup.id.toString());
    }
    setVisible(false);
  };

  if (!visible || !popup) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#162333] shadow-2xl">
        <div className="bg-[#1f8ef1] px-6 py-4">
          <h3 className="text-lg font-semibold text-white">{popup.title}</h3>
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-1 text-white hover:bg-white/20"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          <p className="whitespace-pre-wrap text-sm text-white/80 leading-relaxed">
            {popup.message}
          </p>
        </div>
        <div className="flex justify-end border-t border-white/5 bg-[#111b26] px-6 py-4">
          <button
            onClick={handleClose}
            className="rounded-xl bg-[#1f8ef1] px-6 py-2 text-sm font-semibold text-white hover:bg-[#1a7acb] transition"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
}
