"use client";

import { useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const PAGE_SIZE = 8;

type NotificationItem = {
  id: number;
  title: string;
  message: string;
  audience: "all" | "role" | "user";
  target_role: "admin" | "user" | null;
  target_user_id: number | null;
  target_user_email?: string | null;
  status: "sent" | "draft";
  created_at: string;
  created_by_email?: string | null;
};

type NotificationStats = {
  total: number;
  sent: number;
  draft: number;
  totalUsers: number;
};

type Pagination = {
  page: number;
  total: number;
  totalPages: number;
};

type StatusFilter = "all" | "sent" | "draft";

type AudienceType = "all" | "role" | "user";

type SendStatus = "sent" | "draft";

const statusLabels: Record<SendStatus, string> = {
  sent: "Đã Gửi",
  draft: "Nháp",
};

const statusClasses: Record<SendStatus, string> = {
  sent: "bg-green-500/15 text-green-400",
  draft: "bg-yellow-500/15 text-yellow-300",
};

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    sent: 0,
    draft: 0,
    totalUsers: 0,
  });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState<AudienceType>("all");
  const [targetRole, setTargetRole] = useState("user");
  const [targetEmail, setTargetEmail] = useState("");
  const [sendStatus, setSendStatus] = useState<SendStatus>("sent");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchTerm.trim());
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("cinema_token");
        if (!token) {
          setError("Bạn chưa đăng nhập!.");
          return;
        }

        const params = new URLSearchParams();
        params.set("limit", PAGE_SIZE.toString());
        params.set("page", currentPage.toString());
        if (statusFilter !== "all") params.set("status", statusFilter);
        if (searchQuery) params.set("q", searchQuery);

        const response = await fetch(
          `${API_URL}/api/notifications?${params.toString()}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }
        );

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          setError(data.message || "Không tải được thông báo!");
          return;
        }

        const data = await response.json();
        setNotifications(data.notifications || []);
        setPagination(data.pagination || { page: 1, total: 0, totalPages: 1 });
        setStats(
          data.stats || {
            total: 0,
            sent: 0,
            draft: 0,
            totalUsers: 0,
          }
        );
      } catch (err) {
        setError("Không thể kết nối tới backend!.");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [currentPage, statusFilter, searchQuery, refreshKey]);

  const totalPages = useMemo(
    () => Math.max(1, pagination.totalPages || 1),
    [pagination.totalPages]
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const handleOpenForm = () => {
    setShowForm(true);
    setFormError("");
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setTitle("");
    setMessage("");
    setAudience("all");
    setTargetRole("user");
    setTargetEmail("");
    setSendStatus("sent");
    setFormError("");
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      setFormError("Vui lòng nhập tiêu đề và nội dung.");
      return;
    }

    if (audience === "user" && !targetEmail.trim()) {
      setFormError("Vui lòng nhập email người dùng.");
      return;
    }

    if (audience === "role" && !targetRole) {
      setFormError("Cần chọn vai trò.");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const token = localStorage.getItem("cinema_token");
      if (!token) {
        setFormError("Bạn chưa đăng nhập");
        return;
      }

      const response = await fetch(`${API_URL}/api/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          audience,
          targetRole: audience === "role" ? targetRole : undefined,
          targetEmail: audience === "user" ? targetEmail.trim() : undefined,
          status: sendStatus,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setFormError(data.message || "Không thể gửi thông báo!.");
        return;
      }

      setNotifications((prev) => [data.notification, ...prev]);
      setStats((prev) => ({
        total: prev.total + 1,
        sent: prev.sent + (data.notification?.status === "sent" ? 1 : 0),
        draft: prev.draft + (data.notification?.status === "draft" ? 1 : 0),
        totalUsers: prev.totalUsers,
      }));
      handleCloseForm();
    } catch (err) {
      setFormError("Không thể kết nối tới backend!.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa thông báo này?")) {
      return;
    }

    try {
      const token = localStorage.getItem("cinema_token");
      if (!token) {
        setError("Bạn chưa đăng nhập!.");
        return;
      }

      const response = await fetch(`${API_URL}/api/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.message || "Không thể xóa thông báo.");
        return;
      }

      setNotifications((prev) => prev.filter((item) => item.id !== id));
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      setError("Không thể kết nối dữ liệu.");
    }
  };

  const getAudienceLabel = (item: NotificationItem) => {
    if (item.audience === "all") return "Toàn bộ người dùng";
    if (item.audience === "role") return `Vai Trò: ${item.target_role || "-"}`;
    if (item.audience === "user") {
      return item.target_user_email
        ? item.target_user_email
        : `User #${item.target_user_id || "-"}`;
    }
    return "-";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Quản lý thông báo</h1>
          <p className="mt-1 text-sm text-white/60">
            Quản lý và gửi thông báo tới người dùng.
          </p>
        </div>
        <button
          className="rounded-xl bg-[#1f8ef1] px-4 py-2 text-sm font-semibold text-white"
          onClick={handleOpenForm}
        >
          Gửi Thông Báo Mới
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-white/5 bg-[#162333] p-4">
          <p className="text-xs text-white/50">Tổng thông báo</p>
          <p className="mt-2 text-2xl font-semibold">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-[#162333] p-4">
          <p className="text-xs text-white/50">Đã gửi</p>
          <p className="mt-2 text-2xl font-semibold">{stats.sent}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-[#162333] p-4">
          <p className="text-xs text-white/50">Nháp</p>
          <p className="mt-2 text-2xl font-semibold">{stats.draft}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-[#162333] p-4">
          <p className="text-xs text-white/50">Người Dùng</p>
          <p className="mt-2 text-2xl font-semibold">{stats.totalUsers}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-[#162333] p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-[#111b26] px-3 py-2 text-sm text-white/60">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20L17 17" />
            </svg>
            <input
              className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
              placeholder="Tìm kiếm thông báo..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          {["all", "sent", "draft"].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status as StatusFilter);
                setCurrentPage(1);
              }}
              className={`rounded-xl px-3 py-2 text-xs ${
                statusFilter === status
                  ? "bg-[#1f8ef1] text-white"
                  : "border border-white/10 bg-[#111b26] text-white/70"
              }`}
            >
              {status === "all" ? "Tất cả" : statusLabels[status as SendStatus]}
            </button>
          ))}
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-white/5">
          <div className="grid grid-cols-[2fr_1.2fr_0.8fr_0.8fr] bg-[#111b26] px-4 py-3 text-xs text-white/50">
            <span>Tiêu đề thông báo</span>
            <span>Đối tượng</span>
            <span>Ngày gửi</span>
            <span>Trạng thái</span>
          </div>
          <div className="divide-y divide-white/5">
            {loading ? (
              <div className="px-4 py-6 text-sm text-white/60">
                Đang tải dữ liệu...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-6 text-sm text-white/60">
                Chưa có thông báo nào.
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[2fr_1.2fr_0.8fr_0.8fr] items-center px-4 py-4 text-sm"
                >
                  <div>
                    <p className="font-semibold text-white">{item.title}</p>
                    <p className="text-xs text-white/60">
                      {item.message.length > 120
                        ? `${item.message.slice(0, 120)}...`
                        : item.message}
                    </p>
                  </div>
                  <p className="text-xs text-white/60">
                    {getAudienceLabel(item)}
                  </p>
                  <p className="text-xs text-white/60">
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] ${
                        statusClasses[item.status] ||
                        "bg-white/10 text-white/70"
                      }`}
                    >
                      {statusLabels[item.status]}
                    </span>
                    <button
                      className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70"
                      onClick={() => handleDelete(item.id)}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {error ? <p className="mt-4 text-xs text-red-300">{error}</p> : null}

        <div className="mt-4 flex items-center justify-between text-xs text-white/50">
          <span>
            Hiển thị{" "}
            {notifications.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}{" "}
            đến {Math.min(currentPage * PAGE_SIZE, pagination.total || 0)} kết
            quả
          </span>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`h-8 w-8 rounded-lg border text-xs ${
                    page === currentPage
                      ? "border-transparent bg-[#1f8ef1] text-white"
                      : "border-white/10 bg-[#111b26] text-white/70"
                  }`}
                >
                  {page}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#111b26] p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Gửi Thông Báo Mới</h2>
              <button
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
                onClick={handleCloseForm}
              >
                Đóng
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <label className="space-y-2 text-xs text-white/60">
                Tiêu đề
                <input
                  className="w-full rounded-xl border border-white/10 bg-[#0f1924] px-3 py-2 text-sm text-white"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="VD: Cập nhật hệ thống"
                />
              </label>
              <label className="space-y-2 text-xs text-white/60">
                Nội dung
                <textarea
                  className="min-h-[120px] w-full rounded-xl border border-white/10 bg-[#0f1924] px-3 py-2 text-sm text-white"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Nhập nội dung thông báo..."
                />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-xs text-white/60">
                  Đối tượng
                  <select
                    className="w-full rounded-xl border border-white/10 bg-[#0f1924] px-3 py-2 text-sm text-white"
                    value={audience}
                    onChange={(event) =>
                      setAudience(event.target.value as AudienceType)
                    }
                  >
                    <option value="all">Tất cả người dùng</option>
                    <option value="role">Theo vai trò</option>
                    <option value="user">Người dùng cụ thể</option>
                  </select>
                </label>
                <label className="space-y-2 text-xs text-white/60">
                  Trạng thái
                  <select
                    className="w-full rounded-xl border border-white/10 bg-[#0f1924] px-3 py-2 text-sm text-white"
                    value={sendStatus}
                    onChange={(event) =>
                      setSendStatus(event.target.value as SendStatus)
                    }
                  >
                    <option value="sent">Gửi ngay</option>
                    <option value="draft">Lưu nháp</option>
                  </select>
                </label>
              </div>
              {audience === "role" ? (
                <label className="space-y-2 text-xs text-white/60">
                  Vai trò
                  <select
                    className="w-full rounded-xl border border-white/10 bg-[#0f1924] px-3 py-2 text-sm text-white"
                    value={targetRole}
                    onChange={(event) => setTargetRole(event.target.value)}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
              ) : null}
              {audience === "user" ? (
                <label className="space-y-2 text-xs text-white/60">
                  Email Người dùng
                  <input
                    className="w-full rounded-xl border border-white/10 bg-[#0f1924] px-3 py-2 text-sm text-white"
                    value={targetEmail}
                    onChange={(event) => setTargetEmail(event.target.value)}
                    placeholder="user@example.com"
                  />
                </label>
              ) : null}
            </div>

            {formError ? (
              <p className="mt-3 text-xs text-red-300">{formError}</p>
            ) : null}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70"
                onClick={handleCloseForm}
              >
                Hủy
              </button>
              <button
                className="rounded-xl bg-[#1f8ef1] px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleSend}
                disabled={saving}
              >
                {saving ? "Đang gửi" : "Gửi thông báo"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
