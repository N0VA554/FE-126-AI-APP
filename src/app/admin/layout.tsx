"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import DashboardLayout from "@/src/components/layout/DashboardLayout";
import { useAuth } from "@/src/context/AuthContext";

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isReady } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isReady) return;

    if (!user) {
      router.replace("/");
      return;
    }

    const role = user.role;
    const inLecturer = pathname.startsWith("/lecturer");
    const inStudent = pathname.startsWith("/student");

    if (inLecturer && role !== "LECTURER") router.replace("/student");
    if (inStudent && role !== "STUDENT") router.replace("/lecturer");
  }, [user, isReady, router, pathname]);

  return <DashboardLayout>{children}</DashboardLayout>;
}

