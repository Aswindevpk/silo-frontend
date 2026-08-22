import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';

export const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#18181B] font-sans selection:bg-[#18181B] selection:text-white overflow-hidden flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl bg-white border border-gray-200 shadow-sm rounded-full px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src="/silo.png" alt="SILO Logo" className="h-6 w-auto object-contain" />
          <span className="font-bold text-lg tracking-tight">Silo</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-sm font-medium text-gray-500 hover:text-[#18181B] transition-opacity">Home</Link>
          <Link to="/contact" className="text-sm font-medium text-gray-500 hover:text-[#18181B] transition-opacity">Contact</Link>
          <Link to="/how-it-works" className="text-sm font-medium text-gray-500 hover:text-[#18181B] transition-opacity">How it works</Link>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <Link
              to={user?.default_workspace_slug ? `/w/${user.default_workspace_slug}` : "/onboarding"}
              className="text-sm font-medium bg-[#18181B] hover:bg-black text-white px-5 py-2 rounded-full transition-all"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-[#18181B] transition-colors hidden sm:block">
                Login
              </Link>
              <Link
                to="/register"
                className="text-sm font-medium bg-[#18181B] hover:bg-black text-white px-5 py-2 rounded-full transition-all"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow pt-32 pb-20">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-16 text-center text-gray-500 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <img src="/silo.png" alt="SILO Logo" className="h-6 w-auto object-contain grayscale opacity-70 hover:opacity-100 transition-opacity" />
            <span className="font-bold text-[#18181B]">Silo</span>
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-sm font-medium">
            <Link to="/how-it-works" className="hover:text-[#18181B] transition-colors">How it works</Link>
            <Link to="/privacy" className="hover:text-[#18181B] transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-[#18181B] transition-colors">Terms</Link>
            <Link to="/contact" className="hover:text-[#18181B] transition-colors">Contact</Link>
          </div>
          <div className="text-sm">
            &copy; {new Date().getFullYear()} Silo Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
