import SiteFooter from "../../components/site-footer";
import SiteHeader from "../../components/site-header";

const stats = [
  { label: "Bộ phim", value: "10,000+" },
  { label: "Người dùng", value: "500k" },
  { label: "Quốc gia", value: "50+" },
  { label: "Năm hoạt động", value: "3" },
];

const features = [
  {
    title: "Kho phim khổng lồ",
    description: "Sở hữu bản quyền hàng ngàn bom tấn, donghua đặc sắc cập nhật mỗi ngày.",
  },
  {
    title: "Cộng đồng sôi động",
    description: "Kết nối fan, chia sẻ review và thảo luận 24/7.",
  },
  {
    title: "Chất lượng đỉnh cao",
    description: "Trải nghiệm streaming 4K HDR mượt mà trên mọi thiết bị.",
  },
];

const team = [
  { name: "Quang Sơn", role: "Founder & CEO" },
  { name: "Stich", role: "Design UI" },
  { name: "V0.dev", role: "Frontend" },
  { name: "ChatGPT", role: "Backend" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-16 px-6 pb-20 pt-10">
        <section className="rounded-3xl border border-white/10 bg-[var(--panel)] p-10 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-white/40">Câu chuyện của chúng tôi</p>
          <h1 className="mt-4 font-display text-4xl font-semibold">
            Kết nối hàng triệu trái tim qua làn sóng điện ảnh
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-white/60">
            CineStream không chỉ là một nền tảng xem phim. Chúng tôi xây dựng một
            vũ trụ giải trí nơi mỗi thước phim là một trải nghiệm, mỗi khán giả là
            một phần của câu chuyện.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <button className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white">
              Tham gia cộng đồng
            </button>
            <button className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/70">
              Tìm hiểu thêm
            </button>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center"
            >
              <p className="text-2xl font-semibold">{stat.value}</p>
              <p className="mt-2 text-xs text-white/50">{stat.label}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-white/10 bg-[var(--panel-2)] p-6"
            >
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="mt-3 text-sm text-white/60">{feature.description}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-white/10 bg-[var(--panel)] p-10">
          <h2 className="font-display text-2xl font-semibold text-center">Đội ngũ phát triển</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-4">
            {team.map((member) => (
              <div key={member.name} className="text-center">
                <div className="mx-auto h-20 w-20 rounded-full border border-white/10 bg-white/10" />
                <p className="mt-4 text-sm font-semibold">{member.name}</p>
                <p className="text-xs text-white/50">{member.role}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[var(--panel-2)] p-10 text-center">
          <h2 className="font-display text-3xl font-semibold">Sẵn sàng trải nghiệm?</h2>
          <p className="mt-3 text-sm text-white/60">
            Tham gia ngay hôm nay để nhận 30 ngày xem phim miễn phí không giới hạn.
          </p>
          <button className="mt-6 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white">
            Đăng ký tài khoản ngay
          </button>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
