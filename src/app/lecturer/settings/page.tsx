"use client";

export default function LecturerSettingsPage() {
  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0b1a2b" }}>
        Cấu hình ngưỡng cảnh báo
      </h2>
      <p style={{ marginTop: 6, color: "rgba(11, 26, 43, 0.65)" }}>
        Demo cấu hình — sẽ lưu bằng API sau.
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
          gap: 14,
        }}
      >
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ fontWeight: 700, color: "#0b1a2b" }}>
            Ngưỡng RED (Risk Score)
          </div>
          <div style={{ color: "rgba(11, 26, 43, 0.65)" }}>&ge; 70</div>
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ fontWeight: 700, color: "#0b1a2b" }}>
            Ngưỡng YELLOW (Risk Score)
          </div>
          <div style={{ color: "rgba(11, 26, 43, 0.65)" }}>40 – 69</div>
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ fontWeight: 700, color: "#0b1a2b" }}>
            Vắng mặt cảnh báo
          </div>
          <div style={{ color: "rgba(11, 26, 43, 0.65)" }}>
            &ge; 20% trong 2 tuần
          </div>
        </div>
      </div>
    </div>
  );
}

