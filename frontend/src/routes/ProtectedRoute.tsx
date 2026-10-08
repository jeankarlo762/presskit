import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import type { UserRole } from "@presskit/shared";
import { useAuthStore } from "../store/auth.store";

export function ProtectedRoute({ children, role }: { children: ReactNode; role?: UserRole }) {
  const { accessToken, user } = useAuthStore();
  if (!accessToken) return <Navigate to="/login" replace />;
  // The stored role is only a UI hint — every /admin/* call is re-checked
  // server-side by requireSuperadmin, so a tampered store buys nothing.
  if (role && user?.role !== role) return <Navigate to="/" replace />;
  return children;
}
