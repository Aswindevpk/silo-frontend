import { PublicLayout } from '@/components/PublicLayout';
import { CheckCircle2 } from 'lucide-react';

export const HowItWorks = () => {
  return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-200 text-xs font-bold uppercase tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-black"></span> WORKFLOW
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-['Outfit',sans-serif] mb-6 tracking-tight">
            How SILO Works
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto font-light">
            A seamless workflow for teams that demand focus and clarity.
          </p>
        </div>

        <div className="space-y-12 relative before:absolute before:inset-0 before:ml-12 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
          
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-24 h-24 rounded-full border-4 border-white bg-black text-white text-3xl font-bold shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 mx-auto">
              01
            </div>
            
            <div className="w-[calc(100%-8rem)] md:w-[calc(50%-4rem)] bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-bold text-2xl mb-2 font-['Outfit']">Create your Workspace</h3>
              <p className="text-gray-500 mb-6">Set up a dedicated environment for your team. Invite members with specific roles and start collaborating in seconds.</p>
              <div className="w-full h-32 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center">
                 <div className="w-1/2 h-8 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>

          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-24 h-24 rounded-full border-4 border-white bg-black text-white text-3xl font-bold shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 mx-auto">
              02
            </div>
            
            <div className="w-[calc(100%-8rem)] md:w-[calc(50%-4rem)] bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-bold text-2xl mb-2 font-['Outfit']">Organize into Channels</h3>
              <p className="text-gray-500 mb-6">Keep conversations focused by creating channels for different projects, teams, or topics. No more cluttered generic chat.</p>
              <div className="w-full h-32 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-2 p-4 justify-center">
                 <div className="w-full h-8 bg-white shadow-sm rounded-lg flex items-center px-3"><div className="w-2 h-2 rounded-full bg-green-400 mr-2"></div># engineering</div>
                 <div className="w-full h-8 bg-white shadow-sm rounded-lg flex items-center px-3"><div className="w-2 h-2 rounded-full bg-gray-300 mr-2"></div># marketing</div>
              </div>
            </div>
          </div>

          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-24 h-24 rounded-full border-4 border-white bg-black text-white text-3xl font-bold shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 mx-auto">
              03
            </div>
            
            <div className="w-[calc(100%-8rem)] md:w-[calc(50%-4rem)] bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-bold text-2xl mb-2 font-['Outfit']">Collaborate & Resolve</h3>
              <p className="text-gray-500 mb-6">Use threaded messages to keep discussions tidy, and mark them as resolved when done.</p>
              <div className="w-full h-32 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center">
                 <button className="px-6 py-2 bg-black text-white rounded-full text-sm font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Topic Resolved
                 </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </PublicLayout>
  );
};
