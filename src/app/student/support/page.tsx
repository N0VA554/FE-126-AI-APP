"use client";

export default function StudentSupportPage() {
  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0b1a2b" }}>
        Hỗ trợ
      </h2>
      <p style={{ marginTop: 6, color: "rgba(11, 26, 43, 0.65)" }}>
        Demo kênh hỗ trợ — sẽ thay bằng API/Chat sau.
      </p>

      <div
        style={{
          marginTop: 16,
          background: "white",
          borderRadius: 22,
          border: "1px solid #eef1f7",
          boxShadow: "0 10px 20px rgba(0,0,0,0.03)",
          padding: 18,
          display: "grid",
          gap: 10,
        }}
      >
        <div style={{ fontWeight: 700, color: "#0b1a2b" }}>
          Gợi ý: đặt lịch với Tutor
        </div>
        <div style={{ color: "rgba(11, 26, 43, 0.65)" }}>
          - Thời lượng: 30 phút
          <br />- Chủ đề: Lab/Quiz/Ôn tập
          <br />- Khung giờ: 19:00 – 21:00
        </div>
        <button
          style={{
            marginTop: 6,
            justifySelf: "flex-start",
            background: "#003366",
            border: "1px solid rgba(0,51,102,0.25)",
            color: "white",
            borderRadius: 14,
            padding: "10px 14px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Tạo yêu cầu hỗ trợ
        </button>
      </div>
    </div>
  );
}

