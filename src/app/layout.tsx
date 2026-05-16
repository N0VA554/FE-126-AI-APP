// src/app/layout.tsx
import type { Metadata } from "next"; // Import type Metadata
import { AuthProvider } from "@/src/context/AuthContext";
import "./globals.css";

// Cấu hình Metadata tại đây
export const metadata: Metadata = {
  title: "University EWS | AI & Data Training Portal", // Tên hiển thị trên tab trình duyệt
  description: "Hệ thống hỗ trợ đào tạo AI và Dữ liệu tại các trường Đại học",
  icons: {
    icon: "/ue.ico", // Đường dẫn đến favicon của bạn trong thư mục public
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}