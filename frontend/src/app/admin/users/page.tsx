"use client";

import { useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const PAGE_SIZE = 5;

type User = {
  id: number;
  name: string | null;
  email: string;
  role: string;
  status: string;
  created_at: string;
};

type UserStats = {
  total: number;
  active: number;
  disabled: number;
};

const roleLabels: Record<string, string> = {
  admin: "Admin",
  user: "User",
};

const roleStyles: Record<string, string> = {
  admin: "bg-blue-500/20 text-blue-300",
  user: "bg-slate-500/20 text-slate-300",
};

const statusLabels: Record<string, string> = {
  active: "Hoạt động",
  disabled: "Đã khóa",
  pending: "Chờ xác thực",
};

const statusStyles: Record<string, string> = {
  active: "bg-green-500/15 text-green-400",
  disabled: "bg-red-500/15 text-red-300",
  pending: "bg-yellow-500/15 text-yellow-300",
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("vi-VN");

const formatNumber = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value);

type RoleFilter = "all" | "admin" | "user";
type StatusFilter = "all" | "active" | "disabled" | "pending";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({ total: 0, active: 0, disabled: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${API_URL}/api/users?limit=100`, {
          cache: "no-store",
        });
        if (!response.ok) {
          setError("Không tải được dữ liệu người dùng.");
          return;
        }
        const data = await response.json();
        setUsers(data.users || []);
        setStats(data.stats || { total: 0, active: 0, disabled: 0 });
      } catch (err) {
        setError("Không thể kết nối dữ liệu.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return users.filter((user) => {
      const matchesTerm =
        !term ||
        user.email.toLowerCase().includes(term) ||
        (user.name || "").toLowerCase().includes(term) ||
        user.id.toString().includes(term);
      const matchesRole = roleFilter === "all" ? true : user.role === roleFilter;
      const matchesStatus =
        statusFilter === "all" ? true : user.status === statusFilter;
      return matchesTerm && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter]);

  const handleOpenForm = () => {
    setFormError("");
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setName("");
    setEmail("");
    setPassword("");
    setFormError("");
  };

  const handleSave = async () => {
    if (!email.trim() || !password.trim()) {
      setFormError("Vui lòng nhập email và mật khẩu.");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
          name: name.trim() || undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setFormError(data.message || "Không thể tạo người dùng.");
        return;
      }

      if (data.user) {
        setUsers((prev) => [data.user, ...prev]);
        setStats((prev) => ({
          total: prev.total + 1,
          active: prev.active + (data.user.status === "active" ? 1 : 0),
          disabled: prev.disabled + (data.user.status === "disabled" ? 1 : 0),
        }));
      }
      handleCloseForm();
    } catch (err) {
      setFormError("Không thể kết nối dữ liệu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Quản lý Người Dùng</h1>
          <p className="mt-1 text-sm text-white/60">
            Xem, chỉnh sửa và quản lý quyền truy cập của thành viên.
          </p>
        </div>
        <button
          className="rounded-xl bg-[#1f8ef1] px-4 py-2 text-sm font-semibold text-white"
          onClick={handleOpenForm}
        >
          + Thêm người dùng
        </button>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Tổng người dùng", value: stats.total, note: "Tổng số tài khoản" },
          { label: "Đang hoạt động", value: stats.active, note: "Tỷ lệ hoạt động" },
          { label: "Đã khóa", value: stats.disabled, note: "Cần xem xét" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-white/5 bg-[#162333] p-5"
          >
            <p className="text-xs text-white/50">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold">
              {formatNumber(stat.value)}
            </p>
            <p className="mt-2 text-xs text-white/50">{stat.note}</p>
          </div>
        ))}
      </section>

      <div className="rounded-2xl border border-white/5 bg-[#162333] p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-[#111b26] px-3 py-2 text-sm text-white/60">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20L17 17" />
            </svg>
            <input
              className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
              placeholder="Tìm kiếm theo tên, email hoặc ID..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          {(["all", "admin", "user"] as RoleFilter[]).map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`rounded-xl px-3 py-2 text-xs ${
                roleFilter === role
                  ? "bg-[#1f8ef1] text-white"
                  : "border border-white/10 bg-[#111b26] text-white/70"
              }`}
            >
              {role === "all" ? "Tất cả vai trò" : roleLabels[role]}
            </button>
          ))}
          {(["all", "active", "disabled", "pending"] as StatusFilter[]).map(
            (status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-xl px-3 py-2 text-xs ${
                  statusFilter === status
                    ? "bg-[#1f8ef1] text-white"
                    : "border border-white/10 bg-[#111b26] text-white/70"
                }`}
              >
                {status === "all" ? "Tất cả trạng thái" : statusLabels[status]}
              </button>
            )
          )}
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-white/5">
          <div className="grid grid-cols-[0.6fr_1.4fr_0.9fr_0.8fr_0.8fr_0.7fr] bg-[#111b26] px-4 py-3 text-xs text-white/50">
            <span></span>
            <span>Người dùng</span>
            <span>Vai trò</span>
            <span>Ngày tham gia</span>
            <span>Trạng thái</span>
            <span>Hành động</span>
          </div>
          <div className="divide-y divide-white/5">
            {loading ? (
              <div className="flex items-center gap-3 px-4 py-6 text-sm text-white/60">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-transparent" />
                Đang tải dữ liệu...
              </div>
            ) : paginatedUsers.length === 0 ? (
              <div className="px-4 py-6 text-sm text-white/60">
                Chưa có người dùng.
              </div>
            ) : (
              paginatedUsers.map((user) => {
                const role = roleLabels[user.role] || "User";
                const status = statusLabels[user.status] || user.status;
                return (
                  <div
                    key={user.id}
                    className="grid grid-cols-[0.6fr_1.4fr_0.9fr_0.8fr_0.8fr_0.7fr] items-center px-4 py-4 text-sm"
                  >
                    <input type="checkbox" className="h-4 w-4 rounded border-white/20" />
                    <div>
                      <p className="font-semibold text-white">
                        {user.name || "Chưa đặt tên"}
                      </p>
                      <p className="text-xs text-white/50">{user.email}</p>
                    </div>
                    <span
                      className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] ${
                        roleStyles[user.role] || "bg-white/10 text-white/70"
                      }`}
                    >
                      {role}
                    </span>
                    <span className="text-xs text-white/60">
                      {formatDate(user.created_at)}
                    </span>
                    <span
                      className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] ${
                        statusStyles[user.status] || "bg-white/10 text-white/70"
                      }`}
                    >
                      {status}
                    </span>
                    <button className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70">
                      Xem
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {error ? <p className="mt-4 text-xs text-red-300">{error}</p> : null}

        <div className="mt-4 flex items-center justify-between text-xs text-white/50">
          <span>
            Hiển thị{" "}
            {filteredUsers.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}{" "}
            đến {Math.min(currentPage * PAGE_SIZE, filteredUsers.length)} kết quả
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
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111b26] p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Thêm người dùng mới</h2>
              <button
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
                onClick={handleCloseForm}
              >
                Đóng
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <label className="space-y-2 text-xs text-white/60">
                Tên hiển thị
                <input
                  className="w-full rounded-xl border border-white/10 bg-[#0f1924] px-3 py-2 text-sm text-white"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="VD: Nguyễn Văn A"
                />
              </label>
              <label className="space-y-2 text-xs text-white/60">
                Email
                <input
                  className="w-full rounded-xl border border-white/10 bg-[#0f1924] px-3 py-2 text-sm text-white"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="user@example.com"
                />
              </label>
              <label className="space-y-2 text-xs text-white/60">
                Mật khẩu
                <input
                  type="password"
                  className="w-full rounded-xl border border-white/10 bg-[#0f1924] px-3 py-2 text-sm text-white"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Nhập mật khẩu"
                />
              </label>
              <p className="text-[11px] text-white/50">
                Tài khoản tạo mới mặc định là vai trò User.
              </p>
            </div>

            {formError ? <p className="mt-3 text-xs text-red-300">{formError}</p> : null}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70"
                onClick={handleCloseForm}
              >
                Hủy
              </button>
              <button
                className="rounded-xl bg-[#1f8ef1] px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Đang lưu" : "Lưu người dùng"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
