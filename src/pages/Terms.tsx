import { PublicLayout } from '@/components/PublicLayout';

export const Terms = () => {
  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 prose prose-lg prose-gray">
        <h1 className="text-4xl md:text-5xl font-bold font-['Outfit',sans-serif] mb-6 tracking-tight text-[#18181B]">Terms of Service</h1>
        <p className="text-gray-500 mb-8 font-medium">Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2>1. Acceptance of Terms</h2>
        <p>By accessing or using our services, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the service.</p>
        
        <h2>2. Description of Service</h2>
        <p>SILO provides a workspace collaboration platform for teams. We reserve the right to modify or discontinue the service at any time.</p>

        <h2>3. User Accounts</h2>
        <p>You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password.</p>

        <h2>4. Termination</h2>
        <p>We may terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever.</p>
      </div>
    </PublicLayout>
  );
};
