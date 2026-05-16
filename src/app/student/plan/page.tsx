"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import styles from "./index.module.css";
import {
  Sparkles, BookOpen, GraduationCap,
  Send, Loader2, AlertTriangle, CheckCircle2, 
  MousePointerClick, XCircle, Lock, Clock, CalendarX
} from "lucide-react";
import {
  fetchRegistrationAdvisor,
  refreshRegistrationAdvisor,
  registerCourse,
  type RegistrationAdvisorPayload
} from "@/src/lib/api/sis";
import { useAuth } from "@/src/context/AuthContext";
import { PUBLIC_API_BASE_URL } from "@/src/lib/api/config";

// --- TYPES & INTERFACES DEFINITIONS ---
type Mode = "normal" | "fast_track" | "on_time";
type TimelineStatus = "done" | "doing" | "fail" | "blocked" | "yet";

interface TimetableSlot {
  course_id: number;
  course_name: string;
  day_of_week: number | string;
  start_time: string;
  end_time: string;
  room_number?: string;
}

interface SuggestedCourse {
  course_id: number;
  course_code: string;
  course_name: string;
  credits: number;
  priority: number;
  reason: string;
  suggested_section_id?: string;
  section_id?: string;
  schedule_id?: number | string;
}

interface UnscheduledCourse {
  course?: {
    course_id: number;
  };
  reason: string;
}

interface PlanCourse {
  course_id: number;
  course_code: string;
  course_name?: string;
  semester_index: number;
  was_retaken?: boolean;
  is_retaking?: boolean;
  credits?: number;
  description?: string;
}

interface PlanData {
  completed?: PlanCourse[];
  enrolled?: PlanCourse[];
  failed?: PlanCourse[];
  blocked?: PlanCourse[];
  recommended?: PlanCourse[];
  not_taken?: PlanCourse[];
  student: {
    current_semester: number;
    academic_status?: string;
  };
  target_semester?: number;
}

interface TypedTimelineCourse extends PlanCourse {
  status: TimelineStatus;
}

interface TimelineGroup {
  semester: string;
  courses: TypedTimelineCourse[];
  isCurrent: boolean;
}

interface SelectedCourseDetail {
  course_id: number;
  course_code: string;
  course_name?: string;
  credits?: number;
  description?: string;
}

