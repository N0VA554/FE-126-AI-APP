"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./index.module.css"; // Sử dụng file CSS chung phong cách cũ
import {
  Activity,
  DollarSign,
  FileText,
  Globe,
  Loader2,
  RefreshCw,
  Search,
  Target,
  Users,
  X,
} from "lucide-react";

// --- Types giữ nguyên từ code của bạn ---
type DashboardKpis = {
  logs_count: number;
  avg_latency_ms: number | null;
  avg_cost_usd: number | null;
  avg_total_tokens: number | null;
  avg_faithfulness_score: number | null;
  avg_context_precision_score: number | null;
  avg_context_recall_score: number | null;
  avg_relevance_score: number | null;
  resolution_rate: number | null;
  escalation_rate: number | null;
  p95_latency_ms: number | null;
  p95_cost_usd: number | null;
};

type DashboardTrendPoint = {
  date: string;
  avg_latency_ms: number | null;
  avg_cost_usd: number | null;
  log_count: number;
  unique_users: number;
};

type DashboardMetrics = {
  range: { from: string; to: string };
  kpis: DashboardKpis;
  trends: DashboardTrendPoint[];
};

type StudentLogStat = {
  student_id: string;
  logs_count: number;
  avg_latency_ms: number | null;
  avg_cost_usd: number | null;
  last_log_at: string | null;
};

type StudentLogDetail = {
  log_id: number;
  student_id: string;
  created_at: string | null;
  latency_ms: number | null;
  total_tokens: number | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  cost_usd: number | null;
  faithfulness_score: number | null;
  relevance_score: number | null;
  context_precision_score: number | null;
  context_recall_score: number | null;
  is_resolved: number | null;
  is_escalated: number | null;
  retrieved_context: unknown;
};

// --- Helpers ---
const formatNumber = (v: number | null | undefined) => v?.toLocaleString() ?? "—";
const formatUsd = (v: number | null | undefined) => (v ? `$${v.toFixed(4)}` : "—");
const formatPct = (v: number | null | undefined) => (v ? `${(v * 100).toFixed(1)}%` : "—");

