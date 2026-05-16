"use client";

import { useEffect, useState } from "react";
import styles from "./index.module.css";
import { 
  CalendarDays, 
  CheckCircle2, 
  XCircle, 
  FileBadge, 
  Award, 
  Info, 
  Clock, 
  MapPin,
  AlertCircle
} from "lucide-react";
import { fetchAdmitCard, fetchExams, type ExamsPayload } from "@/src/lib/api/sis";

export default function ExamsCenterPage() {
  const [data, setData] = useState<ExamsPayload | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExams()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const handleAdmit = async (examId: number) => {
    try {
      await fetchAdmitCard(examId);
      setMessage("Phiếu dự thi đã sẵn sàng để in.");
      window.print();
    } catch {
      setMessage("Không đủ điều kiện lấy phiếu dự thi.");
    }
  };

  if (loading) return <div className={styles.statCard}>Đang tải lịch thi...</div>;
  if (!data) return <div className={styles.statCard}>Lỗi tải dữ liệu.</div>;

  return (
    <div className={styles.wrapper}>
      {/* 1. Stats Cards Section */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <p>Tổng môn thi</p>
            <h3>{data.count}</h3>
          </div>
          <div className={`${styles.statIcon} ${styles.bgNavy}`}><CalendarDays size={24} /></div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <p>Đủ điều kiện</p>
            <h3>{data.eligible_count}</h3>
          </div>
          <div className={`${styles.statIcon} ${styles.bgEmerald}`}><CheckCircle2 size={24} /></div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <p>Sinh viên</p>
            <h3 style={{ fontSize: '1.25rem' }}>{data.student.name.split(' ').pop()}</h3>
          </div>
          <div className={`${styles.statIcon} ${styles.bgGold}`}><Award size={24} /></div>
        </div>
      </div>

      {/* 2. Main Content Grid */}
      <div className={styles.contentGrid}>
        
        {/* Left Column: List of Exams */}
        <div className={styles.examPanel}>
          <div className={styles.panelHeader}>
            <h3>Lịch thi chi tiết</h3>
            {message && <span className={styles.alert}>{message}</span>}
          </div>

          <div className={styles.examList}>
            {data.exams.map((exam) => (
              <div key={exam.exam_id} className={styles.examItem}>
                <div className={styles.examMainInfo}>
                  <div className={`${styles.statusIndicator} ${exam.is_eligible ? styles.pass : styles.fail}`}>
                    {exam.is_eligible ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                  </div>
                  <div>
                    <span className={styles.courseCode}>{exam.course_code}</span>
                    <h2 className={styles.courseName}>{exam.course_name}</h2>
                    <div className={styles.examDetails}>
                      <span className="flex items-center gap-1"><Clock size={14}/> {exam.exam_date} ({exam.start_time})</span>
                      <span className="flex items-center gap-1"><MapPin size={14}/> {exam.room} - Ghế {exam.seat_number}</span>
                    </div>
                  </div>
                </div>

                <button
                  disabled={!exam.is_eligible}
                  onClick={() => handleAdmit(exam.exam_id)}
                  className={styles.admitBtn}
                >
                  <FileBadge size={16} /> Phiếu dự thi
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Side Analysis/Rules */}
        <div className={styles.sidePanel}>
          <div className={styles.infoCard}>
            <h4><AlertCircle size={18} /> Trạng thái điều kiện</h4>
            <div className={styles.examDetails} style={{ flexDirection: 'column', gap: '0.5rem' }}>
              <p>Môn đủ điều kiện: <strong>{data.eligible_count}</strong></p>
              <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px' }}>
                <div style={{ 
                  width: `${(data.eligible_count / data.count) * 100}%`, 
                  height: '100%', 
                  background: '#10b981', 
                  borderRadius: '4px' 
                }} />
              </div>
              <p style={{ fontSize: '0.75rem' }}>Dựa trên chuyên cần và điểm quá trình.</p>
            </div>
          </div>

          <div className={styles.infoCard}>
            <h4><Info size={18} /> Quy định phòng thi</h4>
            <div className={styles.ruleItem}>• Có mặt trước giờ thi 15 phút.</div>
            <div className={styles.ruleItem}>• Mang theo thẻ SV và Phiếu dự thi.</div>
            <div className={styles.ruleItem}>• Không mang thiết bị điện tử vào phòng.</div>
            <div className={styles.ruleItem}>• Tuân thủ hướng dẫn của giám thị.</div>
          </div>
        </div>

      </div>
    </div>
  );
}