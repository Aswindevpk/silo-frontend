import { PublicLayout } from '@/components/PublicLayout';

export const Privacy = () => {
  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 prose prose-lg prose-gray">
        <h1 className="text-4xl md:text-5xl font-bold font-['Outfit',sans-serif] mb-6 tracking-tight text-[#18181B]">Privacy Policy</h1>
        <p className="text-gray-500 mb-8 font-medium">Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2>1. Information We Collect</h2>
        <p>We collect information you provide directly to us, such as when you create an account, update your profile, or communicate with us.</p>
        
        <h2>2. How We Use Information</h2>
        <p>We use the information we collect to provide, maintain, and improve our services, as well as to communicate with you.</p>

        <h2>3. Data Security</h2>
        <p>We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access.</p>

        <h2>4. Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact us.</p>
      </div>
    </PublicLayout>
  );
};
