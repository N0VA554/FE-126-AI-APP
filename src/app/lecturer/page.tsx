"use client";

import styles from "./index.module.css";
import { useEffect, useMemo, useState } from "react";
import { 
  Users, AlertCircle, Zap, ShieldCheck, 
  Send, ChevronDown, ChevronUp, Loader2, 
  BarChart3, Mail, CheckCircle2, AlertTriangle,
  LayoutDashboard, FileText, History
} from "lucide-react";
import {
  fetchAdvisorClasses,
  fetchAdvisorDashboard,
  fetchClassStudents,
  fetchDashboardSummary,
  fetchAlerts,
  sendBatchRecommendations,
  type AdvisorClass,
  type AdvisorDashboard,
  type DashboardSummary,
  type AlertStudent,
  type ClassStudent,
  type BatchRecommendResult,
} from "@/src/lib/api/ews";

const DEFAULT_TEMPLATE =
  "Chào {student_name}, cố vấn lớp hành chính {class_name} ghi nhận bạn đang ở mức {risk_level}. Các học phần/điểm cần chú ý: {courses}. Vui lòng phản hồi kế hoạch học tập trong tuần này.";

export default function LecturerPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [alerts, setAlerts] = useState<AlertStudent[]>([]);
  const [advisor, setAdvisor] = useState<AdvisorDashboard | null>(null);
  const [classes, setClasses] = useState<AdvisorClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [classStudents, setClassStudents] = useState<ClassStudent[]>([]);
  
  // States cho tính năng mở rộng dòng (Dropdown chi tiết)
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchResult, setBatchResult] = useState<BatchRecommendResult | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchDashboardSummary(),
      fetchAlerts("all"),
      fetchAdvisorDashboard(),
      fetchAdvisorClasses(),
    ])
      .then(([summaryData, alertData, dashboardData, classData]) => {
        setSummary(summaryData);
        setAlerts(alertData);
        setAdvisor(dashboardData);
        setClasses(classData);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedClassId) return;
    fetchClassStudents(selectedClassId)
      .then(setClassStudents)
      .catch(() => setClassStudents([]));
  }, [selectedClassId]);

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    setBatchResult(null);
    setClassStudents([]);
    setExpandedStudentId(null); // Reset expansion khi đổi lớp
  };

  const selectedClass = classes.find((c) => c.class_id === selectedClassId) || null;
  const displayedStudents = selectedClassId ? classStudents : alerts;
  const atRiskInSelectedClass = classStudents.filter((s) => ["warning", "danger"].includes(s.level));
  
  const stat = summary ?? {
    total: 0, danger: 0, warning: 0, safe: 0,
    danger_pct: 0, warning_pct: 0, safe_pct: 0, data_source: ""
  };

  // Toggle dropdown chi tiết sinh viên
  const toggleStudentDetail = (id: string) => {
    setExpandedStudentId(expandedStudentId === id ? null : id);
  };

  const previewText = useMemo(() => {
    const sample = atRiskInSelectedClass[0];
    if (!sample) return template;
    return template
      .replaceAll("{student_name}", sample.name)
      .replaceAll("{student_code}", sample.student_code)
      .replaceAll("{class_name}", sample.class_name || "N/A")
      .replaceAll("{risk_level}", sample.level_label)
      .replaceAll("{risk_score}", String(sample.risk_score))
      .replaceAll("{courses}", "các học phần có điểm D/F")
      .replaceAll("{warnings}", sample.warnings?.join("; ") || "");
  }, [atRiskInSelectedClass, template]);

  const handleBatchSend = async () => {
    if (!selectedClassId || batchLoading) return;
    setBatchLoading(true);
    try {
      const result = await sendBatchRecommendations(selectedClassId, template);
      setBatchResult(result);
      setShowBatchModal(false);
    } finally {
      setBatchLoading(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', height: '80vh', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 className="animate-spin" size={32} color="#003366" />
    </div>
  );

  return (
    <div className={styles.container}>
      {/* 1. HERO SECTION */}
      <section className={styles.hero}>
        <div>
          <h2 className={styles.heroTitle}>Dashboard Cố vấn học tập</h2>
          <p className={styles.heroSubtitle}>
            Hệ thống quản lý cohort rủi ro & Can thiệp sớm (Tuần 6 • 2026)
          </p>
        </div>
        <div className={styles.heroRight}>
          <div className={styles.weekPill}><History size={14} style={{marginRight: 6}}/> Nhật ký can thiệp</div>
        </div>
      </section>

      {/* 2. STATS KPI GRID */}
      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Tổng sinh viên</p>
          <p className={styles.statValue}>{stat.total}</p>
          <p className={styles.statFoot}>Cohort quản lý</p>
        </div>
        <div className={`${styles.statCard} ${styles.statCardRed}`}>
          <p className={styles.statLabel}>Nguy cơ cao</p>
          <p className={styles.statValue}>{stat.danger}</p>
          <p className={styles.statFoot}>{stat.danger_pct}% — Cần can thiệp ngay</p>
        </div>
        <div className={`${styles.statCard} ${styles.statCardGold}`}>
          <p className={styles.statLabel}>Cảnh báo vàng</p>
          <p className={styles.statValue}>{stat.warning}</p>
          <p className={styles.statFoot}>{stat.warning_pct}% — Theo dõi 7 ngày</p>
        </div>
        <div className={`${styles.statCard} ${styles.statCardGreen}`}>
          <p className={styles.statLabel}>Ổn định</p>
          <p className={styles.statValue}>{stat.safe}</p>
          <p className={styles.statFoot}>{stat.safe_pct}% — Đang duy trì tốt</p>
        </div>
      </section>

      {/* 3. INSIGHTS & RISK DISTRIBUTION */}
      <div className={styles.insightsGrid}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3>Insight can thiệp AI</h3>
            <span className={styles.panelTag}>AI Suggested</span>
          </div>
          <ul className={styles.insightList}>
            {stat.danger > 0 && (
              <li><span className={styles.dotRed} /> <strong>{stat.danger} sinh viên</strong> mức Đỏ chưa được gửi Recommendation kỳ này.</li>
            )}
            <li><span className={styles.dotGold} /> SLA phản hồi Tier 3 hiện tại: <strong>{advisor?.governance.response_time_sla_by_tier.tier_3_critical.sla_hours}h</strong>.</li>
            <li><span className={styles.dotBlue} /> <strong>{advisor?.student_feedback_action_queue.length} phản hồi</strong> mới từ sinh viên cần xử lý.</li>
          </ul>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3>Phân bổ rủi ro cohort</h3>
          </div>
          <div className={styles.riskBars}>
            {[
              { label: "Nguy cơ", pct: stat.danger_pct, cls: styles.riskFillRed, val: stat.danger },
              { label: "Cảnh báo", pct: stat.warning_pct, cls: styles.riskFillGold, val: stat.warning },
              { label: "An toàn", pct: stat.safe_pct, cls: styles.riskFillGreen, val: stat.safe },
            ].map((risk) => (
              <div key={risk.label} className={styles.riskRow}>
                <div className={styles.riskLabel}>{risk.label}</div>
                <div className={styles.riskTrack}>
                  <div className={risk.cls} style={{ width: `${Math.max(risk.pct, 2)}%` }} />
                </div>
                <div className={styles.riskValue}>{risk.val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. CLASS SELECTION & BATCH ACTION */}
      <section className={styles.classActionPanel}>
        <div>
          <h3 className={styles.tableTitle}>Bộ lọc Cohort / Lớp hành chính</h3>
          <p className={styles.tableSubtitle}>
            {selectedClass 
              ? `${selectedClass.class_name}: ${selectedClass.student_count} sinh viên, ${selectedClass.at_risk_count} cần hỗ trợ` 
              : "Chọn một lớp để thực hiện can thiệp hàng loạt."}
          </p>
        </div>
        <div className={styles.classControls}>
          <select 
            className={styles.classSelect}
            value={selectedClassId}
            onChange={(e) => handleClassChange(e.target.value)}
          >
            <option value="">Tất cả lớp học / Toàn bộ cảnh báo</option>
            {classes.map(c => (
              <option key={c.class_id} value={c.class_id}>
                {c.class_name} ({c.at_risk_count} At-risk)
              </option>
            ))}
          </select>
          <button 
            className={styles.primaryBtn}
            disabled={!selectedClassId || atRiskInSelectedClass.length === 0}
            onClick={() => setShowBatchModal(true)}
          >
            <Send size={16} style={{marginRight: 8}}/> Gửi Recommendation Batch
          </button>
        </div>
      </section>

      {/* 5. MAIN ROSTER TABLE WITH EXPANSION */}
      <div className={styles.tableWrapper}>
        <div className={styles.tableHeader}>
          <h3 className={styles.tableTitle}>
            {selectedClassId ? `Danh sách lớp: ${selectedClass?.class_name}` : "Top cảnh báo rủi ro toàn hệ thống"}
          </h3>
          <div className={styles.tableActions}>
            <button className={styles.secondaryBtn}>Xuất danh sách (CSV)</button>
          </div>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Sinh viên</th>
              <th>EWS Score</th>
              <th>Vắng KP</th>
              <th>Điểm TB</th>
              <th style={{textAlign: 'right'}}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {displayedStudents.map((student, index) => (
              <React.Fragment key={student.student_id}>
                <tr>
                  <td className={styles.rankCell}>{index + 1}</td>
                  <td>
                    <div className={styles.studentCell}>
                      <div className={styles.studentAvatar}>{student.name.charAt(0)}</div>
                      <div>
                        <span className={styles.studentName}>{student.name}</span>
                        <span className={styles.studentId}>{student.student_code}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={
                      student.level === "danger" ? styles.badgeRed : 
                      student.level === "warning" ? styles.badgeGold : styles.badgeGreen
                    }>
                      {student.risk_score}
                    </span>
                  </td>
                  <td className={styles.boldCell}>{student.absence_pct.toFixed(1)}%</td>
                  <td>{student.avg_weighted_score?.toFixed(2) ?? "—"}</td>
                  <td style={{textAlign: 'right'}}>
                    <div className={styles.rowActions} style={{justifyContent: 'flex-end'}}>
                      <button 
                        className={styles.actionBtn} 
                        onClick={() => toggleStudentDetail(student.student_id)}
                      >
                        {expandedStudentId === student.student_id ? <ChevronUp size={16}/> : "Xem"}
                      </button>
                      {/* <button className={styles.actionBtnGhost}><Mail size={16}/></button> */}
                    </div>
                  </td>
                </tr>
                
                {/* ROW EXPANSION: CHI TIẾT SINH VIÊN */}
                {expandedStudentId === student.student_id && (
                  <tr>
                    <td colSpan={6} style={{ padding: 0, borderBottom: '1px solid #eef1f7' }}>
                      <div style={{ 
                        padding: '1.5rem 2rem', 
                        background: '#f8fafc', 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr', 
                        gap: '2rem' 
                      }}>
                        <div>
                          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#888', textTransform: 'uppercase', marginBottom: 12 }}>
                            Cảnh báo chi tiết từ AI
                          </p>
                          <div style={{ display: 'grid', gap: 10 }}>
                            {student.warnings && student.warnings.length > 0 ? (
                              student.warnings.map((w, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: 10, fontSize: '0.9rem', color: '#444' }}>
                                  <AlertTriangle size={16} color="#c5a25d" /> {w}
                                </div>
                              ))
                            ) : (
                              <div style={{ color: '#1f7a46', fontSize: '0.9rem' }}>
                                <CheckCircle2 size={16} style={{ marginRight: 8 }} /> Không có cảnh báo hành vi nghiêm trọng.
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{ borderLeft: '1px solid #eef1f7', paddingLeft: '2rem' }}>
                          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#888', textTransform: 'uppercase', marginBottom: 12 }}>
                            Thông tin học vụ
                          </p>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                            {/* <div>
                              <small style={{ color: '#888' }}>Lớp hành chính</small>
                              <p style={{ fontWeight: 700 }}>{student.class_name || "N/A"}</p>
                            </div> */}
                            <div>
                              <small style={{ color: '#888' }}>Trạng thái</small>
                              <p style={{ fontWeight: 700, color: student.level === 'danger' ? '#ff4d4f' : '#0b1a2b' }}>
                                {student.level_label}
                              </p>
                            </div>
                            {/* <button className={styles.secondaryBtn} style={{ gridColumn: 'span 2', marginTop: 10 }}>
                              <FileText size={14} style={{ marginRight: 8 }} /> Xem đầy đủ hồ sơ EWS
                            </button> */}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* 6. MODAL BATCH ACTION */}
      {showBatchModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <div className={styles.panelHeader}>
              <div>
                <h3>Soạn thảo Recommendation hàng loạt</h3>
                <p className={styles.tableSubtitle}>{selectedClass?.class_name} • {atRiskInSelectedClass.length} sinh viên rủi ro</p>
              </div>
              <button className={styles.actionBtnGhost} onClick={() => setShowBatchModal(false)}>Đóng</button>
            </div>
            <label className={styles.templateLabel}>Mẫu nội dung (Hỗ trợ biến động {`{student_name}`})</label>
            <textarea
              className={styles.templateBox}
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={5}
            />
            <div className={styles.previewBox}>
              <strong>Xem trước nội dung cá nhân hóa:</strong>
              <p>{previewText}</p>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.secondaryBtn} onClick={() => setShowBatchModal(false)}>Hủy bỏ</button>
              <button className={styles.primaryBtn} disabled={batchLoading} onClick={handleBatchSend}>
                {batchLoading ? <Loader2 className="animate-spin" size={16}/> : "Gửi Recommendation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Cần import React để dùng Fragment
import React from "react";