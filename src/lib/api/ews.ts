/**
 * ews.ts — Typed wrappers cho tất cả EWS API calls
 * Dùng PUBLIC_API_BASE_URL từ config.ts
 */
import { getJson, postJson } from "./http";
import { PUBLIC_API_BASE_URL } from "./config";
import { API_ROUTES } from "./routes";
import { TOP_RISK_STUDENTS } from "../data";

const base = () => PUBLIC_API_BASE_URL;

const url = (path: string) => `${base()}${path}`;

const demoStudentId = (studentId: string) =>
  studentId === "DEV_TEST" ? "SV001" : studentId;

const demoRisk = (studentId: string): EWSRisk => {
  const id = demoStudentId(studentId);
  const student = TOP_RISK_STUDENTS.find((s) => s.id === id) || TOP_RISK_STUDENTS[0];
  const level = student.status === "RED" ? "danger" : student.status === "YELLOW" ? "warning" : "safe";
  return {
    student_id: student.id,
    student_code: student.id,
    name: student.name,
    risk_score: student.score,
    level,
    level_label: level === "danger" ? "Nguy cơ cao" : level === "warning" ? "Cần theo dõi" : "Ổn định",
    absence_pct: student.absentRate,
    excused_pct: student.excusedRate,
    avg_weighted_score: student.avgGrade,
    login_count: student.loginCount,
    warnings: level === "safe" ? [] : ["Dữ liệu demo: cần theo dõi chuyên cần và kết quả học tập."],
    data_source: "demo_fallback",
  };
};

const demoGpa = (studentId: string): GPAReport => {
  const risk = demoRisk(studentId);
  return {
    student_id: risk.student_id,
    name: risk.name,
    cumulative_gpa4: risk.avg_weighted_score ? Math.min(4, Math.max(0, risk.avg_weighted_score / 2.5)) : null,
    cumulative_gpa10: risk.avg_weighted_score,
    total_credits: 86,
    total_credits_all: 120,
    failed_credits: risk.level === "danger" ? 9 : risk.level === "warning" ? 3 : 0,
    gpa4_classification: risk.level === "safe" ? "Khá/Tốt" : "Cần cải thiện",
    semesters: [{ semester_year: "2025-2026 HK2", gpa4: 3.0, credits: 18 }],
    failed_courses: risk.level === "safe" ? [] : [
      { course_name: "Môn cần cải thiện", credits: 3, weighted_score: 4.8, grade_letter: "F" },
    ],
  };
};

const demoPlanner = (): CoursePlan => ({
  next_semester: 7,
  credit_limit: 18,
  recommended: [
    { course_id: "AI501", course_name: "Trí tuệ nhân tạo ứng dụng", credits: 3 },
    { course_id: "DS401", course_name: "Phân tích dữ liệu", credits: 3 },
  ],
  optional: [{ course_id: "SE405", course_name: "Quản lý dự án phần mềm", credits: 3 }],
  blocked: [],
  warnings: ["Dữ liệu demo fallback vì backend Flask chưa kết nối."],
});

const demoPrediction = (): PredictionResult => ({
  dropout_risk: "low",
  dropout_risk_label: "Thấp",
  trend: "stable",
  trend_label: "Ổn định",
  predicted_gpa4: 3.05,
  tc_progress_pct: 72,
  tc_behind: 0,
  alerts: [],
});

const demoSummary = (): DashboardSummary => {
  const total = 124;
  const danger = TOP_RISK_STUDENTS.filter((s) => s.status === "RED").length;
  const warning = TOP_RISK_STUDENTS.filter((s) => s.status === "YELLOW").length;
  const safe = total - danger - warning;
  return {
    total,
    danger,
    warning,
    safe,
    danger_pct: Math.round((danger / total) * 100),
    warning_pct: Math.round((warning / total) * 100),
    safe_pct: Math.round((safe / total) * 100),
    data_source: "demo_fallback",
  };
};

