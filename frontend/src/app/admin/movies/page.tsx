import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type ApiMovie = {
  id: number;
  title: string;
  original_title: string | null;
  slug: string;
  release_year: number | null;
  poster_url: string | null;
  status: string;
  genres: string | null;
};

const statusLabels: Record<string, string> = {
  ongoing: "Đang tiến hành",
  completed: "Hoàn thành",
  upcoming: "Sắp chiếu",
};

const statusStyles: Record<string, string> = {
  ongoing: "bg-blue-500/20 text-blue-200",
  completed: "bg-green-500/20 text-green-300",
  upcoming: "bg-yellow-500/20 text-yellow-200",
};

const getMovies = async () => {
  try {
    const response = await fetch(`${API_URL}/api/movies?limit=50`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    return (data.movies || []) as ApiMovie[];
  } catch (err) {
    return [];
  }
};

export default async function AdminMoviesPage() {
  const movies = await getMovies();

  return (
    <div className="space-y-6">
      <div className="text-xs text-white/50">
        Home / Dashboard / Quản lý phim
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Danh sách Phim</h1>
          <p className="mt-1 text-sm text-white/60">
            Quản lý kho phim, cập nhật trạng thái và thêm nội dung mới.
          </p>
        </div>
        <Link
          href="/admin/movies/new"
          className="rounded-xl bg-[#1f8ef1] px-4 py-2 text-sm font-semibold text-white"
        >
          + Thêm phim mới
        </Link>
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
              placeholder="Tìm kiếm phim theo tên, đạo diễn..."
            />
          </div>
          <button className="rounded-xl border border-white/10 bg-[#111b26] px-3 py-2 text-xs">
            Thể loại: Tất cả
          </button>
          <button className="rounded-xl border border-white/10 bg-[#111b26] px-3 py-2 text-xs">
            Năm: 2023
          </button>
          <button className="rounded-xl border border-white/10 bg-[#111b26] px-3 py-2 text-xs">
            Trạng thái: Tất cả
          </button>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-white/5">
          <div className="grid grid-cols-[0.7fr_1.6fr_1.1fr_0.6fr_0.7fr_0.7fr_0.7fr] bg-[#111b26] px-4 py-3 text-xs text-white/50">
            <span>Poster</span>
            <span>Tên phim</span>
            <span>Thể loại</span>
            <span>Năm</span>
            <span>Lượt xem</span>
            <span>Trạng thái</span>
            <span>Hành động</span>
          </div>
          <div className="divide-y divide-white/5">
            {movies.length === 0 ? (
              <div className="px-4 py-6 text-sm text-white/60">
                Chưa có phim nào trong hệ thống.
              </div>
            ) : (
              movies.map((movie) => {
                const statusLabel = statusLabels[movie.status] || "Khác";
                const statusStyle =
                  statusStyles[movie.status] || "bg-white/10 text-white/70";
                return (
                  <div
                    key={movie.id}
                    className="grid grid-cols-[0.7fr_1.6fr_1.1fr_0.6fr_0.7fr_0.7fr_0.7fr] items-center px-4 py-4 text-sm"
                  >
                    <div className="h-14 w-10 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                      {movie.poster_url ? (
                        <img
                          src={movie.poster_url}
                          alt={movie.title}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{movie.title}</p>
                      <p className="text-xs text-white/50">
                        {movie.original_title || movie.slug}
                      </p>
                    </div>
                    <p className="text-xs text-white/60">
                      {movie.genres || "Chưa phân loại"}
                    </p>
                    <span className="text-xs text-white/60">
                      {movie.release_year || "—"}
                    </span>
                    <span className="text-xs text-white/60">—</span>
                    <span
                      className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] ${statusStyle}`}
                    >
                      {statusLabel}
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
                );
              })
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-white/50">
          <span>Hiển thị 1 đến {Math.min(movies.length, 10)} trên {movies.length} kết quả</span>
          <div className="flex items-center gap-2">
            <button className="h-8 w-8 rounded-lg border border-white/10 bg-[#111b26]">
              1
            </button>
            <button className="h-8 w-8 rounded-lg border border-white/10 bg-[#111b26]">
              2
            </button>
            <button className="h-8 w-8 rounded-lg border border-white/10 bg-[#111b26]">
              3
            </button>
            <button className="h-8 w-8 rounded-lg border border-white/10 bg-[#111b26]">
              ...
            </button>
            <button className="h-8 w-8 rounded-lg border border-white/10 bg-[#111b26]">
              12
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
