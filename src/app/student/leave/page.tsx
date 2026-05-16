"use client";
import styles from "./index.module.css";
import { Upload, Clock, CheckCircle2, AlertTriangle, FileText, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { fetchStudentClasses, type StudentClass } from "@/src/lib/api/ews";

export default function LeavePage() {
  const [subjects, setSubjects] = useState<StudentClass[]>([]);

  useEffect(() => {
    fetchStudentClasses()
      .then((payload) => setSubjects(payload.subjects))
      .catch(() => setSubjects([]));
  }, []);

  const attendance = useMemo(() => {
    let totalSessions = 0;
    let absentUnexcused = 0;
    for (const s of subjects) {
      const sessions = s.total_sessions ?? 0;
      const absent = s.absent_unexcused ?? 0;
      if (sessions > 0) {
        totalSessions += sessions;
        absentUnexcused += absent;
      }
    }
    const absencePct = totalSessions > 0 ? (absentUnexcused * 100) / totalSessions : 0;
    const attendancePct = Math.max(0, 100 - absencePct);
    return {
      totalSessions,
      absentUnexcused,
      attendancePct,
    };
  }, [subjects]);

  return (
    <div className={styles.wrapper}>
      {/* Header Summary */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}><CheckCircle2 /></div>
          <div>
            <p>Tỷ lệ chuyên cần</p>
            <h3>{attendance.totalSessions ? `${attendance.attendancePct.toFixed(1)}%` : "—"}</h3>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon} style={{backgroundColor: '#fff7ed', color: '#ea580c'}}><AlertTriangle /></div>
          <div>
            <p>Số buổi đã vắng</p>
            <h3>{attendance.totalSessions ? `${String(attendance.absentUnexcused).padStart(2, "0")} buổi` : "—"}</h3>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon} style={{backgroundColor: '#f0f9ff', color: '#0369a1'}}><FileText /></div>
          <div>
            <p>Yêu cầu đang chờ</p>
            <h3>01 đơn</h3>
          </div>
        </div>
      </div>

      <div className={styles.mainGrid}>
        {/* Form đăng ký */}
        <div className={styles.formPanel}>
          <div className={styles.panelHeader}>
            <h3>Đăng ký nghỉ phép mới</h3>
            <p>Vui lòng cung cấp minh chứng chính xác để AI đối soát điểm danh.</p>
          </div>
          
          <div className={styles.formContent}>
            <div className={styles.inputGroup}>
              <label>Môn học & Tiết học</label>
              <select className={styles.select}>
                <option>Machine Learning (Thứ 2 • Tiết 1-3)</option>
                <option>Ethics in AI (Thứ 4 • Tiết 7-9)</option>
                <option>Big Data Lab (Thứ 6 • Tiết 4-6)</option>
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label>Lý do nghỉ phép</label>
              <textarea className={styles.textarea} placeholder="Mô tả lý do vắng mặt của bạn..."></textarea>
            </div>

            <div className={styles.inputGroup}>
              <label>Tệp minh chứng (Medical/Official Documents)</label>
              <div className={styles.dropzone}>
                <Upload size={32} className={styles.uploadIcon} />
                <div className={styles.dropzoneText}>
                  <strong>Kéo thả tệp vào đây</strong>
                  <span>Hỗ trợ PDF, JPG, PNG (Tối đa 5MB)</span>
                </div>
                <input type="file" className={styles.hiddenInput} />
              </div>
            </div>

            <button className={styles.submitBtn}>
              <Plus size={18} /> Gửi yêu cầu phê duyệt
            </button>
          </div>
        </div>

        {/* Lịch sử */}
        <div className={styles.historyPanel}>
          <div className={styles.panelHeader}>
            <h3>Lịch sử vắng mặt</h3>
          </div>
          <div className={styles.historyList}>
            {[
              { subject: 'Machine Learning', date: '05/05/2026', status: 'Pending', type: 'Sickness' },
              { subject: 'Database Systems', date: '20/04/2026', status: 'Approved', type: 'Event' }
            ].map((item, idx) => (
              <div key={idx} className={styles.historyCard}>
                <div className={styles.cardIndicator} style={{backgroundColor: item.status === 'Pending' ? '#C5A25D' : '#3fb46d'}} />
                <div className={styles.cardBody}>
                  <div className={styles.cardTitle}>
                    <strong>{item.subject}</strong>
                    <span className={item.status === 'Pending' ? styles.badgePending : styles.badgeApproved}>
                      {item.status}
                    </span>
                  </div>
                  <div className={styles.cardMeta}>
                    <span><Clock size={12} /> {item.date}</span>
                    <span>•</span>
                    <span>{item.type}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
