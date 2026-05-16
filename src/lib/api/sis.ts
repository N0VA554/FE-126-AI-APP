import { getJson, postJson } from "./http";
import { PUBLIC_API_BASE_URL } from "./config";
import { API_ROUTES } from "./routes";

const base = () => PUBLIC_API_BASE_URL;
const url = (path: string) => `${base()}${path}`;

export interface ResultCourse {
  enrollment_id: number;
  semester_year: number | string;
  semester_index: number;
  course_id: number;
  course_code: string;
  course_name: string;
  credits: number;
  assignment_score: number | null;
  midterm_score: number | null;
  final_score: number | null;
  weighted_score: number | null;
  gpa4: number | null;
  grade_letter: string | null;
  status: string;
  is_passed: boolean;
  retake_required: boolean;
}

export interface ResultsPayload {
  student: { student_id: string; name: string; major: string; academic_status: string };
  summary: {
    attempted_credits: number;
    earned_credits: number;
    failed_credits: number;
    cumulative_gpa4: number | null;
    course_count: number;
  };
  semesters: Array<{
    semester_year: string;
    credits: number;
    earned_credits: number;
    gpa4: number | null;
    courses: ResultCourse[];
  }>;
  courses: ResultCourse[];
}

export interface ExamItem {
  exam_id: number;
  course_code: string;
  course_name: string;
  credits: number;
  exam_type: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  room: string;
  seat_number: string;
  is_eligible: boolean;
  eligibility_reason: string;
  absence_pct: number;
}

export interface ExamsPayload {
  student: { student_id: string; name: string };
  count: number;
  eligible_count: number;
  exams: ExamItem[];
}

export interface EnrollmentCourse {
  course_id: number;
  course_code: string;
  course_name: string;
  credits: number;
  semester_index: number;
  is_required: boolean;
  schedules: Array<{
    schedule_id: number;
    day_of_week: string;
    start_time: string;
    end_time: string;
    room_number: string;
  }>;
  missing_prerequisites?: Array<{ course_code: string; course_name: string }>;
}

export interface EnrollmentPlan {
  student: { student_id: string; name: string };
  target_semester: number;
  credit_limit: { min: number; max: number; note: string };
  recommended: EnrollmentCourse[];
  blocked: EnrollmentCourse[];
  total_recommended_credits: number;
  warnings: string[];
}

export interface EnrollmentSimulation {
  selected: Array<{
    course_id: number;
    course_code: string;
    course_name: string;
    credits: number;
    duplicate?: boolean;
  }>;
  total_credits: number;
  credit_limit: { min: number; max: number; note: string };
  conflicts: Array<{ course_a: string; course_b: string; day_of_week: string; time: string }>;
  blocked: unknown[];
  is_valid: boolean;
  warnings: string[];
  timetable: Array<{
    course_code: string;
    course_name: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    room_number: string;
  }>;
}

export interface SuggestedCourse {
  course_id: number;
  course_code: string;
  course_name: string;
  credits: number;
  semester_index: number;
  is_required: boolean;
  priority: number;
  reason: string;
  reason_source: string;
  section_id?: string;
  suggested_section_id?: string;
  schedule_id?: number | string;
  enrollment_status?: "enrolled" | "wishlist";
  early_enrollment?: boolean;
}

export interface TimetableItem {
  schedule_id: number;
  course_id: number;
  course_code: string;
  course_name: string;
  credits: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room_number: string;
  priority: number;
}

export interface RegistrationAdvisorPayload {
  student_id: number;
  student_code: string;
  name: string;
  gpa_10: number;
  academic_status: string;
  profile: string;
  mode: "normal" | "fast_track" | "on_time";
  overall_advice: string;
  advice_source: string;
  target_semester: number;
  total_suggested_credits: number;
  credit_limit: { min: number; max: number };
  registration_status: {
    is_open: boolean;
    target_semester: number;
    open_date: string;
    close_date: string;
    days_until_open: number | null;
    days_left: number | null;
    message: string;
  };
  graduation_track: {
    total_required_credits: number;
    accumulated_credits: number;
    remaining_credits: number;
    estimated_semesters_left: number;
    on_track: boolean;
  };
  suggested_courses: SuggestedCourse[];
  timetable: TimetableItem[];
  enrolled_courses: any[];   
  debt_courses: any[];
  unscheduled_courses: any[];
  warnings: string[];
}

export async function fetchResults(): Promise<ResultsPayload> {
  const res = await getJson<{ success: boolean; data: ResultsPayload }>(url(API_ROUTES.student.results));
  return res.data;
}

export async function fetchTranscript(): Promise<ResultsPayload> {
  const res = await getJson<{ success: boolean; data: ResultsPayload }>(url(API_ROUTES.student.transcript));
  return res.data;
}

export async function fetchExams(): Promise<ExamsPayload> {
  const res = await getJson<{ success: boolean; data: ExamsPayload }>(url(API_ROUTES.student.exams));
  return res.data;
}

export async function fetchAdmitCard(examId: number): Promise<unknown> {
  const res = await getJson<{ success: boolean; data: unknown }>(url(API_ROUTES.student.admitCard(examId)));
  return res.data;
}

export async function fetchEnrollmentPlan(): Promise<EnrollmentPlan> {
  const res = await getJson<{ success: boolean; data: EnrollmentPlan }>(url(API_ROUTES.student.enrollmentPlan));
  return res.data;
}

export async function simulateEnrollment(courseIds: Array<number | string>): Promise<EnrollmentSimulation> {
  const res = await postJson<{ success: boolean; data: EnrollmentSimulation }>(
    url(API_ROUTES.student.enrollmentSimulate),
    { course_ids: courseIds }
  );
  return res.data;
}

export async function submitEnrollment(courseIds: Array<number | string>): Promise<EnrollmentSimulation & { success: boolean; message: string }> {
  const res = await postJson<{ success: boolean; data: EnrollmentSimulation & { success: boolean; message: string } }>(
    url(API_ROUTES.student.enrollmentSubmit),
    { course_ids: courseIds }
  );
  return res.data;
}

export async function fetchRegistrationAdvisor(
  studentId: string,
  mode: "normal" | "fast_track" | "on_time" = "normal"
): Promise<RegistrationAdvisorPayload> {
  const res = await getJson<{ success: boolean; data: RegistrationAdvisorPayload }>(
    url(API_ROUTES.student.registrationAdvisor(studentId, mode))
  );
  return res.data;
}

export async function refreshRegistrationAdvisor(
  studentId: string,
  mode: "normal" | "fast_track" | "on_time" = "normal"
): Promise<RegistrationAdvisorPayload> {
  const res = await postJson<{ success: boolean; data: RegistrationAdvisorPayload }>(
    url(API_ROUTES.student.registrationAdvisorRefresh(studentId)),
    { mode }
  );
  return res.data;
}

// --- ĐÃ ĐƯỢC CẬP NHẬT TRƯỜNG ERROR VÀ MESSAGE ĐỂ FIX TS ---
export interface RegistrationResult {
  success: boolean;
  message?: string;
  error?: string; // 👈 Thêm dòng này để giải quyết lỗi không tồn tại thuộc tính 'error'
  registration?: unknown;
  total_credits_after?: number;
  credit_limit?: unknown;
}

export async function registerCourse(
  studentId: string,
  courseId: string,
  sectionId?: string
): Promise<RegistrationResult> {
  const res = await postJson<{ success: boolean; data: RegistrationResult }>(
    url(API_ROUTES.student.registration(studentId)),
    { course_id: courseId, section_id: sectionId }
  );
  return res.data;
}