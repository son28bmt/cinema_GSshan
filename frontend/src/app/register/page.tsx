"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Vui lòng nhập email và mật khẩu.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.message || "Đăng ký thất bại.");
        return;
      }

      if (data.token) {
        localStorage.setItem("cinema_token", data.token);
      }

      router.push("/profile");
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
              Bắt đầu hành trình cộng đồnghua.
            </h1>
            <p className="max-w-md text-sm text-white/60">
              Tạo tài khoản miễn phí để theo dõi phim yêu thích, lưu lịch sử xem
              và tham gia cộng đồng.
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-8">
          <div className="w-full max-w-md space-y-6 rounded-3xl border border-white/10 bg-[var(--panel)] p-6 sm:p-8">
            <div>
              <h2 className="font-display text-2xl font-semibold">Tạo tài khoản</h2>
              <p className="text-sm text-white/60">Điền thông tin để bắt đầu.</p>
            </div>

            <div className="flex gap-4 text-sm">
              <Link
                href="/login"
                className="flex-1 pb-2 text-center text-white/50 transition hover:text-white"
              >
                Đăng nhập
              </Link> 
              <span className="flex-1 border-b-2 border-[var(--accent)] pb-2 text-center text-white">
                Đăng ký
              </span>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="space-y-2 text-sm text-white/70">
                Họ và tên
                <input
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none"
                  placeholder="Nguyễn Văn A"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
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
                    placeholder="Tối thiểu 6 ký tự"
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
              <label className="space-y-2 text-sm text-white/70">
                Xác nhận mật khẩu
                <div className="flex items-center rounded-2xl border border-white/10 bg-white/5 px-4">
                  <input
                    className="w-full bg-transparent py-3 text-sm text-white placeholder:text-white/40 focus:outline-none"
                    placeholder="Nhập lại mật khẩu"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                  />
                  <button
                    className="text-xs text-white/50 hover:text-white"
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    {showConfirmPassword ? "ẩn" : "Hiện"}
                  </button>
                </div>
              </label>

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
                {loading ? "Đang xử lý..." : "Đăng ký"}
              </button>
            </form>

            <p className="text-xs text-white/50">
              Khi đăng ký, bạn đồng ý với
              <span className="text-white/70"> điều khoản </span>
              và
              <span className="text-white/70"> Chính sách bảo mật</span>.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

