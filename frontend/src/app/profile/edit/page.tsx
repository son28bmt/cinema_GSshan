"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SiteFooter from "../../../components/site-footer";
import SiteHeader from "../../../components/site-header";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type UserProfile = {
  id: number;
  email: string;
  name?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  gender?: string | null;
  birth_date?: string | null;
};

export default function EditProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("cinema_token");
    if (!token) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const response = await fetch(`${API_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          setError(data.message || "Không thể tải hổ sơ.");
          return;
        }
        const profile = data.user as UserProfile;
        setUser(profile);
        setFullName(profile?.name || "");
        setDisplayName(profile?.display_name || "");
        setGender(profile?.gender || "");
        setBirthDate(profile?.birth_date || "");
        setBio(profile?.bio || "");
        setAvatarPreview(profile?.avatar_url || null);
      } catch (err) {
        setError("Không thể tải hổ sơ.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(typeof reader.result === "string" ? reader.result : null);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem("cinema_token");
      if (!token) {
        setError("Bạn cần đăng nhập lại.");
        return;
      }

      const payload = {
        name: fullName || null,
        displayName: displayName || null,
        gender: gender || null,
        birthDate: birthDate || null,
        bio: bio || null,
        avatarUrl: avatarPreview || null,
      };

      const response = await fetch(`${API_URL}/api/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.message || "Cap nhat that bai.");
        return;
      }

      setUser(data.user || null);
      router.push("/profile");
    } catch (err) {
      setError("Cap nhat that bai.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl space-y-8 px-6 pb-20 pt-10">
        <div className="flex items-center gap-3 text-sm text-white/70">
          <button
            onClick={() => router.back()}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70"
          >
            Quay lại
          </button>
          <div>
            <h1 className="text-xl font-semibold text-white">Chỉnh sửa hồ sơ</h1>
            <p className="text-xs text-white/50">
              Quản lý thông tin cá nhân của bạn tại đây.
            </p>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
            {error}
          </div>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <div className="rounded-2xl border border-white/10 bg-[var(--panel)] p-6">
            <p className="text-sm font-semibold">Ảnh đại diện</p>
            <p className="mt-2 text-xs text-white/50">
              Hổ trợ JPG/PNG. Kích thước tối đa 2MB.
            </p>
            <div className="mt-4 flex items-center gap-4">
              <div className="relative h-24 w-24 overflow-hidden rounded-full border border-white/10 bg-white/5">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={displayName || user?.email || "Avatar"}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70"
                >
                  Tải ảnh lên
                </button>
                <button
                  onClick={() => {
                    setAvatarFile(null);
                    setAvatarPreview(null);
                  }}
                  className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/50"
                >
                  Xóa
                </button>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-[var(--panel)] p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-xs text-white/60">
                Họ và tên
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Nhập họ và tên"
                />
              </label>
              <label className="space-y-2 text-xs text-white/60">
                Tên hiển thị
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Nhập tên hiển thị"
                />
              </label>
              <label className="space-y-2 text-xs text-white/60">
                Giới tính
                <select
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                  value={gender}
                  onChange={(event) => setGender(event.target.value)}
                >
                  <option value="">Chọn</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </label>
              <label className="space-y-2 text-xs text-white/60">
                Ngày sinh
                <input
                  type="date"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                  value={birthDate}
                  onChange={(event) => setBirthDate(event.target.value)}
                />
              </label>
              <label className="md:col-span-2 space-y-2 text-xs text-white/60">
                Tiểu sử ngắn
                <textarea
                  rows={4}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  placeholder="Giới thiệu ngắn về bạn..."
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                onClick={() => router.back()}
                className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/70"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSave}
                disabled={saving || loading}
                className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

