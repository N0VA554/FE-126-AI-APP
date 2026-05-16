"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { PUBLIC_API_BASE_URL } from "@/src/lib/api/config";

interface Notification {
  notification_id: number;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  type: string;
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);

  const getAuthToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

  const markAllRead = async () => {
    try {
      await fetch(`${PUBLIC_API_BASE_URL}notifications/read-all`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnread(0);
    } catch (error) {
      console.error("Lỗi khi đánh dấu đọc tất cả:", error);
    }
  };

  const markOneRead = async (id: number) => {
    try {
      await fetch(`${PUBLIC_API_BASE_URL}notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      setItems((prev) =>
        prev.map((n) => (n.notification_id === id ? { ...n, is_read: true } : n))
      );
      setUnread((u) => Math.max(0, u - 1));
    } catch (error) {
      console.error("Lỗi khi đánh dấu đọc thông báo:", error);
    }
  };

  // TỐI ƯU: Sử dụng AbortController bên trong useEffect để quản lý vòng đời API
  useEffect(() => {
    const controller = new AbortController();
    let isCurrent = true;

    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${PUBLIC_API_BASE_URL}notifications?limit=50&offset=0`, {
          signal: controller.signal, // Gắn signal để có thể hủy request khi unmount
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        });
        const json = await res.json();
        
        if (json.success && isCurrent) {
          setItems(json.data.notifications || []);
          setUnread(json.data.unread || 0);
        }
      } catch (error: any) {
        // Bỏ qua log lỗi nếu request chủ động bị hủy bởi AbortController
        if (error.name !== "AbortError") {
          console.error("Lỗi khi tải thông báo:", error);
        }
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    };

    fetchNotifications();

    // Hàm cleanup thực thi khi component bị unmount hoặc re-render
    return () => {
      isCurrent = false;
      controller.abort(); // Hủy ngay lập tức request cũ nếu có request mới đè lên
    };
  }, []);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Bell size={24} color="#003366" />
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#003366" }}>Thông báo</h1>
          {unread > 0 && (
            <span style={{
              background: "#ef4444", color: "#fff", borderRadius: "999px",
              fontSize: "12px", fontWeight: 700, padding: "2px 10px",
            }}>{unread} chưa đọc</span>
          )}
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: "#f1f5f9", border: "none", borderRadius: "8px",
              padding: "8px 14px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600,
            }}
          >
            <CheckCheck size={16} /> Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: "0 auto 8px" }} />
          <p>Đang tải thông báo...</p>
        </div>
      ) : items.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "4rem 2rem",
          background: "#f8fafc", borderRadius: "1rem", color: "#94a3b8",
        }}>
          <Bell size={48} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
          <p style={{ fontSize: "1rem" }}>Chưa có thông báo nào</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {items.map((n) => (
            <div
              key={n.notification_id}
              onClick={() => !n.is_read && markOneRead(n.notification_id)}
              style={{
                background: n.is_read ? "#fff" : "#eff6ff",
                border: `1px solid ${n.is_read ? "#e2e8f0" : "#bfdbfe"}`,
                borderRadius: "12px", padding: "1rem 1.25rem",
                cursor: n.is_read ? "default" : "pointer",
                transition: "background 0.2s",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{
                  fontWeight: n.is_read ? 500 : 700,
                  fontSize: "0.95rem",
                  color: "#1e293b",
                  flex: 1,
                }}>{n.title}</span>
                {!n.is_read && (
                  <span style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: "#3b82f6", flexShrink: 0, marginTop: 4, marginLeft: 8,
                  }} />
                )}
              </div>
              <p style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.4rem", lineHeight: 1.6 }}>
                {n.body}
              </p>
              <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.5rem" }}>
                {new Date(n.created_at).toLocaleString("vi-VN")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}