function toPolylinePoints(values: number[], width: number, height: number): string {
  if (values.length === 0) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values
    .map((v, i) => {
      const x = (i / Math.max(1, values.length - 1)) * width;
      const y = height - ((v - min) / span) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

export default function AdminMetricsDashboard() {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [logsOpen, setLogsOpen] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [studentStats, setStudentStats] = useState<StudentLogStat[]>([]);
  const [studentQuery, setStudentQuery] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [studentLogs, setStudentLogs] = useState<StudentLogDetail[]>([]);

  // Endpoint: NEXT_PUBLIC_API_URL + path
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1/";
  const DASHBOARD_URL = `${API_BASE}admin/metrics/dashboard`;
  const STATS_URL = `${API_BASE}student/admin/chatbot/logs/stats`;

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      try {
        const token = localStorage.getItem("auth_token");
        const res = await fetch(DASHBOARD_URL, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const result = await res.json();
        if (!cancelled && result.success) setData(result.data);
      } catch (e) {
        if (!cancelled) setError("Không thể kết nối đến máy chủ Metrics.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [DASHBOARD_URL]);

  async function fetchStudentStats(nextQuery?: string) {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const token = localStorage.getItem("auth_token");
      const q = (nextQuery ?? studentQuery).trim();
      const url = new URL(STATS_URL);
      url.searchParams.set("last_days", "30");
      url.searchParams.set("limit", "200");
      if (q) url.searchParams.set("q", q);

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const result = await res.json();
      if (!result?.success) throw new Error(result?.error || "Fetch stats failed");
      const students: StudentLogStat[] = result?.data?.students || [];
      setStudentStats(students);
      if (!selectedStudentId && students.length > 0) setSelectedStudentId(students[0].student_id);
    } catch (e) {
      setStatsError("Không thể lấy thống kê logs theo sinh viên.");
    } finally {
      setStatsLoading(false);
    }
  }

  async function fetchStudentLogs(studentId: string) {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const token = localStorage.getItem("auth_token");
      const url = new URL(`${API_BASE}student/admin/chatbot/logs/${encodeURIComponent(studentId)}`);
      url.searchParams.set("last_days", "30");
      url.searchParams.set("limit", "80");
      url.searchParams.set("offset", "0");

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const result = await res.json();
      if (!result?.success) throw new Error(result?.error || "Fetch details failed");
      const logs: StudentLogDetail[] = result?.data?.logs || [];
      setStudentLogs(logs);
    } catch (e) {
      setDetailError("Không thể lấy chi tiết logs của sinh viên.");
      setStudentLogs([]);
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    if (!logsOpen) return;
    fetchStudentStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logsOpen]);

  useEffect(() => {
    if (!logsOpen) return;
    if (!selectedStudentId) return;
    fetchStudentLogs(selectedStudentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logsOpen, selectedStudentId]);

  // Logic Chart SVG
  const chartParams = useMemo(() => {
    if (!data) return null;
    const w = 900,
      h = 200;
    return {
      w,
      h,
      latency: toPolylinePoints(
        data.trends.map((p) => p.avg_latency_ms ?? 0),
        w,
        h,
      ),
      cost: toPolylinePoints(
        data.trends.map((p) => p.avg_cost_usd ?? 0),
        w,
        h,
      ),
      users: toPolylinePoints(
        data.trends.map((p) => p.unique_users ?? 0),
        w,
        h,
      ),
    };
  }, [data]);

  if (loading)
    return (
      <div style={{ display: "flex", height: "60vh", alignItems: "center", justifyContent: "center" }}>
        <Loader2 className="animate-spin" size={32} color="#003366" />
      </div>
    );

  return (
    <div className={styles.container}>
      {/* 1. HERO SECTION */}
      <section className={styles.hero}>
        <div>
          <h2 className={styles.heroTitle}>AI Evaluation Metrics</h2>
          <p className={styles.heroSubtitle}>Giám sát hiệu năng mô hình, chi phí và độ chính xác của AI Advisor.</p>
        </div>
        <div className={styles.heroRight}>
          <div className={styles.weekPill}>
            <Globe size={14} style={{ marginRight: 6 }} /> {data?.range.from} → {data?.range.to}
          </div>
          <p className={styles.refreshHint}>Live Monitoring</p>
        </div>
      </section>

      {/* 2. STATS KPI GRID - 4 Thẻ chính phong cách cũ */}
      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>North Star (Resolution)</p>
          <p className={styles.statValue}>{formatPct(data?.kpis.resolution_rate)}</p>
          <p className={styles.statFoot}>
            <Target size={12} /> Tỷ lệ giải quyết thành công
          </p>
        </div>

        <div className={styles.statCard}>
          <p className={styles.statLabel}>Avg Latency</p>
          <p className={styles.statValue}>
            {formatNumber(data?.kpis.avg_latency_ms)} <span style={{ fontSize: "1rem" }}>ms</span>
          </p>
          <p className={styles.statFoot}>
            <Activity size={12} /> P95: {data?.kpis.p95_latency_ms}ms
          </p>
        </div>

        <div className={styles.statCard}>
          <p className={styles.statLabel}>Cost / Request</p>
          <p className={styles.statValue} style={{ color: "#c5a25d" }}>
            {formatUsd(data?.kpis.avg_cost_usd)}
          </p>
          <p className={styles.statFoot}>
            <DollarSign size={12} /> P95 Cost: {formatUsd(data?.kpis.p95_cost_usd)}
          </p>
        </div>

        <div
          className={`${styles.statCard} ${data?.kpis.escalation_rate && data.kpis.escalation_rate > 0.1 ? styles.statCardRed : ""}`}
        >
          <p className={styles.statLabel}>Escalation Rate</p>
          <p className={styles.statValue}>{formatPct(data?.kpis.escalation_rate)}</p>
          <p className={styles.statFoot}>
            <Users size={12} /> Chuyển tiếp cố vấn người
          </p>
        </div>
      </section>

      {/* 3. EVALUATION SCORES & TRENDS */}
      <div className={styles.insightsGrid}>
        {/* Bảng điểm chi tiết AI */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3>Chỉ số chất lượng RAG</h3>
            <span className={styles.panelTag}>Ragas Scores</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "0.5rem" }}>
            <MetricMini label="Faithfulness" val={formatPct(data?.kpis.avg_faithfulness_score)} />
            <MetricMini label="Relevance" val={data?.kpis.avg_relevance_score?.toFixed(3) || "—"} />
            <MetricMini label="Context Precision" val={formatPct(data?.kpis.avg_context_precision_score)} />
            <MetricMini label="Context Recall" val={formatPct(data?.kpis.avg_context_recall_score)} />
          </div>
        </div>

        {/* Biểu đồ xu hướng */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3>7-day Analytics Trend</h3>
            <div style={{ display: "flex", gap: 10 }}>
              <span style={{ fontSize: "0.7rem", color: "#003366", fontWeight: 800 }}>● Latency</span>
              <span style={{ fontSize: "0.7rem", color: "#c5a25d", fontWeight: 800 }}>● Cost</span>
            </div>
          </div>

          <div style={{ padding: "10px 0" }}>
            {chartParams && (
              <svg viewBox={`0 0 ${chartParams.w} ${chartParams.h}`} style={{ width: "100%", height: "140px" }}>
                {/* Latency Line */}
                <polyline points={chartParams.latency} fill="none" stroke="#003366" strokeWidth="3" strokeLinecap="round" />
                {/* Cost Line */}
                <polyline points={chartParams.cost} fill="none" stroke="#c5a25d" strokeWidth="3" strokeDasharray="5,5" />
              </svg>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
              {data?.trends.map((t, i) => (
                <span key={i} style={{ fontSize: "0.65rem", color: "#888", fontWeight: 700 }}>
                  {t.date.split("-").slice(1).join("/")}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. LOG SUMMARY PANEL */}
      <div className={styles.tableWrapper} style={{ marginTop: "1.5rem" }}>
        <div className={styles.tableHeader}>
          <h3 className={styles.tableTitle}>Hàng đợi xử lý hệ thống</h3>
        </div>
        <div style={{ padding: "1.5rem", display: "flex", gap: "2rem" }}>
          <div>
            <small className={styles.statLabel}>Tổng yêu cầu</small>
            <p style={{ fontSize: "1.5rem", fontWeight: 700 }}>{formatNumber(data?.kpis.logs_count)}</p>
          </div>
          <div style={{ borderLeft: "1px solid #eef1f7", paddingLeft: "2rem" }}>
            <small className={styles.statLabel}>Người dùng duy nhất</small>
            <p style={{ fontSize: "1.5rem", fontWeight: 700 }}>{formatNumber(data?.trends.reduce((sum, p) => sum + p.unique_users, 0))}</p>
          </div>
          <div style={{ flex: 1, textAlign: "right" }}>
            <button className={styles.primaryBtn} onClick={() => setLogsOpen(true)}>
              <FileText size={16} style={{ marginRight: 8 }} /> Xem chi tiết Logs
            </button>
          </div>
        </div>
      </div>

      {logsOpen && (
        <div className={styles.modalBackdrop} onMouseDown={() => setLogsOpen(false)}>
          <div className={styles.modalCard} onMouseDown={(e) => e.stopPropagation()} style={{ maxWidth: 980 }}>
            <div
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid #eef1f7",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#0b1a2b" }}>Chatbot Logs theo sinh viên</h3>
                <p style={{ margin: "0.35rem 0 0", fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>
                  Thống kê + xem chi tiết logs chatbot
                </p>
              </div>
              <button className={styles.secondaryBtn} onClick={() => setLogsOpen(false)}>
                <X size={16} /> Đóng
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", minHeight: 520 }}>
              {/* Left: student list */}
              <div style={{ borderRight: "1px solid #eef1f7", padding: "1rem" }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1, position: "relative" }}>
                    <Search size={16} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                    <input
                      value={studentQuery}
                      onChange={(e) => setStudentQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") fetchStudentStats(e.currentTarget.value);
                      }}
                      placeholder="Tìm theo mã SV (vd: SV001)"
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.75rem 0.65rem 2.25rem",
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        outline: "none",
                      }}
                    />
                  </div>
                  <button className={styles.secondaryBtn} onClick={() => fetchStudentStats()} disabled={statsLoading}>
                    <RefreshCw size={16} /> Làm mới
                  </button>
                </div>

                {statsError && (
                  <div style={{ marginTop: 10, color: "#b91c1c", fontWeight: 700, fontSize: "0.85rem" }}>{statsError}</div>
                )}

                <div style={{ marginTop: 12, maxHeight: 420, overflow: "auto" }}>
                  {statsLoading ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0.75rem", color: "#64748b", fontWeight: 700 }}>
                      <Loader2 className="animate-spin" size={16} /> Đang tải danh sách…
                    </div>
                  ) : studentStats.length === 0 ? (
                    <div style={{ padding: "0.75rem", color: "#64748b", fontWeight: 700 }}>Không có dữ liệu.</div>
                  ) : (
                    studentStats.map((s) => {
                      const active = selectedStudentId === s.student_id;
                      return (
                        <button
                          key={s.student_id}
                          onClick={() => setSelectedStudentId(s.student_id)}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            border: "1px solid " + (active ? "rgba(0,51,102,0.35)" : "#eef1f7"),
                            background: active ? "rgba(0,51,102,0.06)" : "white",
                            borderRadius: 14,
                            padding: "0.75rem",
                            marginBottom: 10,
                            cursor: "pointer",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                            <span style={{ fontWeight: 900, color: "#0b1a2b" }}>{s.student_id}</span>
                            <span style={{ fontWeight: 900, color: "#003366" }}>{formatNumber(s.logs_count)} logs</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 6 }}>
                            <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 700 }}>Avg latency: {formatNumber(s.avg_latency_ms)}</span>
                            <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 700 }}>Avg cost: {formatUsd(s.avg_cost_usd)}</span>
                          </div>
                          {s.last_log_at && (
                            <div style={{ marginTop: 6, fontSize: "0.75rem", color: "#94a3b8", fontWeight: 800 }}>
                              Last: {s.last_log_at.replace("T", " ").replace("Z", "")}
                            </div>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right: details */}
              <div style={{ padding: "1rem 1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 900, color: "#0b1a2b" }}>Chi tiết logs: {selectedStudentId || "—"}</h4>
                  {detailLoading && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#64748b", fontWeight: 800, fontSize: "0.85rem" }}>
                      <Loader2 className="animate-spin" size={16} /> Đang tải…
                    </span>
                  )}
                </div>

                {detailError && (
                  <div style={{ marginTop: 10, color: "#b91c1c", fontWeight: 700, fontSize: "0.85rem" }}>{detailError}</div>
                )}

                <div style={{ marginTop: 12, maxHeight: 450, overflow: "auto" }}>
                  {studentLogs.length === 0 && !detailLoading ? (
                    <div style={{ padding: "0.75rem", color: "#64748b", fontWeight: 700 }}>Không có logs.</div>
                  ) : (
                    studentLogs.map((l) => (
                      <div
                        key={l.log_id}
                        style={{
                          border: "1px solid #eef1f7",
                          borderRadius: 16,
                          padding: "0.85rem 0.95rem",
                          marginBottom: 10,
                          background: "white",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                          <span style={{ fontWeight: 900, color: "#0b1a2b" }}>#{l.log_id}</span>
                          <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#64748b" }}>
                            {l.created_at ? l.created_at.replace("T", " ").replace("Z", "") : "—"}
                          </span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 8 }}>
                          <StatChip label="Latency" value={l.latency_ms != null ? `${formatNumber(l.latency_ms)} ms` : "—"} />
                          <StatChip label="Cost" value={formatUsd(l.cost_usd)} />
                          <StatChip label="Tokens" value={l.total_tokens != null ? formatNumber(l.total_tokens) : "—"} />
                          <StatChip label="Resolved" value={l.is_resolved == null ? "—" : l.is_resolved ? "Yes" : "No"} />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 10 }}>
                          <StatChip label="Faith" value={l.faithfulness_score == null ? "—" : l.faithfulness_score.toFixed(3)} />
                          <StatChip label="Rel" value={l.relevance_score == null ? "—" : l.relevance_score.toFixed(3)} />
                          <StatChip label="Ctx Prec" value={l.context_precision_score == null ? "—" : l.context_precision_score.toFixed(3)} />
                          <StatChip label="Ctx Recall" value={l.context_recall_score == null ? "—" : l.context_recall_score.toFixed(3)} />
                        </div>
                        <details style={{ marginTop: 10 }}>
                          <summary style={{ cursor: "pointer", fontWeight: 900, color: "#003366", fontSize: "0.85rem" }}>Xem retrieved_context</summary>
                          <pre
                            style={{
                              marginTop: 8,
                              background: "#0b1a2b",
                              color: "white",
                              padding: 12,
                              borderRadius: 12,
                              fontSize: "0.75rem",
                              overflow: "auto",
                            }}
                          >
                            {JSON.stringify(l.retrieved_context, null, 2)}
                          </pre>
                        </details>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div style={{ padding: "0.75rem 1rem", border: "1px solid #fee2e2", background: "#fff1f2", borderRadius: 14, color: "#b91c1c", fontWeight: 800 }}>
          {error}
        </div>
      )}
    </div>
  );
}

// Sub-component nhỏ cho grid điểm số
function MetricMini({ label, val }: { label: string; val: string }) {
  return (
    <div style={{ padding: "0.75rem", background: "#f8fafc", borderRadius: "12px", border: "1px solid #eef1f7" }}>
      <p style={{ fontSize: "0.65rem", fontWeight: 800, color: "#888", textTransform: "uppercase" }}>{label}</p>
      <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0b1a2b", marginTop: "2px" }}>{val}</p>
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: "0.55rem 0.65rem", background: "#f8fafc", borderRadius: 12, border: "1px solid #eef1f7" }}>
      <div style={{ fontSize: "0.65rem", fontWeight: 900, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
      <div style={{ marginTop: 2, fontSize: "0.88rem", fontWeight: 900, color: "#0b1a2b" }}>{value}</div>
    </div>
  );
}

