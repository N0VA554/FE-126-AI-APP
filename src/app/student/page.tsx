"use client";

import styles from "./index.module.css";
import { useAuth } from "@/src/context/AuthContext";
import { useEffect, useState } from "react";
import {
  BookOpen,
  AlertCircle,
  UserCircle,
  Activity,
  Zap,
  CheckCircle2
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
import { fetchResults, type ResultsPayload, type ResultCourse } from "@/src/lib/api/sis";
import { PUBLIC_API_BASE_URL } from "@/src/lib/api/config";

export default function StudentEWSPage() {
  const { user } = useAuth();

  const [ews, setEws] = useState<EWSRisk | null>(null);
  const [gpa, setGpa] = useState<GPAReport | null>(null);
  const [pred, setPred] = useState<PredictionResult | null>(null);
  const [adminClass, setAdminClass] = useState<AdministrativeClass | null>(null);
  const [subjects, setSubjects] = useState<StudentClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.username || !user?.user_id) return;

    setLoading(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const studentId = user.username;

    Promise.all([
      fetchStudentEWS(studentId).catch(() => null),
      fetchStudentGPA(studentId).catch(() => null),
      fetchStudentPrediction(studentId).catch(() => null),
      fetchStudentClasses().catch(() => ({ administrative_class: null, subjects: [] as StudentClass[] })),
      fetchResults().catch(() => null as ResultsPayload | null),
    ])
      .then(async ([e, g, p, classPayload, results]) => {
        setEws(e);
        setGpa(g);
        setPred(p);
        setAdminClass(classPayload?.administrative_class ?? null);

        let baseSubjects = classPayload?.subjects || [];

        if (baseSubjects.length === 0) {
          try {
            const res = await fetch(`${PUBLIC_API_BASE_URL}student/${user.user_id}/timetable`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            if (json.success && json.data?.courses) {
              baseSubjects = json.data.courses.map((c: any) => ({
                course_id: c.course_id,
                course_code: c.course_code,
                course_name: c.course_name,
                credits: c.credits,
                absence_pct: 0,
                midterm_score: null,
                assignment_score: null,
                final_score: null,
                weighted_score: null,
              }));
            }
          } catch (err) {
            console.error("Lỗi fetch lịch học:", err);
          }
        }

        const weightedByCode = new Map<string, number>();
        const currentSemesterCourses: ResultCourse[] = results?.semesters?.[0]?.courses || [];
        
        for (const c of currentSemesterCourses) {
          if (typeof c.weighted_score === "number") weightedByCode.set(c.course_code, c.weighted_score);
          if (typeof c.absence_pct === "number") weightedByCode.set(`abs_${c.course_code}`, c.absence_pct);
        }

        setSubjects(
          baseSubjects.map((s) => {
            const ws = weightedByCode.get(s.course_code);
            const absPct = weightedByCode.get(`abs_${s.course_code}`);
            return {
              ...s,
              ...(typeof ws === "number" ? { weighted_score: ws } : {}),
              ...(typeof absPct === "number" ? { absence_pct: absPct } : {}),
            };
          })
        );
      })
      .catch((error) => console.error("Lỗi đồng bộ dữ liệu EWS:", error))
      .finally(() => setLoading(false));
  }, [user?.username, user?.user_id]);

  const riskClass = ews?.level === "danger" ? styles.riskDanger
    : ews?.level === "warning" ? styles.riskWarning
      : styles.riskSafe;

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

  const hasWarnings = (ews?.warnings && ews.warnings.length > 0) || (gpa?.failed_courses && gpa.failed_courses.length > 0);

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
          <span className={styles.statLabel}>ID: {user?.username}</span>
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

      {/* 3. Content Grid (Main & Side) */}
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

        {/* Side Column: AI Prediction Only */}
        <div className={styles.sidePanel}>
          <div className={styles.panel} style={{ height: '100%', marginBottom: 0 }}>
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
        </div>
      </div>

      {/* 4. Bottom Full-Width Section: Cảnh báo quan trọng */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h3><AlertCircle size={18} /> Cảnh báo quan trọng</h3>
          {hasWarnings && <span className={styles.alertBadge}>Yêu cầu chú ý</span>}
        </div>
        <div className={styles.alertGrid}>
          {hasWarnings ? (
            <>
              {ews?.warnings.map((w, i) => (
                <div key={`warning-${i}`} className={`${styles.insightItem} ${styles.bgWarning}`}>
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} /> 
                  <span>{w}</span>
                </div>
              ))}
              {gpa?.failed_courses.map((c, i) => (
                <div key={`failed-${c.course_name}-${i}`} className={`${styles.insightItem} ${styles.bgDanger}`}>
                  <Activity size={16} style={{ flexShrink: 0, marginTop: '2px' }} /> 
                  <span>Học phần trượt (Điểm F): <strong>{c.course_name}</strong></span>
                </div>
              ))}
            </>
          ) : (
            <div className={styles.emptyAlerts}>
              <CheckCircle2 size={24} color="#10b981" />
              <p>Hiện tại không ghi nhận cảnh báo học vụ nào cho học kỳ này.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}