"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  Calendar,
  CalendarCheck2,
  CalendarClock,
  FileText,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  LogOut,
  MessageSquare,
  SlidersHorizontal,
  Users,
} from "lucide-react";

import { useAuth } from "@/src/context/AuthContext";
import { PUBLIC_API_BASE_URL } from "@/src/lib/api/config";
import styles from "./DashboardLayout.module.css";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isReady } = useAuth();
  const [unread, setUnread] = useState(0);
  const pathname = usePathname();
  const router = useRouter();

  // Prevent hydration mismatch: don't render user-dependent UI until auth state is loaded.
  const displayUser = isReady ? user : null;

  const primaryPath =
    displayUser?.role === "ADMIN"
      ? "/admin"
      : displayUser?.role === "LECTURER"
        ? "/lecturer"
        : "/student";

  const items =
    displayUser?.role === "ADMIN"
      ? [
          { href: "/admin", label: "Tổng quan", Icon: LayoutDashboard },
          { href: "/admin/metrics", label: "AI Metrics", Icon: SlidersHorizontal },
        ]
      : displayUser?.role === "LECTURER"
        ? [
            { href: "/lecturer", label: "Tổng quan", Icon: LayoutDashboard },
            { href: "/lecturer/schedule", label: "Lịch giảng dạy", Icon: CalendarCheck2 },
            { href: "/lecturer/classes", label: "Lớp học của tôi", Icon: Users },
          ]
        : [
            { href: "/student", label: "Tổng quan", Icon: LayoutDashboard },
            { href: "/student/calendar", label: "Thời khóa biểu", Icon: Calendar },
            { href: "/student/exams", label: "Lịch thi", Icon: CalendarClock },
            { href: "/student/grades", label: "Điểm số", Icon: GraduationCap },
            { href: "/student/leave", label: "Nghỉ phép", Icon: FileText },
            { href: "/student/plan", label: "Kế hoạch đăng ký", Icon: ListChecks },
            { href: "/student/chatbot", label: "AI Assistant", Icon: MessageSquare },
            { href: "/student/notifications", label: "Thông báo", Icon: Bell, badge: unread },
            { href: "/student/profile", label: "Hồ sơ cá nhân", Icon: Users },
          ];

  // Fetch unread count
  useEffect(() => {
    if (!isReady || !user) return;
    const token = localStorage.getItem("auth_token");
    fetch(`${PUBLIC_API_BASE_URL}notifications/unread-count`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => { if (json.success) setUnread(json.data?.unread ?? 0); })
      .catch(() => {});
  }, [isReady, user]);

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.logoSection}>
          <div className={styles.brand}>University EWS</div>
          <p className={styles.subBrand}>Early Warning System</p>
        </div>

        <div className={styles.userCard}>
          <div className={styles.userCardTop}>
            <div className={styles.userAvatar}>
              {user?.full_name?.charAt(0) || "U"}
            </div>
            <div className={styles.userMeta}>
              <div className={styles.userFullName}>
                {displayUser?.full_name || "Người dùng"}
              </div>
              <div className={styles.userEmail}>{displayUser?.email || ""}</div>
            </div>
          </div>
          <div className={styles.rolePill}>{displayUser?.role || "GUEST"}</div>
        </div>

        <nav className={styles.nav}>
          {items.map((it) => {
            const active =
              pathname === it.href ||
              (it.href !== primaryPath && pathname.startsWith(it.href));
            const Icon = it.Icon;
            const badge = (it as any).badge;
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
              >
                <span style={{ position: "relative", display: "inline-flex" }}>
                  <Icon className={styles.navIcon} size={18} />
                  {badge > 0 && (
                    <span style={{
                      position: "absolute", top: -6, right: -8,
                      background: "#ef4444", color: "#fff",
                      borderRadius: "999px", fontSize: "10px",
                      fontWeight: 700, minWidth: 16, height: 16,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      padding: "0 3px",
                    }}>{badge > 99 ? "99+" : badge}</span>
                  )}
                </span>
                <span>{it.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.logoutSection}>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <LogOut className={styles.btnIcon} size={18} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.pageContent}>{children}</div>
      </main>
    </div>
  );
}

