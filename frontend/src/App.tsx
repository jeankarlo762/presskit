import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { DashboardHomePage } from "./pages/DashboardHomePage";
import { CreateWithAiPage } from "./pages/projeto/CreateWithAiPage";
import { UploadsPage } from "./pages/projeto/UploadsPage";
import { ReadyTemplatesPage } from "./pages/projeto/ReadyTemplatesPage";
import { SubscriptionPage } from "./pages/billing/SubscriptionPage";
import { FeedbackPage } from "./pages/feedback/FeedbackPage";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage";
import { AdminUserDetailPage } from "./pages/admin/AdminUserDetailPage";
import { AdminSubscriptionsRoute } from "./pages/admin/AdminSubscriptionsPage";
import { AdminDelinquencyPage } from "./pages/admin/AdminDelinquencyPage";
import { AdminPaymentsPage } from "./pages/admin/AdminPaymentsPage";
import { AdminFeedbackPage } from "./pages/admin/AdminFeedbackPage";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { DashboardLayout } from "./components/layout/DashboardLayout";

// The overview pulls in recharts (~200 kB) that no artist ever needs — keep
// it out of the main bundle and load it only when a superadmin opens it.
const AdminOverviewPage = lazy(() =>
  import("./pages/admin/AdminOverviewPage").then((module) => ({ default: module.AdminOverviewPage })),
);

function admin(element: React.ReactNode) {
  return (
    <ProtectedRoute role="SUPERADMIN">
      <Suspense fallback={<p className="p-6 text-sm text-fg-muted">Carregando...</p>}>{element}</Suspense>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardHomePage />} />
          <Route path="/assinatura" element={<SubscriptionPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/projeto/crie-com-ia" element={<CreateWithAiPage />} />
          <Route path="/projeto/uploads" element={<UploadsPage />} />
          <Route path="/projeto/modelos-prontos" element={<ReadyTemplatesPage />} />

          <Route path="/admin" element={admin(<AdminOverviewPage />)} />
          <Route path="/admin/usuarios" element={admin(<AdminUsersPage />)} />
          <Route path="/admin/usuarios/:id" element={admin(<AdminUserDetailPage />)} />
          <Route path="/admin/assinaturas" element={admin(<AdminSubscriptionsRoute />)} />
          <Route path="/admin/inadimplencia" element={admin(<AdminDelinquencyPage />)} />
          <Route path="/admin/pagamentos" element={admin(<AdminPaymentsPage />)} />
          <Route path="/admin/feedback" element={admin(<AdminFeedbackPage />)} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