export default function EnrollmentPlannerPage() {
  const { user } = useAuth();
  const [data, setData] = useState<RegistrationAdvisorPayload | null>(null);
  const [baseStats, setBaseStats] = useState<RegistrationAdvisorPayload | null>(null);
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [mode, setMode] = useState<Mode>("normal");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<SelectedCourseDetail | null>(null);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [hasLoadedAdvice, setHasLoadedAdvice] = useState(false);

  // --- STATE TOAST MESSAGE ---
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // --- LOGIC ADVISOR ---
  const getAIAdvice = useCallback(async (targetMode: Mode, isAutoLoad = false) => {
    if (!isAutoLoad) setLoading(true);
    try {
      const studentId = user?.username || "string";
      const res = await fetchRegistrationAdvisor(studentId, targetMode);
      setData(res);
      setBaseStats(res);
      setSelectedIds([]); 
    } catch (error) {
      console.error("Lỗi khi lấy tư vấn:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.username]);

  // --- LOGIC TIMELINE & MASTER DATA ---
  const fetchTimeline = useCallback(async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${PUBLIC_API_BASE_URL}student/enrollment/plan/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) setPlanData(result.data);
    } catch (error) {
      console.error("Lỗi fetch timeline:", error);
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.username) {
      fetchTimeline();
      if (!hasLoadedAdvice) {
        getAIAdvice(mode, true).then(() => setHasLoadedAdvice(true));
      }
    }
  }, [user?.username, mode, hasLoadedAdvice, fetchTimeline, getAIAdvice]);

  const handleModeChange = (newMode: Mode) => {
    if (newMode !== mode) {
      setMode(newMode);
      setData(null);
      setSelectedIds([]);
      getAIAdvice(newMode);
    }
  };

  const refreshAdvisor = async (targetMode: Mode) => {
    setLoading(true);
    try {
      const studentId = user?.username || "string";
      const res = await refreshRegistrationAdvisor(studentId, targetMode);
      setData(res);
      setBaseStats(res);
      setSelectedIds([]);
    } catch (error) {
      console.error("Lỗi khi refresh tư vấn:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIC ĐĂNG KÝ MÔN HỌC ---
  const handleRegisterOneCourse = async () => {
    if (!data) {
      showToast("Không có dữ liệu môn học.", "error");
      return;
    }
    if (selectedIds.length !== 1) {
      showToast("Vui lòng chọn đúng 1 môn để đăng ký.", "error");
      return;
    }

    const selectedId = selectedIds[0];
    const suggestedCourses = (data.suggested_courses as SuggestedCourse[]) || [];
    const course = suggestedCourses.find(c => c.course_id === selectedId);
    if (!course) {
      showToast("Môn được chọn không hợp lệ.", "error");
      return;
    }

    const courseId = course.course_code || course.course_id?.toString();
    const sectionId = (course.suggested_section_id || course.section_id || course.schedule_id?.toString() || "").trim();

    if (!courseId) {
      showToast("Không tìm thấy mã môn để đăng ký.", "error");
      return;
    }

    setRegisterLoading(true);
    try {
      const studentId = user?.username || "string";
      const result = await registerCourse(studentId, courseId, sectionId || undefined);
      
      if (result && result.success === false) {
        showToast(result.error || "Đăng ký không thành công.", "error");
      } else {
        showToast(result.message || "Đăng ký môn học thành công.", "success");
        setSelectedIds([]);
        fetchTimeline();
      }
    } catch (error: any) {
      console.error("Lỗi khi gọi API đăng ký:", error);
      const serverError = error?.body?.error || error?.message || "Lỗi hệ thống khi đăng ký môn học.";
      showToast(serverError, "error");
    } finally {
      setRegisterLoading(false);
    }
  };

  // --- DATA SAFE CASTING VIA USEMEMO ---
  const scheduledCourseIds = useMemo(() => {
    const timetable = (data?.timetable as TimetableSlot[]) || [];
    return new Set<number>(timetable.map(slot => slot.course_id));
  }, [data]);

  const unscheduledCourseMap = useMemo(() => {
    const map = new Map<number, string>();
    const unscheduled = (data?.unscheduled_courses as UnscheduledCourse[]) || [];
    unscheduled.forEach(item => {
      if (item?.course?.course_id) {
        map.set(item.course.course_id, item.reason);
      }
    });
    return map;
  }, [data]);

  const filteredTimetable = useMemo(() => {
    const timetable = (data?.timetable as TimetableSlot[]) || [];
    return timetable.filter(slot => selectedIds.includes(slot.course_id));
  }, [selectedIds, data]);

  const getUnscheduledReason = (courseId: number) => {
    return unscheduledCourseMap.get(courseId) ?? null;
  };

  const currentCredits = useMemo(() => {
    if (!data) return 0;
    const suggestedCourses = (data.suggested_courses as SuggestedCourse[]) || [];
    return suggestedCourses
      .filter(c => selectedIds.includes(c.course_id))
      .reduce((sum, c) => sum + c.credits, 0);
  }, [selectedIds, data]);

  const timelineGroups = useMemo<TimelineGroup[]>(() => {
    if (!planData) return [];
    
    const all: TypedTimelineCourse[] = [
      ...(planData.completed || []).map(c => ({ ...c, status: "done" as const })),
      ...(planData.enrolled || []).map(c => ({ ...c, status: "doing" as const })),
      ...(planData.failed || []).map(c => ({ ...c, status: "fail" as const })),
      ...(planData.blocked || []).map(c => ({ ...c, status: "blocked" as const })),
      ...(planData.recommended || []).map(c => ({ ...c, status: "yet" as const })),
      ...(planData.not_taken || []).map(c => ({ ...c, status: "yet" as const })),
    ];

    const groups = all.reduce<Record<number, TypedTimelineCourse[]>>((acc, c) => {
      const k = c.semester_index;
      if (!acc[k]) acc[k] = [];
      acc[k].push(c);
      return acc;
    }, {});

    return Object.keys(groups)
      .sort((a, b) => Number(a) - Number(b))
      .map(k => ({
        semester: k,
        courses: groups[Number(k)],
        isCurrent: Number(k) === planData.student.current_semester
      }));
  }, [planData]);

  if (isInitialLoading) {
    return (
      <div className={styles.wrapper}>
        <Loader2 className="animate-spin" /> Đang đồng bộ lộ trình...
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      {/* 1. Header */}
      <header className={styles.pageHeader}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Đăng ký học phần</h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Hồ sơ sinh viên: <strong>{baseStats?.name}</strong></p>
        </div>
        {planData?.student?.academic_status === 'warning' && (
          <div style={{ background: '#fef2f2', color: '#dc2626', padding: '8px 16px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700, border: '1px solid #fee2e2' }}>
            Đang bị cảnh báo học vụ
          </div>
        )}
      </header>

      {/* 2. Timeline Toàn Khóa */}
      <section className={styles.panel} style={{ padding: '1.5rem' }}>
        <p className={styles.sectionLabel}>Lộ trình đào tạo toàn khóa</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', fontSize: '0.75rem', color: '#475569' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#dcfce7', border: '1px solid #86efac' }} />
            Hoàn thành
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#dbeafe', border: '1px solid #93c5fd' }} />
            Đang học
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#475569' }}>↻</span>
            Học lại
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#fee2e2', border: '1px solid #fecaca' }} />
            Trượt
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f1f5f9', border: '1px solid #cbd5e1' }} />
            Khóa bị chặn
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)' }} />
            Chưa học
          </span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}>
          {timelineGroups.map((group) => (
            <div key={group.semester} style={{ 
              minWidth: '200px', height: '220px', padding: '1rem', borderRadius: '1.25rem',
              display: 'flex', flexDirection: 'column',
              background: group.isCurrent ? '#f0f7ff' : '#f8fafc',
              border: group.isCurrent ? '2px solid #003366' : '1px solid #e2e8f0',
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '0.75rem' }}>Kỳ {group.semester}</div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {group.courses.map((c, idx) => (
                  <div key={`${c.course_id}-${idx}`} style={{
                    fontSize: '0.65rem', padding: '6px 8px', borderRadius: '6px', marginBottom: '6px',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: c.status === 'done' ? '#dcfce7' : c.status === 'doing' ? '#dbeafe' : c.status === 'fail' ? '#fee2e2' : c.status === 'blocked' ? '#f1f5f9' : '#ffffff',
                    color: c.status === 'done' ? '#166534' : c.status === 'doing' ? '#1e40af' : c.status === 'fail' ? '#991b1b' : '#64748b',
                    border: '1px solid rgba(0,0,0,0.03)',
                  }}>
                    {c.status === 'done' && !c.was_retaken && <CheckCircle2 size={10} />}
                    {c.status === 'done' && c.was_retaken && <span title="Học lại thành công" style={{ fontSize: '0.6rem', fontWeight: 700 }}>↻</span>}
                    {c.status === 'fail' && <XCircle size={10} />}
                    {c.status === 'blocked' && <Lock size={10} />}
                    {c.status === 'doing' && c.is_retaking && <span title="Đang học lại" style={{ fontSize: '0.6rem', fontWeight: 700 }}>↻</span>}
                    <span
                      style={{ fontWeight: 600, cursor: 'pointer' }}
                      onClick={() => setSelectedCourse(c)}
                    >
                      {c.course_name || c.course_code}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Stats Row */}
      <section className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Tín chỉ đăng ký</p>
            <h3 className={`${styles.statValue} ${currentCredits > (data?.credit_limit?.max || 18) ? "text-red-500" : ""}`}>
              {currentCredits} / {data?.credit_limit?.max ?? baseStats?.credit_limit?.max ?? "--"}
            </h3>
          </div>
          <div className={`${styles.statIcon} ${styles.bgNavy}`}><BookOpen size={24} /></div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Tiến độ</p>
            <h3 className={styles.statValue}>
              {baseStats ? `${Math.round((baseStats.graduation_track.accumulated_credits / baseStats.graduation_track.total_required_credits) * 100)}%` : "--"}
            </h3>
          </div>
          <div className={`${styles.statIcon} ${styles.bgEmerald}`}><GraduationCap size={24} /></div>
        </div>
      </section>

      {/* 4. Content Grid */}
      <div className={styles.contentGrid}>
        {/* Lời khuyên cố vấn */}
        <aside className={styles.sidePanel}>
          <div className={styles.panel} style={{ padding: '1.5rem' }}>
            <h4 style={{ fontWeight: 600, marginBottom: '1.25rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Sparkles size={16} color="#b45309" /> Lời khuyên cố vấn
            </h4>
            {data ? (
              <>
                <div className={styles.adviceBox}><p style={{ fontSize: '0.85rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{data.overall_advice}</p></div>
                
                <div style={{ marginTop: '1.5rem' }}>
                  <p className={styles.sectionLabel}>Lịch học dự kiến (môn đã chọn)</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {filteredTimetable.length > 0 ? (
                      filteredTimetable.map((slot, idx) => (
                        <div key={idx} className={styles.timeSlot}>
                          <div style={{ fontWeight: 700 }}>{slot.course_name}</div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                            Thứ {slot.day_of_week} | {slot.start_time} - {slot.end_time} | Phòng {slot.room_number || '...'}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '1.5rem', textAlign: 'center', border: '2px dashed #e2e8f0', borderRadius: '1rem', color: '#94a3b8', fontSize: '0.75rem' }}>
                        <Clock size={20} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                        Hãy tick chọn môn học để xem lịch dự kiến.
                      </div>
                    )}
                  </div>
                </div>

                <button
                  className={styles.submitBtn}
                  disabled={
                    registerLoading ||
                    currentCredits === 0 ||
                    currentCredits > (data?.credit_limit?.max || 18) ||
                    selectedIds.length !== 1
                  }
                  onClick={handleRegisterOneCourse}
                >
                  {registerLoading ? <Loader2 className="animate-spin" size={18} /> : <Send size={16} style={{ marginRight: 8, display: 'inline' }} />}
                  Đăng ký 1 môn
                </button>
              </>
            ) : (
              <div className={styles.emptyState}><BookOpen size={24} color="#94a3b8" /><p>Chọn chế độ và nhấn cập nhật tư vấn.</p></div>
            )}
          </div>
        </aside>

        {/* Danh sách môn học đề xuất */}
        <main className={styles.panel}>
          <div className={styles.panelHeader} style={{ flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 700 }}>Môn học đề xuất kỳ {data?.target_semester ?? planData?.target_semester}</h3>
              <button className={styles.adviseBtn} onClick={() => refreshAdvisor(mode)} disabled={loading}>
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                Cập nhật tư vấn
              </button>
            </div>

            <div className={styles.modeGroup} style={{ width: '100%', padding: '2px' }}>
              {(['normal', 'fast_track', 'on_time'] as Mode[]).map(m => (
                <button
                  key={m}
                  className={`${styles.modeBtn} ${mode === m ? styles.modeActive : ""}`}
                  onClick={() => handleModeChange(m)}
                  style={{ flex: 1, textAlign: 'center' }}
                >
                  {m === "normal" ? "Chế độ Chuẩn" : m === "fast_track" ? "Học vượt" : "Đúng hạn"}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#334155' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#dbeafe', border: '1px solid #93c5fd' }} />
                Có lịch
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#334155' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#fee2e2', border: '1px solid #fecaca' }} />
                Trùng lịch / không đăng ký
              </span>
            </div>
          </div>

          <div className={styles.courseList}>
            {data ? (
              (data.suggested_courses as SuggestedCourse[]).map(course => {
                const isScheduled = scheduledCourseIds.has(course.course_id);
                const unscheduledReason = getUnscheduledReason(course.course_id);
                const isBlocked = !isScheduled;

                return (
                  <label 
                    key={course.course_id} 
                    className={`${styles.courseItem} ${isBlocked ? styles.courseDisabled : ""}`}
                    style={{ opacity: isBlocked ? 0.6 : 1, cursor: isBlocked ? 'not-allowed' : 'pointer' }}
                  >
                    <input
                      type="checkbox"
                      disabled={isBlocked}
                      checked={selectedIds.includes(course.course_id)}
                      onChange={() => {
                        if (isBlocked) return;
                        const id = course.course_id;
                        setSelectedIds(prev => prev.includes(id) ? [] : [id]);
                      }}
                      style={{ width: 20, height: 20, accentColor: '#003366' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div className="flex justify-between items-start">
                        <span className={styles.courseCode}>{course.course_code}</span>
                        {isBlocked ? (
                          <span style={{ color: '#ef4444', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', background: '#fef2f2', padding: '2px 8px', borderRadius: '10px' }}>
                            <CalendarX size={12}/> {unscheduledReason || 'Chưa có lịch đăng ký'}
                          </span>
                        ) : (
                          <span className={styles.priorityBadge}>Ưu tiên {course.priority}</span>
                        )}
                      </div>
                      <div style={{ fontWeight: 700, margin: '4px 0' }}>{course.course_name}</div>
                      <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{course.reason}</p>
                    </div>
                    <div style={{ fontWeight: 700, color: '#1e40af' }}>{course.credits} TC</div>
                  </label>
                );
              })
            ) : (
              <div className={styles.emptyState}>
                <MousePointerClick size={40} />
                <p>Hãy chọn chế độ học tập phía trên và nhấn <strong>Cập nhật tư vấn</strong>.</p>
              </div>
            )}
          </div>

          {selectedCourse && (
            <div className={styles.modalBackdrop} onClick={() => setSelectedCourse(null)}>
              <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                  <div>
                    <h2 className={styles.modalTitle}>{selectedCourse.course_name || selectedCourse.course_code}</h2>
                    <p className={styles.modalSubtitle}>{selectedCourse.course_code}</p>
                  </div>
                  <button
                    className={styles.secondaryBtn}
                    onClick={() => setSelectedCourse(null)}
                    style={{ minWidth: 'auto', padding: '0.5rem 0.75rem' }}
                  >
                    Đóng
                  </button>
                </div>
                <div className={styles.modalBody}>
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    <div><strong>Tên môn:</strong> {selectedCourse.course_name || "--"}</div>
                    <div><strong>Mã môn:</strong> {selectedCourse.course_code}</div>
                    <div><strong>Tín chỉ:</strong> {selectedCourse.credits ?? "--"}</div>
                    {selectedCourse.description && (
                      <div><strong>Mô tả:</strong> {selectedCourse.description}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* --- UI TOAST MESSAGE --- */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          background: toast.type === 'success' ? '#f0fdf4' : '#fef2f2',
          color: toast.type === 'success' ? '#166534' : '#991b1b',
          border: `1px solid ${toast.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          padding: '12px 20px',
          borderRadius: '12px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          maxWidth: '420px',
          transition: 'all 0.2s ease-in-out'
        }}>
          {toast.type === 'success' ? (
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          ) : (
            <AlertTriangle size={18} style={{ flexShrink: 0, color: '#dc2626' }} />
          )}
          <span style={{ fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.4 }}>{toast.message}</span>
          <button 
            onClick={() => setToast(null)} 
            style={{ background: 'none', border: 'none', marginLeft: 'auto', padding: '4px', cursor: 'pointer', color: 'inherit', opacity: 0.6 }}
          >
            <XCircle size={16} />
          </button>
        </div>
      )}
    </div>
  );
}