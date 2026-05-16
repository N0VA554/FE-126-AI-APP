"use client";

import { useEffect, useState } from "react";
import styles from "./index.module.css";
import {
  Award,
  TrendingUp,
  BookOpen,
  Search,
  Download,
  ChevronRight,
  FileText,
  Loader2
} from "lucide-react";
import { fetchResults, fetchTranscript, type ResultsPayload } from "@/src/lib/api/sis";

export default function GradesPage() {
  const [data, setData] = useState<ResultsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Logic Call Data từ file 2
  useEffect(() => {
    fetchResults()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const handleTranscript = async () => {
    const transcript = await fetchTranscript();
    setData(transcript);
    window.print();
  };

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <Loader2 className={styles.spinner} />
        <p>Đang tải kết quả học tập...</p>
      </div>
    );
  }

  if (!data) return <div className={styles.errorState}>Không tải được dữ liệu.</div>;

  // Lấy kỳ học đầu tiên để hiển thị bảng chi tiết
  const currentSemester = data.semesters[0];

  // Lọc môn học theo tìm kiếm
  const filteredCourses = currentSemester?.courses.filter(c =>
    c.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.course_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.wrapper}>
      {/* Header Section (Hợp nhất từ cả 2 file) */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Kết quả học tập</h1>
          <p className={styles.subtitle}>
            {data.student.name} · {data.student.student_id} · {data.student.major}
          </p>
        </div>
        <button onClick={handleTranscript} className={styles.printBtn}>
          <FileText size={18} /> In bảng điểm
        </button>
      </div>

      {/* Header Stats - UI File 1, Data File 2 */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <p>GPA Tích lũy (4.0)</p>
            <h3>{data.summary.cumulative_gpa4 ?? "—"}</h3>
          </div>
          <div className={`${styles.statIcon} ${styles.bgGold}`}><Award size={24} /></div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <p>Tín chỉ tích lũy</p>
            <h3>{data.summary.earned_credits} / 120</h3>
          </div>
          <div className={`${styles.statIcon} ${styles.bgNavy}`}><BookOpen size={24} /></div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <p>Học phần đã học</p>
            <h3>{data.summary.course_count}</h3>
          </div>
          <div className={`${styles.statIcon} ${styles.bgGreen}`}><TrendingUp size={24} /></div>
        </div>
      </div>

      <div className={styles.contentGrid}>
        {/* Main Grades Table */}
        <div className={styles.tablePanel}>
          <div className={styles.panelHeader}>
            <h3>Chi tiết {currentSemester?.semester_year}</h3>
            <div className={styles.actions}>
              <div className={styles.searchBox}>
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Tìm môn học..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className={styles.iconBtn} onClick={handleTranscript}>
                <Download size={18} />
              </button>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Mã môn</th>
                  <th>Tên môn học</th>
                  <th>Số TC</th>
                  <th>Điểm 10</th>
                  <th>Thang 4</th>
                  <th>Chữ</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses?.map((course) => (
                  <tr key={course.enrollment_id}>
                    <td className={styles.codeCell}>{course.course_code}</td>
                    <td className={styles.nameCell}>{course.course_name}</td>
                    <td>{course.credits}</td>
                    <td>{typeof course.weighted_score === "number" ? course.weighted_score.toFixed(2) : "—"}</td>
                    <td className={styles.boldCell}>{course.gpa4 ?? "—"}</td>
                    <td><span className={styles.gradeBadge}>{course.grade_letter}</span></td>
                    <td>
                      <span className={course.retake_required ? styles.statusRed : styles.statusGreen}>
                        {course.retake_required ? "Học lại" : "Đạt"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side Analysis */}
        <div className={styles.sidePanel}>
          <div className={styles.panelHeader}>
            <h3>Phân tích mục tiêu AI</h3>
          </div>

          <div className={styles.goalCard}>
            <div className={styles.goalHeader}>
              <span>Tiến độ tín chỉ</span>
              <strong>{Math.round((data.summary.earned_credits / 120) * 100)}%</strong>
            </div>
            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{ width: `${(data.summary.earned_credits / 120) * 100}%` }}
              ></div>
            </div>
            <p className={styles.goalHint}>
              Bạn đã hoàn thành <strong>{data.summary.earned_credits}</strong> tín chỉ trên tổng số 120 tín chỉ yêu cầu.
            </p>
          </div>

          <div className={styles.historyList}>
            <h4 className={styles.listTitle}>Lịch sử học tập</h4>
            {data.semesters.map((sem, i) => (
              <div key={i} className={styles.historyItem}>
                <span>{sem.semester_year}</span>
                <div className={styles.semGpa}>
                  <strong>{sem.gpa4 ?? "—"}</strong>
                  <ChevronRight size={16} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
