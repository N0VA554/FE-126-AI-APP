"use client";
import { useState } from "react";
import styles from "./index.module.css";
import { 
  Users, AlertTriangle, Search, Download, 
  ExternalLink, Mail, MessageCircle, X, Filter,
  ChevronRight, TrendingUp, MoreHorizontal
} from "lucide-react";

// --- DUMMY DATA ---
const CLASSES = [
  { id: 'COMP301', name: 'Machine Learning', total: 45, riskCount: 5, gpa: 3.2, semester: 'Semester 2 - 2026', type: 'Lecture' },
  { id: 'COMP202', name: 'Database Systems', total: 38, riskCount: 2, gpa: 3.5, semester: 'Semester 2 - 2026', type: 'Lab' },
  { id: 'AI101', name: 'Intro to AI', total: 120, riskCount: 15, gpa: 2.8, semester: 'Semester 2 - 2026', type: 'Lecture' },
  { id: 'DATA402', name: 'Big Data Analytics', total: 30, riskCount: 0, gpa: 3.7, semester: 'Semester 1 - 2026', type: 'Seminar' },
];

const STUDENT_LISTS: Record<string, any[]> = {
  'COMP301': [
    { id: '2023001', name: 'Lê Hải Nam', gpa: 2.1, absent: '25%', risk: 85, status: 'RED', email: 'nam.lh@vinuni.edu.vn' },
    { id: '2023042', name: 'Nguyễn Minh Anh', gpa: 3.8, absent: '5%', risk: 10, status: 'GREEN', email: 'anh.nm@vinuni.edu.vn' },
    { id: '2023015', name: 'Trần Hoàng Bách', gpa: 2.9, absent: '15%', risk: 45, status: 'YELLOW', email: 'bach.th@vinuni.edu.vn' },
  ],
  // ... data cho các lớp khác
};

export default function ClassesManagement() {
  const [selectedClass, setSelectedClass] = useState<any>(null);

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.pageTitle}>Quản lý danh sách lớp</h2>
          <p className={styles.pageSubtitle}>Theo dõi chỉ số rủi ro và quản lý sinh viên theo từng học phần.</p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.searchBox}>
            <Search size={18} />
            <input type="text" placeholder="Tìm mã lớp, tên môn..." />
          </div>
          <button className={styles.exportBtn}><Download size={18} /> Xuất dữ liệu</button>
        </div>
      </div>

      {/* --- BẢNG DANH SÁCH LỚP HỌC --- */}
      <div className={styles.tableCard}>
        <table className={styles.mainTable}>
          <thead>
            <tr>
              <th>Mã lớp / Học phần</th>
              <th>Học kỳ</th>
              <th>Loại hình</th>
              <th>Sĩ số</th>
              <th>Cảnh báo rủi ro</th>
              <th>GPA Trung bình</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {CLASSES.map((cls) => (
              <tr key={cls.id} className={styles.tableRow} onClick={() => setSelectedClass(cls)}>
                <td>
                  <div className={styles.classInfo}>
                    <span className={styles.classId}>{cls.id}</span>
                    <span className={styles.className}>{cls.name}</span>
                  </div>
                </td>
                <td><span className={styles.semesterText}>{cls.semester}</span></td>
                <td><span className={styles.typeTag}>{cls.type}</span></td>
                <td>
                  <div className={styles.iconText}>
                    <Users size={16} /> {cls.total}
                  </div>
                </td>
                <td>
                  <div className={`${styles.riskBadge} ${cls.riskCount > 5 ? styles.riskHigh : styles.riskLow}`}>
                    <AlertTriangle size={14} /> {cls.riskCount} Sinh viên
                  </div>
                </td>
                <td>
                  <div className={styles.gpaInfo}>
                    <TrendingUp size={16} /> <strong>{cls.gpa}</strong>
                  </div>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button className={styles.viewBtn}>
                    Chi tiết <ChevronRight size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- POPUP CHI TIẾT (GIỮ NGUYÊN GIAO DIỆN CAO CẤP) --- */}
      {selectedClass && (
        <div className={styles.modalOverlay} onClick={() => setSelectedClass(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setSelectedClass(null)}><X size={28} /></button>
            
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleArea}>
                <h2>{selectedClass.id} - {selectedClass.name}</h2>
                <p>Toàn bộ danh sách sinh viên và chỉ số dự báo rủi ro</p>
              </div>
              <div className={styles.modalQuickStats}>
                <div className={styles.qStat}>
                  <label>Sĩ số</label>
                  <span>{selectedClass.total}</span>
                </div>
                <div className={styles.qStat}>
                  <label>Nguy cơ</label>
                  <span style={{color: '#ef4444'}}>{selectedClass.riskCount}</span>
                </div>
              </div>
            </div>

            <div className={styles.studentTableWrapper}>
              <table className={styles.studentTable}>
                <thead>
                  <tr>
                    <th>Sinh viên</th>
                    <th>Mã số</th>
                    <th>Vắng mặt</th>
                    <th>GPA</th>
                    <th>Risk Score</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {(STUDENT_LISTS[selectedClass.id] || STUDENT_LISTS['COMP301']).map((sv) => (
                    <tr key={sv.id}>
                      <td>
                        <div className={styles.stCell}>
                          <div className={styles.stAvatar}>{sv.name.charAt(0)}</div>
                          <strong>{sv.name}</strong>
                        </div>
                      </td>
                      <td>{sv.id}</td>
                      <td className={styles.boldNavy}>{sv.absent}</td>
                      <td className={styles.boldNavy}>{sv.gpa}</td>
                      <td>
                        <div className={styles.riskBarContainer}>
                          <div className={styles.riskBarFill} style={{ width: `${sv.risk}%`, backgroundColor: sv.status === 'RED' ? '#ef4444' : '#C5A25D' }} />
                          <span className={styles.riskNum}>{sv.risk}</span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.stActions}>
                          <button className={styles.stBtn}><Mail size={16} /></button>
                          <button className={styles.stBtn}><MessageCircle size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}