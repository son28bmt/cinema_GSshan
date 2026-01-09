"use client";

import { useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const PAGE_SIZE = 5;

type Server = {
  id: number;
  name: string;
  endpoint_url: string;
  load_percent: number;
  status: "active" | "maintenance" | "disabled";
};

const statusLabels: Record<Server["status"], string> = {
  active: "Hoạt động",
  maintenance: "Bảo trì",
  disabled: "Dừng",
};

const statusStyles: Record<Server["status"], string> = {
  active: "bg-green-500/15 text-green-400",
  maintenance: "bg-yellow-500/15 text-yellow-300",
  disabled: "bg-red-500/15 text-red-300",
};

const statusFilters = [
  { label: "Tất cả", value: "all" },
  { label: "Hoạt động", value: "active" },
  { label: "Bảo trì", value: "maintenance" },
  { label: "Dừng", value: "disabled" },
] as const;

type StatusFilter = (typeof statusFilters)[number]["value"];

export default function AdminServersPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [endpointUrl, setEndpointUrl] = useState("");
  const [loadPercent, setLoadPercent] = useState("0");
  const [status, setStatus] = useState<Server["status"]>("active");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const fetchServers = async () => {
      try {
        const response = await fetch(`${API_URL}/api/servers`, { cache: "no-store" });
        if (!response.ok) {
          setError("Không tải được dữ liệu server.");
          return;
        }
        const data = await response.json();
        setServers(data.servers || []);
      } catch (err) {
        setError("Không thể kết nối backend.");
      } finally {
        setLoading(false);
      }
    };

    fetchServers();
  }, []);

  const filteredServers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return servers.filter((server) => {
      const matchesTerm =
        !term ||
        server.name.toLowerCase().includes(term) ||
        server.endpoint_url.toLowerCase().includes(term);
      const matchesStatus =
        statusFilter === "all" ? true : server.status === statusFilter;
      return matchesTerm && matchesStatus;
    });
  }, [servers, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredServers.length / PAGE_SIZE));
  const paginatedServers = filteredServers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const handleOpenForm = () => {
    setFormError("");
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setName("");
    setEndpointUrl("");
    setLoadPercent("0");
    setStatus("active");
    setFormError("");
  };

  const handleSave = async () => {
    if (!name.trim() || !endpointUrl.trim()) {
      setFormError("Vui lòng nhập đầy đủ tên và URL.");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const response = await fetch(`${API_URL}/api/servers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          endpointUrl: endpointUrl.trim(),
          loadPercent: Number(loadPercent || 0),
          status,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setFormError(data.message || "Không thể lưu server.");
        return;
      }
      setServers((prev) => [data.server, ...prev]);
      handleCloseForm();
    } catch (err) {
      setFormError("Không thể kết nối backend.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Quản lý Server Video</h1>
          <p className="mt-1 text-sm text-white/60">
            Danh sách và trạng thái các máy chủ lưu trữ nội dung.
          </p>
        </div>
        <button
          className="rounded-xl bg-[#1f8ef1] px-4 py-2 text-sm font-semibold text-white"
          onClick={handleOpenForm}
        >
          + Thêm Server Mới
        </button>
      </div>

      <div className="rounded-2xl border border-white/5 bg-[#162333] p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-[#111b26] px-3 py-2 text-sm text-white/60">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20L17 17" />
            </svg>
            <input
              className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
              placeholder="Tìm kiếm theo tên hoặc URL..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          {statusFilters.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setStatusFilter(tab.value);
                setCurrentPage(1);
              }}
              className={`rounded-xl px-3 py-2 text-xs ${
                statusFilter === tab.value
                  ? "bg-[#1f8ef1] text-white"
                  : "border border-white/10 bg-[#111b26] text-white/70"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-white/5">
          <div className="grid grid-cols-[0.6fr_1fr_1.6fr_0.8fr_0.8fr_0.7fr] bg-[#111b26] px-4 py-3 text-xs text-white/50">
            <span>ID</span>
            <span>Tên server</span>
            <span>Endpoint URL</span>
            <span>Tải (Load)</span>
            <span>Trạng thái</span>
            <span>Hành động</span>
          </div>
          <div className="divide-y divide-white/5">
            {loading ? (
              <div className="px-4 py-6 text-sm text-white/60">Đang tải dữ liệu...</div>
            ) : paginatedServers.length === 0 ? (
              <div className="px-4 py-6 text-sm text-white/60">
                Chưa có server nào.
              </div>
            ) : (
              paginatedServers.map((server) => (
                <div
                  key={server.id}
                  className="grid grid-cols-[0.6fr_1fr_1.6fr_0.8fr_0.8fr_0.7fr] items-center px-4 py-4 text-sm"
                >
                  <span className="text-white/60">#{server.id.toString().padStart(3, "0")}</span>
                  <p className="font-semibold text-white">{server.name}</p>
                  <p className="text-xs text-white/60">{server.endpoint_url}</p>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-24 rounded-full bg-[#111b26]">
                      <div
                        className="h-2 rounded-full bg-[#1f8ef1]"
                        style={{ width: `${server.load_percent}%` }}
                      />
                    </div>
                    <span className="text-xs text-white/60">{server.load_percent}%</span>
                  </div>
                  <span
                    className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] ${
                      statusStyles[server.status] || "bg-white/10 text-white/70"
                    }`}
                  >
                    {statusLabels[server.status]}
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    <button className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-white/70">
                      Sửa
                    </button>
                    <button className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-white/70">
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
            Hiển thị {filteredServers.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
            {" "}đến{" "}
            {Math.min(currentPage * PAGE_SIZE, filteredServers.length)} server
          </span>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
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
            ))}
          </div>
        </div>
      </div>

      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111b26] p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Thêm server mới</h2>
              <button
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
                onClick={handleCloseForm}
              >
                Đóng
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <label className="space-y-2 text-xs text-white/60">
                Tên server
                <input
                  className="w-full rounded-xl border border-white/10 bg-[#0f1924] px-3 py-2 text-sm text-white"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="VD: VIP Server SG-1"
                />
              </label>
              <label className="space-y-2 text-xs text-white/60">
                Endpoint URL
                <input
                  className="w-full rounded-xl border border-white/10 bg-[#0f1924] px-3 py-2 text-sm text-white"
                  value={endpointUrl}
                  onChange={(event) => setEndpointUrl(event.target.value)}
                  placeholder="https://cdn.example.com"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-xs text-white/60">
                  Tải (Load %)
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="w-full rounded-xl border border-white/10 bg-[#0f1924] px-3 py-2 text-sm text-white"
                    value={loadPercent}
                    onChange={(event) => setLoadPercent(event.target.value)}
                  />
                </label>
                <label className="space-y-2 text-xs text-white/60">
                  Trạng thái
                  <select
                    className="w-full rounded-xl border border-white/10 bg-[#0f1924] px-3 py-2 text-sm text-white"
                    value={status}
                    onChange={(event) => setStatus(event.target.value as Server["status"])}
                  >
                    <option value="active">Hoạt động</option>
                    <option value="maintenance">Bảo trì</option>
                    <option value="disabled">Dừng</option>
                  </select>
                </label>
              </div>
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
                {saving ? "Đang lưu" : "Lưu server"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
