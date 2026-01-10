"use client";

import { useEffect, useState } from "react";
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
};

type UserSettings = {
  notify_new_movies: number;
  notify_new_episodes: number;
  marketing_emails: number;
};

type UserDevice = {
  id: number;
  device_name?: string | null;
  user_agent?: string | null;
  ip_address?: string | null;
  last_seen_at: string;
};

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [devices, setDevices] = useState<UserDevice[]>([]);

  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");

  const [notifyNewMovies, setNotifyNewMovies] = useState(true);
  const [notifyNewEpisodes, setNotifyNewEpisodes] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [emailEditOpen, setEmailEditOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("cinema_token");
    if (!token) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const [profileRes, devicesRes] = await Promise.all([
          fetch(`${API_URL}/api/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/api/profile/devices`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const profileData = await profileRes.json().catch(() => ({}));
        if (profileRes.ok) {
          setUser(profileData.user || null);
          setSettings(profileData.settings || null);
          setFullName(profileData.user?.name || "");
          setDisplayName(profileData.user?.display_name || "");
          setBio(profileData.user?.bio || "");
          setNotifyNewMovies(!!profileData.settings?.notify_new_movies);
          setNotifyNewEpisodes(!!profileData.settings?.notify_new_episodes);
          setMarketingEmails(!!profileData.settings?.marketing_emails);
          setNewEmail(profileData.user?.email || "");
        } else {
          setError(profileData.message || "Khong the tai du lieu.");
        }

        const devicesData = await devicesRes.json().catch(() => ({}));
        if (devicesRes.ok) {
          setDevices(devicesData.devices || []);
        }
      } catch (err) {
        setError("Khong the tai du lieu.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setError(null);

    try {
      const token = localStorage.getItem("cinema_token");
      if (!token) {
        setError("Ban can dang nhap lai.");
        return;
      }

      const response = await fetch(`${API_URL}/api/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: fullName || null,
          displayName: displayName || null,
          bio: bio || null,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.message || "Cap nhat that bai.");
        return;
      }
      setUser(data.user || null);
    } catch (err) {
      setError("Cap nhat that bai.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setError(null);

    try {
      const token = localStorage.getItem("cinema_token");
      if (!token) {
        setError("Ban can dang nhap lai.");
        return;
      }

      const response = await fetch(`${API_URL}/api/profile/settings`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notifyNewMovies,
          notifyNewEpisodes,
          marketingEmails,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.message || "Cap nhat that bai.");
        return;
      }
      setSettings(data.settings || null);
    } catch (err) {
      setError("Cap nhat that bai.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError("Mat khau moi khong khop.");
      return;
    }

    setSavingPassword(true);
    setError(null);

    try {
      const token = localStorage.getItem("cinema_token");
      if (!token) {
        setError("Ban can dang nhap lai.");
        return;
      }

      const response = await fetch(`${API_URL}/api/profile/password`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.message || "Cap nhat that bai.");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError("Cap nhat that bai.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleChangeEmail = async () => {
    setSavingEmail(true);
    setError(null);

    try {
      const token = localStorage.getItem("cinema_token");
      if (!token) {
        setError("Ban can dang nhap lai.");
        return;
      }

      const response = await fetch(`${API_URL}/api/profile/email`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: newEmail,
          password: emailPassword,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.message || "Cap nhat that bai.");
        return;
      }
      setUser(data.user || null);
      setEmailEditOpen(false);
      setEmailPassword("");
    } catch (err) {
      setError("Cap nhat that bai.");
    } finally {
      setSavingEmail(false);
    }
  };

  const handleLogoutAll = () => {
    localStorage.removeItem("cinema_token");
    router.push("/login");
  };

  const renderDeviceLabel = (device: UserDevice) => {
    if (device.device_name) return device.device_name;
    if (device.user_agent) return device.user_agent.slice(0, 40);
    return "Unknown device";
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-8 px-4 pb-20 pt-10 sm:px-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Cai dat tai khoan</h1>
          <p className="text-sm text-white/60">
            Quan ly thong tin ho so, bao mat va thiet bi dang nhap.
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 sm:p-6 lg:grid-cols-[240px_1fr]">
          <aside className="space-y-3">
            {[
              "Thông tin chung",
              "Bảo mật & Mật khẩu",
              "Thông báo",
              "Thiết bị",
              "Gói dịch vụ",
            ].map((item, index) => (
              <div
                key={item}
                className={`rounded-xl px-4 py-3 text-sm ${
                  index === 0
                    ? "bg-[var(--accent)]/20 text-white"
                    : "border border-white/10 text-white/70"
                }`}
              >
                {item}
              </div>
            ))}
          </aside>

          <div className="space-y-6">
            <section className="rounded-2xl border border-white/10 bg-[var(--panel)] p-4 sm:p-6">
              <h3 className="text-sm font-semibold">Thông tin cá nhân</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-[120px_1fr_1fr]">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-20 w-20 overflow-hidden rounded-full border border-white/10 bg-white/5">
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.display_name || user.name || "Avatar"}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <p className="text-xs text-white/50">Avatar</p>
                </div>
                <label className="space-y-2 text-xs text-white/60">
                  Ho va ten
                  <input
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                  />
                </label>
                <label className="space-y-2 text-xs text-white/60">
                  Ten hien thi
                  <input
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                  />
                </label>
                <label className="md:col-span-3 space-y-2 text-xs text-white/60">
                  Gioi thieu ban than
                  <textarea
                    rows={3}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                  />
                </label>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile || loading}
                  className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {savingProfile ? "Dang luu..." : "Luu thay doi"}
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[var(--panel)] p-4 sm:p-6">
              <h3 className="text-sm font-semibold">Bao mat tai khoan</h3>
              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">Email lien ket</p>
                      <p className="text-xs text-white/60">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => setEmailEditOpen((prev) => !prev)}
                      className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/70"
                    >
                      Thay doi email
                    </button>
                  </div>
                  {emailEditOpen ? (
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <input
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                        value={newEmail}
                        onChange={(event) => setNewEmail(event.target.value)}
                        placeholder="Email moi"
                      />
                      <input
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                        type="password"
                        value={emailPassword}
                        onChange={(event) => setEmailPassword(event.target.value)}
                        placeholder="Mat khau hien tai"
                      />
                      <div className="md:col-span-2 flex justify-end">
                        <button
                          onClick={handleChangeEmail}
                          disabled={savingEmail}
                          className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                        >
                          {savingEmail ? "Dang luu..." : "Xac nhan"}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    placeholder="Mat khau hien tai"
                  />
                  <input
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="Mat khau moi"
                  />
                  <input
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Nhap lai mat khau moi"
                  />
                </div>
                <div className="flex justify-start">
                  <button
                    onClick={handleChangePassword}
                    disabled={savingPassword}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70 disabled:opacity-60"
                  >
                    {savingPassword ? "Dang cap nhat..." : "Cap nhat mat khau"}
                  </button>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[var(--panel)] p-4 sm:p-6">
              <h3 className="text-sm font-semibold">Cài đặt Thông báo</h3>
              <div className="mt-4 space-y-3">
                <label className="flex items-center justify-between text-sm text-white/70">
                  Phim mới ra mắt
                  <input
                    type="checkbox"
                    checked={notifyNewMovies}
                    onChange={(event) => setNotifyNewMovies(event.target.checked)}
                    className="h-5 w-10 accent-[var(--accent)]"
                  />
                </label>
                <label className="flex items-center justify-between text-sm text-white/70">
                  Cập nhật tập mới
                  <input
                    type="checkbox"
                    checked={notifyNewEpisodes}
                    onChange={(event) => setNotifyNewEpisodes(event.target.checked)}
                    className="h-5 w-10 accent-[var(--accent)]"
                  />
                </label>
                <label className="flex items-center justify-between text-sm text-white/70">
                  Email Marketing
                  <input
                    type="checkbox"
                    checked={marketingEmails}
                    onChange={(event) => setMarketingEmails(event.target.checked)}
                    className="h-5 w-10 accent-[var(--accent)]"
                  />
                </label>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {savingSettings ? "Dang luu..." : "Luu thay doi"}
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[var(--panel)] p-4 sm:p-6">
              <h3 className="text-sm font-semibold">Thiết bị đã đăng nhập</h3>
              <div className="mt-4 space-y-3">
                {devices.length === 0 ? (
                  <p className="text-xs text-white/50">Chưa có thiết bị.</p>
                ) : (
                  devices.map((device) => (
                    <div
                      key={device.id}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/70"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {renderDeviceLabel(device)}
                        </p>
                        <p className="text-[11px] text-white/50">
                          {device.ip_address || "Unknown IP"} · {new Date(
                            device.last_seen_at
                          ).toLocaleString()}
                        </p>
                      </div>
                      <span className="text-[11px] text-white/40">Active</span>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleLogoutAll}
                  className="rounded-full border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs text-red-200"
                >
                  Đăng xuất Khỏi tất cả các thiết bị
                </button>
              </div>
            </section>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}


