"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import MovieCard from "../../components/movie-card";
import SectionHeading from "../../components/section-heading";
import SiteFooter from "../../components/site-footer";
import SiteHeader from "../../components/site-header";
import Tag from "../../components/tag";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const PAGE_SIZE = 12;

type ApiMovie = {
  id: number;
  title: string;
  slug: string;
  release_year: number | null;
  poster_url: string | null;
  genres: string | null;
  status: string | null;
  country: string | null;
};

type Genre = {
  id: number;
  name: string;
  slug: string;
};

type Pagination = {
  page: number;
  total: number;
  totalPages: number;
};

type SortMode = "latest" | "views" | "rating";
type StatusFilter = "all" | "ongoing" | "completed";

const sortOptions: { label: string; value: SortMode }[] = [
  { label: "Mới cập nhật", value: "latest" },
  { label: "Xem nhiều", value: "views" },
  { label: "Đánh giá cao", value: "rating" },
];

const statusOptions: { label: string; value: StatusFilter }[] = [
  { label: "Tất cả", value: "all" },
  { label: "Đang chiếu", value: "ongoing" },
  { label: "Hoàn thành", value: "completed" },
];

const getPageItems = (current: number, total: number) => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }
  const items: Array<number | string> = [1];
  if (current > 3) items.push("...");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let page = start; page <= end; page += 1) {
    items.push(page);
  }
  if (current < total - 2) items.push("...");
  items.push(total);
  return items;
};

export default function MoviesPage() {
  const searchParams = useSearchParams();
  const searchTerm = (searchParams.get("q") || "").trim();

  const [movies, setMovies] = useState<ApiMovie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [sortMode, setSortMode] = useState<SortMode>("latest");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [genreRes, filterRes] = await Promise.all([
          fetch(`${API_URL}/api/genres`, { cache: "no-store" }),
          fetch(`${API_URL}/api/movies/filters`, { cache: "no-store" }),
        ]);

        if (genreRes.ok) {
          const genreData = await genreRes.json();
          setGenres(genreData.genres || []);
        }
        if (filterRes.ok) {
          const filterData = await filterRes.json();
          setYears(filterData.years || []);
          setCountries(filterData.countries || []);
        }
      } catch (err) {
        setError("Không thể tải bộ lọc.");
      }
    };

    loadFilters();
  }, []);

  useEffect(() => {
    const loadMovies = async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        params.set("limit", PAGE_SIZE.toString());
        params.set("page", currentPage.toString());
        params.set("sort", sortMode);
        if (searchTerm) params.set("q", searchTerm);
        if (selectedGenre !== "all") params.set("genre", selectedGenre);
        if (selectedYear !== "all") params.set("year", selectedYear);
        if (selectedCountry !== "all") params.set("country", selectedCountry);
        if (selectedStatus !== "all") params.set("status", selectedStatus);

        const response = await fetch(`${API_URL}/api/movies?${params.toString()}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          setError("Không tải được dữ liệu phim.");
          return;
        }
        const data = await response.json();
        setMovies(data.movies || []);
        setPagination(
          data.pagination || { page: currentPage, total: 0, totalPages: 1 }
        );
      } catch (err) {
        setError("Không thể kết nối backend.");
      } finally {
        setLoading(false);
      }
    };

    loadMovies();
  }, [
    sortMode,
    selectedGenre,
    selectedYear,
    selectedCountry,
    selectedStatus,
    currentPage,
    searchTerm,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    sortMode,
    selectedGenre,
    selectedYear,
    selectedCountry,
    selectedStatus,
    searchTerm,
  ]);

  const pageItems = useMemo(
    () => getPageItems(pagination.page || currentPage, pagination.totalPages || 1),
    [pagination.page, pagination.totalPages, currentPage]
  );

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-10 px-6 pb-20 pt-10">
        <SectionHeading
          title="Danh sách phim"
          subtitle="Khám phá kho donghua khổng lồ, cập nhật liên tục các tựa phim hot"
          action={
            <div className="flex flex-wrap items-center gap-3">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortMode(option.value)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold ${
                    sortMode === option.value
                      ? "bg-[var(--accent)] text-white"
                      : "border border-white/10 bg-white/5 text-white/70"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          }
        />

        <div className="flex flex-wrap gap-3">
          <button onClick={() => setSelectedGenre("all")}>
            <Tag active={selectedGenre === "all"}>Tat ca</Tag>
          </button>
          {genres.map((genre) => (
            <button key={genre.id} onClick={() => setSelectedGenre(genre.slug)}>
              <Tag active={selectedGenre === genre.slug}>{genre.name}</Tag>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-white/70">
          <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
            Năm:
            <select
              className="bg-transparent text-xs text-white/80 focus:outline-none"
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
            >
              <option value="all">Tất cả</option>
              {years.map((year) => (
                <option key={year} value={year.toString()}>
                  {year}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
            QG:
            <select
              className="bg-transparent text-xs text-white/80 focus:outline-none"
              value={selectedCountry}
              onChange={(event) => setSelectedCountry(event.target.value)}
            >
              <option value="all">Tất cả</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </label>
          {statusOptions.map((status) => (
            <button
              key={status.value}
              onClick={() => setSelectedStatus(status.value)}
              className={`rounded-full border px-3 py-2 ${
                selectedStatus === status.value
                  ? "border-[var(--accent)] bg-[rgba(239,43,79,0.16)] text-white"
                  : "border-white/10 bg-white/5 text-white/70"
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>

        {error ? <p className="text-sm text-red-300">{error}</p> : null}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            <div className="col-span-full text-sm text-white/60">Đang tải dữ liệu...</div>
          ) : movies.length === 0 ? (
            <div className="col-span-full text-sm text-white/60">Chưa có phim nào.</div>
          ) : (
            movies.map((movie) => {
              const subtitleParts = [] as string[];
              if (movie.release_year) subtitleParts.push(movie.release_year.toString());
              if (movie.genres) subtitleParts.push(movie.genres);
              return (
                <MovieCard
                  key={movie.id}
                  title={movie.title}
                  subtitle={subtitleParts.join(" | ")}
                  cover={movie.poster_url || undefined}
                  href={`/movies/${movie.slug}`}
                />
              );
            })
          )}
        </div>

        <div className="flex items-center justify-center gap-3 text-sm">
          <button
            className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 text-white/70 disabled:opacity-50"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage <= 1}
          >
            &lt;
          </button>
          {pageItems.map((item, index) => {
            if (typeof item !== "number") {
              return (
                <span key={`ellipsis-${index}`} className="px-2 text-white/50">
                  ...
                </span>
              );
            }

            return (
              <button
                key={item}
                className={`h-9 w-9 rounded-xl border text-sm ${
                  item === currentPage
                    ? "border-transparent bg-[var(--accent)] text-white"
                    : "border-white/10 bg-white/5 text-white/70"
                }`}
                onClick={() => setCurrentPage(item)}
              >
                {item}
              </button>
            );
          })}
          <button
            className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 text-white/70 disabled:opacity-50"
            onClick={() =>
              setCurrentPage((prev) => Math.min(pagination.totalPages || prev, prev + 1))
            }
            disabled={currentPage >= (pagination.totalPages || 1)}
          >
            &gt;
          </button>
        </div>

        <div className="text-center text-sm text-white/60">
          <Link href="/rankings" className="underline decoration-white/30 underline-offset-4">
            Xem bảng xếp hạng
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
