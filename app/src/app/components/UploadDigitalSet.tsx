import React, { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { Upload, X } from 'lucide-react';
import { useProspects } from '../context/ProspectsContext';
import { useRoster } from '../context/RosterContext';
import type { DigitalSet } from '../types/talent';

type UploadFormImageKey = 'front' | 'profile' | 'threeQuarter' | 'fullBody';

const formFieldLabelStyle = {
  fontFamily: 'var(--font-mono)',
  fontSize: '9px',
  color: '#888880',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
};

const formInputStyle = {
  fontFamily: 'var(--font-mono)',
  fontSize: '13px',
  color: '#f0f0ec',
};

const uploadFields = [
  { key: 'front' as const, label: 'FRONT' },
  { key: 'profile' as const, label: 'PROFILE' },
  { key: 'threeQuarter' as const, label: '3/4' },
  { key: 'fullBody' as const, label: 'FULL BODY' },
];

function getDefaultUploadDate() {
  return new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

export function UploadDigitalSet() {
  const navigate = useNavigate();
  const { prospectId } = useParams();
  const [searchParams] = useSearchParams();
  const profileType = searchParams.get('profileType') || 'prospect';
  const { getProspectById, updateProspect } = useProspects();
  const { models, updateModel } = useRoster();

  const entityId = prospectId ?? '';
  const prospect = getProspectById(entityId);
  const rosterModel = models.find((m) => m.id === entityId);
  const entityName = prospect?.name ?? rosterModel?.name ?? 'Unknown';

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(getDefaultUploadDate);
  const [notes, setNotes] = useState('');
  const [images, setImages] = useState<Record<UploadFormImageKey, string>>({
    front: '',
    profile: '',
    threeQuarter: '',
    fullBody: '',
  });
  const [fileNames, setFileNames] = useState<Partial<Record<UploadFormImageKey, string>>>({});

  const handleSave = () => {
    const newSet: DigitalSet = {
      id: Date.now().toString(),
      title: title.trim() || 'Untitled Set',
      uploadedAt: date.trim() || '—',
      front: images.front.trim() || '',
      profile: images.profile.trim() || '',
      threeQuarter: images.threeQuarter.trim() || '',
      fullBody: images.fullBody.trim() || '',
      additionalImages: [],
      notes: notes.trim(),
      tags: [],
      evaluations: [],
    };

    if (profileType === 'prospect') {
      const currentProspect = getProspectById(entityId);
      const baseSets = currentProspect?.digitalSets ?? [];
      updateProspect(entityId, { digitalSets: [newSet, ...baseSets] });
      navigate(`/prospects/${entityId}`);
    } else {
      const currentModel = models.find((m) => m.id === entityId);
      const baseSets = currentModel?.digitalSets ?? [];
      updateModel(entityId, { digitalSets: [newSet, ...baseSets] });
      navigate(`/roster/${entityId}`);
    }
  };

  const clearField = (fieldKey: UploadFormImageKey) => {
    setImages((prev) => ({ ...prev, [fieldKey]: '' }));
    setFileNames((prev) => {
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  };

  return (
    <div className="p-[20px] md:p-[48px]" style={{ backgroundColor: '#080808', minHeight: '100%' }}>
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-[32px] bg-transparent border-none hover:opacity-70 transition-opacity"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: '#888880',
          cursor: 'pointer',
        }}
      >
        ← BACK
      </button>

      <h1
        className="mb-[8px]"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '40px',
          fontWeight: 300,
          color: '#f0f0ec',
          lineHeight: 1.1,
        }}
      >
        Upload Digital Set
      </h1>

      <p
        className="mb-[32px]"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: '#888880',
        }}
      >
        {entityName}
      </p>

      <div className="max-w-[640px] space-y-[16px]">
        <div>
          <label className="block mb-[8px]" style={formFieldLabelStyle}>
            SET TITLE
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. May 2026 Update"
            className="w-full px-[12px] py-[12px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-[4px]"
            style={formInputStyle}
          />
        </div>

        <div>
          <label className="block mb-[8px]" style={formFieldLabelStyle}>
            DATE
          </label>
          <input
            type="text"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            placeholder="e.g. May 2026"
            className="w-full px-[12px] py-[12px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-[4px]"
            style={formInputStyle}
          />
        </div>

        {uploadFields.map((field) => {
          const fieldKey = field.key;
          const imageUrl = images[fieldKey];

          return (
            <div key={fieldKey}>
              <label className="block mb-[8px]" style={formFieldLabelStyle}>
                {field.label}
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                id={`upload-digitals-${fieldKey}`}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  const reader = new FileReader();
                  reader.onload = (evt) => {
                    const base64 = evt.target?.result as string;
                    setImages((prev) => ({ ...prev, [fieldKey]: base64 }));
                    setFileNames((prev) => ({ ...prev, [fieldKey]: file.name }));
                  };
                  reader.readAsDataURL(file);
                  e.target.value = '';
                }}
              />

              {imageUrl ? (
                <div
                  className="relative bg-[#111111] border border-[#2a2a2a] rounded-[4px] overflow-hidden"
                  style={{ height: '140px' }}
                >
                  <img
                    src={imageUrl}
                    alt={field.label}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center 15%',
                      display: 'block',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => clearField(fieldKey)}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'rgba(0,0,0,0.7)',
                      border: '1px solid #2a2a2a',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#f0f0ec',
                    }}
                    aria-label={`Clear ${field.label}`}
                  >
                    <X size={14} />
                  </button>
                  <div
                    className="absolute bottom-0 left-0 right-0 px-[8px] py-[6px]"
                    style={{
                      background: 'linear-gradient(transparent, rgba(8,8,8,0.9))',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '9px',
                        color: '#888880',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {fileNames[fieldKey] ?? 'Uploaded'}
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  role="button"
                  tabIndex={0}
                  className="relative bg-[#0d0d0d] border border-dashed rounded-[4px] cursor-pointer hover:border-[#3a3a3a] transition-colors"
                  style={{ borderColor: '#2a2a2a', height: '140px' }}
                  onClick={() =>
                    document.getElementById(`upload-digitals-${fieldKey}`)?.click()
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      document.getElementById(`upload-digitals-${fieldKey}`)?.click();
                    }
                  }}
                >
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <Upload size={24} style={{ color: '#6a6a64', marginBottom: '8px' }} />
                    <div
                      className="text-[9px] uppercase tracking-[0.1em]"
                      style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec' }}
                    >
                      {field.label}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '9px',
                        color: '#888880',
                        marginTop: '4px',
                      }}
                    >
                      Click to upload
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div>
          <label className="block mb-[8px]" style={formFieldLabelStyle}>
            NOTES
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes about this set"
            className="w-full px-[12px] py-[12px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-[4px] resize-none"
            style={formInputStyle}
          />
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="w-full py-[12px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
          style={{
            fontFamily: 'var(--font-mono)',
            backgroundColor: '#f0f0ec',
            color: '#080808',
            cursor: 'pointer',
            border: 'none',
          }}
        >
          SAVE DIGITAL SET
        </button>

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-full py-[12px] border border-[#f0f0ec] bg-transparent rounded-[4px] text-[11px] uppercase tracking-[0.1em] hover:bg-[#f0f0ec] hover:text-[#080808] transition-colors"
          style={{
            fontFamily: 'var(--font-mono)',
            color: '#f0f0ec',
            cursor: 'pointer',
          }}
        >
          CANCEL
        </button>
      </div>
    </div>
  );
}
