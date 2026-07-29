import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { WebSocketProvider } from '@/context/WebSocketContext';
import { CallProvider } from '@/context/CallContext';
import { ChannelSFUProvider } from '@/context/ChannelSFUContext';
import { RightSidebarProvider } from '@/context/RightSidebarContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { VerifyEmail } from '@/pages/VerifyEmail';
import { ForgotPassword } from '@/pages/ForgotPassword';
import { ResetPassword } from '@/pages/ResetPassword';
import { Onboarding } from '@/pages/Onboarding';
import { WorkspaceLayout } from '@/pages/WorkspaceLayout';
import { ChannelFeed } from '@/pages/ChannelFeed';
import { DirectMessageView } from '@/pages/DirectMessageView';
import { DocumentCanvas } from '@/pages/DocumentCanvas';
import { BillingSettings } from '@/pages/BillingSettings';
import { WorkspacePeople } from '@/pages/WorkspacePeople';
import { GoogleCallback } from '@/pages/GoogleCallback';
import { CallWidget } from '@/components/CallWidget';
import { LandingPage } from '@/pages/LandingPage';
import { Contact } from '@/pages/Contact';
import { HowItWorks } from '@/pages/HowItWorks';
import { Privacy } from '@/pages/Privacy';
import { Terms } from '@/pages/Terms';
import { TooltipProvider } from '@/components/ui/tooltip';
import { RootRedirect } from '@/components/RootRedirect';

function App() {
  return (
    <BrowserRouter>
      <TooltipProvider>
        <AuthProvider>
          <WebSocketProvider>
            <CallProvider>
              <ChannelSFUProvider>
                <RightSidebarProvider>
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
                    <Route path="dm/:targetEmail" element={<DirectMessageView />} />
                    <Route path="docs/:docId" element={<DocumentCanvas />} />
                    <Route path="people" element={<WorkspacePeople />} />
                    <Route path="settings/billing" element={<BillingSettings />} />
                  </Route>

                  {/* Catch-all & Redirection */}
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/how-it-works" element={<HowItWorks />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/" element={<LandingPage />} />
                  <Route path="*" element={<RootRedirect />} />
                </Routes>
                <CallWidget />
              </RightSidebarProvider>
            </ChannelSFUProvider>
          </CallProvider>
          </WebSocketProvider>
        </AuthProvider>
      </TooltipProvider>
    </BrowserRouter>
  );
}

export default App;
