// ============================================================
// data.ts — Mock data khớp với backend students.json
// Dùng làm fallback khi API chưa trả về hoặc chưa đăng nhập
// ============================================================

export type RiskStatus = 'RED' | 'YELLOW' | 'GREEN';

export interface Student {
  id: string;
  name: string;
  score: number;
  status: RiskStatus;
  absentRate: number;       // % vắng không phép
  excusedRate: number;      // % vắng có phép
  avgGrade: number;         // điểm TB thang 10
  gpa4: number | null;      // GPA thang 4.0
  email: string;
  loginCount: number;
}

// Dữ liệu khớp với src/ews_engine.py JSON fallback (students.json seed=42)
export const TOP_RISK_STUDENTS: Student[] = [
  { id: "SV015", name: "Cao Văn Quý",      score: 80, status: "RED",    absentRate: 25.0, excusedRate: 5.8,  avgGrade: 3.12, gpa4: 0.0,  email: "sv015@student.edu.vn", loginCount: 2  },
  { id: "SV010", name: "Ngô Thị Lan",      score: 74, status: "RED",    absentRate: 25.8, excusedRate: 4.2,  avgGrade: 2.42, gpa4: 0.0,  email: "sv010@student.edu.vn", loginCount: 4  },
  { id: "SV011", name: "Trịnh Văn Mạnh",   score: 72, status: "RED",    absentRate: 22.5, excusedRate: 3.3,  avgGrade: 2.80, gpa4: 0.0,  email: "sv011@student.edu.vn", loginCount: 3  },
  { id: "SV012", name: "Lý Thị Ngọc",      score: 68, status: "RED",    absentRate: 20.8, excusedRate: 2.5,  avgGrade: 3.05, gpa4: 0.0,  email: "sv012@student.edu.vn", loginCount: 5  },
  { id: "SV006", name: "Đặng Thị Phương",  score: 42, status: "YELLOW", absentRate: 12.5, excusedRate: 2.5,  avgGrade: 5.63, gpa4: 1.38, email: "sv006@student.edu.vn", loginCount: 12 },
  { id: "SV007", name: "Vũ Minh Quân",     score: 40, status: "YELLOW", absentRate: 11.7, excusedRate: 3.3,  avgGrade: 5.72, gpa4: 1.50, email: "sv007@student.edu.vn", loginCount: 14 },
  { id: "SV008", name: "Bùi Thị Hoa",      score: 38, status: "YELLOW", absentRate: 10.8, excusedRate: 1.7,  avgGrade: 5.85, gpa4: 1.63, email: "sv008@student.edu.vn", loginCount: 10 },
  { id: "SV009", name: "Đỗ Văn Kiên",      score: 36, status: "YELLOW", absentRate: 10.0, excusedRate: 2.5,  avgGrade: 5.95, gpa4: 1.75, email: "sv009@student.edu.vn", loginCount: 11 },
  { id: "SV013", name: "Phan Văn Ổn",      score: 35, status: "YELLOW", absentRate: 9.2,  excusedRate: 4.2,  avgGrade: 6.10, gpa4: 2.00, email: "sv013@student.edu.vn", loginCount: 13 },
  { id: "SV001", name: "Nguyễn Văn An",    score: 12, status: "GREEN",  absentRate: 0.8,  excusedRate: 3.3,  avgGrade: 7.50, gpa4: 3.00, email: "sv001@student.edu.vn", loginCount: 22 },
];

// Alias tương thích với code cũ
export const TOP_10_RISK = TOP_RISK_STUDENTS.map(s => ({
  id: s.id, name: s.name, score: s.score, status: s.status,
  absentRate: s.absentRate, avgGrade: s.avgGrade, email: s.email,
}));

// Demo accounts cho hướng dẫn chạy thử
export const DEMO_ACCOUNTS = [
  { role: "ADMIN",   email: "admin@school.edu.vn",  password: "admin123",  note: "Xem toàn bộ dashboard + alerts" },
  { role: "STUDENT", email: "sv001@student.edu.vn", password: "student123", note: "Sinh viên an toàn (EWS: 12/100)" },
  { role: "STUDENT", email: "sv010@student.edu.vn", password: "student123", note: "Sinh viên nguy cơ cao (EWS: 74/100)" },
];
