"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

// Hub de redirección post-login: envía al usuario a su vista según su rol
export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    if (user.role === "seller") {
      router.replace("/dashboard/my-products");
    } else {
      router.replace("/dashboard/my-orders");
    }
  }, [user, isLoading, router]);

  return null;
}
