import React from 'react';
import { useRef, useState, type ChangeEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Upload, Check, Lock } from 'lucide-react';
import { saveNewModelDigitals } from '../utils/newModelDigitalsStorage';

type DigitalImageKey = 'front' | 'profile' | 'three_quarter' | 'full_body';

export function NewModelDigitals() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showDigitalsError, setShowDigitalsError] = useState(false);
  const [uploadFileNames, setUploadFileNames] = useState<
    Partial<Record<DigitalImageKey, string>>
  >({});

  const [uploadedImages, setUploadedImages] = useState<
    Record<DigitalImageKey, string | null>
  >({
    front: null,
    profile: null,
    three_quarter: null,
    full_body: null,
  });

  const fileInputRefs = {
    front: useRef<HTMLInputElement>(null),
    profile: useRef<HTMLInputElement>(null),
    three_quarter: useRef<HTMLInputElement>(null),
    full_body: useRef<HTMLInputElement>(null),
  };

  const handleFileSelect = (
    e: ChangeEvent<HTMLInputElement>,
    key: DigitalImageKey
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64 = evt.target?.result as string;
      setUploadedImages((prev) => ({
        ...prev,
        [key]: base64,
      }));
      setUploadFileNames((prev) => ({
        ...prev,
        [key]: file.name,
      }));
    };
    reader.readAsDataURL(file);
    setShowDigitalsError(false);
  };

  const uploadZones: {
    key: DigitalImageKey;
    label: string;
    uploaded: string | null;
  }[] = [
    { key: 'front', label: 'FRONT', uploaded: uploadedImages.front },
    { key: 'profile', label: 'PROFILE', uploaded: uploadedImages.profile },
    {
      key: 'three_quarter',
      label: '3/4',
      uploaded: uploadedImages.three_quarter,
    },
    { key: 'full_body', label: 'FULL BODY', uploaded: uploadedImages.full_body },
  ];

  const handleContinue = () => {
    const front = uploadedImages.front;
    const profile = uploadedImages.profile;
    const threeQuarter = uploadedImages.three_quarter;
    const fullBody = uploadedImages.full_body;
    const hasAtLeastOneDigital =
      front || profile || threeQuarter || fullBody;

    if (!hasAtLeastOneDigital) {
      setShowDigitalsError(true);
      return;
    }

    setShowDigitalsError(false);

    saveNewModelDigitals({
      front: front || '',
      profile: profile || '',
      threeQuarter: threeQuarter || '',
      fullBody: fullBody || '',
    });

    const params = new URLSearchParams(searchParams.toString());
    params.delete('front');
    params.delete('profile');
    params.delete('threeQuarter');
    params.delete('fullBody');
    navigate(`/roster/new/review?${params.toString()}`);
  };

  return (
    <div className="p-[48px]">
      <h1
        className="text-[48px] mb-[32px]"
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 300,
          color: 'var(--cv-primary-text)',
        }}
      >
        Upload Digitals
      </h1>

      <div className="flex items-center gap-[16px] mb-[48px]">
        <div className="flex items-center gap-[12px]">
          <div
            className="w-[32px] h-[32px] rounded-full flex items-center justify-center"
            style={{
              backgroundColor: 'var(--cv-primary-text)',
              color: 'var(--cv-background)',
            }}
          >
            <Check size={16} />
          </div>
          <span
            className="text-[13px]"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-primary-text)' }}
          >
            Basic Info
          </span>
        </div>

        <div className="w-[40px] h-[1px] bg-[var(--cv-subtle-border)]" />

        <div className="flex items-center gap-[12px]">
          <div
            className="w-[32px] h-[32px] rounded-full flex items-center justify-center text-[13px]"
            style={{
              fontFamily: 'var(--font-mono)',
              backgroundColor: 'var(--cv-primary-text)',
              color: 'var(--cv-background)',
            }}
          >
            2
          </div>
          <span
            className="text-[13px]"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-primary-text)' }}
          >
            Digitals
          </span>
        </div>

        <div className="w-[40px] h-[1px] bg-[var(--cv-subtle-border)]" />

        <div className="flex items-center gap-[12px]">
          <div
            className="w-[32px] h-[32px] rounded-full border flex items-center justify-center text-[13px]"
            style={{
              fontFamily: 'var(--font-mono)',
              borderColor: 'var(--cv-subtle-border)',
              color: 'var(--cv-secondary-text)',
            }}
          >
            3
          </div>
          <span
            className="text-[13px]"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}
          >
            Review
          </span>
        </div>
      </div>

      <div className="mb-[24px]">
        <div
          className="text-[9px] uppercase tracking-[0.1em] mb-[8px]"
          style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
        >
          UPLOAD DIGITALS
        </div>
        <div
          className="text-[11px] mb-[6px]"
          style={{
            fontFamily: 'var(--font-mono)',
            color: 'var(--cv-secondary-text)',
            fontStyle: 'italic',
          }}
        >
          Digitals are standard neutral-background agency photos — front-facing,
          profile, 3/4 turn, and full body. Natural light, no styling, no
          filters.
        </div>
        <div
          className="text-[12px]"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}
        >
          All four shots are required. Clear, natural light, no filters.
        </div>
      </div>

      <div
        className="grid grid-cols-4 gap-[16px] mb-[16px]"
        style={{ maxWidth: '640px' }}
        data-tutorial="upload-area"
      >
        {uploadZones.map((zone) => (
          <div
            key={zone.key}
            className="relative bg-[var(--cv-background)] border border-dashed rounded-[4px] cursor-pointer hover:border-[var(--cv-elevated)] transition-colors"
            style={{
              borderColor: 'var(--cv-subtle-border)',
              height: '140px',
            }}
            onClick={() => fileInputRefs[zone.key].current?.click()}
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              ref={fileInputRefs[zone.key]}
              onChange={(e) => handleFileSelect(e, zone.key)}
            />
            {zone.uploaded ? (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '8px',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#1a2a1a',
                    border: '1px solid #4a7a4a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ color: '#4a7a4a', fontSize: '14px' }}>✓</span>
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '9px',
                    color: '#4a7a4a',
                    textAlign: 'center',
                    wordBreak: 'break-all',
                    lineHeight: 1.4,
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {uploadFileNames[zone.key] ?? 'Uploaded'}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadedImages((prev) => ({
                      ...prev,
                      [zone.key]: null,
                    }));
                    setUploadFileNames((prev) => {
                      const next = { ...prev };
                      delete next[zone.key];
                      return next;
                    });
                    if (fileInputRefs[zone.key].current) {
                      fileInputRefs[zone.key].current!.value = '';
                    }
                  }}
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    background: 'rgba(0,0,0,0.7)',
                    border: '1px solid #333',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--cv-primary-text)',
                    fontSize: '10px',
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <Upload
                  size={32}
                  style={{ color: 'var(--cv-secondary-text)', marginBottom: '16px' }}
                />
                <div
                  className="text-[9px] uppercase tracking-[0.1em] mb-[8px]"
                  style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-primary-text)' }}
                >
                  {zone.label}
                </div>
                <div
                  className="text-[11px] text-center"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}
                >
                  (click or drag to upload)
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div
        className="text-[12px] mb-[8px]"
        style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}
      >
        JPG or PNG · Max 10MB per image · Minimum 800px on shortest side
      </div>

      <div className="flex items-center gap-[8px] mb-[24px]">
        <Lock size={12} style={{ color: 'var(--cv-secondary-text)' }} />
        <div
          className="text-[11px]"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}
        >
          Photos stored securely in EU-West (Ireland) · Never used for model
          training · Deletable anytime
        </div>
      </div>

      <div className="flex gap-[12px] items-center">
        <button
          type="button"
          onClick={() => navigate('/roster/new')}
          className="px-[20px] py-[12px] border border-[var(--cv-subtle-border)] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-colors hover:bg-[var(--cv-elevated)]"
          style={{
            fontFamily: 'var(--font-mono)',
            color: 'var(--cv-secondary-text)',
            cursor: 'pointer',
          }}
        >
          BACK
        </button>
        <div className="flex-1 flex flex-col items-end">
          {showDigitalsError && (
            <p
              className="w-full text-right"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: '#c87a7a',
                marginTop: '12px',
              }}
            >
              Upload at least one digital to continue.
            </p>
          )}
          <button
            type="button"
            onClick={handleContinue}
            className="px-[20px] py-[12px] bg-[var(--cv-primary-text)] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80 cursor-pointer"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--cv-background)',
            }}
          >
            CONTINUE TO REVIEW →
          </button>
          <div
            className="text-[12px] mt-[8px]"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}
          >
            You can complete missing digitals later.
          </div>
        </div>
      </div>
    </div>
  );
}
