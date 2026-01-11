"use client";

import { useEffect, useMemo, useState } from "react";
import SectionHeading from "./section-heading";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const reportReasons = [
  "Spam / Quảng cáo",
  "Nội dung không phù hợp",
  "Xúc phạm / Tục tĩu",
  "Giả mạo",
  "Khác",
];

type Comment = {
  id: number;
  author_name: string;
  author_email: string | null;
  content: string;
  status: string;
  created_at: string;
  parent_id: number | null;
  report_reason: string | null;
};

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("vi-VN");

export default function EpisodeComments({
  episodeId,
  movieId,
}: {
  episodeId: number;
  movieId: number;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [commentText, setCommentText] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [reportingId, setReportingId] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    setToken(localStorage.getItem("cinema_token"));
  }, []);

  const loadComments = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${API_URL}/api/comments?episodeId=${episodeId}&limit=100&status=approved`,
        { cache: "no-store" }
      );
      if (!response.ok) {
        setError("Không thể tải được bình luận.");
        return;
      }
      const data = await response.json();
      setComments(data.comments || []);
    } catch (err) {
      setError("Không thể kết nối dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [episodeId]);

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
          episodeId,
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
          episodeId,
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

  const renderCommentThread = (comment: Comment, depth = 0) => {
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
        {replies.map((reply) => renderCommentThread(reply, depth + 1))}
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[var(--panel)] p-6">
      <SectionHeading title="Bình luận" />
      <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <textarea
          className="min-h-[120px] w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white placeholder:text-white/40 focus:outline-none"
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
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            onClick={handleSubmitComment}
            disabled={sendingComment}
          >
            {sendingComment ? "Đang gửi" : "Gửi bình luận"}
          </button>
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
          grouped.roots.map((comment) => renderCommentThread(comment))
        )}
      </div>
    </div>
  );
}