const demoAlerts = (): AlertStudent[] =>
  TOP_RISK_STUDENTS.map((student) => {
    const level = student.status === "RED" ? "danger" : student.status === "YELLOW" ? "warning" : "safe";
    return {
      student_id: student.id,
      student_code: student.id,
      name: student.name,
      risk_score: student.score,
      level,
      level_label: level === "danger" ? "Nguy cơ cao" : level === "warning" ? "Cần theo dõi" : "Ổn định",
      absence_pct: student.absentRate,
      avg_weighted_score: student.avgGrade,
      warnings: [],
    };
  });

const demoAdvisorDashboard = (): AdvisorDashboard => ({
  campaign_progress: [{
    campaign_id: 1,
    name: "Demo Midterm Review",
    status: "demo",
    target_count: 9,
    completed_targets: 3,
    completion_rate: 0.3333,
    delivery: { sent: 7, read: 4, replied: 3, unread: 3, unreplied: 1 },
  }],
  tier_distribution: { tier_1_watch: 1, tier_2_intervention: 5, tier_3_critical: 4 },
  critical_cases: { count: 3, unread_count: 2, unreplied_count: 1, cases: [] },
  student_feedback_action_queue: [
    { task_id: 1, student_id: "SV010", task_type: "meeting_request", priority: "high", title: "Student requested advisor meeting" },
  ],
  governance: {
    false_positive_review: { reviewed: 0, false_positive: 0, false_positive_rate: 0 },
    response_time_sla_by_tier: {
      tier_3_critical: { total: 4, within_sla: 3, breached: 1, pending: 1, within_sla_rate: 0.75, avg_response_hours: 18, sla_hours: 24 },
    },
    intervention_outcomes: { pending: 2, queued: 1, sent: 3, read: 1, replied: 0, acknowledged: 2, booked: 1, resolved: 0, skipped: 0 },
  },
});

// ── Types ──────────────────────────────────────────────────────
export interface EWSRisk {
  student_id: string;
  student_code: string;
  name: string;
  risk_score: number;
  level: "danger" | "warning" | "safe";
  level_label: string;
  absence_pct: number;
  excused_pct: number;
  avg_weighted_score: number | null;
  login_count: number;
  warnings: string[];
  data_source: string;
}

export interface GPAReport {
  student_id: string;
  name: string;
  cumulative_gpa4: number | null;
  cumulative_gpa10: number | null;
  total_credits: number;
  total_credits_all: number;
  failed_credits: number;
  gpa4_classification: string;
  semesters: Array<{ semester_year: string; gpa4: number | null; credits: number }>;
  failed_courses: Array<{ course_name: string; credits: number; weighted_score: number; grade_letter: string }>;
}

export interface DashboardSummary {
  total: number;
  danger: number;
  warning: number;
  safe: number;
  danger_pct: number;
  warning_pct: number;
  safe_pct: number;
  data_source: string;
}

export interface AlertStudent {
  student_id: string;
  student_code: string;
  name: string;
  risk_score: number;
  level: string;
  level_label: string;
  absence_pct: number;
  avg_weighted_score: number | null;
  warnings: string[];
}

export interface AdvisorClass {
  class_id: string;
  class_name: string;
  cohort_year: number;
  current_semester: number;
  student_count: number;
  at_risk_count: number;
  subject_count: number;
}

export interface ClassStudent extends AlertStudent {
  class_id: string;
  class_name: string;
  cohort_year: number;
  current_semester: number;
  enrolled_subject_count: number;
}

export interface BatchRecommendResult {
  class_id: string;
  total_students: number;
  at_risk_count: number;
  created_count: number;
  status: string;
  recommendations: Array<{
    intervention_id: number;
    student_id: number;
    student_code: string;
    name: string;
    level: string;
    message: string;
    status: string;
  }>;
}

export interface CoursePlan {
  next_semester: number;
  credit_limit: number;
  recommended: Array<{ course_id: string; course_name: string; credits: number }>;
  optional: Array<{ course_id: string; course_name: string; credits: number }>;
  blocked: Array<{ course_id: string; course_name: string; missing_prereqs: string[] }>;
  warnings: string[];
}

