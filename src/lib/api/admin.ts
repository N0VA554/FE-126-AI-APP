import { getJson, postJson } from "./http";
import { API_ROUTES } from "./routes";
import { API_BASE_URL } from "./config";

const buildUrl = (endpoint: string) => `${API_BASE_URL}${endpoint}`;

/** --- INTERFACES --- **/
export interface StudentInfo {
  student_code?: string;
  student_id?: string;
  student_name?: string;
  level?: "danger" | "warning" | "safe";
  [key: string]: unknown;
}

export interface Intervention {
  student_code: string;
  student_name: string;
  intervention_date: string;
  status: "open" | "resolved" | "pending";
  note: string;
  follow_up_date?: string;
}

export interface AdminReportData {
  count: number;
  generated_at: string;
  level_filter: string;
  students: StudentInfo[];
}

export interface AdminAlertsResponse {
  count: number;
  interventions: Intervention[];
  page?: number;
  limit?: number;
}

export interface AdminTriggerResult {
  triggered: number;
  skipped: number;
  total_at_risk: number;
  db_available: boolean;
  message?: string;
}

export interface UploadRegulationResponse {
  success: boolean;
  message: string;
  chunks_count?: number;
  doc_id?: string;
}

export interface AdminDocument {
  doc_id: number;
  title: string;
  doc_code: string;
  doc_type: string;
  effective_date: string;
  chunk_count: number;
  file_name: string;
  is_active: number;
  created_at: string;
}

export interface AdminChunk {
  chunk_id: number;
  chunk_index: number;
  chunk_text: string;
  chuong_ref: string;
  dieu_ref: string;
  token_count: number;
}

export interface AdminChunksResponse {
  chunks: AdminChunk[];
  doc: {
    doc_id: number;
    title: string;
    doc_code: string;
    chunk_count: number;
  };
  total: number;
  page: number;
  limit: number;
}

/** --- API FUNCTIONS --- **/

export async function fetchAdminReport(level = "all"): Promise<AdminReportData> {
  const url = buildUrl(`${API_ROUTES.admin.report}?level=${encodeURIComponent(level)}`);
  const res = await getJson<{ success: boolean; data: AdminReportData }>(url);
  return res.data;
}

export async function fetchAdminAlerts(status = "open", limit = 25, page = 1): Promise<AdminAlertsResponse> {
  const url = buildUrl(`${API_ROUTES.admin.alerts}?status=${encodeURIComponent(status)}&limit=${limit}&page=${page}`);
  const res = await getJson<{ success: boolean; data: AdminAlertsResponse }>(url);
  return res.data;
}

export async function triggerAdminAlerts(): Promise<AdminTriggerResult> {
  const url = buildUrl(API_ROUTES.admin.alertsTrigger);
  const res = await postJson<{ success: boolean; data: AdminTriggerResult }>(url, {});
  return res.data;
}

export async function uploadRegulation(formData: FormData): Promise<UploadRegulationResponse> {
  const url = buildUrl('admin/upload'); 
  const response = await fetch(url, { method: 'POST', body: formData });
  if (!response.ok) throw new Error("Lỗi khi tải lên quy chế");
  return await response.json();
}

export async function fetchAdminDocuments(): Promise<AdminDocument[]> {
  const url = buildUrl('admin/documents');
  const res = await getJson<{ success: boolean; data: { documents: AdminDocument[] } }>(url);
  return res.data.documents;
}

export async function fetchAdminChunks(docId: number, page = 1, limit = 20): Promise<AdminChunksResponse> {
  const url = buildUrl(`admin/chunks/${docId}?page=${page}&limit=${limit}`);
  const res = await getJson<{ success: boolean; data: AdminChunksResponse }>(url);
  return res.data;
}