import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { DashboardHomePage } from "./pages/DashboardHomePage";
import { CreateWithAiPage } from "./pages/projeto/CreateWithAiPage";
import { UploadsPage } from "./pages/projeto/UploadsPage";
import { ReadyTemplatesPage } from "./pages/projeto/ReadyTemplatesPage";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { DashboardLayout } from "./components/layout/DashboardLayout";

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
          <Route path="/projeto/crie-com-ia" element={<CreateWithAiPage />} />
          <Route path="/projeto/uploads" element={<UploadsPage />} />
          <Route path="/projeto/modelos-prontos" element={<ReadyTemplatesPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
