"use client";

import { useEffect, useState, useMemo } from "react";
import styles from "./index.module.css";
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  MapPin, User, Clock, X, Info, BookOpen, FileText, 
  AlertCircle, Loader2, RefreshCw
} from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { PUBLIC_API_BASE_URL } from "@/src/lib/api/config";

// --- TYPE DEFINITIONS ---
interface Event {
  id: string;
  course_id: string;
  course_code: string;
  course_name: string;
  start_time: string;
  end_time: string;
  room: string;
  instructor: string;
  credits: number;
  is_required: boolean;
  day: string;
  timeStr: string;
  date: string;
  schedule_id: string;
}

// --- HELPERS & CONSTANTS ---
const DAYS_MAP: Record<string, string> = {
  "Monday": "Thứ 2", "Tuesday": "Thứ 3", "Wednesday": "Thứ 4",
  "Thursday": "Thứ 5", "Friday": "Thứ 6", "Saturday": "Thứ 7", "Sunday": "CN"
};

const DAYS_NAME = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];

// Hàm tính toán tuần hiện tại dựa trên ngày hôm nay (Giờ Việt Nam)
const getCurrentWeekDates = () => {
  const now = new Date();
  // Chuyển sang giờ Việt Nam (UTC+7)
  const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  const today = new Date(vietnamTime.getFullYear(), vietnamTime.getMonth(), vietnamTime.getDate());
  
  // Tìm ngày đầu tuần (Thứ 2)
  const dayOfWeek = today.getDay(); // 0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Nếu Chủ nhật, lùi 6 ngày; nếu Thứ 2, offset 0
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  
  const weekDates: Record<string, string> = {};
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  
  days.forEach((day, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    weekDates[day] = date.toISOString().split('T')[0]; // YYYY-MM-DD
  });
  
  return {
    DATE_MAP: weekDates,
    TODAY_STR: today.toISOString().split('T')[0],
    CURRENT_MONTH: today.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
  };
};



