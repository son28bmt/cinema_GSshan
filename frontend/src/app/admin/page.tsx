const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type OverviewResponse = {
  stats: {
    totalViews: number;
    activeUsers: number;
    totalMovies: number;
    newComments: number;
  };
  weeklyPoints: number[];
  categoryBars: { label: string; value: number }[];
  recentMovies: {
    id: number;
    title: string;
    year: number | null;
    genres: string | null;
    status: string;
    views: number;
  }[];
  hotMovies: { rank: number; title: string; views: number }[];
};

const statusLabels: Record<string, string> = {
  ongoing: "Đang tiến hành",
  completed: "Hoàn thành",
  upcoming: "Sắp chiếu",
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value);

const formatViews = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${value}`;
};

const getOverview = async (): Promise<OverviewResponse | null> => {
  try {
    const response = await fetch(`${API_URL}/api/admin/overview`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return null;
    }
    return response.json();
  } catch (err) {
    return null;
  }
};

export default async function AdminPage() {
  const overview = await getOverview();
  const weeklyPoints =
    overview?.weeklyPoints || Array.from({ length: 7 }, () => 0);
  const maxPoint = Math.max(...weeklyPoints, 1);
  const linePoints = weeklyPoints
    .map((value, index) => {
      const x = index * 80;
      const y = 110 - Math.round((value / maxPoint) * 90);
      return `${x},${y}`;
    })
    .join(" ");

  const categoryBars = overview?.categoryBars || [];
  const maxCategory = Math.max(...categoryBars.map((bar) => bar.value), 1);
  const stats = overview?.stats;
  const recentMovies = overview?.recentMovies || [];
  const hotMovies = overview?.hotMovies || [];

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Tổng quan hệ thống</h1>
          <p className="mt-1 text-sm text-white/60">
            Chào mừng trở lại, Admin. Hệ thống đang hoạt động ổn định.
          </p>
        </div>
        <a
          href="/admin/movies/new"
          className="rounded-xl bg-[#1f8ef1] px-4 py-2 text-sm font-semibold text-white"
        >
          + Thêm phim mới
        </a>
      </section>

      <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Tổng lượt xem",
            value: stats ? formatNumber(stats.totalViews) : "—",
            change: "—",
            icon: "eye",
          },
          {
            label: "Người dùng hoạt động",
            value: stats ? formatNumber(stats.activeUsers) : "—",
            change: "—",
            icon: "users",
          },
          {
            label: "Tổng số phim",
            value: stats ? formatNumber(stats.totalMovies) : "—",
            change: "—",
            icon: "film",
          },
          {
            label: "Bình luận mới",
            value: stats ? formatNumber(stats.newComments) : "—",
            change: "—",
            icon: "chat",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-white/5 bg-[#162333] p-5"
          >
            <div className="flex items-center justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-[#6bb7ff]">
                {stat.icon === "film" ? (
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path d="M4 5h16v14H4z" />
                    <path
                      d="M4 9h16M9 5v14M15 5v14"
                      stroke="currentColor"
                      strokeWidth="1.2"
                    />
                  </svg>
                ) : null}
                {stat.icon === "users" ? (
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path d="M8 11a4 4 0 100-8 4 4 0 000 8zM16 13a3 3 0 100-6 3 3 0 000 6z" />
                    <path d="M2 20c1.6-3 4.3-5 7-5s5.4 2 7 5" />
                    <path d="M14 20c.8-1.6 2.3-2.8 4-3.3" />
                  </svg>
                ) : null}
                {stat.icon === "chat" ? (
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path d="M4 5h16v10H8l-4 4z" />
                  </svg>
                ) : null}
                {stat.icon === "eye" ? (
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path d="M12 5c5 0 9 4.5 9 7s-4 7-9 7-9-4.5-9-7 4-7 9-7z" />
                    <circle cx="12" cy="12" r="3" fill="#0f1720" />
                  </svg>
                ) : null}
              </span>
              <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/60">
                {stat.change}
              </span>
            </div>
            <p className="mt-4 text-xs text-white/50">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 grid-cols-1 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-white/5 bg-[#162333] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Xu hướng lượt xem</p>
              <p className="text-xs text-white/50">7 ngày qua</p>
            </div>
            <p className="text-xl font-semibold">
              {formatViews(weeklyPoints.reduce((sum, value) => sum + value, 0))}
            </p>
          </div>
          <div className="mt-6 rounded-xl border border-white/5 bg-[#111b26] p-4">
            <svg viewBox="0 0 480 130" className="h-40 w-full">
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1f8ef1" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#1f8ef1" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polyline
                points={linePoints}
                fill="none"
                stroke="#1f8ef1"
                strokeWidth="3"
              />
              <polygon
                points={`0,130 ${linePoints} 480,130`}
                fill="url(#lineGradient)"
              />
            </svg>
            <div className="mt-3 flex justify-between text-xs text-white/50">
              {["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"].map(
                (label) => (
                  <span key={label}>{label}</span>
                )
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#162333] p-6">
          <p className="text-sm font-semibold">Phim mới thêm</p>
          <p className="text-xs text-white/50">Theo thể loại tháng này</p>
          <div className="mt-6 grid grid-cols-4 items-end gap-4">
            {(categoryBars.length > 0
              ? categoryBars
              : [{ label: "Chưa có", value: 0 }]
            ).map((bar) => (
              <div key={bar.label} className="flex flex-col items-center gap-3">
                <div className="flex h-32 w-full items-end rounded-full bg-[#111b26]">
                  <div
                    className="w-full rounded-full bg-[#1f8ef1]"
                    style={{
                      height: `${Math.round((bar.value / maxCategory) * 100)}%`,
                    }}
                  />
                </div>
                <span className="text-xs text-white/60">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 grid-cols-1 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-white/5 bg-[#162333] p-6 overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Phim mới cập nhật</p>
            <a href="/admin/movies" className="text-xs text-[#1f8ef1]">
              Xem tất cả
            </a>
          </div>

          <div className="mt-6 overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="grid grid-cols-[1.4fr_1fr_0.6fr_0.6fr_0.6fr] text-xs text-white/40 mb-4 px-2">
                <span>Phim</span>
                <span>Thể loại</span>
                <span>Trạng thái</span>
                <span>Lượt xem</span>
                <span>Hành động</span>
              </div>
              <div className="space-y-4">
                {recentMovies.length === 0 ? (
                  <div className="rounded-xl border border-white/5 bg-[#111b26] px-4 py-3 text-sm text-white/60">
                    Chưa có phim nào.
                  </div>
                ) : (
                  recentMovies.map((movie) => (
                    <div
                      key={movie.id}
                      className="grid grid-cols-[1.4fr_1fr_0.6fr_0.6fr_0.6fr] items-center rounded-xl border border-white/5 bg-[#111b26] px-4 py-3 text-sm"
                    >
                      <div>
                        <p className="font-semibold">{movie.title}</p>
                        <p className="text-xs text-white/50">
                          {movie.year || "—"}
                        </p>
                      </div>
                      <p className="text-xs text-white/60">
                        {movie.genres || "Chưa phân loại"}
                      </p>
                      <span className="rounded-full bg-green-500/15 px-3 py-1 text-xs text-green-400 w-fit">
                        {statusLabels[movie.status] || movie.status}
                      </span>
                      <span className="text-xs text-white/60">
                        {formatViews(movie.views)}
                      </span>
                      <div className="flex items-center gap-2 text-[#6bb7ff]">
                        <a
                          href="/admin/movies"
                          className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs"
                        >
                          Sửa
                        </a>
                        <button className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs">
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#162333] p-6">
          <p className="text-sm font-semibold">Phim đang hot</p>
          <div className="mt-5 space-y-4">
            {hotMovies.length === 0 ? (
              <div className="rounded-xl border border-white/5 bg-[#111b26] px-4 py-3 text-sm text-white/60">
                Chưa có dữ liệu.
              </div>
            ) : (
              hotMovies.map((movie) => (
                <div
                  key={movie.rank}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-[#111b26] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold text-[#1f8ef1]">
                      {movie.rank}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{movie.title}</p>
                      <p className="text-xs text-white/50">
                        {formatViews(movie.views)} views
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-green-400">↑</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
