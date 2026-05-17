"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import styles from "./index.module.css";
import { 
  Users, Zap, Loader2, BarChart3, Globe, 
  TrendingUp, CheckCircle2, UploadCloud, X, 
  FileText, Database, ChevronRight, Hash, Layers, AlertCircle
} from "lucide-react";
import {
  fetchAdminReport, fetchAdminAlerts, triggerAdminAlerts,
  uploadRegulation, fetchAdminDocuments, fetchAdminChunks,
  type AdminReportData, type AdminAlertsResponse,
  type AdminTriggerResult, type AdminDocument,
  type AdminChunksResponse, type Intervention
} from "@/src/lib/api/admin";

const DUMMY_SUMMARY = {
  total_students: 12540,
  danger_students: 385,
  warning_students: 1240,
  danger_pct: 3.1,
  warning_pct: 9.8,
  safe_pct: 87.1,
  system_health: "94%",
  last_update: "15/05/2026 10:20"
};

export default function AdminDashboardPage() {
  // --- Data States ---
  const [report, setReport] = useState<AdminReportData | null>(null);
  const [alertsData, setAlertsData] = useState<AdminAlertsResponse | null>(null);
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [selectedDocChunks, setSelectedDocChunks] = useState<AdminChunksResponse | null>(null);
  const [triggerResult, setTriggerResult] = useState<AdminTriggerResult | null>(null);
  
  // --- Loading States ---
  const [isLoading, setIsLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // --- UI States ---
  const [adminError, setAdminError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [viewingDocId, setViewingDocId] = useState<number | null>(null);

  const loadAll = useCallback(async () => {
    try {
      setIsLoading(true);
      const [rep, alerts, docs] = await Promise.all([
        fetchAdminReport("all"),
        fetchAdminAlerts("open", 25, 1),
        fetchAdminDocuments()
      ]);
      setReport(rep);
      setAlertsData(alerts);
      setDocuments(docs);
    } catch (err: unknown) {
      setAdminError(err instanceof Error ? err.message : "Lỗi hệ thống");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // --- Handlers ---
  const handleTrigger = async () => {
    setIsTriggering(true);
    try {
      const res = await triggerAdminAlerts();
      setTriggerResult(res);
      await loadAll();
    } catch (err: unknown) {
      setAdminError(err instanceof Error ? err.message : "Lỗi kích hoạt");
    } finally {
      setIsTriggering(false);
    }
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);
    setAdminError(null);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await uploadRegulation(formData);
      setUploadSuccess(`Thành công! Đã tạo ${res.chunks_count} chunks.`);
      await fetchAdminDocuments().then(setDocuments);
      setTimeout(() => { setShowUploadModal(false); setUploadSuccess(null); }, 2000);
    } catch (err: unknown) {
      setAdminError(err instanceof Error ? err.message : "Upload thất bại");
    } finally {
      setIsUploading(false);
    }
  };

  const openChunks = async (docId: number, page = 1) => {
    setViewingDocId(docId);
    try {
      const data = await fetchAdminChunks(docId, page);
      setSelectedDocChunks(data);
    } catch (err) { console.error(err); }
  };

  const stats = useMemo(() => {
    const total = report?.count ?? DUMMY_SUMMARY.total_students;
    if (!report?.students) return { ...DUMMY_SUMMARY, total_students: total };
    
    const danger = report.students.filter(s => s.level === 'danger').length;
    const warning = report.students.filter(s => s.level === 'warning').length;
    const d_pct = Math.round((danger / total) * 100);
    const w_pct = Math.round((warning / total) * 100);

    return {
      total_students: total,
      danger_students: danger || DUMMY_SUMMARY.danger_students,
      warning_students: warning || DUMMY_SUMMARY.warning_students,
      danger_pct: d_pct || DUMMY_SUMMARY.danger_pct,
      warning_pct: w_pct || DUMMY_SUMMARY.warning_pct,
      safe_pct: 100 - d_pct - w_pct,
      system_health: report.generated_at ? "98%" : DUMMY_SUMMARY.system_health,
      last_update: report.generated_at ? new Date(report.generated_at).toLocaleString() : DUMMY_SUMMARY.last_update
    };
  }, [report]);

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-slate-400" size={40}/></div>;

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div>
          <h2 className={styles.heroTitle}>Giám sát Hệ thống EWS</h2>
          <p className={styles.heroSubtitle}>Phân tích dữ liệu học vụ thời gian thực • VinUni AI Ecosystem</p>
        </div>
        <div className={styles.heroRight}>
          <button type="button" className={styles.primaryBtn} onClick={() => setShowUploadModal(true)}>
            <UploadCloud size={18}/> Tải quy chế mới
          </button>
          <p className={styles.refreshHint}>Cập nhật: {stats.last_update}</p>
        </div>
      </section>

      {/* Knowledge Base */}
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h3><Database size={18} className="inline mr-2"/> Kho dữ liệu Quy chế</h3>
          <span className={styles.panelTag}>{documents.length} văn bản</span>
        </div>
        <div className={styles.docGrid}>
          {documents.map((doc) => (
            <div key={doc.doc_id} className={styles.docCard}>
              <div className="flex gap-3 mb-3">
                <FileText className="text-blue-600" size={24}/>
                <div>
                  <h4 className="font-bold text-sm leading-tight">{doc.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">{doc.doc_code}</p>
                </div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded"><Layers size={12} className="inline mr-1"/> {doc.chunk_count} Chunks</span>
                <button type="button" className={styles.actionBtnGhost} onClick={() => openChunks(doc.doc_id)}>
                  Kiểm tra <ChevronRight size={14}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Intervention Table */}
      <div className={styles.tableWrapper}>
        <div className={styles.tableHeader}>
          <button type="button" className={styles.secondaryBtn} onClick={handleTrigger} disabled={isTriggering}>
            {isTriggering ? <Loader2 className="animate-spin" size={16}/> : <Zap size={16}/>} Chạy Alert mới
          </button>
        </div>
        <table className={styles.table}>
          <thead>
            <tr><th>Sinh viên</th><th>Ngày</th><th>Trạng thái</th><th>Ghi chú</th><th className="text-right">Hành động</th></tr>
          </thead>
          <tbody>
            {alertsData?.interventions.map((item, idx) => (
              <tr key={`${item.student_code}-${idx}`}>
                <td className="font-bold">{item.student_name} <span className="block text-xs font-normal text-slate-400">{item.student_code}</span></td>
                <td>{new Date(item.intervention_date).toLocaleDateString()}</td>
                <td><span className={item.status === 'open' ? styles.badgeRed : styles.badgeGreen}>{item.status.toUpperCase()}</span></td>
                <td className="max-w-xs truncate">{item.note}</td>
                <td className="text-right"><button type="button" className={styles.actionBtnGhost}>Chi tiết</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- TỐI ƯU UI: MODAL UPLOAD QUY CHẾ --- */}
      {showUploadModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard} style={{ maxWidth: 540 }}>
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderTitle}>
                <UploadCloud size={20} className="text-blue-700" />
                <h3>Thêm quy chế hệ thống mới</h3>
              </div>
              <button type="button" className={styles.closeBtn} onClick={() => setShowUploadModal(false)}>
                <X size={18}/>
              </button>
            </div>
            
            <form onSubmit={handleUpload} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tiêu đề văn bản quy chế *</label>
                <input name="title" required className={styles.formInput} placeholder="Ví dụ: Quy chế đào tạo đại học chính quy 2026"/>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Số hiệu văn bản</label>
                  <input name="doc_code" className={styles.formInput} placeholder="Ví dụ: 1024/QĐ-VINUNI"/>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Ngày bắt đầu hiệu lực</label>
                  <input name="effective_date" type="date" className={styles.formInput}/>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tệp tin quy chế cấu trúc (Chấp nhận .pdf, .md) *</label>
                <div className={styles.fileUploadZone}>
                  <input type="file" name="file" accept=".pdf,.md" required className={styles.fileInputRaw}/>
                </div>
              </div>
              
              <input type="hidden" name="save_db" value="true" />
              
              {/* Thông báo trạng thái */}
              {uploadSuccess && <div className={`${styles.statusMessage} ${styles.badgeGreen}`}>{uploadSuccess}</div>}
              {adminError && (
                <div className={`${styles.statusMessage} ${styles.badgeRed}`}>
                  <AlertCircle size={15} />
                  <span>{adminError}</span>
                </div>
              )}

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowUploadModal(false)}>Hủy bỏ</button>
                <button type="submit" className={styles.submitFormBtn} disabled={isUploading}>
                  {isUploading ? <Loader2 className="animate-spin" size={16}/> : "Xử lý & Phân tách Chunks"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL CHUNKS VIEW --- */}
      {viewingDocId && selectedDocChunks && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <div className={styles.panelHeader}>
              <div>
                <h3 className="text-lg">{selectedDocChunks.doc.title}</h3>
                <p className="text-xs text-slate-400">Total {selectedDocChunks.total} chunks in vector database</p>
              </div>
              <button type="button" onClick={() => {setViewingDocId(null); setSelectedDocChunks(null);}}><X/></button>
            </div>
            <div className={styles.chunkContainer}>
              {selectedDocChunks.chunks.map((chunk) => (
                <div key={chunk.chunk_id} className={styles.chunkItem}>
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-2">
                    <div className="flex gap-2">
                      <span className={styles.chunkRef}>{chunk.chuong_ref}</span>
                      <span className={styles.chunkRef} style={{background: '#fef3c7', color: '#92400e'}}>{chunk.dieu_ref}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono"><Hash size={10} className="inline"/> {chunk.token_count} tokens</span>
                  </div>
                  <p className={styles.chunkText}>{chunk.chunk_text}</p>
                </div>
              ))}
            </div>
            <div className={styles.modalActions}>
              <button type="button" className={styles.secondaryBtn} disabled={selectedDocChunks.page <= 1} onClick={() => openChunks(viewingDocId, selectedDocChunks.page - 1)}>Trang trước</button>
              <span className="self-center font-bold">Trang {selectedDocChunks.page}</span>
              <button type="button" className={styles.secondaryBtn} disabled={selectedDocChunks.chunks.length < 20} onClick={() => openChunks(viewingDocId, selectedDocChunks.page + 1)}>Trang tiếp</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}