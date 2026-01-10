import SiteFooter from "../../components/site-footer"
import SiteHeader from "../../components/site-header"

const stats = [
  { label: "Bộ phim", value: "10,000+" },
  { label: "Người dùng", value: "500k" },
  { label: "Quốc gia", value: "50+" },
  { label: "Năm hoạt động", value: "3" },
]

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
]

const team = [
  { name: "Quang Son", role: "Founder & CEO" },
  { name: "Stich", role: "Design UI" },
  { name: "V0.dev", role: "Frontend" },
  { name: "ChatGPT", role: "Backend" },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl space-y-8 px-3 pb-12 pt-6 sm:px-6 sm:space-y-12 sm:pb-16 sm:pt-10 md:space-y-16 md:pb-20">
        <section className="rounded-2xl border border-white/10 bg-[var(--panel)] p-4 text-center sm:rounded-3xl sm:p-8 lg:p-10">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40 sm:tracking-[0.4em]">
            Câu chuyện của chúng tôi
          </p>
          <h1 className="mt-3 text-2xl font-semibold leading-tight sm:mt-4 sm:text-3xl lg:text-4xl">
            Kết nối hàng triệu trái tim qua làn sóng điện ảnh
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-xs text-white/60 leading-relaxed sm:mt-4 sm:text-sm">
            CineStream không chỉ là một nền tảng xem phim. Chúng tôi xây dựng một vũ trụ giải trí nơi mỗi thước phim là
            một trải nghiệm, mỗi khán giả là một phần của câu chuyện.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:mt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-4">
            <button className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-xs font-semibold text-white sm:px-5 sm:py-3 sm:text-sm">
              Tham gia cộng đồng
            </button>
            <button className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-xs text-white/70 sm:px-5 sm:py-3 sm:text-sm">
              Tìm hiểu thêm
            </button>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:gap-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-white/10 bg-white/5 p-4 text-center sm:rounded-2xl sm:p-6"
            >
              <p className="text-lg font-semibold sm:text-2xl">{stat.value}</p>
              <p className="mt-1.5 text-xs text-white/50 sm:mt-2">{stat.label}</p>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-white/10 bg-[var(--panel-2)] p-4 sm:rounded-2xl sm:p-6"
            >
              <h3 className="text-base font-semibold sm:text-lg">{feature.title}</h3>
              <p className="mt-2 text-xs text-white/60 leading-relaxed sm:mt-3 sm:text-sm">{feature.description}</p>
            </div>
          ))}
        </section>

        <section className="rounded-xl border border-white/10 bg-[var(--panel)] p-4 sm:rounded-3xl sm:p-8 lg:p-10">
          <h2 className="text-center text-xl font-semibold sm:text-2xl lg:text-3xl">Đội ngũ phát triển</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4 lg:gap-6">
            {team.map((member) => (
              <div key={member.name} className="text-center">
                <div className="mx-auto h-16 w-16 rounded-full border border-white/10 bg-white/10 sm:h-20 sm:w-20" />
                <p className="mt-3 text-xs font-semibold sm:mt-4 sm:text-sm">{member.name}</p>
                <p className="mt-1 text-xs text-white/50 leading-tight">{member.role}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-[var(--panel-2)] p-4 text-center sm:rounded-3xl sm:p-8 lg:p-10">
          <h2 className="text-xl font-semibold sm:text-2xl lg:text-3xl">Sẵn sàng trãi nghiệm</h2>
          <p className="mt-2 text-xs text-white/60 leading-relaxed sm:mt-3 sm:text-sm">
            Tham gia ngay hôm nay để nhận 30 ngày xem phim miễn phí không giới hạn.
          </p>
          <button className="mt-4 rounded-full bg-[var(--accent)] px-5 py-2.5 text-xs font-semibold text-white sm:mt-6 sm:px-6 sm:py-3 sm:text-sm">
            Đăng ký tài khoản VIP ngay
          </button>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
