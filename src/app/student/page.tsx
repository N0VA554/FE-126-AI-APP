"use client";

import styles from "./index.module.css";
import { useAuth } from "@/src/context/AuthContext";
import { useEffect, useState } from "react";
import {
  BookOpen,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  UserCircle,
  Activity,
  Award,
  Zap
} from "lucide-react";
import {
  fetchStudentClasses,
  fetchStudentEWS,
  fetchStudentGPA,
  fetchStudentPrediction,
  type AdministrativeClass,
  type EWSRisk,
  type GPAReport,
  type PredictionResult,
  type StudentClass,
} from "@/src/lib/api/ews";
import { fetchResults, type ResultsPayload } from "@/src/lib/api/sis";

export default function StudentEWSPage() {
  const { user } = useAuth();
  const studentId = user?.username || "string";

  const [ews, setEws] = useState<EWSRisk | null>(null);
  const [gpa, setGpa] = useState<GPAReport | null>(null);
  const [pred, setPred] = useState<PredictionResult | null>(null);
  const [adminClass, setAdminClass] = useState<AdministrativeClass | null>(null);
  const [subjects, setSubjects] = useState<StudentClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchStudentEWS(studentId).catch(() => null),
      fetchStudentGPA(studentId).catch(() => null),
      fetchStudentPrediction(studentId).catch(() => null),
      fetchStudentClasses().catch(() => ({ administrative_class: null, subjects: [] as StudentClass[] })),
      fetchResults().catch(() => null as ResultsPayload | null),
    ])
      .then(([e, g, p, classPayload, results]) => {
        setEws(e);
        setGpa(g);
        setPred(p);
        setAdminClass(classPayload?.administrative_class ?? null);

        const weightedByCode = new Map<string, number>();
        const currentSemesterCourses = results?.semesters?.[0]?.courses || [];
        for (const c of currentSemesterCourses) {
          if (typeof c.weighted_score === "number") weightedByCode.set(c.course_code, c.weighted_score);
        }

        setSubjects(
          (classPayload?.subjects || []).map((s) => {
            const ws = weightedByCode.get(s.course_code);
            return typeof ws === "number" ? { ...s, weighted_score: ws } : s;
          })
        );
      })
      .finally(() => setLoading(false));
  }, [studentId]);

  const riskClass = ews?.level === "danger" ? styles.riskDanger
    : ews?.level === "warning" ? styles.riskWarning
      : styles.riskSafe;

  // Prefer backend-provided weighted_score to keep `/student` consistent with `/student/grades`.
  // Fallback to a local estimate only when weighted_score is missing.
  const courseScore10 = (item: StudentClass): number | null => {
    if (typeof item.weighted_score === "number") return Number(item.weighted_score.toFixed(2));

    const assignment = item.assignment_score ?? null;
    const midterm = item.midterm_score ?? null;
    const final = item.final_score ?? null;

    if (final !== null && midterm !== null && assignment !== null) {
      return Number((final * 0.6 + midterm * 0.3 + assignment * 0.1).toFixed(2));
    }
    if (final !== null && midterm !== null) {
      return Number((final * 0.6 + midterm * 0.4).toFixed(2));
    }
    if (final !== null) return Number(final.toFixed(2));
    if (midterm !== null) return Number(midterm.toFixed(2));
    return null;
  };

  if (loading) return <div className={styles.statCard}>Đang nạp dữ liệu EWS...</div>;

  return (
    <div className={styles.wrapper}>
      {/* 1. Hero Greeting */}
      <section className={styles.hero}>
        <div>
          <h2 className={styles.heroTitle}>Chào {user?.full_name?.split(" ").pop()},</h2>
          <p className={styles.heroSubtitle}>Hệ thống AI đã phân tích xong tình trạng học thuật của bạn.</p>
        </div>
        <div className={styles.statCard} style={{ padding: '0.5rem 1rem', borderStyle: 'dashed' }}>
          <span className={styles.statLabel}>ID: {studentId}</span>
        </div>
      </section>

      {/* 2. Stats Row - 4 KPI Cards */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>GPA Tích lũy</span>
          <div className={styles.statValue} style={{ color: '#d4af37' }}>{gpa?.cumulative_gpa4?.toFixed(2)}</div>
          <span className={styles.statFoot}>{gpa?.gpa4_classification}</span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>Chuyên cần</span>
          <div className={styles.statValue}>{ews ? `${(100 - ews.absence_pct).toFixed(1)}%` : "—"}</div>
          <span className={styles.statFoot}>Vắng KP: {ews?.absence_pct}%</span>
        </div>

        <div className={`${styles.statCard} ${riskClass}`}>
          <span className={styles.statLabel}>Rủi ro EWS</span>
          <div className={styles.statValue}>{ews?.risk_score} <span style={{ fontSize: '1rem' }}>/100</span></div>
          <span className={styles.statFoot}>{ews?.level_label}</span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>Tín chỉ đạt</span>
          <div className={styles.statValue}>{gpa?.total_credits}</div>
          <span className={styles.statFoot}>Tín chỉ đã học: {gpa?.total_credits_all}</span>
        </div>
      </div>

      {/* 3. Content Grid */}
      <div className={styles.contentGrid}>

        {/* Main Column: Classes & Subjects */}
        <div className={styles.mainPanel}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h3><UserCircle size={18} /> Lớp hành chính</h3>
              <span className={styles.statLabel}>{adminClass?.class_name}</span>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <strong>{adminClass?.class_name || "Chưa phân lớp"}</strong>
              <p className={styles.heroSubtitle}>Khóa {adminClass?.cohort_year} • Học kỳ {adminClass?.current_semester}</p>
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h3><BookOpen size={18} /> Môn học kỳ này</h3>
            </div>
            <div className={styles.classGrid}>
              {subjects.map((item, idx) => (
                <div key={`subject-${item.course_id ?? idx}-${idx}`} className={styles.classCard}>
                  <p className={styles.courseCode}>{item.course_code}</p>
                  <p className={styles.courseName}>{item.course_name}</p>
                  <div className={styles.statFoot} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                    {(() => {
                      const score = courseScore10(item);
                      return <span>Điểm: {score !== null ? score.toFixed(2) : "—"}</span>;
                    })()}
                    <span>Vắng: {item.absence_pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side Column: AI Insights & Alerts */}
        <div className={styles.sidePanel}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h3><Zap size={18} /> AI Prediction</h3>
            </div>
            <div className={styles.insightList}>
              <div className={styles.infoBox} style={{ padding: '1rem', background: '#f8fafc', borderRadius: '1rem' }}>
                <p className={styles.statLabel}>Dự báo GPA kỳ tới</p>
                <div className={styles.statValue} style={{ fontSize: '1.25rem' }}>{pred?.predicted_gpa4?.toFixed(2)}</div>
                <p className={styles.statFoot}>Xu hướng: {pred?.trend_label}</p>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <p className={styles.statLabel}>Rủi ro thôi học</p>
                <p style={{ fontWeight: 700, color: pred?.dropout_risk_label === "Thấp" ? '#10b981' : '#ef4444' }}>
                  {pred?.dropout_risk_label}
                </p>
              </div>
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h3><AlertCircle size={18} /> Cảnh báo quan trọng</h3>
            </div>
            <div className={styles.insightList}>
              {ews?.warnings.map((w, i) => (
                <div key={`warning-${i}`} className={`${styles.insightItem} ${styles.bgWarning}`}>
                  <AlertCircle size={16} /> {w}
                </div>
              ))}

              {gpa?.failed_courses.map((c, i) => (
                <div key={`failed-${i}`} className={`${styles.insightItem} ${styles.bgDanger}`}>
                  <Activity size={16} /> F: {c.course_name}
                </div>
              ))}

              {(!ews?.warnings.length && !gpa?.failed_courses.length) && (
                <div className={`${styles.insightItem} ${styles.bgSafe}`} style={{ background: '#f0fdf4', color: '#166534' }}>
                  <CheckCircle2 size={16} /> Mọi thứ đều ổn!
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
