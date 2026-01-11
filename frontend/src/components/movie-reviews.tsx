"use client";

import { useEffect, useMemo, useState } from "react";
import SectionHeading from "./section-heading";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Comment = {
  id: number;
  author_name: string;
  author_email: string | null;
  content: string;
  status: string;
  created_at: string;
  parent_id: number | null;
  report_reason?: string | null;
};

type RatingSummary = {
  average: number;
  total: number;
  counts: Record<number, number>;
};

const ratingLevels = [5, 4, 3, 2, 1];
const reportReasons = [
  "Spam / Quảng cáo",
  "Nội dung không phù hợp",
  "Xúc phạm / Tục tĩu",
  "Giả mạo",
  "Khác",
];

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("vi-VN");

export default function MovieReviews({ movieId }: { movieId: number }) {
  const [summary, setSummary] = useState<RatingSummary>({
    average: 0,
    total: 0,
    counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [commentText, setCommentText] = useState("");
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [sendingComment, setSendingComment] = useState(false);
  const [sendingRating, setSendingRating] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [token, setToken] = useState<string | null>(null);

  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [reportingId, setReportingId] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    setToken(localStorage.getItem("cinema_token"));
  }, []);

  const loadData = async () => {
    try {
      const [ratingRes, commentRes] = await Promise.all([
        fetch(`${API_URL}/api/ratings?movieId=${movieId}`, {
          cache: "no-store",
        }),
        fetch(`${API_URL}/api/comments?movieId=${movieId}&limit=50`, {
          cache: "no-store",
        }),
      ]);

      if (!ratingRes.ok) {
        setError("Không tải được đánh giá.");
      } else {
        const ratingData = await ratingRes.json();
        if (ratingData.summary) {
          setSummary(ratingData.summary);
        }
      }

      if (!commentRes.ok) {
        setError("Không tải được bình luận.");
      } else {
        const commentData = await commentRes.json();
        setComments(commentData.comments || []);
      }
    } catch (err) {
      setError("Không thể kết nối dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [movieId]);

  const ratingPercentages = useMemo(() => {
    if (summary.total === 0) {
      return ratingLevels.map(() => 0);
    }
    return ratingLevels.map((level) =>
      Math.round(((summary.counts[level] || 0) / summary.total) * 100)
    );
  }, [summary]);

  const grouped = useMemo(() => {
    const roots: Comment[] = [];
    const replyMap = new Map<number, Comment[]>();

    comments.forEach((comment) => {
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
  }, [comments]);

  const handleRate = async (value: number) => {
    if (!token) {
      setFeedback("Bạn cần đăng nhập để đánh giá.");
      return;
    }

    setSelectedRating(value);
    setSendingRating(true);
    setFeedback("");

    try {
      const response = await fetch(`${API_URL}/api/ratings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ movieId, rating: value }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setFeedback(data.message || "Không thể lưu đánh giá.");
        return;
      }

      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (err) {
      setFeedback("Không thể kết nối dữ liệu.");
    } finally {
      setSendingRating(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      setFeedback("Vui lòng nhập nội dung bình luận.");
      return;
    }
    if (!token) {
      setFeedback("Bạn cần đăng nhập để bình luận.");
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
          movieId,
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

  const handleReply = async (parentId: number) => {
    if (!replyText.trim()) {
      setFeedback("Vui lòng nhập nội dung trả lời.");
      return;
    }
    if (!token) {
      setFeedback("Bạn cần đăng nhập để trả lời.");
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
          movieId,
          parentId,
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
      setFeedback("bạn cần đăng nhập để báo cáo.");
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
      setFeedback("Không thể kết nối backend.");
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
            depth > 0 ? "ml-6" : ""
          }`}
        >
          <div className="flex items-center justify-between text-xs text-white/50">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">
                {comment.author_name}
              </p>
              <p>{comment.author_email || "Ẩn danh"}</p>
            </div>
            <span>{formatDateTime(comment.created_at)}</span>
          </div>
          <p className="mt-3 text-sm text-white/70">{comment.content}</p>
          {comment.status === "pending" ? (
            <span className="mt-3 inline-flex rounded-full bg-yellow-500/15 px-3 py-1 text-[11px] text-yellow-200">
              Đang chờ duyệt
            </span>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/60">
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
                  onClick={() => handleReply(comment.id)}
                  disabled={sendingComment}
                >
                  {sendingComment ? "Đang gửi..." : "Gửi trả lời"}
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
    <div className="rounded-2xl border border-white/10 bg-[var(--panel)] p-6">
      <SectionHeading title="Đánh giá & Bình luận" />
      <div className="mt-5 grid gap-5 lg:grid-cols-[0.6fr_1fr]">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-3xl font-semibold">
            {summary.total === 0 ? "-" : summary.average.toFixed(1)}
          </p>
          <p className="text-sm text-white/60">
            {summary.total === 0
              ? "Chưa có đánh giá"
              : `${summary.total} đánh giá`}
          </p>
          <div className="mt-4 space-y-2 text-xs text-white/60">
            {ratingLevels.map((level, index) => (
              <div key={level} className="flex items-center gap-3">
                <span>{level}</span>
                <div className="h-2 flex-1 rounded-full bg-white/5">
                  <div
                    className="h-2 rounded-full bg-[var(--accent)]"
                    style={{ width: `${ratingPercentages[index]}%` }}
                  />
                </div>
                <span>{ratingPercentages[index]}%</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2">
            {ratingLevels.map((level) => (
              <button
                key={level}
                className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm ${
                  selectedRating === level
                    ? "border-transparent bg-[var(--accent)] text-white"
                    : "border-white/10 bg-white/5 text-white/70"
                }`}
                onClick={() => handleRate(level)}
                disabled={sendingRating}
                aria-label={`Đánh giá ${level} sao`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <textarea
            className="min-h-[140px] w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white placeholder:text-white/40 focus:outline-none"
            placeholder="Viết bình luận của bạn..."
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
          />
          <div className="flex items-center justify-between gap-3">
            {feedback ? (
              <p className="text-xs text-red-300">{feedback}</p>
            ) : (
              <span />
            )}
            <button
              className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleSubmitComment}
              disabled={sendingComment}
            >
              {sendingComment ? "Đang gửi" : "Gửi bình luận"}
            </button>
          </div>
        </div>
      </div>
      {error ? <p className="mt-4 text-xs text-red-300">{error}</p> : null}

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
  );
}
