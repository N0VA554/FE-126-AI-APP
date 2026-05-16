"use client";

import { useEffect, useState } from "react";
import styles from "./index.module.css";
import { 
  UserRound, 
  IdCard, 
  BadgeCheck, 
  Camera, 
  Mail, 
  MapPin, 
  GraduationCap, 
  School 
} from "lucide-react";
import { 
  fetchStudentProfile, 
  updateStudentAvatar, 
  type StudentProfile 
} from "@/src/lib/api/studentPortal";

type TabKey = "academic" | "personal";

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("academic");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStudentProfile()
      .then(setProfile)
      .finally(() => setLoading(false));
  }, []);

  const handleAvatarUpdate = async () => {
    if (!profile || saving) return;
    setSaving(true);
    try {
      const result = await updateStudentAvatar();
      setProfile({
        ...profile,
        personal_info: { ...profile.personal_info, avatar_url: result.avatar_url },
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.statCard}>Đang nạp hồ sơ sinh viên...</div>;
  if (!profile) return <div className={styles.statCard}>Lỗi kết nối dữ liệu.</div>;

  const { personal_info: personal, academic_info: academic } = profile;

  return (
    <div className={styles.wrapper}>
      
      {/* 1. Header Stats Row */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <p>Mã sinh viên</p>
            <h3>{academic.student_id}</h3>
          </div>
          <div className={`${styles.statIcon} ${styles.bgNavy}`}><IdCard size={24} /></div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <p>Khóa học</p>
            <h3>{academic.cohort}</h3>
          </div>
          <div className={`${styles.statIcon} ${styles.bgGold}`}><School size={24} /></div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <p>Niên khóa</p>
            <h3>{academic.admission_year}</h3>
          </div>
          <div className={`${styles.statIcon} ${styles.bgEmerald}`}><GraduationCap size={24} /></div>
        </div>
      </div>

      {/* 2. Content Grid */}
      <div className={styles.contentGrid}>
        
        {/* Main Info Panel (Left) */}
        <div className={styles.profilePanel}>
          <div className={styles.tabHeader}>
            <button 
              onClick={() => setActiveTab("academic")}
              className={`${styles.tabBtn} ${activeTab === "academic" ? styles.activeTab : styles.inactiveTab}`}
            >
              <GraduationCap size={18} /> Hồ sơ Học vụ
            </button>
            <button 
              onClick={() => setActiveTab("personal")}
              className={`${styles.tabBtn} ${activeTab === "personal" ? styles.activeTab : styles.inactiveTab}`}
            >
              <UserRound size={18} /> Hồ sơ Cá nhân
            </button>
          </div>

          <div className={styles.infoGrid}>
            {activeTab === "academic" ? (
              <>
                <InfoBox label="Khoa/Viện" value={academic.faculty} />
                <InfoBox label="Ngành học" value={academic.major} />
                <InfoBox label="Lớp hành chính" value={academic.administrative_class} />
                <InfoBox label="Học kỳ hiện tại" value={academic.current_semester} />
                <InfoBox label="Trạng thái học tập" value={academic.academic_status} />
                <InfoBox label="Mã ngành" value={academic.major_code} />
              </>
            ) : (
              <>
                <InfoBox label="Ngày sinh" value={personal.dob} />
                <InfoBox label="Giới tính" value={personal.gender} />
                <InfoBox label="Nơi sinh" value={personal.place_of_birth} />
                <InfoBox label="Số CMND/CCCD" value={personal.id_card_num} />
                <InfoBox label="Địa chỉ hiện tại" value={personal.current_address} />
                <InfoBox label="Email cá nhân" value={personal.school_email} />
              </>
            )}
          </div>
        </div>

        {/* Side Panel (Right) */}
        <div className={styles.sidePanel}>
          <div className={styles.avatarCard}>
            <div className={styles.avatarWrapper}>
              <img src={personal.avatar_url} alt="Avatar" className={styles.avatarImg} />
              <button onClick={handleAvatarUpdate} className={styles.uploadBtn}>
                <Camera size={14} /> {saving ? "Đang lưu..." : "Đổi ảnh"}
              </button>
            </div>
            <h2 className={styles.userName}>{personal.full_name}</h2>
            <p className={styles.userEmail}>{personal.school_email}</p>
            <div className={styles.statusBadge}>
              <BadgeCheck size={16} /> {academic.status || "Đang học"}
            </div>
          </div>

          <div className={styles.statCard} style={{ padding: '1rem' }}>
             <div className="flex items-center gap-3">
                <MapPin size={20} className="text-slate-400" />
                <span className="text-sm font-medium">{academic.university}</span>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Sub-component cho gọn
function InfoBox({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className={styles.infoBox}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value || "—"}</span>
    </div>
  );
}