export default function TKBPage() {
  const { user } = useAuth();
  const [view, setView] = useState("week");
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Tính toán tuần hiện tại
  const { DATE_MAP, TODAY_STR, CURRENT_MONTH, MONDAY_DATE } = useMemo(() => {
    const now = new Date();
    const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const today = new Date(vietnamTime.getFullYear(), vietnamTime.getMonth(), vietnamTime.getDate());
    
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    
    const weekDates: Record<string, string> = {};
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    
    days.forEach((day: string, index: number) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      weekDates[day] = date.toISOString().split('T')[0];
    });
    
    return {
      DATE_MAP: weekDates,
      TODAY_STR: today.toISOString().split('T')[0],
      CURRENT_MONTH: today.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }),
      MONDAY_DATE: monday
    };
  }, []);

  // 1. FETCH DATA TỪ API (Sử dụng user_id từ Context)
  useEffect(() => {
    if (!user?.user_id) return;

    const fetchTKB = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("auth_token");
        const res = await fetch(`${PUBLIC_API_BASE_URL}student/${user.user_id}/timetable`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });
        const result = await res.json();
        
        if (result.success) {
          // Trải phẳng dữ liệu schedules
          const rawEvents = result.data.courses.flatMap((course: any): Event[] =>
            course.schedules.map((s: any): Event => ({
              ...s,
              ...course,
              id: `${course.course_id}-${s.schedule_id}`,
              timeStr: `${s.start_time.slice(0, 5)} - ${s.end_time.slice(0, 5)}`,
              day: s.day // giữ day để tính toán
            }))
          );
          // Dedup theo id: cùng (course_id, schedule_id) chỉ giữ 1 bản
          const seenIds = new Set<string>();
          const baseEvents = rawEvents.filter((e: Event) => {
            if (seenIds.has(e.id)) return false;
            seenIds.add(e.id);
            return true;
          });

          // Tạo events cho toàn bộ tháng, giả sử lịch lặp lại hàng tuần
          const allEvents: any[] = [];
          const currentYear = new Date().getFullYear();
          const currentMonth = new Date().getMonth();
          const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
          const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
          const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
          const totalWeeks = Math.ceil((daysInMonth + startDay) / 7);

          for (let week = 0; week < totalWeeks; week++) {
            const weekMonday = new Date(MONDAY_DATE);
            weekMonday.setDate(MONDAY_DATE.getDate() + week * 7);
            
            baseEvents.forEach((event: Event) => {
              const dayIndex = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].indexOf(event.day);
              if (dayIndex !== -1) {
                const eventDate = new Date(weekMonday);
                eventDate.setDate(weekMonday.getDate() + dayIndex);
                const dateStr = eventDate.toISOString().split('T')[0];
                
                // Chỉ thêm nếu trong tháng hiện tại
                if (eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear) {
                  allEvents.push({
                    ...event,
                    date: dateStr,
                    id: `${event.id}-${week}`
                  });
                }
              }
            });
          }
          
          setEvents(allEvents);
        }
      } catch (error) {
        console.error("Lỗi TKB:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTKB();
  }, [user, MONDAY_DATE]);

  const getEventsByDate = (date: string): Event[] => events.filter((e: Event) => e.date === date);

  // Hàm format ngày cho hiển thị
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const dayName = DAYS_MAP[Object.keys(DATE_MAP).find(k => DATE_MAP[k] === dateStr) || ""];
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${dayName}, ${day} tháng ${month}, ${year}`;
  };

  if (loading) return (
    <div className={styles.container}>
      <Loader2 size={40} />
      <p>Đang đồng bộ lịch học từ hệ thống...</p>
    </div>
  );

  return (
    <div className={styles.container}>
      {/* --- HEADER --- */}
      <header className={styles.calendarHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.currentDate}>{CURRENT_MONTH}</div>
          <div className={styles.viewSwitch}>
            <button onClick={() => setView('day')} className={view === 'day' ? styles.activeView : ''}>Ngày</button>
            <button onClick={() => setView('week')} className={view === 'week' ? styles.activeView : ''}>Tuần</button>
            <button onClick={() => setView('month')} className={view === 'month' ? styles.activeView : ''}>Tháng</button>
          </div>
        </div>
        {/* <button className={styles.syncBtn}>
          <RefreshCw size={16} />
          Đồng bộ
        </button> */}
      </header>

      {/* --- CHẾ ĐỘ XEM --- */}
      {/* 1. VIEW NGÀY */}
      {view === 'day' && (
        <div className={styles.dayViewWrapper}>
          <div className={styles.dayHeaderRow}>
            <div className={styles.dayInfo}>
              <h3>Hôm nay</h3>
              <p>{formatDate(TODAY_STR)}</p>
            </div>
            <div className={styles.todayLabel}>Hôm nay</div>
          </div>
          <div className={styles.timelineContainer}>
            {getEventsByDate(TODAY_STR).length > 0 ? (
              getEventsByDate(TODAY_STR).map((event: Event, idx: number) => (
                <div key={event.id} className={styles.timelineItem} onClick={() => setSelectedEvent(event)}>
                  <div className={styles.timeSection}>
                    <div className={styles.startTime}>{event.start_time.slice(0, 5)}</div>
                    <div className={styles.timeLineConnector}>
                      <div className={styles.timeDot}></div>
                      {idx < getEventsByDate(TODAY_STR).length - 1 && <div className={styles.line}></div>}
                    </div>
                  </div>
                  <div className={styles.detailedCard}>
                    <div className={styles.cardHeader}>
                      <span className={styles.typeBadge}>{event.course_code}</span>
                      <div className={styles.duration}>
                        <Clock size={14} />
                        {event.timeStr}
                      </div>
                    </div>
                    <h4 className={styles.courseTitle}>{event.course_name}</h4>
                    <div className={styles.cardMeta}>
                      <div className={styles.metaItem}>
                        <MapPin size={14} />
                        {event.room}
                      </div>
                      <div className={styles.metaItem}>
                        <User size={14} />
                        {event.instructor}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <p>Hôm nay bạn không có lịch học.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. VIEW TUẦN */}
      {view === 'week' && (
        <div className={styles.weekGrid}>
          {DAYS_NAME.map((dayName: string, idx: number) => {
            const engKey = Object.keys(DAYS_MAP).find(k => DAYS_MAP[k] === dayName) || "";
            const date = DATE_MAP[engKey];
            const isToday = date === TODAY_STR;
            const dayNumber = new Date(date).getDate();
            
            return (
              <div key={dayName} className={`${styles.dayColumn} ${isToday ? styles.todayCol : ""}`}>
                <div className={styles.dayHeader}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>{dayName}</div>
                  <span className={`${styles.dayNumber} ${isToday ? styles.todayCircle : ""}`}>{dayNumber}</span>
                </div>
                <div className={styles.eventSlot}>
                  {getEventsByDate(date).map((e: Event) => (
                    <div key={e.id} className={styles.eventCard} onClick={() => setSelectedEvent(e)}>
                      <div className={styles.eventTitle}>{e.course_name}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. VIEW THÁNG */}
      {view === 'month' && (
        <div className={styles.monthGrid}>
          {DAYS_NAME.map((d: string) => <div key={d} className={styles.monthDayHeader}>{d}</div>)}
          {(() => {
            const now = new Date();
            const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
            const currentMonth = vietnamTime.getMonth();
            const currentYear = vietnamTime.getFullYear();
            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
            const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 = CN, 1 = T2, ..., 6 = T7
            const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Chuyển sang T2=0, T3=1, ..., CN=6
            
            const cells = [];
            // Thêm cell trống cho các ngày trước ngày đầu tháng
            for (let i = 0; i < startDay; i++) {
              cells.push(<div key={`empty-${i}`} className={styles.monthCell}></div>);
            }
            // Thêm cell cho các ngày trong tháng
            for (let day = 1; day <= daysInMonth; day++) {
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday = dateStr === TODAY_STR;
              cells.push(
                <div key={`day-${day}`} className={`${styles.monthCell} ${isToday ? styles.todayCell : ""}`}>
                  <span className={styles.monthDateNum}>{day}</span>
                  <div className={styles.monthEventList}>
                    {getEventsByDate(dateStr).map((e: Event) => (
                      <div key={e.id} className={styles.monthEventPill} onClick={() => setSelectedEvent(e)}>
                        {e.course_name}
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            return cells;
          })()}
        </div>
      )}

      {/* --- MODAL CHI TIẾT --- */}
      {selectedEvent && (
        <div className={styles.modalOverlay} onClick={() => setSelectedEvent(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setSelectedEvent(null)}>
              <X size={20} />
            </button>
            <div className={styles.typeTag}>{selectedEvent.course_code}</div>
            <h2 className={styles.modalTitle}>{selectedEvent.course_name}</h2>
            <p className={styles.modalSubtitle}>{selectedEvent.is_required ? "Bắt buộc" : "Tự chọn"}</p>
            <div className={styles.modalBody}>
              <div className={styles.infoRow}>
                <div className={styles.iconBox}>
                  <Clock size={16} />
                </div>
                <div>
                  <label>Thời gian</label>
                  <p>{selectedEvent.timeStr}</p>
                </div>
              </div>
              <div className={styles.infoRow}>
                <div className={styles.iconBox}>
                  <MapPin size={16} />
                </div>
                <div>
                  <label>Phòng học</label>
                  <p>{selectedEvent.room}</p>
                </div>
              </div>
              <div className={styles.infoRow}>
                <div className={styles.iconBox}>
                  <User size={16} />
                </div>
                <div>
                  <label>Giảng viên</label>
                  <p>{selectedEvent.instructor}</p>
                </div>
              </div>
              <div className={styles.descriptionBox}>
                <div className={styles.descTitle}>
                  <Info size={14} />
                  Thông tin môn học
                </div>
                <p>Số tín chỉ: {selectedEvent.credits} TC</p>
              </div>
            </div>
            {/* <div className={styles.modalFooter}>
              <button className={styles.secondaryBtn}>
                <BookOpen size={16} />
                Đề cương
              </button>
              <button className={styles.primaryBtn}>
                <FileText size={16} />
                Tài liệu AI
              </button>
            </div> */}
          </div>
        </div>
      )}
    </div>
  );
}