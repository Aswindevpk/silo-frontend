import React from 'react';
import { useRightSidebar } from '@/context/RightSidebarContext';
import { X, Mail, Clock, User as UserIcon, Search, Filter, Plus, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export const RightSidebar: React.FC = () => {
  const { isOpen, type, data, closeSidebar } = useRightSidebar();

  if (!isOpen) return null;

  return (
    <aside className="w-[340px] border-l bg-white flex flex-col h-full overflow-hidden shrink-0 transition-all duration-300 ease-in-out">
      <ScrollArea className="flex-1">
        {type === 'profile' && data && (
          <div className="flex flex-col px-5 py-4">
            
            {/* Header Info */}
            <div className="flex items-start gap-4 mb-4 relative">
             <Button variant="ghost" size="icon" onClick={closeSidebar} className="absolute right-0 top-0 h-6 w-6 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100">
               <X className="h-3.5 w-3.5" />
             </Button>
             
             <div className="h-16 w-16 bg-gray-600 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-white text-xl font-medium">{data.username.substring(0, 2).toUpperCase()}</span>
             </div>
             <div className="flex flex-col pt-1 w-full">
                <div className="flex items-center justify-between pr-6">
                   <h2 className="text-lg font-bold text-gray-900 font-['Outfit']">{data.username}</h2>
                </div>
                <p className="text-sm text-gray-400 mt-0.5">Add description...</p>
                
                <div className="flex items-center gap-2 mt-2">
                   <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div> Online
                   </div>
                </div>
             </div>
          </div>
          
          <Button variant="secondary" size="sm" className="w-max bg-[#F3F1FF] text-[#5851DE] hover:bg-[#EBEBFE] h-7 px-3 text-xs font-semibold mb-6 flex gap-1.5 items-center">
             <span className="text-sm">🌸</span> Get StandUp
          </Button>

          {/* Tabs */}
          <div className="flex items-center gap-4 text-xs font-medium border-b border-gray-100 pb-2 mb-4">
             <button className="text-gray-900 border-b-2 border-gray-900 pb-2 -mb-[9px]">Activity</button>
             <button className="text-gray-500 hover:text-gray-900 pb-2 -mb-[9px]">Tasks (1)</button>
             <button className="text-gray-500 hover:text-gray-900 pb-2 -mb-[9px]">Comments (0)</button>
             <button className="text-gray-500 hover:text-gray-900 pb-2 -mb-[9px]">2 more...</button>
          </div>

          {/* User Details List */}
          <div className="flex flex-col gap-4 text-sm text-gray-700 mb-8 mt-2">
             <div className="flex items-center gap-3 cursor-pointer group">
                <Plus className="h-4 w-4 text-gray-400 group-hover:text-gray-700" />
                <span className="group-hover:text-gray-900">Add time off</span>
             </div>
             <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>{data.email}</span>
             </div>
             <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>8:25 pm local time</span>
             </div>
             <div className="flex items-center gap-3 cursor-pointer group">
                <UserIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-700" />
                <span className="text-gray-500 group-hover:text-gray-900">Select manager ⌄</span>
             </div>
          </div>

          <Separator className="w-full opacity-60 mb-6" />
          
          {/* Priorities Section */}
          <div className="w-full mb-8">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5">
                   <h3 className="text-[13px] font-bold text-gray-900">Priorities</h3>
                   <Info className="h-3.5 w-3.5 text-gray-400" />
                </div>
                <button className="text-xs font-semibold text-gray-500 hover:text-gray-900 flex items-center gap-1">
                   <Plus className="h-3 w-3" /> Add
                </button>
             </div>
             <div className="border border-dashed border-gray-200 rounded-lg p-3 text-center cursor-pointer hover:bg-gray-50 transition-colors">
                <span className="text-[13px] text-gray-400 font-medium flex items-center justify-center gap-2">
                   <Plus className="h-3.5 w-3.5" /> Add your most important tasks here.
                </span>
             </div>
          </div>

          {/* Activity Section */}
          <div className="w-full mb-8">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-[13px] font-bold text-gray-900">Activity</h3>
                <div className="flex items-center gap-3">
                   <Search className="h-3.5 w-3.5 text-gray-400 hover:text-gray-700 cursor-pointer" />
                   <Filter className="h-3.5 w-3.5 text-gray-400 hover:text-gray-700 cursor-pointer" />
                </div>
             </div>
             
             <div className="flex flex-col items-center text-center mt-6">
                <div className="h-24 w-32 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center mb-6 relative">
                   {/* Abstract representation of the empty state illustration */}
                   <div className="absolute top-4 left-4 h-6 w-20 bg-white border border-gray-200 rounded shadow-sm flex items-center px-2 gap-1 rotate-[-5deg]">
                      <div className="h-1.5 w-1.5 rounded-full bg-gray-300"></div>
                      <div className="h-1 w-8 bg-gray-200 rounded"></div>
                   </div>
                   <div className="absolute bottom-4 right-4 h-6 w-20 bg-white border border-gray-200 rounded shadow-sm flex items-center px-2 gap-1 rotate-[5deg]">
                      <div className="h-1.5 w-1.5 rounded-full bg-gray-300"></div>
                      <div className="h-1 w-8 bg-gray-200 rounded"></div>
                   </div>
                   <div className="absolute -bottom-2 -right-2 h-6 w-6 rounded-full bg-gray-400 flex items-center justify-center border-2 border-white">
                      <span className="text-[10px] text-white font-bold">~</span>
                   </div>
                </div>
                <h4 className="text-[15px] font-bold text-gray-900 mb-1">Nothing to see here</h4>
                <p className="text-xs text-gray-500 max-w-[200px]">Looks like you don't have any task activity yet.</p>
             </div>
          </div>
          </div>
        )}
      </ScrollArea>
    </aside>
  );
};
