import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { toast } from 'sonner';

type UseCase = 'Work' | 'Personal' | 'School' | '';

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('token') || '';

  // Steps: 1: Use Case, 2: How you heard, 3: Specific Purpose, 4: Workspace Name
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const [useCase, setUseCase] = useState<UseCase>('');
  const [howHeard, setHowHeard] = useState('');
  const [specificPurpose, setSpecificPurpose] = useState('');
  
  const [workspaceName, setWorkspaceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptingInvite, setAcceptingInvite] = useState(false);

  // If there's an invite token on mount, we should just accept it instead of wizard
  useEffect(() => {
    if (inviteToken) {
      handleAcceptInvite();
    }
  }, [inviteToken]);

  const handleAcceptInvite = async () => {
    try {
      setAcceptingInvite(true);
      await api.acceptWorkspaceInvitation(inviteToken);
      toast.success('Invitation accepted successfully!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Failed to accept invitation. The token may be expired.');
      // Remove token from URL so they can proceed with normal onboarding if failed
      navigate('/onboarding', { replace: true });
    } finally {
      setAcceptingInvite(false);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!workspaceName) {
      toast.error('Please enter a workspace name.');
      return;
    }

    try {
      setLoading(true);
      const slug = workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const ws = await api.createWorkspace(workspaceName, slug || `ws-${Date.now()}`);
      toast.success(`Workspace "${ws.name}" created successfully!`);
      navigate(`/w/${ws.slug}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create workspace.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !useCase) return toast.error('Please select an option');
    if (step === 2 && !howHeard) return toast.error('Please select an option');
    if (step === 3 && !specificPurpose) return toast.error('Please select an option');
    
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleCreateWorkspace();
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  if (acceptingInvite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-[#18181B]">
        <div className="animate-pulse">Accepting Invitation...</div>
      </div>
    );
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
            <h1 className="text-3xl font-bold mb-8 text-[#18181B] font-['Outfit']">What would you like to use Silo for?</h1>
            <div className="flex flex-wrap gap-4">
              {['Work', 'Personal', 'School'].map((option) => (
                <button
                  key={option}
                  onClick={() => setUseCase(option as UseCase)}
                  className={`px-6 py-3 rounded-full border transition-all ${
                    useCase === option 
                      ? 'bg-[#18181B] text-white border-[#18181B] shadow-md' 
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-gray-900 shadow-sm'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
            <h1 className="text-3xl font-bold mb-8 text-[#18181B] font-['Outfit']">How did you hear about us?</h1>
            <div className="flex flex-wrap gap-4 max-w-2xl">
              {['Search Engine', 'Social Media', 'Friend or Colleague', 'Advertisement', 'Other'].map((option) => (
                <button
                  key={option}
                  onClick={() => setHowHeard(option)}
                  className={`px-6 py-3 rounded-full border transition-all ${
                    howHeard === option 
                      ? 'bg-[#18181B] text-white border-[#18181B] shadow-md' 
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-gray-900 shadow-sm'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
            <h1 className="text-3xl font-bold mb-8 text-[#18181B] font-['Outfit']">What would you like to manage?</h1>
            <div className="flex flex-wrap gap-3 max-w-2xl">
              {['Finance & Accounting', 'Creative & Design', 'HR & Recruiting', 'Software Development', 
                'Sales & CRM', 'Operations', 'PMO', 'Personal Use', 'Support', 'Marketing', 
                'Startup', 'Professional Services', 'IT', 'Other'].map((option) => (
                <button
                  key={option}
                  onClick={() => setSpecificPurpose(option)}
                  className={`px-5 py-2.5 rounded-full border text-sm transition-all ${
                    specificPurpose === option 
                      ? 'bg-[#18181B] text-white border-[#18181B] shadow-md' 
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-gray-900 shadow-sm'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-xl">
            <h1 className="text-3xl font-bold mb-8 text-[#18181B] font-['Outfit']">What should we call your workspace?</h1>
            <input
              type="text"
              autoFocus
              placeholder="e.g. Acme Corporation"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && workspaceName.trim()) {
                  nextStep();
                }
              }}
              className="w-full bg-white border border-gray-200 rounded-xl px-5 py-4 text-xl text-[#18181B] focus:outline-none focus:border-[#18181B] focus:ring-1 focus:ring-[#18181B] transition-colors shadow-sm"
            />
            <p className="mt-4 text-sm text-green-600 flex items-center gap-2 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
              Don't do it alone - invite your team later to get started 200% faster.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  const isNextDisabled = 
    (step === 1 && !useCase) || 
    (step === 2 && !howHeard) || 
    (step === 3 && !specificPurpose) || 
    (step === 4 && !workspaceName.trim());

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F9FA] text-[#18181B] font-sans relative overflow-hidden">
      {/* Top Header Logo */}
      <div className="absolute top-8 left-8 flex items-center gap-3">
        <img src="/silo.png" alt="SILO Logo" className="h-7 w-auto object-contain" />
        <span className="text-xl font-bold tracking-tight text-[#18181B] font-['Outfit']">Silo</span>
      </div>

      {/* Main Content Centered */}
      <div className="flex-1 flex items-center justify-center px-8 w-full max-w-3xl mx-auto">
        {renderStep()}
      </div>

      {/* Bottom Progress Bar & Navigation */}
      <div className="w-full max-w-3xl mx-auto px-8 pb-10">
        {/* Progress Line */}
        <div className="w-full h-[4px] bg-gray-200 rounded-full mb-8 overflow-hidden flex relative">
          <div 
            className="absolute left-0 top-0 h-full bg-[#18181B] transition-all duration-500 ease-in-out" 
            style={{ width: `${(step / totalSteps) * 100}%` }}
          ></div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={step === 1}
            className={`px-5 py-2.5 rounded-full border text-sm font-medium transition-all ${
              step === 1 
                ? 'opacity-0 pointer-events-none' 
                : 'border-gray-200 bg-white text-gray-600 hover:text-gray-900 hover:border-gray-300 shadow-sm'
            }`}
          >
            &lt; Back
          </button>
          
          <button
            onClick={nextStep}
            disabled={isNextDisabled || loading}
            className={`px-8 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm ${
              isNextDisabled || loading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                : 'bg-[#18181B] text-white hover:bg-black'
            }`}
          >
            {loading ? 'Creating...' : step === totalSteps ? 'Create Workspace' : 'Next >'}
          </button>
        </div>
      </div>
    </div>
  );
};
