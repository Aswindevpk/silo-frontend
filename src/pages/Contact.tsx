
import { PublicLayout } from '@/components/PublicLayout';

export const Contact = () => {
  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-4xl md:text-5xl font-bold font-['Outfit',sans-serif] mb-6 tracking-tight text-center">Contact Us</h1>
        <p className="text-xl text-gray-500 mb-12 font-light text-center">
          Have questions or need help? We're here for you. Reach out to our team.
        </p>
        
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm max-w-xl mx-auto">
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-bold tracking-wide uppercase text-gray-400 mb-2">Name</label>
              <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#18181B] transition-shadow" placeholder="Your Name" />
            </div>
            <div>
              <label className="block text-sm font-bold tracking-wide uppercase text-gray-400 mb-2">Email</label>
              <input type="email" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#18181B] transition-shadow" placeholder="your@email.com" />
            </div>
            <div>
              <label className="block text-sm font-bold tracking-wide uppercase text-gray-400 mb-2">Message</label>
              <textarea rows={6} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#18181B] transition-shadow" placeholder="How can we help?"></textarea>
            </div>
            <button type="button" className="w-full bg-[#18181B] hover:bg-black text-white rounded-xl py-4 font-bold transition-transform active:scale-95 shadow-lg shadow-black/10">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </PublicLayout>
  );
};
