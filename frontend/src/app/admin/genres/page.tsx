"use client";

import { useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const PAGE_SIZE = 5;

type Genre = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  movie_count?: number;
  created_at?: string;
  updated_at?: string;
};

type SortMode = "latest" | "az";

const sortLabels: Record<SortMode, string> = {
  latest: "Mới nhất",
  az: "A-Z",
};

export default function AdminGenresPage() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("latest");
  const [currentPage, setCurrentPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await fetch(`${API_URL}/api/genres?includeCounts=1`, {
          cache: "no-store",
        });
        if (!response.ok) {
          setError("Không tải được dữ liệu thể loại.");
          return;
        }
        const data = await response.json();
        setGenres(data.genres || []);
      } catch (err) {
        setError("Không thể kết nối dữ liệu.");
      } finally {
        setLoading(false);
      }
    };

    fetchGenres();
  }, []);

  const filteredGenres = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const filtered = genres.filter((genre) => {
      if (!term) {
        return true;
      }
      return (
        genre.name.toLowerCase().includes(term) ||
        genre.slug.toLowerCase().includes(term) ||
        (genre.description || "").toLowerCase().includes(term)
      );
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortMode === "az") {
        return a.name.localeCompare(b.name, "vi");
      }
      const aTime = new Date(a.updated_at || a.created_at || 0).getTime();
      const bTime = new Date(b.updated_at || b.created_at || 0).getTime();
      return bTime - aTime;
    });

    return sorted;
  }, [genres, searchTerm, sortMode]);

  const totalPages = Math.max(1, Math.ceil(filteredGenres.length / PAGE_SIZE));
  const paginatedGenres = filteredGenres.slice(
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
  }, [searchTerm, sortMode]);

  const handleOpenForm = () => {
    setFormError("");
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingGenre(null);
    setName("");
    setSlug("");
    setDescription("");
    setFormError("");
  };

  const handleEdit = (genre: Genre) => {
    setEditingGenre(genre);
    setName(genre.name);
    setSlug(genre.slug);
    setDescription(genre.description || "");
    setFormError("");
    setShowForm(true);
  };

  const handleDelete = async (genreId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa thể loại này?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/genres/${genreId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        alert(data.message || "Không thể xóa thể loại.");
        return;
      }

      setGenres((prev) => prev.filter((g) => g.id !== genreId));
    } catch {
      alert("Không thể xóa thể loại. Hãy thử lại.");
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setFormError("Vui lòng nhập tên thể loại.");
      return;
    }

    setSaving(true);
    setFormError("");

    const payload: Record<string, string> = {
      name: name.trim(),
    };

    if (slug.trim()) {
      payload.slug = slug.trim();
    }
    if (description.trim()) {
      payload.description = description.trim();
    }

    try {
      const isEditing = editingGenre !== null;
      const url = isEditing
        ? `${API_URL}/api/genres/${editingGenre.id}`
        : `${API_URL}/api/genres`;
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setFormError(
          data.message ||
            `Không thể ${isEditing ? "cập nhật" : "lưu"} thể loại.`
        );
        return;
      }

      if (isEditing) {
        setGenres((prev) =>
          prev.map((g) =>
            g.id === editingGenre.id ? { ...g, ...data.genre } : g
          )
        );
      } else {
        const created = data.genre as Genre;
        setGenres((prev) => [{ ...created, movie_count: 0 }, ...prev]);
      }
      handleCloseForm();
    } catch {
      setFormError("Không thể kết nối dữ liệu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Quản lý Thể Loại</h1>
          <p className="mt-1 text-sm text-white/60">
            Danh sách và quản lý các thể loại phim hiện có trên hệ thống.
          </p>
        </div>
        <button
          className="rounded-xl bg-[#1f8ef1] px-4 py-2 text-sm font-semibold text-white"
          onClick={handleOpenForm}
        >
          + Thêm thể loại
        </button>
      </div>

      <div className="rounded-2xl border border-white/5 bg-[#162333] p-5">
        <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-[#111b26] px-3 py-2">
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
              placeholder="Tìm kiếm thể loại (VD: Tiên hiệp, Kinh dị)..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <button
            className="rounded-xl border border-white/10 bg-[#111b26] px-3 py-2 text-xs"
            onClick={() =>
              setSortMode((prev) => (prev === "latest" ? "az" : "latest"))
            }
          >
            {sortLabels[sortMode]}
          </button>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-white/5">
          <div className="grid grid-cols-[0.6fr_1.1fr_1.1fr_1.7fr_0.6fr_0.7fr] bg-[#111b26] px-4 py-3 text-xs text-white/50">
            <span>ID</span>
            <span>Tên thể loại</span>
            <span>Slug</span>
            <span>Mô tả</span>
            <span>Số phim</span>
            <span>Hành động</span>
          </div>
          <div className="divide-y divide-white/5">
            {loading ? (
              <div className="flex items-center gap-3 px-4 py-6 text-sm text-white/60">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-transparent" />
                Đang tải dữ liệu...
              </div>
            ) : paginatedGenres.length === 0 ? (
              <div className="px-4 py-6 text-sm text-white/60">
                Chưa có thể loại nào.
              </div>
            ) : (
              paginatedGenres.map((genre) => (
                <div
                  key={genre.id}
                  className="grid grid-cols-[0.6fr_1.1fr_1.1fr_1.7fr_0.6fr_0.7fr] items-center px-4 py-4 text-sm"
                >
                  <span className="text-white/60">
                    #{genre.id.toString().padStart(3, "0")}
                  </span>
                  <p className="font-semibold text-white">{genre.name}</p>
                  <p className="text-xs text-white/60">{genre.slug}</p>
                  <p className="text-xs text-white/60">
                    {genre.description || "—"}
                  </p>
                  <span className="text-xs text-white/60">
                    {genre.movie_count ?? 0}
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-white/70 hover:bg-white/10 transition-colors"
                      onClick={() => handleEdit(genre)}
                    >
                      Sửa
                    </button>
                    <button
                      className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-white/70 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                      onClick={() => handleDelete(genre.id)}
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
            {filteredGenres.length === 0
              ? 0
              : (currentPage - 1) * PAGE_SIZE + 1}{" "}
            đến {Math.min(currentPage * PAGE_SIZE, filteredGenres.length)} kết
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
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111b26] p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingGenre ? "Sửa thể loại" : "Thêm thể loại mới"}
              </h2>
              <button
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
                onClick={handleCloseForm}
              >
                Đóng
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <label className="space-y-2 text-xs text-white/60">
                Tên thể loại
                <input
                  className="w-full rounded-xl border border-white/10 bg-[#0f1924] px-3 py-2 text-sm text-white"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="VD: Tiên hiệp"
                />
              </label>
              <label className="space-y-2 text-xs text-white/60">
                Slug
                <input
                  className="w-full rounded-xl border border-white/10 bg-[#0f1924] px-3 py-2 text-sm text-white"
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                  placeholder="tien-hiep"
                />
                <span className="block text-[11px] text-white/40">
                  Để trống để tự tạo từ tên.
                </span>
              </label>
              <label className="space-y-2 text-xs text-white/60">
                Mô tả
                <textarea
                  className="min-h-[90px] w-full rounded-xl border border-white/10 bg-[#0f1924] px-3 py-2 text-sm text-white"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Mô tả ngắn về thể loại..."
                />
              </label>
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
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Đang lưu" : "Lưu thể loại"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
