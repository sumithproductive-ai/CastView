import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus } from 'lucide-react';

interface TeamMember {
  id: string;
  email: string;
  role: string;
}

export function OnboardingInviteTeam() {
  const navigate = useNavigate();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { id: '1', email: '', role: 'Agent' }
  ]);

  const addTeamMember = () => {
    setTeamMembers([
      ...teamMembers,
      { id: Date.now().toString(), email: '', role: 'Agent' }
    ]);
  };

  const updateEmail = (id: string, email: string) => {
    setTeamMembers(
      teamMembers.map(member =>
        member.id === id ? { ...member, email } : member
      )
    );
  };

  const updateRole = (id: string, role: string) => {
    setTeamMembers(
      teamMembers.map(member =>
        member.id === id ? { ...member, role } : member
      )
    );
  };

  const handleContinue = () => {
    navigate('/onboarding/first-prospect');
  };

  const handleSkip = () => {
    navigate('/onboarding/first-prospect');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-[24px]">
      <div style={{ maxWidth: '560px', width: '100%' }}>
        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-[48px]">
          {/* Step 1 - Complete */}
          <div className="flex flex-col items-center">
            <div 
              className="w-[32px] h-[32px] rounded-full flex items-center justify-center mb-[8px]"
              style={{ backgroundColor: '#2a2a2a' }}
            >
              <span 
                className="text-[13px]" 
                style={{ fontFamily: 'var(--font-mono)', color: '#a0a09a' }}
              >
                1
              </span>
            </div>
            <span 
              className="text-[11px] uppercase tracking-[0.1em]"
              style={{ fontFamily: 'var(--font-label)', color: '#6a6a64' }}
            >
              Agency
            </span>
          </div>

          {/* Connecting Line */}
          <div 
            className="w-[80px] h-[1px] mx-[16px] mb-[24px]"
            style={{ backgroundColor: '#2a2a2a' }}
          />

          {/* Step 2 - Active */}
          <div className="flex flex-col items-center">
            <div 
              className="w-[32px] h-[32px] rounded-full flex items-center justify-center mb-[8px]"
              style={{ backgroundColor: '#f0f0ec' }}
            >
              <span 
                className="text-[13px]" 
                style={{ fontFamily: 'var(--font-mono)', color: '#080808', fontWeight: 500 }}
              >
                2
              </span>
            </div>
            <span 
              className="text-[11px] uppercase tracking-[0.1em]"
              style={{ fontFamily: 'var(--font-label)', color: '#f0f0ec' }}
            >
              Team
            </span>
          </div>

          {/* Connecting Line */}
          <div 
            className="w-[80px] h-[1px] mx-[16px] mb-[24px]"
            style={{ backgroundColor: '#2a2a2a' }}
          />

          {/* Step 3 - Inactive */}
          <div className="flex flex-col items-center">
            <div 
              className="w-[32px] h-[32px] rounded-full flex items-center justify-center mb-[8px]"
              style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}
            >
              <span 
                className="text-[13px]" 
                style={{ fontFamily: 'var(--font-mono)', color: '#6a6a64' }}
              >
                3
              </span>
            </div>
            <span 
              className="text-[11px] uppercase tracking-[0.1em]"
              style={{ fontFamily: 'var(--font-label)', color: '#6a6a64' }}
            >
              First Prospect
            </span>
          </div>
        </div>

        {/* Title */}
        <h1 
          className="text-[48px] mb-[12px] text-center" 
          style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
        >
          Invite your team.
        </h1>

        {/* Subtitle */}
        <p 
          className="text-[13px] mb-[48px] text-center"
          style={{ fontFamily: 'var(--font-mono)', color: '#a0a09a' }}
        >
          Add colleagues who will use CastView.
        </p>

        {/* Form Card */}
        <div 
          className="rounded-[4px] p-[32px]"
          style={{ backgroundColor: '#111111', border: '1px solid #2a2a2a' }}
        >
          {/* Team Member Inputs */}
          <div className="mb-[24px] space-y-[12px]">
            {teamMembers.map((member) => (
              <div key={member.id} className="flex gap-[12px]">
                {/* Email Input */}
                <input
                  type="email"
                  value={member.email}
                  onChange={(e) => updateEmail(member.id, e.target.value)}
                  placeholder="colleague@agency.com"
                  className="flex-1 px-[16px] py-[10px] bg-[#080808] border border-[#2a2a2a] rounded-[4px]"
                  style={{ 
                    fontFamily: 'var(--font-mono)', 
                    fontSize: '13px', 
                    color: '#f0f0ec'
                  }}
                />

                {/* Role Selector */}
                <select
                  value={member.role}
                  onChange={(e) => updateRole(member.id, e.target.value)}
                  className="px-[16px] py-[10px] bg-[#080808] border border-[#2a2a2a] rounded-[4px]"
                  style={{ 
                    fontFamily: 'var(--font-mono)', 
                    fontSize: '13px', 
                    color: '#f0f0ec'
                  }}
                >
                  <option value="Agent">Agent</option>
                  <option value="Booker">Booker</option>
                  <option value="Director">Director</option>
                </select>

                {/* Add Button */}
                {member.id === teamMembers[teamMembers.length - 1].id && (
                  <button
                    onClick={addTeamMember}
                    className="w-[40px] h-[40px] flex items-center justify-center border border-[#2a2a2a] rounded-[4px] hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                    style={{ color: '#a0a09a' }}
                  >
                    <Plus size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            className="w-full py-[14px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80 cursor-pointer"
            style={{ 
              fontFamily: 'var(--font-label)',
              backgroundColor: '#f0f0ec',
              color: '#080808'
            }}
          >
            SEND INVITES & CONTINUE →
          </button>

          {/* Skip Link */}
          <button
            onClick={() => navigate('/')}
            className="text-[11px] uppercase tracking-[0.05em] hover:opacity-70 transition-opacity mt-[16px]"
            style={{ 
              fontFamily: 'var(--font-mono)', 
              fontSize: '12px', 
              color: '#888880',
              display: 'block',
              textAlign: 'center', 
              cursor: 'pointer',
              marginTop: '24px',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
              width: '100%',
              background: 'none',
              border: 'none'
            }}
          >
            Skip setup — I'll do this later
          </button>

          {/* Skip Helper Text */}
          <p 
            className="text-center mt-[8px]"
            style={{ 
              fontFamily: 'var(--font-mono)', 
              fontSize: '10px', 
              color: '#555550',
              fontStyle: 'italic'
            }}
          >
            You can complete agency setup anytime in Settings.
          </p>
        </div>
      </div>
    </div>
  );
}