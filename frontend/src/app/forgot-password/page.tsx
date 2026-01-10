import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="flex min-h-screen items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md space-y-6 rounded-3xl border border-white/10 bg-[var(--panel)] p-6 sm:p-8">
          <div>
            <h2 className="font-display text-2xl font-semibold">Quên mật khẩu</h2>
            <p className="text-sm text-white/60">
              Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu.
            </p>
          </div>

          <form className="space-y-4">
            <label className="space-y-2 text-sm text-white/70">
              Email
              <input
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none"
                placeholder="name@example.com"
                type="email"
              />
            </label>
            <button
              className="w-full rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white"
              type="submit"
            >
              Gửii yêu cầu
            </button>
          </form>

          <div className="text-center text-xs text-white/50">
            <Link href="/login" className="text-[var(--accent-2)]">
              Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

