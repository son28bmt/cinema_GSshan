"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SectionHeading from "../../components/section-heading";
import SiteFooter from "../../components/site-footer";
import SiteHeader from "../../components/site-header";
import Tag from "../../components/tag";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Movie = {
  id: number;
  title: string;
  slug: string;
  release_year: number | null;
  poster_url: string | null;
  views?: number | null;
};

type Comment = {
  id: number;
  content: string;
  status: string;
  created_at: string;
  parent_id: number | null;
  report_reason?: string | null;
  author_name: string;
  author_email: string | null;
  movie_title: string | null;
  movie_slug?: string | null;
  movie_id?: number | null;
  episode_id?: number | null;
  episode_number?: number | null;
};

type FilterMode = "all" | "movie" | "episode";

const reportReasons = [
  "Spam / Quảng cáo",
  "Nội dung không phù hợp",
  "Xúc phạm / Tục tĩu",
  "Giả mạo",
  "Khác",
];

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("vi-VN");

export default function CommunityPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [topMovies, setTopMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [token, setToken] = useState<string | null>(null);

  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [selectedMovieId, setSelectedMovieId] = useState<number | "">("");
  const [commentText, setCommentText] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [feedback, setFeedback] = useState("");

  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [reportingId, setReportingId] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    setToken(localStorage.getItem("cinema_token"));
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [commentRes, movieRes, topRes] = await Promise.all([
        fetch(`${API_URL}/api/comments?limit=30`, { cache: "no-store" }),
        fetch(`${API_URL}/api/movies?limit=50`, { cache: "no-store" }),
        fetch(`${API_URL}/api/movies?sort=views&limit=5`, {
          cache: "no-store",
        }),
      ]);

      if (commentRes.ok) {
        const data = await commentRes.json();
        setComments(data.comments || []);
      }
      if (movieRes.ok) {
        const data = await movieRes.json();
        setMovies(data.movies || []);
      }
      if (topRes.ok) {
        const data = await topRes.json();
        setTopMovies(data.movies || []);
      }
    } catch (err) {
      setError("Không thể kết nối dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredComments = useMemo(() => {
    if (filterMode === "movie") {
      return comments.filter(
        (comment) => comment.movie_id && !comment.episode_id
      );
    }
    if (filterMode === "episode") {
      return comments.filter((comment) => comment.episode_id);
    }
    return comments;
  }, [comments, filterMode]);

  const grouped = useMemo(() => {
    const roots: Comment[] = [];
    const replyMap = new Map<number, Comment[]>();

    filteredComments.forEach((comment) => {
      if (comment.parent_id) {
        const list = replyMap.get(comment.parent_id) || [];
        list.push(comment);
        replyMap.set(comment.parent_id, list);
      } else {
        roots.push(comment);
      }
    });

    replyMap.forEach((list, key) => {
      list.sort((a, b) => a.created_at.localeCompare(b.created_at));
      replyMap.set(key, list);
    });

    return { roots, replyMap };
  }, [filteredComments]);

  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      setFeedback("Vui lòng nhập nội dung bình luận.");
      return;
    }
    if (!token) {
      setFeedback("Bạn cần đăng nhập để bình luận.");
      return;
    }
    if (!selectedMovieId) {
      setFeedback("Vui lòng chọn phim để bình luận.");
      return;
    }

    setSendingComment(true);
    setFeedback("");

    try {
      const response = await fetch(`${API_URL}/api/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          movieId: selectedMovieId,
          content: commentText.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setFeedback(data.message || "Không thể gửi bình luận.");
        return;
      }

      if (data.comment) {
        setComments((prev) => [data.comment, ...prev]);
        setCommentText("");
      }
    } catch (err) {
      setFeedback("Không thể kết nối dữ liệu.");
    } finally {
      setSendingComment(false);
    }
  };

  const handleReply = async (parent: Comment) => {
    if (!replyText.trim()) {
      setFeedback("Vui lòng nhập nội dung trả lời.");
      return;
    }
    if (!token) {
      setFeedback("Bạn cần đăng nhập để trả lời.");
      return;
    }
    if (!parent.movie_id && !parent.episode_id) {
      setFeedback("Không tìm thấy thông tin phim để trả lời.");
      return;
    }

    setSendingComment(true);
    setFeedback("");

    try {
      const response = await fetch(`${API_URL}/api/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          movieId: parent.movie_id,
          episodeId: parent.episode_id,
          parentId: parent.id,
          content: replyText.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setFeedback(data.message || "Không thể gửi trả lời.");
        return;
      }

      if (data.comment) {
        setComments((prev) => [data.comment, ...prev]);
        setReplyText("");
        setReplyingToId(null);
      }
    } catch (err) {
      setFeedback("Không thể kết nối dữ liệu.");
    } finally {
      setSendingComment(false);
    }
  };

  const handleReport = async (commentId: number) => {
    if (!reportReason) {
      setFeedback("Vui lòng chọn lý do báo cáo.");
      return;
    }
    if (!token) {
      setFeedback("Bạn cần đăng nhập để báo cáo.");
      return;
    }

    setReporting(true);
    setFeedback("");

    try {
      const response = await fetch(
        `${API_URL}/api/comments/${commentId}/report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: reportReason }),
        }
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setFeedback(data.message || "Không thể gửi báo cáo.");
        return;
      }

      if (data.comment) {
        setComments((prev) =>
          prev.map((item) => (item.id === commentId ? data.comment : item))
        );
      }

      setReportingId(null);
      setReportReason("");
    } catch (err) {
      setFeedback("Không thể kết nối dữ liệu.");
    } finally {
      setReporting(false);
    }
  };

  const renderThread = (comment: Comment, depth = 0) => {
    const replies = grouped.replyMap.get(comment.id) || [];
    return (
      <div key={comment.id} className="space-y-3">
        <div
          className={`rounded-2xl border border-white/10 bg-white/5 p-4 ${
            depth > 0 ? "ml-5" : ""
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3 text-xs text-white/50">
            <div>
              <p className="text-sm font-semibold text-white">
                {comment.author_name}
              </p>
              <p>{comment.author_email || "ẩn danh"}</p>
              {comment.movie_title ? (
                <p className="text-[11px] text-white/50">
                  {comment.movie_slug ? (
                    <Link
                      className="underline"
                      href={`/movies/${comment.movie_slug}`}
                    >
                      {comment.movie_title}
                    </Link>
                  ) : (
                    comment.movie_title
                  )}
                  {comment.episode_number
                    ? ` - Tập ${comment.episode_number}`
                    : ""}
                </p>
              ) : null}
            </div>
            <span>{formatDateTime(comment.created_at)}</span>
          </div>
          <p className="mt-3 text-sm text-white/70">{comment.content}</p>
          {comment.status === "reported" ? (
            <span className="mt-3 inline-flex rounded-full bg-red-500/15 px-3 py-1 text-[11px] text-red-200">
              Đã báo cáo
            </span>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/60">
            <button
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70"
              onClick={() => {
                setReplyingToId(comment.id);
                setReplyText("");
                setReportingId(null);
              }}
            >
              Trả lời
            </button>
            <button
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70"
              onClick={() => {
                setReportingId(comment.id);
                setReportReason("");
                setReplyingToId(null);
              }}
            >
              Báo cáo
            </button>
            {comment.report_reason ? (
              <span className="text-[11px] text-red-300">
                Báo cáo: {comment.report_reason}
              </span>
            ) : null}
          </div>

          {replyingToId === comment.id ? (
            <div className="mt-4 space-y-3 rounded-xl border border-white/10 bg-black/20 p-3">
              <textarea
                className="min-h-[90px] w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white placeholder:text-white/40 focus:outline-none"
                placeholder="Nhập nội dung trả lời..."
                value={replyText}
                onChange={(event) => setReplyText(event.target.value)}
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70"
                  onClick={() => {
                    setReplyingToId(null);
                    setReplyText("");
                  }}
                >
                  Hủy
                </button>
                <button
                  className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                  onClick={() => handleReply(comment)}
                  disabled={sendingComment}
                >
                  {sendingComment ? "Đang gửi" : "Gửi trả lời"}
                </button>
              </div>
            </div>
          ) : null}

          {reportingId === comment.id ? (
            <div className="mt-4 space-y-3 rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs text-white/60">Chọn lý do báo cáo</p>
              <div className="flex flex-wrap gap-2">
                {reportReasons.map((reason) => (
                  <button
                    key={reason}
                    className={`rounded-full px-3 py-1 text-xs ${
                      reportReason === reason
                        ? "bg-[var(--accent)] text-white"
                        : "border border-white/10 bg-white/5 text-white/70"
                    }`}
                    onClick={() => setReportReason(reason)}
                  >
                    {reason}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70"
                  onClick={() => {
                    setReportingId(null);
                    setReportReason("");
                  }}
                >
                  Hủy
                </button>
                <button
                  className="rounded-full bg-red-500/80 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                  onClick={() => handleReport(comment.id)}
                  disabled={reporting}
                >
                  {reporting ? "Đang gửi" : "Gửi báo cáo"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
        {replies.map((reply) => renderThread(reply, depth + 1))}
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-10 px-4 pb-20 pt-10 sm:px-6">
        <SectionHeading
          title="Cộng đồng"
          subtitle="Nơi kết nối và chia sẻ của cộng đồng yêu thích DONGHUA"
        />

        {error ? <p className="text-sm text-red-300">{error}</p> : null}

        <section className="grid gap-6 lg:grid-cols-[1.6fr_0.8fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-[var(--panel)] p-4 sm:p-6">
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { label: "Tất cả", value: "all" },
                    { label: "Phim", value: "movie" },
                    { label: "Tập", value: "episode" },
                  ] as { label: string; value: FilterMode }[]
                ).map((item) => (
                  <button
                    key={item.value}
                    className={`rounded-full px-3 py-2 text-xs ${
                      filterMode === item.value
                        ? "bg-[var(--accent)] text-white"
                        : "border border-white/10 bg-white/5 text-white/70"
                    }`}
                    onClick={() => setFilterMode(item.value)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <select
                    className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/80"
                    value={selectedMovieId}
                    onChange={(event) =>
                      setSelectedMovieId(
                        event.target.value ? Number(event.target.value) : ""
                      )
                    }
                  >
                    <option value="">Chọn phim để thảo luận</option>
                    {movies.map((movie) => (
                      <option key={movie.id} value={movie.id}>
                        {movie.title}
                      </option>
                    ))}
                  </select>
                  <button
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70"
                    onClick={loadData}
                  >
                    Làm mới trang
                  </button>
                </div>
                <textarea
                  className="mt-4 min-h-[120px] w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white placeholder:text-white/40 focus:outline-none"
                  placeholder="Bạn đang nghĩ gì, chia sẻ với mọi người nhé"
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                />
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-white/60">
                  {feedback ? (
                    <p className="text-xs text-red-300">{feedback}</p>
                  ) : (
                    <span />
                  )}
                  <button
                    className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                    onClick={handleSubmitComment}
                    disabled={sendingComment}
                  >
                    {sendingComment ? "Đang gửi" : "Gửi bình luận"}
                  </button>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {loading ? (
                  <div className="flex items-center gap-3 text-sm text-white/60">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-transparent" />
                    Đang tải bình luận...
                  </div>
                ) : grouped.roots.length === 0 ? (
                  <p className="text-sm text-white/60">Chưa có bình luận.</p>
                ) : (
                  grouped.roots.map((comment) => renderThread(comment))
                )}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[var(--panel)] p-4 sm:p-6">
              <h3 className="text-sm font-semibold">Chủ đề nổi bật</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {topMovies.length === 0 ? (
                  <p className="text-xs text-white/50">Chưa có dữ liệu.</p>
                ) : (
                  topMovies.map((movie) => (
                    <Link
                      key={movie.id}
                      href={`/movies/${movie.slug}`}
                      className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm"
                    >
                      <p className="font-semibold text-white">{movie.title}</p>
                      <p className="text-xs text-white/50">
                        {movie.release_year ? movie.release_year : "--"}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[var(--panel-2)] p-4 sm:p-6">
              <p className="text-sm font-semibold">Mẹo nhanh</p>
              <p className="mt-2 text-xs text-white/60">
                Chọn phim ở trên để gửi bình luận. Mỗi bình luận có thể trả lời
                hoặc báo cáo khi cần.
              </p>
            </div>
          </aside>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
