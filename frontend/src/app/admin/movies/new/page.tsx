"use client";

import type { ChangeEvent, DragEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import RichTextEditor from "../../../../components/rich-text-editor";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Genre = {
  id: number;
  name: string;
  slug: string;
};

const slugify = (value: string) => {
  if (!value) return "";
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export default function AdminMovieCreatePage() {
  const router = useRouter();
  const [movieId, setMovieId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("movieId");
      setMovieId(id);
      setIsEditMode(Boolean(id));
    }
  }, []);

  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [originalTitle, setOriginalTitle] = useState("");
  const [studio, setStudio] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugEditing, setIsSlugEditing] = useState(false);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("ongoing");
  const [country, setCountry] = useState("Viet Nam");
  const [releaseYear, setReleaseYear] = useState(
    String(new Date().getFullYear())
  );
  const [totalEpisodes, setTotalEpisodes] = useState("");
  const [trailerUrl, setTrailerUrl] = useState("");

  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [genresLoading, setGenresLoading] = useState(true);
  const [genreError, setGenreError] = useState("");

  const [newGenre, setNewGenre] = useState("");
  const [addingGenre, setAddingGenre] = useState(false);
  const [savingGenre, setSavingGenre] = useState(false);

  const [backdropFile, setBackdropFile] = useState<File | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [backdropPreview, setBackdropPreview] = useState<string | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const backdropInputRef = useRef<HTMLInputElement | null>(null);
  const posterInputRef = useRef<HTMLInputElement | null>(null);

  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isSlugEditing) {
      setSlug(slugify(title));
    }
  }, [title, isSlugEditing]);

  useEffect(() => {
    const loadGenres = async () => {
      try {
        const response = await fetch(`${API_URL}/api/genres`);
        const data = await response.json();
        setGenres(data.genres || []);
      } catch {
        setGenreError("Không thể tải thể loại.");
      } finally {
        setGenresLoading(false);
      }
    };

    loadGenres();
  }, []);

  useEffect(() => {
    if (!movieId) return;

    const loadMovie = async () => {
      try {
        const response = await fetch(`${API_URL}/api/movies/id/${movieId}`);
        if (!response.ok) {
          setSaveError("Không thể tải thông tin phim.");
          return;
        }
        const data = await response.json();
        const movie = data.movie;

        setTitle(movie.title || "");
        setOriginalTitle(movie.original_title || "");
        setStudio(movie.studio || "");
        setSlug(movie.slug || "");
        setDescription(movie.description || "");
        setStatus(movie.status || "ongoing");
        setCountry(movie.country || "Viet Nam");
        setReleaseYear(
          movie.release_year
            ? String(movie.release_year)
            : String(new Date().getFullYear())
        );
        setTotalEpisodes(
          movie.total_episodes ? String(movie.total_episodes) : ""
        );
        setTrailerUrl(movie.trailer_url || "");

        if (movie.backdrop_url) {
          setBackdropPreview(movie.backdrop_url);
        }
        if (movie.poster_url) {
          setPosterPreview(movie.poster_url);
        }

        // Set genres - movie.genres is string like "Action,Drama"
        if (movie.genres) {
          const genreNames = movie.genres
            .split(",")
            .map((g: string) => g.trim());
          // We'll set selectedGenres after genres are loaded
          setTimeout(() => {
            const matchedIds = genres
              .filter((g) => genreNames.includes(g.name))
              .map((g) => g.id);
            setSelectedGenres(matchedIds);
          }, 100);
        }
      } catch {
        setSaveError("Không thể tải thông tin phim.");
      } finally {
        setLoading(false);
      }
    };

    loadMovie();
  }, [movieId, genres]);

  const slugPreview = useMemo(() => {
    const safeSlug = slug || slugify(title);
    return safeSlug
      ? `moviestream.com/phim/${safeSlug}`
      : "moviestream.com/phim";
  }, [slug, title]);

  const toggleGenre = (id: number) => {
    setSelectedGenres((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAddGenre = async () => {
    if (!newGenre.trim()) {
      setGenreError("Vui lòng nhập tên thể loại.");
      return;
    }

    try {
      setSavingGenre(true);
      setGenreError("");
      const response = await fetch(`${API_URL}/api/genres`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGenre.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setGenreError(data.message || "Tạo thể loại thất bại.");
        return;
      }

      const created: Genre = data.genre;
      setGenres((prev) => [...prev, created]);
      setSelectedGenres((prev) => [...prev, created.id]);
      setNewGenre("");
      setAddingGenre(false);
    } catch (err) {
      setGenreError("Không thể kết nối dữ liệu.");
    } finally {
      setSavingGenre(false);
    }
  };

  const handleFileSelect = (
    file: File | undefined,
    setFile: (value: File | null) => void,
    setPreview: (
      value: string | null | ((prev: string | null) => string | null)
    ) => void
  ) => {
    if (!file) {
      return;
    }
    setFile(file);
    setPreview((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return URL.createObjectURL(file);
    });
  };

  const handleBackdropChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(
      event.target.files?.[0],
      setBackdropFile,
      setBackdropPreview
    );
  };

  const handlePosterChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(event.target.files?.[0], setPosterFile, setPosterPreview);
  };

  const handleBackdropDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    handleFileSelect(
      event.dataTransfer.files?.[0],
      setBackdropFile,
      setBackdropPreview
    );
  };

  const handlePosterDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    handleFileSelect(
      event.dataTransfer.files?.[0],
      setPosterFile,
      setPosterPreview
    );
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  useEffect(() => {
    return () => {
      if (backdropPreview) {
        URL.revokeObjectURL(backdropPreview);
      }
      if (posterPreview) {
        URL.revokeObjectURL(posterPreview);
      }
    };
  }, [backdropPreview, posterPreview]);

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 20 }, (_, index) => String(current - index));
  }, []);

  const handleSave = async () => {
    if (!title.trim()) {
      setSaveError("Vui lòng nhập tên phim.");
      return;
    }

    setIsSaving(true);
    setSaveError("");
    setSaveSuccess("");

    try {
      const backdropUrl = backdropFile
        ? await readFileAsDataUrl(backdropFile)
        : null;
      const posterUrl = posterFile ? await readFileAsDataUrl(posterFile) : null;

      const payload = {
        title: title.trim(),
        originalTitle: originalTitle.trim() || undefined,
        studio: studio.trim() || undefined,
        totalEpisodes: totalEpisodes
          ? Number.parseInt(totalEpisodes, 10)
          : undefined,
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
        status,
        country,
        releaseYear: releaseYear ? Number.parseInt(releaseYear, 10) : undefined,
        trailerUrl: trailerUrl.trim() || undefined,
        backdropUrl: backdropUrl || undefined,
        posterUrl: posterUrl || undefined,
        genreIds: selectedGenres,
      };

      const url = isEditMode
        ? `${API_URL}/api/movies/id/${movieId}`
        : `${API_URL}/api/movies`;
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setSaveError(
          data.message || `${isEditMode ? "Cập nhật" : "Lưu"} phim thất bại.`
        );
        return;
      }

      setSaveSuccess(isEditMode ? "Đã cập nhật phim." : "Đã lưu phim mới.");
    } catch (err) {
      setSaveError("Không thể lưu phim. Hãy thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {isEditMode ? "Sửa phim" : "Thêm mới phim"}
          </h1>
          <p className="mt-1 text-sm text-white/60">
            {isEditMode
              ? "Cập nhật thông tin cho bộ phim đã có."
              : "Nhập thông tin chi tiết cho bộ phim mới để hiển thị trên hệ thống."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="rounded-xl border border-white/10 bg-[#111b26] px-4 py-2 text-xs text-white/70"
            onClick={() => router.push("/admin/movies")}
          >
            Hủy bỏ
          </button>
          <button
            className="rounded-xl bg-[#1f8ef1] px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Đang lưu" : "Lưu thay đổi"}
          </button>
        </div>
      </div>

      {saveError ? <p className="text-sm text-red-300">{saveError}</p> : null}
      {saveSuccess ? (
        <p className="text-sm text-emerald-300">{saveSuccess}</p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-white/5 bg-[#162333] p-6">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-white/5 text-[#6bb7ff]">
                i
              </span>
              Thông tin chung
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-xs text-white/60">
                Tên phim (Tiếng Việt)
                <input
                  className="w-full rounded-xl border border-white/10 bg-[#111b26] px-3 py-2 text-sm text-white"
                  placeholder="VD: tien nghich"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </label>
              <label className="space-y-2 text-xs text-white/60">
                Tên gốc (Original Name)
                <input
                  className="w-full rounded-xl border border-white/10 bg-[#111b26] px-3 py-2 text-sm text-white"
                  placeholder="VD: tien nghich"
                  value={originalTitle}
                  onChange={(event) => setOriginalTitle(event.target.value)}
                />
              </label>
              <label className="space-y-2 text-xs text-white/60 md:col-span-2">
                Studio
                <input
                  className="w-full rounded-xl border border-white/10 bg-[#111b26] px-3 py-2 text-sm text-white"
                  placeholder="VD: Spark Studio"
                  value={studio}
                  onChange={(event) => setStudio(event.target.value)}
                />
              </label>
              <label className="space-y-2 text-xs text-white/60 md:col-span-2">
                Đường dẫn tĩnh (Slug)
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#111b26] px-3 py-2 text-sm text-white/70">
                  {isSlugEditing ? (
                    <input
                      className="flex-1 bg-transparent text-sm text-white focus:outline-none"
                      value={slug}
                      onChange={(event) => setSlug(slugify(event.target.value))}
                      placeholder="slug-phim"
                    />
                  ) : (
                    <span>{slugPreview}</span>
                  )}
                  <button
                    type="button"
                    className="text-xs text-[#1f8ef1]"
                    onClick={() => setIsSlugEditing((prev) => !prev)}
                  >
                    {isSlugEditing ? "Xong" : "Chỉnh sửa"}
                  </button>
                </div>
              </label>
              <label className="space-y-2 text-xs text-white/60 md:col-span-2">
                Mô tả phim
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Nhap noi dung mo ta phim..."
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-white/5 bg-[#162333] p-6">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-white/5 text-[#6bb7ff]">
                M
              </span>
              Media & Backdrop
            </div>
            <div className="mt-5 grid gap-4">
              <label className="space-y-2 text-xs text-white/60">
                Link Trailer (Youtube/Vimeo)
                <div className="flex items-center gap-2">
                  <input
                    className="flex-1 rounded-xl border border-white/10 bg-[#111b26] px-3 py-2 text-sm text-white"
                    placeholder="https://www.youtube.com/watchtv=..."
                    value={trailerUrl}
                    onChange={(event) => setTrailerUrl(event.target.value)}
                  />
                  <button className="rounded-xl border border-white/10 bg-[#111b26] px-3 py-2 text-xs text-white/60">
                    Kiểm tra
                  </button>
                </div>
              </label>
              <label className="space-y-2 text-xs text-white/60">
                Ảnh nền(Backdrop)
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => backdropInputRef.current?.click()}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      backdropInputRef.current?.click();
                    }
                  }}
                  onDrop={handleBackdropDrop}
                  onDragOver={handleDragOver}
                  className="relative flex h-32 items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/20 bg-[#111b26] text-xs text-white/40 transition hover:border-white/40"
                >
                  {backdropPreview ? (
                    <>
                      <img
                        src={backdropPreview}
                        alt="Backdrop preview"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <div className="relative z-10 rounded-full bg-black/40 px-3 py-1 text-[11px] text-white">
                        Đổi ảnh nền
                      </div>
                    </>
                  ) : (
                    <span>Kéo thả hoặc chọn ảnh nền</span>
                  )}
                  <input
                    ref={backdropInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBackdropChange}
                  />
                </div>
                {backdropFile ? (
                  <p className="text-[11px] text-white/40">
                    {backdropFile.name}
                  </p>
                ) : null}
              </label>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-white/5 bg-[#162333] p-6">
            <h3 className="text-sm font-semibold">Phân Loại</h3>
            <div className="mt-4 space-y-3 text-xs text-white/60">
              <label className="space-y-2">
                Trạng thái
                <select
                  className="w-full rounded-xl border border-white/10 bg-[#111b26] px-3 py-2 text-sm text-white"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  <option value="ongoing">Đang tiến hành (Ongoing)</option>
                  <option value="completed">Hoàn thành</option>
                  <option value="upcoming">Sắp chiếu</option>
                </select>
              </label>
              <label className="space-y-2">
                Thể loại
                <div className="flex flex-wrap gap-2">
                  {genresLoading ? (
                    <span className="text-xs text-white/40">Đang tải...</span>
                  ) : null}
                  {genres.map((genre) => {
                    const active = selectedGenres.includes(genre.id);
                    return (
                      <button
                        key={genre.id}
                        type="button"
                        onClick={() => toggleGenre(genre.id)}
                        className={`rounded-full border px-3 py-1 text-[11px] transition ${
                          active
                            ? "border-[#1f8ef1] bg-[#1f8ef1]/20 text-white"
                            : "border-white/10 bg-[#111b26] text-white/70"
                        }`}
                      >
                        {genre.name}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    className="rounded-full border border-dashed border-white/20 px-3 py-1 text-[11px] text-white/40"
                    onClick={() => setAddingGenre(true)}
                  >
                    + Thêm
                  </button>
                </div>
                {addingGenre ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <input
                      className="flex-1 rounded-xl border border-white/10 bg-[#111b26] px-3 py-2 text-xs text-white"
                      placeholder="Nhập tên thể loại"
                      value={newGenre}
                      onChange={(event) => setNewGenre(event.target.value)}
                    />
                    <button
                      type="button"
                      className="rounded-xl bg-[#1f8ef1] px-3 py-2 text-xs text-white"
                      onClick={handleAddGenre}
                      disabled={savingGenre}
                    >
                      {savingGenre ? "Đang lưu" : "Thêm"}
                    </button>
                    <button
                      type="button"
                      className="rounded-xl border border-white/10 bg-[#111b26] px-3 py-2 text-xs text-white/70"
                      onClick={() => {
                        setAddingGenre(false);
                        setNewGenre("");
                      }}
                    >
                      Hủy
                    </button>
                  </div>
                ) : null}
                {genreError ? (
                  <p className="mt-2 text-xs text-red-300">{genreError}</p>
                ) : null}
              </label>
              <label className="space-y-2">
                Quốc gia
                <select
                  className="w-full rounded-xl border border-white/10 bg-[#111b26] px-3 py-2 text-sm text-white"
                  value={country}
                  onChange={(event) => setCountry(event.target.value)}
                >
                  {["Việt Nam", "Trung Quốc", "Nhật Bản", "Hàn Quốc"].map(
                    (item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    )
                  )}
                </select>
              </label>
              <label className="space-y-2">
                Năm phát hành
                <select
                  className="w-full rounded-xl border border-white/10 bg-[#111b26] px-3 py-2 text-sm text-white"
                  value={releaseYear}
                  onChange={(event) => setReleaseYear(event.target.value)}
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                Tổng số tập dự kiến
                <input
                  type="number"
                  min={1}
                  className="w-full rounded-xl border border-white/10 bg-[#111b26] px-3 py-2 text-sm text-white"
                  placeholder="VD: 12"
                  value={totalEpisodes}
                  onChange={(event) => setTotalEpisodes(event.target.value)}
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-white/5 bg-[#162333] p-6">
            <h3 className="text-sm font-semibold">Poster phim</h3>
            <div
              role="button"
              tabIndex={0}
              onClick={() => posterInputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  posterInputRef.current?.click();
                }
              }}
              onDrop={handlePosterDrop}
              onDragOver={handleDragOver}
              className="relative mt-4 flex h-64 items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/20 bg-[#111b26] text-xs text-white/40 transition hover:border-white/40"
            >
              {posterPreview ? (
                <>
                  <img
                    src={posterPreview}
                    alt="Poster preview"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="relative z-10 rounded-full bg-black/40 px-3 py-1 text-[11px] text-white">
                    Đổi ảnh poster
                  </div>
                </>
              ) : (
                <span>Chọn hoặc kéo ảnh poster</span>
              )}
              <input
                ref={posterInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePosterChange}
              />
            </div>
            {posterFile ? (
              <p className="mt-2 text-[11px] text-white/40">
                {posterFile.name}
              </p>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
