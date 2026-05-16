// Tất cả API routes của backend Flask /api/v1/
export const API_ROUTES = {
  auth: {
    login: "auth/login",
    me:    "auth/me",
  },
  student: {
    detail:     (id: string) => `student/${id}`,
    ews:        (id: string) => `student/${id}/ews`,
    gpa:        (id: string) => `student/${id}/gpa`,
    gpaTarget:  (id: string, target: number) => `student/${id}/gpa/target?target=${target}`,
    planner:    (id: string) => `student/${id}/planner`,
    prediction: (id: string) => `student/${id}/prediction`,
    
    // API Cố vấn đăng ký môn học mới thêm vào đây
    registrationAdvisor: (id: string, mode: "normal" | "fast_track" | "on_time") => 
      `student/${id}/registration-advisor?mode=${mode}`,
    registrationAdvisorRefresh: (id: string) => `student/${id}/registration-advisor/refresh`,
    registration: (id: string) => `student/${id}/registration`,

    interventions: "student/me/interventions",
    classes: "student/me/classes",
    profile: "student/profile/me",
    avatar: "student/profile/avatar",
    curriculum: "student/curriculum",
    results: "student/results/me",
    transcript: "student/transcript/me",
    exams: "student/exams/me",
    admitCard: (id: number) => `student/exams/${id}/admit-card`,
    enrollmentPlan: "student/enrollment/plan/me",
    enrollmentSimulate: "student/enrollment/simulate",
    enrollmentSubmit: "student/enrollment/submit",
    acknowledgeIntervention: (id: number) => `student/me/interventions/${id}/acknowledge`,
    bookInterventionMeeting: (id: number) => `student/me/interventions/${id}/book-meeting`,
  },
  dashboard: {
    summary:    "dashboard/summary",
    alerts:     (level?: string) => `dashboard/alerts${level ? `?level=${level}` : ""}`,
  },
  advisor: {
    classes: "advisor/classes",
    classStudents: (classId: string) => `advisor/classes/${encodeURIComponent(classId)}/students`,
    batchRecommend: "advisor/batch-recommend",
  },
  notifications: {
    list:         "notifications",
    unreadCount: "notifications/unread-count",
    readOne:     (id: number) => `notifications/${id}/read`,
    readAll:     "notifications/read-all",
    trigger:     "notifications/trigger",
  },
  benchmark: {
    schools:        "benchmark/schools",
    comparison:     "benchmark",
    studentPct:     (id: string) => `benchmark/student/${id}`,
  },
  chat:  "chat",
  admin: {
    report:            "admin/report",
    alertsTrigger:     "admin/alerts/trigger",
    alerts:            "admin/alerts",
    config:            "admin/config",
    documents:         "admin/documents",
    upload:            "admin/upload",
    chunks:            (docId: number) => `admin/chunks/${docId}`,
    metricsDashboard:  "admin/metrics/dashboard",
    campaignDashboard: "admin/campaigns/dashboard",
  },
} as const;