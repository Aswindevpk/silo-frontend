import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { WebSocketProvider } from '@/context/WebSocketContext';
import { CallProvider } from '@/context/CallContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { VerifyEmail } from '@/pages/VerifyEmail';
import { ForgotPassword } from '@/pages/ForgotPassword';
import { ResetPassword } from '@/pages/ResetPassword';
import { Dashboard } from '@/pages/Dashboard';
import { Onboarding } from '@/pages/Onboarding';
import { WorkspaceLayout } from '@/pages/WorkspaceLayout';
import { ChannelFeed } from '@/pages/ChannelFeed';
import { DocumentCanvas } from '@/pages/DocumentCanvas';
import { BillingSettings } from '@/pages/BillingSettings';
import { GoogleCallback } from '@/pages/GoogleCallback';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WebSocketProvider>
          <CallProvider>
            <Routes>
              {/* Public Authentication Routes */}
              <Route
                path="/login"
                element={
                  <ProtectedRoute requireAuth={false}>
                    <Login />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <ProtectedRoute requireAuth={false}>
                    <Register />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/register/verify-email"
                element={
                  <ProtectedRoute requireAuth={false}>
                    <VerifyEmail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <ProtectedRoute requireAuth={false}>
                    <ForgotPassword />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reset-password"
                element={
                  <ProtectedRoute requireAuth={false}>
                    <ResetPassword />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/auth/google/callback"
                element={
                  <ProtectedRoute requireAuth={false}>
                    <GoogleCallback />
                  </ProtectedRoute>
                }
              />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requireAuth={true}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute requireAuth={true}>
                    <Onboarding />
                  </ProtectedRoute>
                }
              />

              {/* Workspace Scoped Protected Routes */}
              <Route
                path="/w/:workspaceSlug"
                element={
                  <ProtectedRoute requireAuth={true}>
                    <WorkspaceLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="ch/:channelId" element={<ChannelFeed />} />
                <Route path="docs/:docId" element={<DocumentCanvas />} />
                <Route path="settings/billing" element={<BillingSettings />} />
              </Route>

              {/* Catch-all & Redirection */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </CallProvider>
        </WebSocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
