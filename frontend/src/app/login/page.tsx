"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Vui lòng nhập email và mật khẩu.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.message || "Đăng nhập thất bại.");
        return;
      }

      if (data.token) {
        localStorage.setItem("cinema_token", data.token);
      }

      if (data.user?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (err) {
      setError("Không thể kết nối backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative hidden items-center justify-center border-r border-white/10 bg-[var(--panel)] p-12 lg:flex">
          <div className="space-y-6">
            <div className="flex items-center gap-3 font-display text-2xl font-semibold">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent)] text-white">
                CS
              </span>
              CineStream
            </div>
            <h1 className="font-display text-4xl font-semibold">
              Thế giới điện ảnh trong tầm tay bạn.
            </h1>
            <p className="max-w-md text-sm text-white/60">
              Trải nghiệm hàng ngàn bộ phim bom tấn, donghua độc quyền và chương
              trình giải trí chất lượng cao. Đăng nhập để tiếp tục hành trình.
            </p>
            <div className="flex items-center gap-4 text-xs text-white/60">
              <div className="flex -space-x-2">
                <span className="h-8 w-8 rounded-full border border-white/10 bg-white/10" />
                <span className="h-8 w-8 rounded-full border border-white/10 bg-white/20" />
                <span className="h-8 w-8 rounded-full border border-white/10 bg-white/30" />
              </div>
              <span>+2tr người dùng tin tưởng</span>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-6 rounded-3xl border border-white/10 bg-[var(--panel)] p-8">
            <div>
              <h2 className="font-display text-2xl font-semibold">Chào mừng trở lại!</h2>
              <p className="text-sm text-white/60">Vui lòng nhập thông tin đăng nhập.</p>
            </div>

            <div className="flex gap-4 text-sm">
              <span className="flex-1 border-b-2 border-[var(--accent)] pb-2 text-center text-white">
                Đăng nhập
              </span>
              <Link
                href="/register"
                className="flex-1 pb-2 text-center text-white/50 transition hover:text-white"
              >
                Đăng ký
              </Link>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="space-y-2 text-sm text-white/70">
                Email
                <input
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none"
                  placeholder="name@example.com"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>
              <label className="space-y-2 text-sm text-white/70">
                Mật khẩu
                <div className="flex items-center rounded-2xl border border-white/10 bg-white/5 px-4">
                  <input
                    className="w-full bg-transparent py-3 text-sm text-white placeholder:text-white/40 focus:outline-none"
                    placeholder="Nhập mật khẩu"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                  <button
                    className="text-xs text-white/50 hover:text-white"
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? "Ẩn" : "Hiện"}
                  </button>
                </div>
              </label>
              <div className="flex justify-end">
                <Link href="/forgot-password" className="text-xs text-[var(--accent-2)]">
                  Quên mật khẩu?
                </Link>
              </div>

              {error ? (
                <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-200">
                  {error}
                </p>
              ) : null}

              <button
                className="w-full rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={loading}
              >
                {loading ? "Đang xử lý..." : "Đăng nhập"}
              </button>
            </form>

            <div className="flex items-center gap-3 text-xs text-white/50">
              <span className="h-px flex-1 bg-white/10" />
              Hoặc tiếp tục với
              <span className="h-px flex-1 bg-white/10" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70">
                Google
              </button>
              <button className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70">
                Facebook
              </button>
            </div>

            <p className="text-xs text-white/50">
              Bằng việc đăng nhập, bạn đồng ý với
              <span className="text-white/70"> Điều khoản </span>
              và
              <span className="text-white/70"> Chính sách bảo mật</span>.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
