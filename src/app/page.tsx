"use client";
import styles from "./Login.module.css";
import { useAuth } from "@/src/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { login, user, isReady } = useAuth();
  const router = useRouter();
  
  
  // 1. Loại bỏ dữ liệu cứng
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 2. State cho ẩn/hiện mật khẩu
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isReady || !user) return;
    router.replace(user.role === "ADMIN" ? "/admin" : user.role === "LECTURER" ? "/lecturer" : "/student");
  }, [isReady, router, user]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Ngăn trang reload
    setIsLoading(true);
    setError(null);
    try {
      const u = await login(email, password);
      router.push(u.role === "ADMIN" ? "/admin" : u.role === "LECTURER" ? "/lecturer" : "/student");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Email hoặc mật khẩu không chính xác");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Bên trái: Hình ảnh và slogan */}
      <div className={styles.leftSide}>
        <div className={styles.overlay}></div>
        <div className={styles.sloganBox}>
          <h2>
            Đồng hành cùng <br /> 
            <span className={styles.highlight}>Sinh viên</span> <br /> 
            & <span className={styles.highlight}>Giảng viên</span>
          </h2>
          <p className={styles.description}>
            Hệ thống quản lý đào tạo thông minh tối ưu cho kỷ nguyên AI.
          </p>
        </div>
      </div>

      {/* Bên phải: Form đăng nhập */}
      <div className={styles.rightSide}>
        <div className={styles.formCard}>
          <div className={styles.header}>
            <h3>Đăng nhập</h3>
            <p className={styles.subtitle}>Cổng thông tin hỗ trợ đào tạo AI & Data</p>
          </div>
          
          <form onSubmit={handleLogin} className={styles.form}>
            {/* Input Email */}
            <div className={styles.inputGroup}>
              <Mail className={styles.inputIcon} size={20} />
              <input
                type="email"
                className={styles.input}
                placeholder="Email của bạn"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            {/* Input Password */}
            <div className={styles.inputGroup}>
              <Lock className={styles.inputIcon} size={20} />
              <input
                type={showPassword ? "text" : "password"}
                className={styles.input}
                placeholder="Mật khẩu"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}

            <button type="submit" className={styles.btnGold} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className={styles.spinner} size={20} />
                  Đang xử lý...
                </>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>

          <div className={styles.footer}>
            <p>Quên mật khẩu? <span className={styles.link}>Liên hệ quản trị viên</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
