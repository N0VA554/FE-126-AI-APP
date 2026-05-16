"use client";

import { useEffect, useState, useMemo } from "react";
import styles from "./index.module.css";
import {
  Award,
  TrendingUp,
  BookOpen,
  Search,
  ChevronRight,
  FileText,
  Loader2,
  Download
} from "lucide-react";
import { fetchResults, fetchTranscript, type ResultsPayload } from "@/src/lib/api/sis";

export default function GradesPage() {
  const [data, setData] = useState<ResultsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  // State quản lý tab kỳ học đang chọn (mặc định là kỳ đầu tiên index = 0)
  const [selectedSemIdx, setSelectedSemIdx] = useState<number>(0);

  useEffect(() => {
    fetchResults()
      .then((res) => {
        // Nếu API trả về bọc trong object { success, data }, hãy dùng res.data
        // Ở đây map theo cấu trúc dữ liệu ResultsPayload hiện tại của bạn
        setData(res);
      })
      .catch((err) => console.error("Lỗi fetch điểm:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleTranscript = async () => {
    try {
      const transcript = await fetchTranscript();
      setData(transcript);
      window.print();
    } catch (err) {
      console.error("Lỗi in bảng điểm:", err);
    }
  };

  // Xác định kỳ học hiện tại dựa trên Tab được chọn
  const currentSemester = useMemo(() => {
    if (!data?.semesters || data.semesters.length === 0) return null;
    return data.semesters[selectedSemIdx] || data.semesters[0];
  }, [data, selectedSemIdx]);

  // Bộ lọc tìm kiếm môn học tối ưu theo Tab hiện tại
  const filteredCourses = useMemo(() => {
    if (!currentSemester?.courses) return [];
    return currentSemester.courses.filter(c =>
      c.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.course_code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [currentSemester, searchTerm]);

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <Loader2 className={styles.spinner} />
        <p>Đang tải kết quả học tập...</p>
      </div>
    );
  }

  if (!data || !data.semesters) return <div className={styles.errorState}>Không tải được dữ liệu.</div>;

  return (
    <div className={styles.wrapper}>
      {/* Header Section */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Kết quả học tập</h1>
          <p className={styles.subtitle}>
            {data.student.name} · {data.student.student_id} · {data.student.major}
          </p>
        </div>
        {/* <button onClick={handleTranscript} className={styles.printBtn}>
          <FileText size={18} /> In bảng điểm
        </button> */}
      </div>

      {/* Header Stats */}
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

      {/* Thanh điều hướng Tab chuyển đổi giữa các năm học */}
      <div className={styles.tabsContainer}>
        {data.semesters.map((sem, idx) => (
          <button
            key={`tab-${sem.semester_year}-${idx}`}
            className={`${styles.tabItem} ${selectedSemIdx === idx ? styles.tabActive : ""}`}
            onClick={() => {
              setSelectedSemIdx(idx);
              setSearchTerm(""); // Reset tìm kiếm khi chuyển tab
            }}
          >
            Năm {sem.semester_year}
            <span className={styles.tabGpaBadge}>
              {sem.gpa4 !== null && sem.gpa4 !== undefined ? `GPA: ${sem.gpa4}` : "N/A"}
            </span>
          </button>
        ))}
      </div>

      <div className={styles.contentGrid}>
        {/* Main Grades Table */}
        <div className={styles.tablePanel}>
          <div className={styles.panelHeader}>
            <div>
              <h3>Chi tiết học phần năm {currentSemester?.semester_year}</h3>
              <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>
                Số tín chỉ đăng ký: <strong>{currentSemester?.credits} TC</strong> • Đạt: <strong>{currentSemester?.earned_credits} TC</strong>
              </p>
            </div>
            <div className={styles.actions}>
              <div className={styles.searchBox}>
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Tìm môn học trong kỳ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className={styles.iconBtn} onClick={handleTranscript} title="Tải bảng điểm">
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
                {filteredCourses.length > 0 ? (
                  filteredCourses.map((course) => (
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
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
                      Không tìm thấy học phần nào trùng khớp hoặc chưa có điểm.
                    </td>
                  </tr>
                )}
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
              <span>Tiến độ tín chỉ toàn khóa</span>
              <strong>{Math.round((data.summary.earned_credits / 120) * 100)}%</strong>
            </div>
            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{ width: `${Math.min(100, (data.summary.earned_credits / 120) * 100)}%` }}
              ></div>
            </div>
            <p className={styles.goalHint}>
              Bạn đã hoàn thành <strong>{data.summary.earned_credits}</strong> tín chỉ tích lũy. Số tín chỉ trượt/F cần cải thiện: <span style={{ color: "#ef4444", fontWeight: 700 }}>{data.summary.failed_credits || 0} TC</span>.
            </p>
          </div>

          <div className={styles.historyList}>
            <h4 className={styles.listTitle}>Lịch sử tiến trình gpa</h4>
            {data.semesters.map((sem, i) => (
              <div 
                key={`history-${i}`} 
                className={`${styles.historyItem} ${selectedSemIdx === i ? styles.historyItemActive : ""}`}
                onClick={() => setSelectedSemIdx(i)}
              >
                <span>Năm {sem.semester_year}</span>
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