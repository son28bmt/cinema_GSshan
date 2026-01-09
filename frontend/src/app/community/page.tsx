import SectionHeading from "../../components/section-heading";
import SiteFooter from "../../components/site-footer";
import SiteHeader from "../../components/site-header";
import Tag from "../../components/tag";

const comments = [
  {
    name: "MovieStream Official",
    role: "Admin",
    time: "2 ngày trước",
    content:
      "Cảnh báo: Tập phim có after-credit quan trọng. Vui lòng không spoil nội dung trong bình luận.",
    likes: 245,
  },
  {
    name: "Nguyễn Văn A",
    role: "Fan cứng",
    time: "3 giờ trước",
    content:
      "Thật sự không thể tin được cái kết. Cảm xúc vỡ òa luôn!",
    likes: 1200,
  },
  {
    name: "Trần B",
    role: "Thành viên",
    time: "1 giờ trước",
    content: "Chuẩn luôn bác ơi, rạp lúc đó hét ầm lên.",
    likes: 12,
  },
  {
    name: "Lê C",
    role: "Thành viên",
    time: "5 giờ trước",
    content: "(Nội dung có spoiler, nhấn để xem)",
    likes: 89,
  },
];

export default function CommunityPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-10 px-6 pb-20 pt-10">
        <SectionHeading
          title="Cộng đồng"
          subtitle="Chia sẻ cảm nhận và thảo luận về tập phim mới nhất"
        />

        <section className="rounded-3xl border border-white/10 bg-[var(--panel)] p-6">
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Tag active>Tất cả</Tag>
                <Tag>Tập hiện tại</Tag>
                <Tag>Bình luận ghim</Tag>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <textarea
                  className="min-h-[120px] w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white placeholder:text-white/40 focus:outline-none"
                  placeholder="Bạn nghĩ gì về phim này? Có spoiler không?"
                />
                <div className="mt-4 flex items-center justify-between text-xs text-white/60">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="h-4 w-4" />
                    Chứa Spoiler
                  </label>
                  <button className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white">
                    Gửi bình luận
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {comments.map((comment) => (
                  <div
                    key={`${comment.name}-${comment.time}`}
                    className="rounded-2xl border border-white/10 bg-white/5 p-5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{comment.name}</p>
                        <p className="text-xs text-white/50">{comment.role} · {comment.time}</p>
                      </div>
                      <span className="text-xs text-white/50">♥ {comment.likes}</span>
                    </div>
                    <p className="mt-3 text-sm text-white/70">{comment.content}</p>
                    <div className="mt-3 flex gap-3 text-xs text-white/50">
                      <button>Trả lời</button>
                      <button>Ghim</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-semibold">Đánh giá nhanh</p>
                <div className="mt-4 space-y-3">
                  {["Tuyệt vời", "Ổn", "Bình thường", "Không hay"].map((label) => (
                    <button
                      key={label}
                      className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[var(--panel-2)] p-5">
                <p className="text-sm font-semibold">Tìm bạn xem chung</p>
                <p className="mt-2 text-xs text-white/60">
                  Kết nối người xem cùng sở thích để bàn luận mỗi tập.
                </p>
                <button className="mt-4 w-full rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white">
                  Tham gia phòng chat
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
