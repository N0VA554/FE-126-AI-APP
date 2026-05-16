import { getJson, postJson } from "./http";
import { PUBLIC_API_BASE_URL } from "./config";
import { API_ROUTES } from "./routes";

const base = () => PUBLIC_API_BASE_URL;
const url = (path: string) => `${base()}${path}`;

export interface StudentProfile {
  personal_info: {
    full_name: string;
    dob: string;
    current_address: string;
    gender: string;
    place_of_birth: string;
    id_card_num: string;
    id_issue_date: string;
    id_issue_place: string;
    father_name: string;
    mother_name: string;
    school_email: string;
    avatar_url: string;
  };
  academic_info: {
    student_id: string;
    administrative_class: string;
    cohort: string;
    faculty: string;
    major: string;
    major_code: string;
    admission_year: number;
    current_semester: number;
    academic_status: string;
    status: string;
    university: string;
  };
}

export interface CurriculumSubject {
  subject_code: string;
  subject_name: string;
  credits: number;
  block: string;
  type?: string;
  is_required: boolean;
}

export interface CurriculumSemester {
  semester: number;
  credits: number;
  subjects: CurriculumSubject[];
}

export interface StudentCurriculum {
  major_code: string;
  major: string;
  faculty: string;
  effective_year: number;
  total_credits: number;
  earned_credits: number;
  progress_pct: number;
  subject_count: number;
  source_file: string;
  semesters: CurriculumSemester[];
  subjects: CurriculumSubject[];
}

export async function fetchStudentProfile(): Promise<StudentProfile> {
  const res = await getJson<{ success: boolean; data: StudentProfile }>(
    url(API_ROUTES.student.profile)
  );
  return res.data;
}

export async function updateStudentAvatar(avatarUrl?: string): Promise<{ avatar_url: string; status: string }> {
  const res = await postJson<{ success: boolean; data: { avatar_url: string; status: string } }>(
    url(API_ROUTES.student.avatar),
    { avatar_url: avatarUrl }
  );
  return res.data;
}

export async function fetchStudentCurriculum(): Promise<StudentCurriculum> {
  const res = await getJson<{ success: boolean; data: StudentCurriculum }>(
    url(API_ROUTES.student.curriculum)
  );
  return res.data;
}
