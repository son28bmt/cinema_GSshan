"use client";

import type { ChangeEvent, DragEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Movie = {
  id: number;
  title: string;
  description: string | null;
  release_year: number | null;
  poster_url: string | null;
  status: string;
  genres: string | null;
};

type Episode = {
  id: number;
  episode_number: number;
  title: string | null;
  description: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  status: string;
  views: number;
  updated_at: string;
  released_at: string | null;
};

const statusLabels: Record<string, string> = {
  published: "Công khai",
  draft: "Bản nháp",
  ongoing: "Đang tiến hành",
  completed: "Hoàn thành",
  upcoming: "Sắp chiếu",
};

const statusStyles: Record<string, string> = {
  published: "bg-green-500/15 text-green-300",
  draft: "bg-yellow-500/15 text-yellow-300",
  ongoing: "bg-blue-500/20 text-blue-200",
  completed: "bg-green-500/20 text-green-300",
  upcoming: "bg-yellow-500/20 text-yellow-200",
};

const formatViews = (value: number) => {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return `${value}`;
};

const formatRelativeTime = (value: string) => {
  if (!value) return "Chưa cập nhật";
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `Cập nhật ${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Cập nhật ${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `Cập nhật ${days} ngày trước`;
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const Spinner = ({ label }: { label?: string }) => (
  <div className="flex items-center justify-center gap-3 py-10 text-sm text-white/60">
    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
    {label ? <span>{label}</span> : null}
  </div>
);

export default function AdminEpisodesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loadingMovies, setLoadingMovies] = useState(true);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [episodeNumber, setEpisodeNumber] = useState("");
  const [episodeTitle, setEpisodeTitle] = useState("");
  const [episodeDescription, setEpisodeDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [linkType, setLinkType] = useState<"m3u8" | "embed">("m3u8");
  const [serverOption, setServerOption] = useState("vip-1");
  const [isPublished, setIsPublished] = useState(true);
  const [isVipOnly, setIsVipOnly] = useState(false);
  const [releaseDate, setReleaseDate] = useState("");
  const [releaseTime, setReleaseTime] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null);

  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadMovies = async () => {
      try {
        const response = await fetch(`${API_URL}/api/movies?limit=100`, {
          cache: "no-store",
        });
        const data = await response.json();
        const list = data.movies || [];
        setMovies(list);
        if (list.length > 0) {
          setSelectedMovieId((prev) => prev ?? list[0].id);
        }
      } catch (err) {
        setError("Không tải được danh sách phim.");
      } finally {
        setLoadingMovies(false);
      }
    };

    loadMovies();
  }, []);

  useEffect(() => {
    if (!selectedMovieId) {
      return;
    }

    const loadEpisodes = async () => {
      try {
        setLoadingEpisodes(true);
        const response = await fetch(`${API_URL}/api/episodes?movieId=${selectedMovieId}`, {
          cache: "no-store",
        });
        const data = await response.json();
        setEpisodes(data.episodes || []);
      } catch (err) {
        setError("Không tải được danh sách tập.");
      } finally {
        setLoadingEpisodes(false);
      }
    };

    loadEpisodes();
  }, [selectedMovieId]);

  useEffect(() => {
    if (showCreate) {
      const nextNumber =
        episodes.length > 0 ? episodes[episodes.length - 1].episode_number + 1 : 1;
      setEpisodeNumber(String(nextNumber));
    }
  }, [showCreate, episodes]);

  useEffect(() => {
    return () => {
      if (thumbnailPreview) {
        URL.revokeObjectURL(thumbnailPreview);
      }
    };
  }, [thumbnailPreview]);

  const selectedMovie = useMemo(
    () => movies.find((movie) => movie.id === selectedMovieId) || null,
    [movies, selectedMovieId]
  );

  const totalViews = useMemo(
    () => episodes.reduce((sum, item) => sum + (item.views || 0), 0),
    [episodes]
  );

  const handleThumbnailSelect = (
    file: File | undefined,
    setFile: (value: File | null) => void,
    setPreview: (value: string | null | ((prev: string | null) => string | null)) => void
  ) => {
    if (!file) return;
    setFile(file);
    setPreview((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return URL.createObjectURL(file);
    });
  };

  const handleThumbnailChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleThumbnailSelect(event.target.files?.[0], setThumbnailFile, setThumbnailPreview);
  };

  const handleThumbnailDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    handleThumbnailSelect(event.dataTransfer.files?.[0], setThumbnailFile, setThumbnailPreview);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const resetForm = () => {
    setEpisodeNumber("");
    setEpisodeTitle("");
    setEpisodeDescription("");
    setVideoUrl("");
    setLinkType("m3u8");
    setServerOption("vip-1");
    setIsPublished(true);
    setIsVipOnly(false);
    setReleaseDate("");
    setReleaseTime("");
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setSaveError("");
  };

  const handleCancel = () => {
    resetForm();
    setShowCreate(false);
  };

  const handleSave = async () => {
    if (!selectedMovieId) {
      setSaveError("Vui lòng chọn phim.");
      return;
    }
    if (!episodeNumber.trim()) {
      setSaveError("Vui lòng nhập số tập.");
      return;
    }

    setIsSaving(true);
    setSaveError("");

    try {
      const thumbnailUrl = thumbnailFile ? await readFileAsDataUrl(thumbnailFile) : null;
      const releaseAt = releaseDate
        ? releaseTime
          ? `${releaseDate} ${releaseTime}:00`
          : releaseDate
        : undefined;
      const payload = {
        movieId: selectedMovieId,
        episodeNumber: Number.parseInt(episodeNumber, 10),
        title: episodeTitle.trim() || undefined,
        description: episodeDescription.trim() || undefined,
        videoUrl: videoUrl.trim() || undefined,
        status: isPublished ? "published" : "draft",
        releasedAt: releaseAt,
        thumbnailUrl: thumbnailUrl || undefined,
      };

      const response = await fetch(`${API_URL}/api/episodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setSaveError(data.message || "Lưu tập phim thất bại.");
        return;
      }

      const refresh = await fetch(`${API_URL}/api/episodes?movieId=${selectedMovieId}`, {
        cache: "no-store",
      });
      const refreshed = await refresh.json().catch(() => ({}));
      setEpisodes(refreshed.episodes || []);
      setShowCreate(false);
      resetForm();
    } catch (err) {
      setSaveError("Không thể lưu tập phim. Hãy thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestLink = () => {
    if (videoUrl.trim()) {
      window.open(videoUrl.trim(), "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/5 bg-[#162333] p-6">
        {loadingMovies ? (
          <Spinner label="Đang tải thông tin phim..." />
        ) : !selectedMovie ? (
          <p className="text-sm text-white/60">Chưa có phim nào để quản lý tập.</p>
        ) : (
          <div className="flex flex-wrap items-start gap-6">
            <div className="h-24 w-20 overflow-hidden rounded-xl border border-white/10 bg-white/5">
              {selectedMovie.poster_url ? (
                <img
                  src={selectedMovie.poster_url}
                  alt={selectedMovie.title}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl font-semibold">{selectedMovie.title}</h1>
                <select
                  className="rounded-xl border border-white/10 bg-[#111b26] px-3 py-2 text-xs text-white"
                  value={selectedMovieId ?? ""}
                  onChange={(event) => setSelectedMovieId(Number(event.target.value))}
                >
                  {movies.map((movie) => (
                    <option key={movie.id} value={movie.id}>
                      {movie.title}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-white/60">
                {selectedMovie.release_year ? `${selectedMovie.release_year}` : "Chưa rõ"} •{" "}
                {selectedMovie.genres || "Chưa phân loại"}
              </p>
              <p className="text-sm text-white/60">
                {selectedMovie.description || "Chưa có mô tả cho phim này."}
              </p>
            </div>
            <div className="flex gap-6 text-xs text-white/60">
              {[
                { label: "Episodes", value: episodes.length },
                { label: "Total Views", value: formatViews(totalViews) },
                {
                  label: "Status",
                  value: statusLabels[selectedMovie.status] || selectedMovie.status,
                },
              ].map((item) => (
                <div key={item.label}>
                  <p className="uppercase text-[10px] text-white/40">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showCreate ? (
        <div className="rounded-2xl border border-white/5 bg-[#162333] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Thêm Tập Phim Mới</h2>
              <p className="mt-1 text-xs text-white/60">
                Nhập thông tin chi tiết và nguồn phát cho tập phim mới.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="rounded-xl border border-white/10 bg-[#111b26] px-4 py-2 text-xs text-white/70"
                onClick={handleCancel}
              >
                Hủy bỏ
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-xl bg-[#1f8ef1] px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Đang lưu
                  </>
                ) : (
                  "Lưu & Đăng"
                )}
              </button>
            </div>
          </div>

          {saveError ? <p className="mt-4 text-xs text-red-300">{saveError}</p> : null}

          <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-6">
              <section className="rounded-2xl border border-white/5 bg-[#111b26] p-5">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span className="grid h-6 w-6 place-items-center rounded-lg bg-white/5 text-[#6bb7ff]">
                    i
                  </span>
                  Thông tin cơ bản
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-xs text-white/60">
                    Số tập
                    <input
                      className="w-full rounded-xl border border-white/10 bg-[#0f1924] px-3 py-2 text-sm text-white"
                      value={episodeNumber}
                      onChange={(event) => setEpisodeNumber(event.target.value)}
                      placeholder="VD: 13"
                    />
                    <span className="text-[11px] text-white/40">
                      Tự động tăng dựa trên tập trước đó.
                    </span>
                  </label>
                  <label className="space-y-2 text-xs text-white/60">
                    Tên tập (không bắt buộc)
                    <input
                      className="w-full rounded-xl border border-white/10 bg-[#0f1924] px-3 py-2 text-sm text-white"
                      value={episodeTitle}
                      onChange={(event) => setEpisodeTitle(event.target.value)}
                      placeholder="VD: Sự trở lại của..."
                    />
                  </label>
                  <label className="space-y-2 text-xs text-white/60 md:col-span-2">
                    Mô tả ngắn
                    <textarea
                      className="min-h-[120px] w-full rounded-xl border border-white/10 bg-[#0f1924] px-3 py-2 text-sm text-white"
                      value={episodeDescription}
                      onChange={(event) => setEpisodeDescription(event.target.value)}
                      placeholder="Nhập tóm tắt nội dung tập phim này..."
                    />
                  </label>
                </div>
              </section>

              <section className="rounded-2xl border border-white/5 bg-[#111b26] p-5">
                <div className="flex items-center justify-between gap-2 text-sm font-semibold">
                  <span className="flex items-center gap-2">
                    <span className="grid h-6 w-6 place-items-center rounded-lg bg-white/5 text-[#6bb7ff]">
                      M
                    </span>
                    Nguồn Video
                  </span>
                  <button className="text-xs text-[#6bb7ff]" type="button">
                    + Thêm server khác
                  </button>
                </div>
                <div className="mt-4 grid gap-4">
                  <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                    <label className="space-y-2 text-xs text-white/60">
                      Chọn Server
                      <select
                        className="w-full rounded-xl border border-white/10 bg-[#0f1924] px-3 py-2 text-sm text-white"
                        value={serverOption}
                        onChange={(event) => setServerOption(event.target.value)}
                      >
                        <option value="vip-1">Server VIP 1 (Fast)</option>
                        <option value="vip-2">Server VIP 2</option>
                        <option value="backup">Server Backup</option>
                      </select>
                    </label>
                    <label className="space-y-2 text-xs text-white/60">
                      Loại Link
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setLinkType("m3u8")}
                          className={`rounded-xl px-3 py-2 text-xs ${
                            linkType === "m3u8"
                              ? "bg-[#1f8ef1] text-white"
                              : "border border-white/10 bg-[#0f1924] text-white/70"
                          }`}
                        >
                          M3U8/MP4
                        </button>
                        <button
                          type="button"
                          onClick={() => setLinkType("embed")}
                          className={`rounded-xl px-3 py-2 text-xs ${
                            linkType === "embed"
                              ? "bg-[#1f8ef1] text-white"
                              : "border border-white/10 bg-[#0f1924] text-white/70"
                          }`}
                        >
                          Embed
                        </button>
                      </div>
                    </label>
                  </div>

                  <label className="space-y-2 text-xs text-white/60">
                    Đường dẫn Video (URL)
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        className="flex-1 rounded-xl border border-white/10 bg-[#0f1924] px-3 py-2 text-sm text-white"
                        value={videoUrl}
                        onChange={(event) => setVideoUrl(event.target.value)}
                        placeholder="https://example.com/video.m3u8"
                      />
                      <button
                        className="rounded-xl border border-white/10 bg-[#0f1924] px-3 py-2 text-xs text-white/70"
                        onClick={handleTestLink}
                        type="button"
                      >
                        Test Link
                      </button>
                    </div>
                  </label>
                  <p className="text-[11px] text-yellow-300/80">
                    Vui lòng kiểm tra link trước khi lưu.
                  </p>
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section className="rounded-2xl border border-white/5 bg-[#111b26] p-5">
                <h3 className="text-sm font-semibold">Trạng thái</h3>
                <div className="mt-4 space-y-4 text-xs text-white/60">
                  <label className="flex items-center justify-between">
                    Hiển thị
                    <input
                      type="checkbox"
                      checked={isPublished}
                      onChange={(event) => setIsPublished(event.target.checked)}
                      className="h-4 w-4 accent-[#1f8ef1]"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    Yêu cầu VIP
                    <input
                      type="checkbox"
                      checked={isVipOnly}
                      onChange={(event) => setIsVipOnly(event.target.checked)}
                      className="h-4 w-4 accent-[#1f8ef1]"
                    />
                  </label>
                  <label className="space-y-2">
                    Ngày phát hành
                    <input
                      type="date"
                      className="w-full rounded-xl border border-white/10 bg-[#0f1924] px-3 py-2 text-sm text-white"
                      value={releaseDate}
                      onChange={(event) => setReleaseDate(event.target.value)}
                    />
                  </label>
                  <label className="space-y-2">
                    Giờ phát hành
                    <input
                      type="time"
                      className="w-full rounded-xl border border-white/10 bg-[#0f1924] px-3 py-2 text-sm text-white"
                      value={releaseTime}
                      onChange={(event) => setReleaseTime(event.target.value)}
                    />
                  </label>
                </div>
              </section>

              <section className="rounded-2xl border border-white/5 bg-[#111b26] p-5">
                <h3 className="text-sm font-semibold">Ảnh bìa tập (Thumbnail)</h3>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => thumbnailInputRef.current?.click()}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      thumbnailInputRef.current?.click();
                    }
                  }}
                  onDrop={handleThumbnailDrop}
                  onDragOver={handleDragOver}
                  className="relative mt-4 flex h-40 items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/20 bg-[#0f1924] text-xs text-white/40 transition hover:border-white/40"
                >
                  {thumbnailPreview ? (
                    <>
                      <img
                        src={thumbnailPreview}
                        alt="Thumbnail preview"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <div className="relative z-10 rounded-full bg-black/40 px-3 py-1 text-[11px] text-white">
                        Đổi ảnh bìa
                      </div>
                    </>
                  ) : (
                    <span>Kéo thả hoặc click để tải lên</span>
                  )}
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleThumbnailChange}
                  />
                </div>
                {thumbnailFile ? (
                  <p className="mt-2 text-[11px] text-white/40">{thumbnailFile.name}</p>
                ) : null}
              </section>

              <section className="rounded-2xl border border-white/5 bg-[#111b26] p-5 text-xs text-white/60">
                <p className="text-sm font-semibold text-white">Mẹo nhanh</p>
                <p className="mt-2 text-[11px] text-white/50">
                  Bạn có thể dùng phim đã tạo ở mục “Phim” để chọn nhanh tập.
                </p>
              </section>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/5 bg-[#162333] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3 rounded-xl border border-white/10 bg-[#111b26] px-3 py-2 text-sm text-white/60">
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
                placeholder="Tìm kiếm tập phim..."
              />
            </div>
            <div className="flex items-center gap-2">
              <button className="rounded-xl border border-white/10 bg-[#111b26] px-3 py-2 text-xs text-white/70">
                Lọc
              </button>
              <button
                className="rounded-xl bg-[#1f8ef1] px-4 py-2 text-xs font-semibold text-white"
                onClick={() => setShowCreate(true)}
              >
                + Thêm tập mới
              </button>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-white/5">
            <div className="grid grid-cols-[0.5fr_1.6fr_1.4fr_0.8fr_0.8fr_0.8fr] bg-[#111b26] px-4 py-3 text-xs text-white/50">
              <span>#</span>
              <span>Tên tập</span>
              <span>Video source</span>
              <span>Lượt xem</span>
              <span>Trạng thái</span>
              <span>Hành động</span>
            </div>
            <div className="divide-y divide-white/5">
              {loadingEpisodes ? (
                <Spinner label="Đang tải tập phim..." />
              ) : episodes.length === 0 ? (
                <div className="px-4 py-6 text-sm text-white/60">
                  Chưa có tập nào cho phim này.
                </div>
              ) : (
                episodes.map((episode) => (
                  <div
                    key={episode.id}
                    className="grid grid-cols-[0.5fr_1.6fr_1.4fr_0.8fr_0.8fr_0.8fr] items-center px-4 py-4 text-sm"
                  >
                    <span className="text-white/60">
                      {episode.episode_number.toString().padStart(2, "0")}
                    </span>
                    <div>
                      <p className="font-semibold text-white">{episode.title || "Chưa có tên"}</p>
                      <p className="text-xs text-white/40">
                        {formatRelativeTime(episode.updated_at)}
                      </p>
                    </div>
                    <div className="truncate text-xs text-white/60">
                      {episode.video_url || "Chưa có video"}
                    </div>
                    <span className="text-xs text-white/60">
                      {formatViews(episode.views || 0)}
                    </span>
                    <span
                      className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] ${
                        statusStyles[episode.status] || "bg-white/10 text-white/70"
                      }`}
                    >
                      {statusLabels[episode.status] || episode.status}
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
        </div>
      )}
    </div>
  );
}
