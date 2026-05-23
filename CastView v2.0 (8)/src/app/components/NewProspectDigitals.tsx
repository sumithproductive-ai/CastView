import { useNavigate, useParams, useSearchParams } from 'react-router';
import { Upload, X, Check, Lock } from 'lucide-react';

const sumithDigitals = {
  front: 'https://i.imgur.com/jZHp7Ei.jpg',
  profile: 'https://i.imgur.com/aBlfily.jpg',
  three_quarter: 'https://i.imgur.com/AlYexxj.jpg',
  full_body: 'https://i.imgur.com/sH8hoNb.jpg'
};

export function NewProspectDigitals() {
  const navigate = useNavigate();
  const { prospectId: routeProspectId } = useParams();
  const [searchParams] = useSearchParams();
  const prospectId = routeProspectId ?? searchParams.get('prospectId');

  const defaultUploadedImages = {
    front: 'https://images.unsplash.com/photo-1669643783392-09d0a26c79e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwbW9kZWwlMjBwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MzE3MzUyMHww&ixlib=rb-4.1.0&q=80&w=1080',
    profile: 'https://images.unsplash.com/photo-1763987275895-72f645d0acbc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2RlbCUyMHByb2ZpbGUlMjBzaWRlJTIwdmlldyUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MzE3MzUyMnww&ixlib=rb-4.1.0&q=80&w=1080',
    three_quarter: null,
    full_body: null
  };

  const uploadedImages = prospectId === 'sumith-chittimalla'
    ? sumithDigitals
    : defaultUploadedImages;

  const uploadZones = [
    { key: 'front', label: 'FRONT', uploaded: uploadedImages.front },
    { key: 'profile', label: 'PROFILE', uploaded: uploadedImages.profile },
    { key: 'three_quarter', label: '3/4', uploaded: uploadedImages.three_quarter },
    { key: 'full_body', label: 'FULL BODY', uploaded: uploadedImages.full_body }
  ];

  const uploadedCount = uploadZones.filter(zone => zone.uploaded).length;
  const allUploaded = uploadedCount === 4;

  return (
    <div className="p-[48px]">
      {/* Page Title */}
      <h1 
        className="text-[48px] mb-[32px]" 
        style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
      >
        New Prospect
      </h1>

      {/* Step Indicator */}
      <div className="flex items-center gap-[16px] mb-[48px]">
        {/* Step 1 - Completed */}
        <div className="flex items-center gap-[12px]">
          <div 
            className="w-[32px] h-[32px] rounded-full flex items-center justify-center"
            style={{ 
              backgroundColor: '#f0f0ec',
              color: '#080808'
            }}
          >
            <Check size={16} />
          </div>
          <span 
            className="text-[13px]"
            style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec' }}
          >
            Basic Info
          </span>
        </div>

        {/* Connector Line */}
        <div className="w-[40px] h-[1px] bg-[#2a2a2a]" />

        {/* Step 2 - Active */}
        <div className="flex items-center gap-[12px]">
          <div 
            className="w-[32px] h-[32px] rounded-full flex items-center justify-center text-[13px]"
            style={{ 
              fontFamily: 'var(--font-mono)', 
              backgroundColor: '#f0f0ec',
              color: '#080808'
            }}
          >
            2
          </div>
          <span 
            className="text-[13px]"
            style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec' }}
          >
            Digitals
          </span>
        </div>

        {/* Connector Line */}
        <div className="w-[40px] h-[1px] bg-[#2a2a2a]" />

        {/* Step 3 - Inactive */}
        <div className="flex items-center gap-[12px]">
          <div 
            className="w-[32px] h-[32px] rounded-full border flex items-center justify-center text-[13px]"
            style={{ 
              fontFamily: 'var(--font-mono)', 
              borderColor: '#2a2a2a',
              color: '#6a6a64'
            }}
          >
            3
          </div>
          <span 
            className="text-[13px]"
            style={{ fontFamily: 'var(--font-mono)', color: '#6a6a64' }}
          >
            Review
          </span>
        </div>
      </div>

      {/* Section Header */}
      <div className="mb-[24px]">
        <div 
          className="text-[9px] uppercase tracking-[0.1em] mb-[8px]"
          style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
        >
          UPLOAD DIGITALS
        </div>
        <div 
          className="text-[11px] mb-[6px]"
          style={{ 
            fontFamily: 'var(--font-mono)', 
            color: '#888880',
            fontStyle: 'italic'
          }}
        >
          Digitals are standard neutral-background agency photos — front-facing, profile, 3/4 turn, and full body. Natural light, no styling, no filters.
        </div>
        <div 
          className="text-[12px]"
          style={{ fontFamily: 'var(--font-mono)', color: '#6a6a64' }}
        >
          All four shots are required. Clear, natural light, no filters.
        </div>
      </div>

      {/* Upload Grid */}
      <div 
        className="grid grid-cols-4 gap-[16px] mb-[16px]" 
        style={{ maxWidth: '640px' }}
        data-tutorial="upload-area"
      >
        {uploadZones.map((zone) => (
          <div 
            key={zone.key}
            className="relative bg-[#0d0d0d] border border-dashed rounded-[4px] cursor-pointer hover:border-[#3a3a3a] transition-colors"
            style={{ 
              borderColor: zone.uploaded ? '#2a2a2a' : '#2a2a2a',
              height: '140px'
            }}
          >
            {zone.uploaded ? (
              <>
                {/* Uploaded Image */}
                <img 
                  src={zone.uploaded} 
                  alt={zone.label}
                  className="w-full h-full object-cover rounded-[4px]"
                />
                
                {/* Remove Button - Top Right */}
                <button
                  className="absolute top-[8px] right-[8px] w-[28px] h-[28px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-full flex items-center justify-center hover:bg-[#222222] transition-colors"
                >
                  <X size={14} style={{ color: '#f0f0ec' }} />
                </button>

                {/* Uploaded Badge - Bottom Left */}
                <div 
                  className="absolute bottom-[8px] left-[8px] px-[8px] py-[4px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-[4px] text-[8px] uppercase tracking-[0.1em]"
                  style={{ 
                    fontFamily: 'var(--font-label)', 
                    color: '#5d7d5d'
                  }}
                >
                  UPLOADED
                </div>
              </>
            ) : (
              /* Empty Upload Zone */
              <div className="w-full h-full flex flex-col items-center justify-center">
                <Upload size={32} style={{ color: '#6a6a64', marginBottom: '16px' }} />
                <div 
                  className="text-[9px] uppercase tracking-[0.1em] mb-[8px]"
                  style={{ fontFamily: 'var(--font-label)', color: '#f0f0ec' }}
                >
                  {zone.label}
                </div>
                <div 
                  className="text-[11px] text-center"
                  style={{ fontFamily: 'var(--font-mono)', color: '#6a6a64' }}
                >
                  (click or drag to upload)
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Requirements Note */}
      <div 
        className="text-[12px] mb-[8px]"
        style={{ fontFamily: 'var(--font-mono)', color: '#6a6a64' }}
      >
        JPG or PNG · Max 10MB per image · Minimum 800px on shortest side
      </div>

      {/* Privacy Notice */}
      <div className="flex items-center gap-[8px] mb-[24px]">
        <Lock size={12} style={{ color: '#6a6a64' }} />
        <div 
          className="text-[11px]"
          style={{ fontFamily: 'var(--font-mono)', color: '#6a6a64' }}
        >
          Photos stored securely in EU-West (Ireland) · Never used for model training · Deletable anytime
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-[12px] items-center">
        <button
          onClick={() => navigate('/prospects/new')}
          className="px-[20px] py-[12px] border border-[#2a2a2a] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-colors hover:bg-[#1a1a1a]"
          style={{ 
            fontFamily: 'var(--font-mono)', 
            color: '#a0a09a',
            cursor: 'pointer'
          }}
        >
          BACK
        </button>
        <div className="flex-1 flex flex-col items-end">
          <button
            onClick={() => navigate('/prospects/new/review')}
            className="px-[20px] py-[12px] bg-[#f0f0ec] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80 cursor-pointer"
            style={{ 
              fontFamily: 'var(--font-mono)', 
              color: '#080808'
            }}
          >
            CONTINUE TO REVIEW →
          </button>
          <div 
            className="text-[12px] mt-[8px]"
            style={{ fontFamily: 'var(--font-mono)', color: '#6a6a64' }}
          >
            You can complete missing digitals later.
          </div>
        </div>
      </div>
    </div>
  );
}