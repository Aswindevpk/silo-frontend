import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/context/AuthContext';
import { WebSocketProvider } from '@/context/WebSocketContext';
import { CallProvider } from '@/features/calls/context/CallContext';
import { ChannelSFUProvider } from '@/features/calls/context/ChannelSFUContext';
import { RightSidebarProvider } from '@/features/chat/context/RightSidebarContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Login } from '@/features/auth/pages/Login';
import { Register } from '@/features/auth/pages/Register';
import { VerifyEmail } from '@/features/auth/pages/VerifyEmail';
import { ForgotPassword } from '@/features/auth/pages/ForgotPassword';
import { ResetPassword } from '@/features/auth/pages/ResetPassword';
import { Onboarding } from '@/features/workspaces/pages/Onboarding';
import { WorkspaceLayout } from '@/features/workspaces/pages/WorkspaceLayout';
import { ChannelFeed } from '@/features/chat/pages/ChannelFeed';
import { DirectMessageView } from '@/features/chat/pages/DirectMessageView';
import { DocumentCanvas } from '@/features/documents/pages/DocumentCanvas';
import { BillingSettings } from '@/features/billing/pages/BillingSettings';
import { WorkspacePeople } from '@/features/workspaces/pages/WorkspacePeople';
import { GoogleCallback } from '@/features/auth/pages/GoogleCallback';
import { CallWidget } from '@/features/calls/components/CallWidget';
import { LandingPage } from '@/pages/LandingPage';
import { Contact } from '@/pages/Contact';
import { HowItWorks } from '@/pages/HowItWorks';
import { Privacy } from '@/pages/Privacy';
import { Terms } from '@/pages/Terms';
import { JoinWorkspace } from '@/features/workspaces/pages/JoinWorkspace';
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

                  <Route
                    path="/join-workspace"
                    element={<JoinWorkspace />}
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
