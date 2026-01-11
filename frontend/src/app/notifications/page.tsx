"use client";

import { useEffect, useMemo, useState } from "react";
import SiteFooter from "../../components/site-footer";
import SiteHeader from "../../components/site-header";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const PAGE_SIZE = 10;

type NotificationItem = {
  id: number;
  title: string;
  message: string;
  created_at: string;
  read_at: string | null;
};

type Pagination = {
  page: number;
  total: number;
  totalPages: number;
};

type FilterMode = "all" | "unread" | "read";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    total: 0,
    totalPages: 1
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("cinema_token");
        if (!token) {
          setError("B?n chua dang nhập.");
          return;
        }

        const params = new URLSearchParams();
        params.set("limit", PAGE_SIZE.toString());
        params.set("page", currentPage.toString());

        const response = await fetch(`${API_URL}/api/notifications/inbox?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store"
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          setError(data.message || "Không tải được thông báo.");
          return;
        }

        const data = await response.json();
        setNotifications(data.notifications || []);
        setPagination(data.pagination || { page: 1, total: 0, totalPages: 1 });
      } catch (err) {
        setError("Không thể kết nối dữ liệu.");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [currentPage]);

  const filteredNotifications = useMemo(() => {
    if (filterMode === "all") return notifications;
    if (filterMode === "unread") return notifications.filter((item) => !item.read_at);
    return notifications.filter((item) => item.read_at);
  }, [notifications, filterMode]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read_at).length,
    [notifications]
  );

  const totalPages = Math.max(1, pagination.totalPages || 1);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const handleMarkRead = async (id: number) => {
    try {
      const token = localStorage.getItem("cinema_token");
      if (!token) {
        setError("Bạn chưa đăng nhập.");
        return;
      }

      const response = await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.message || "Không thể cập nhật thông báo.");
        return;
      }

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, read_at: new Date().toISOString() } : item
        )
      );
      window.dispatchEvent(new Event("notifications-updated"));
    } catch (err) {
      setError("Không thể kết nối dữ liệu.");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem("cinema_token");
      if (!token) {
        setError("Bạn chưa đăng nhập.");
        return;
      }

      const response = await fetch(`${API_URL}/api/notifications/mark-all-read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.message || "Không thể cập nhật thông báo.");
        return;
      }

      const now = new Date().toISOString();
      setNotifications((prev) => prev.map((item) => ({ ...item, read_at: now })));
      window.dispatchEvent(new Event("notifications-updated"));
    } catch (err) {
      setError("Không thể kết nối dữ liệu.");
    }
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl space-y-6 px-4 pb-16 pt-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Thông báo</h1>
            <p className="mt-1 text-sm text-white/60">
              {unreadCount > 0
                ? `Bạn có ${unreadCount} thông báo chưa đọc.`
                : "Không có thông báo mới."}
            </p>
          </div>
          <button
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs text-white/80"
            onClick={handleMarkAllRead}
            disabled={notifications.length === 0}
          >
            Đánh dấu đã đọc
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          {([
            { label: "Tất cả", value: "all" },
            { label: "Chưa đọc", value: "unread" },
            { label: "Đã đọc", value: "read" }
          ] as { label: string; value: FilterMode }[]).map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilterMode(tab.value)}
              className={`rounded-full px-4 py-2 text-xs ${
                filterMode === tab.value
                  ? "bg-[var(--accent)] text-white"
                  : "border border-white/10 bg-white/5 text-white/70"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-[var(--panel)] p-4 sm:p-6 text-sm text-white/60">
              Đang tải thông báo...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[var(--panel)] p-4 sm:p-6 text-sm text-white/60">
              Chưa có thông báo nào.
            </div>
          ) : (
            filteredNotifications.map((item) => (
              <div
                key={item.id}
                className={`rounded-2xl border border-white/10 bg-[var(--panel)] p-4 sm:p-5 ${
                  item.read_at ? "opacity-75" : ""
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-white">{item.title}</p>
                    <p className="mt-2 text-sm text-white/70">{item.message}</p>
                    <p className="mt-3 text-xs text-white/40">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!item.read_at ? (
                      <button
                        className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white"
                        onClick={() => handleMarkRead(item.id)}
                      >
                        Đánh dấu đã đọc
                      </button>
                    ) : (
                      <span className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs text-white/60">
                        Đã đọc
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {error ? <p className="text-sm text-red-300">{error}</p> : null}

        <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`h-9 w-9 rounded-xl border text-xs ${
                page === currentPage
                  ? "border-transparent bg-[var(--accent)] text-white"
                  : "border-white/10 bg-white/5 text-white/70"
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