export interface PredictionResult {
  dropout_risk: string;
  dropout_risk_label: string;
  trend: string;
  trend_label: string;
  predicted_gpa4: number | null;
  tc_progress_pct: number;
  tc_behind: number;
  alerts: string[];
}

export interface Notification {
  notification_id: number;
  type: string;
  title: string;
  body: string;
  ref_student_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface StudentInterventionCard {
  job_id: number;
  campaign_id: number;
  target_id: number;
  student_id: string;
  channel: string;
  status: "SENT" | "READ" | "REPLIED" | string;
  tier: string;
  tier_label: string;
  message: string;
  recommended_actions: string[];
  sent_at: string | null;
  read_at: string | null;
  replied_at: string | null;
  can_acknowledge: boolean;
  can_book_meeting: boolean;
}

export interface AdministrativeClass {
  class_id: string;
  class_name: string;
  cohort_year: number;
  current_semester: number;
}

export interface StudentClass {
  class_id: string;
  class_name: string;
  semester: number;
  course_id: number;
  course_code: string;
  course_name: string;
  credits: number;
  midterm_score: number | null;
  assignment_score: number | null;
  final_score: number | null;
  weighted_score: number | null;
  absence_pct: number;
  absent_unexcused?: number;
  absent_excused?: number;
  total_sessions?: number;
  status: string;
}

export interface StudentClassPayload {
  administrative_class: AdministrativeClass | null;
  subjects: StudentClass[];
}

export interface AdvisorDashboard {
  campaign_progress: Array<{
    campaign_id: number;
    name: string;
    status: string;
    target_count: number;
    completed_targets: number;
    completion_rate: number;
    delivery: {
      sent: number;
      read: number;
      replied: number;
      unread: number;
      unreplied: number;
    };
  }>;
  tier_distribution: Record<string, number>;
  critical_cases: {
    count: number;
    unread_count: number;
    unreplied_count: number;
    cases: unknown[];
  };
  student_feedback_action_queue: Array<{
    task_id: number;
    student_id: string;
    task_type: string;
    priority: string;
    title: string;
  }>;
  governance: {
    false_positive_review: {
      reviewed: number;
      false_positive: number;
      false_positive_rate: number;
    };
    response_time_sla_by_tier: Record<string, {
      total: number;
      within_sla: number;
      breached: number;
      pending: number;
      within_sla_rate: number;
      avg_response_hours: number;
      sla_hours: number;
    }>;
    intervention_outcomes: Record<string, number>;
  };
}

// ── API calls ──────────────────────────────────────────────────

export async function fetchStudentEWS(studentId: string): Promise<EWSRisk> {
  try {
    const res = await getJson<{ success: boolean; data: EWSRisk }>(
      url(API_ROUTES.student.ews(demoStudentId(studentId)))
    );
    return res.data;
  } catch {
    return demoRisk(studentId);
  }
}

export async function fetchStudentGPA(studentId: string): Promise<GPAReport> {
  try {
    const res = await getJson<{ success: boolean; data: GPAReport }>(
      url(API_ROUTES.student.gpa(demoStudentId(studentId)))
    );
    return res.data;
  } catch {
    return demoGpa(studentId);
  }
}

export async function fetchStudentPlanner(studentId: string): Promise<CoursePlan> {
  try {
    const res = await getJson<{ success: boolean; data: CoursePlan }>(
      url(API_ROUTES.student.planner(demoStudentId(studentId)))
    );
    return res.data;
  } catch {
    return demoPlanner();
  }
}

export async function fetchStudentPrediction(studentId: string): Promise<PredictionResult> {
  try {
    const res = await getJson<{ success: boolean; data: PredictionResult }>(
      url(API_ROUTES.student.prediction(demoStudentId(studentId)))
    );
    return res.data;
  } catch {
    return demoPrediction();
  }
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  try {
    const res = await getJson<{ success: boolean; data: DashboardSummary }>(
      url(API_ROUTES.dashboard.summary)
    );
    return res.data;
  } catch {
    return demoSummary();
  }
}

export async function fetchAlerts(level: "danger" | "warning" | "all" = "all"): Promise<AlertStudent[]> {
  try {
    const res = await getJson<{ success: boolean; data: { students: AlertStudent[] } }>(
      url(API_ROUTES.dashboard.alerts(level))
    );
    return res.data.students || [];
  } catch {
    const alerts = demoAlerts();
    return level === "all" ? alerts : alerts.filter((student) => student.level === level);
  }
}

export async function fetchNotifications(unreadOnly = false): Promise<{
  notifications: Notification[]; unread: number;
}> {
  try {
    const res = await getJson<{ success: boolean; data: { notifications: Notification[]; unread: number } }>(
      url(`${API_ROUTES.notifications.list}${unreadOnly ? "?unread_only=true" : ""}`)
    );
    return res.data;
  } catch {
    return { notifications: [], unread: 0 };
  }
}

export async function fetchStudentInterventions(): Promise<StudentInterventionCard[]> {
  try {
    const res = await getJson<{ success: boolean; data: { interventions: StudentInterventionCard[] } }>(
      url(API_ROUTES.student.interventions)
    );
    return res.data.interventions || [];
  } catch {
    return [];
  }
}

export async function fetchStudentClasses(): Promise<StudentClassPayload> {
  try {
    const res = await getJson<{
      success: boolean;
      data: {
        administrative_class?: AdministrativeClass | null;
        subjects?: StudentClass[];
        classes?: StudentClass[];
      };
    }>(
      url(API_ROUTES.student.classes)
    );
    return {
      administrative_class: res.data.administrative_class ?? null,
      subjects: res.data.subjects || res.data.classes || [],
    };
  } catch {
    return { administrative_class: null, subjects: [] };
  }
}

export async function acknowledgeIntervention(jobId: number, note?: string): Promise<unknown> {
  const res = await postJson<{ success: boolean; data: unknown }>(
    url(API_ROUTES.student.acknowledgeIntervention(jobId)),
    { note }
  );
  return res.data;
}

export async function bookInterventionMeeting(jobId: number, note?: string): Promise<unknown> {
  const res = await postJson<{ success: boolean; data: unknown }>(
    url(API_ROUTES.student.bookInterventionMeeting(jobId)),
    { note }
  );
  return res.data;
}

export async function triggerEWSNotifications(): Promise<{ notifications_created: number }> {
  const res = await postJson<{ success: boolean; data: { notifications_created: number } }>(
    url(API_ROUTES.notifications.trigger), {}
  );
  return res.data;
}

export async function fetchBenchmark() {
  const res = await getJson<{ success: boolean; data: unknown }>(
    url(API_ROUTES.benchmark.comparison)
  );
  return res.data;
}

export async function fetchAdvisorDashboard(): Promise<AdvisorDashboard> {
  try {
    const res = await getJson<{ success: boolean; data: AdvisorDashboard }>(
      url(API_ROUTES.admin.campaignDashboard)
    );
    return res.data;
  } catch {
    return demoAdvisorDashboard();
  }
}

export async function fetchAdvisorClasses(): Promise<AdvisorClass[]> {
  const res = await getJson<{ success: boolean; data: { classes: AdvisorClass[] } }>(
    url(API_ROUTES.advisor.classes)
  );
  return res.data.classes || [];
}

export async function fetchClassStudents(classId: string): Promise<ClassStudent[]> {
  const res = await getJson<{ success: boolean; data: { students: ClassStudent[] } }>(
    url(API_ROUTES.advisor.classStudents(classId))
  );
  return res.data.students || [];
}

export async function sendBatchRecommendations(
  classId: string,
  messageTemplate: string
): Promise<BatchRecommendResult> {
  const res = await postJson<{ success: boolean; data: BatchRecommendResult }>(
    url(API_ROUTES.advisor.batchRecommend),
    { administrative_class_id: classId, message_template: messageTemplate }
  );
  return res.data;
}
