import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Check } from 'lucide-react';
import { useTutorial } from '../context/TutorialContext';
import { LocationMarketField } from './LocationMarketField';

type Source = 'SCOUT' | 'INSTAGRAM' | 'EMAIL' | 'OPEN CALL' | 'REFERRAL';

export function NewProspectBasicInfo() {
  const navigate = useNavigate();
  const { isTutorialOpen } = useTutorial();
  const [searchParams] = useSearchParams();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [source, setSource] = useState<Source | null>(null);
  const [measurements, setMeasurements] = useState({
    height: '',
    bust: '',
    waist: '',
    hips: '',
    shoe: '',
    hair: ''
  });
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const n = searchParams.get('name');
    const m = searchParams.get('markets');
    const s = searchParams.get('source');
    if (n) setName(n);
    if (m) setLocation(m);
    if (s) setSource(s as Source);
    setMeasurements({
      height: searchParams.get('height') || '',
      bust:   searchParams.get('bust')   || '',
      waist:  searchParams.get('waist')  || '',
      hips:   searchParams.get('hips')   || '',
      shoe:   searchParams.get('shoe')   || '',
      hair:   searchParams.get('hair')   || ''
    });
    const no = searchParams.get('notes');
    if (no) setNotes(no);
  }, []);

  const handleContinue = () => {
    if (isTutorialOpen) {
      const tutorialParams = new URLSearchParams({
        name: name.trim() || 'Demo Prospect',
        markets: location.trim() || 'NEW YORK',
        source: source || 'SCOUT',
      });
      navigate(`/prospects/new/digitals?${tutorialParams.toString()}`);
      return;
    }
    const params = new URLSearchParams({
      name: name.trim(),
      markets: location.trim(),
      source: source || '',
      height: measurements.height,
      bust: measurements.bust,
      waist: measurements.waist,
      hips: measurements.hips,
      shoe: measurements.shoe,
      hair: measurements.hair,
      notes: notes
    });
    navigate(`/prospects/new/consent?${params.toString()}`);
  };

  return (
    <div className="p-[48px]">
      {/* Page Title */}
      <h1 
        className="text-[48px] mb-[32px]" 
        style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: 'var(--cv-primary-text)' }}
      >
        New Prospect
      </h1>

      {/* Step Indicator */}
      <div className="flex items-center gap-[16px] mb-[48px]">
        {/* Step 1 - Active */}
        <div className="flex items-center gap-[12px]">
          <div 
            className="w-[32px] h-[32px] rounded-full flex items-center justify-center text-[13px]"
            style={{ 
              fontFamily: 'var(--font-mono)', 
              backgroundColor: 'var(--cv-primary-text)',
              color: 'var(--cv-background)'
            }}
          >
            1
          </div>
          <span 
            className="text-[13px]"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-primary-text)' }}
          >
            Basic Info
          </span>
        </div>

        {/* Connector Line */}
        <div className="w-[40px] h-[1px] bg-[var(--cv-subtle-border)]" />

        {/* Step 2 - Inactive */}
        <div className="flex items-center gap-[12px]">
          <div 
            className="w-[32px] h-[32px] rounded-full border flex items-center justify-center text-[13px]"
            style={{ 
              fontFamily: 'var(--font-mono)', 
              borderColor: 'var(--cv-subtle-border)',
              color: 'var(--cv-secondary-text)'
            }}
          >
            2
          </div>
          <span 
            className="text-[13px]"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}
          >
            Digitals
          </span>
        </div>

        {/* Connector Line */}
        <div className="w-[40px] h-[1px] bg-[var(--cv-subtle-border)]" />

        {/* Step 3 - Inactive */}
        <div className="flex items-center gap-[12px]">
          <div 
            className="w-[32px] h-[32px] rounded-full border flex items-center justify-center text-[13px]"
            style={{ 
              fontFamily: 'var(--font-mono)', 
              borderColor: 'var(--cv-subtle-border)',
              color: 'var(--cv-secondary-text)'
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

      {/* Form Card */}
      <div className="max-w-[480px] mx-auto bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px] p-[32px]" data-tutorial="basic-info-form">
        <div className="space-y-[20px]">
          {/* Full Name Field */}
          <div>
            <label 
              className="block mb-[8px] text-[9px] uppercase tracking-[0.1em]"
              style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
            >
              FULL NAME
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sofia Andersen"
              className="w-full px-[12px] py-[12px] bg-[var(--cv-elevated)] border border-[var(--cv-subtle-border)] rounded-[4px]"
              style={{ 
                fontFamily: 'var(--font-mono)', 
                fontSize: '13px', 
                color: 'var(--cv-primary-text)'
              }}
            />
          </div>

          {/* Location Field */}
          <div>
            <LocationMarketField
              label="LOCATION"
              value={location}
              onChange={setLocation}
              placeholder="e.g. Dallas, TX"
              labelClassName="block mb-[8px] text-[9px] uppercase tracking-[0.1em]"
            />
          </div>

          {/* Source Field */}
          <div>
            <label 
              className="block mb-[8px] text-[10px] uppercase tracking-[0.12em]"
              style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
            >
              SOURCE
            </label>
            <div className="flex gap-[8px]">
              {(['SCOUT', 'INSTAGRAM', 'EMAIL', 'OPEN CALL', 'REFERRAL'] as Source[]).map((src) => (
                <button
                  key={src}
                  onClick={() => setSource(src)}
                  className="px-[16px] py-[8px] rounded-full text-[11px] uppercase tracking-[0.05em] transition-colors border cursor-pointer"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    backgroundColor: source === src ? 'var(--cv-primary-text)' : 'transparent',
                    borderColor: source === src ? 'var(--cv-primary-text)' : 'var(--cv-secondary-text)',
                    color: source === src ? 'var(--cv-background)' : 'var(--cv-secondary-text)'
                  }}
                >
                  {src}
                </button>
              ))}
            </div>
          </div>

          {/* Measurements Field */}
          <div>
            <label 
              className="block mb-[8px] text-[9px] uppercase tracking-[0.1em]"
              style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
            >
              MEASUREMENTS
            </label>
            <div className="grid grid-cols-3 gap-[12px]">
              {/* Height */}
              <div>
                <label 
                  className="block mb-[4px] text-[9px] uppercase tracking-[0.05em]"
                  style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
                >
                  Height
                </label>
                <input
                  type="text"
                  value={measurements.height}
                  onChange={(e) => setMeasurements(prev => ({ ...prev, height: e.target.value }))}
                  placeholder="177cm"
                  className="w-full px-[10px] py-[8px] bg-[var(--cv-elevated)] border border-[var(--cv-subtle-border)] rounded-[4px]"
                  style={{ 
                    fontFamily: 'var(--font-mono)', 
                    fontSize: '12px', 
                    color: 'var(--cv-primary-text)'
                  }}
                />
              </div>

              {/* Bust */}
              <div>
                <label 
                  className="block mb-[4px] text-[9px] uppercase tracking-[0.05em]"
                  style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
                >
                  Bust
                </label>
                <input
                  type="text"
                  value={measurements.bust}
                  onChange={(e) => setMeasurements(prev => ({ ...prev, bust: e.target.value }))}
                  placeholder="82cm"
                  className="w-full px-[10px] py-[8px] bg-[var(--cv-elevated)] border border-[var(--cv-subtle-border)] rounded-[4px]"
                  style={{ 
                    fontFamily: 'var(--font-mono)', 
                    fontSize: '12px', 
                    color: 'var(--cv-primary-text)'
                  }}
                />
              </div>

              {/* Waist */}
              <div>
                <label 
                  className="block mb-[4px] text-[9px] uppercase tracking-[0.05em]"
                  style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
                >
                  Waist
                </label>
                <input
                  type="text"
                  value={measurements.waist}
                  onChange={(e) => setMeasurements(prev => ({ ...prev, waist: e.target.value }))}
                  placeholder="61cm"
                  className="w-full px-[10px] py-[8px] bg-[var(--cv-elevated)] border border-[var(--cv-subtle-border)] rounded-[4px]"
                  style={{ 
                    fontFamily: 'var(--font-mono)', 
                    fontSize: '12px', 
                    color: 'var(--cv-primary-text)'
                  }}
                />
              </div>

              {/* Hips */}
              <div>
                <label 
                  className="block mb-[4px] text-[9px] uppercase tracking-[0.05em]"
                  style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
                >
                  Hips
                </label>
                <input
                  type="text"
                  value={measurements.hips}
                  onChange={(e) => setMeasurements(prev => ({ ...prev, hips: e.target.value }))}
                  placeholder="89cm"
                  className="w-full px-[10px] py-[8px] bg-[var(--cv-elevated)] border border-[var(--cv-subtle-border)] rounded-[4px]"
                  style={{ 
                    fontFamily: 'var(--font-mono)', 
                    fontSize: '12px', 
                    color: 'var(--cv-primary-text)'
                  }}
                />
              </div>

              {/* Shoe */}
              <div>
                <label 
                  className="block mb-[4px] text-[9px] uppercase tracking-[0.05em]"
                  style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
                >
                  Shoe
                </label>
                <input
                  type="text"
                  value={measurements.shoe}
                  onChange={(e) => setMeasurements(prev => ({ ...prev, shoe: e.target.value }))}
                  placeholder="39"
                  className="w-full px-[10px] py-[8px] bg-[var(--cv-elevated)] border border-[var(--cv-subtle-border)] rounded-[4px]"
                  style={{ 
                    fontFamily: 'var(--font-mono)', 
                    fontSize: '12px', 
                    color: 'var(--cv-primary-text)'
                  }}
                />
              </div>

              {/* Hair */}
              <div>
                <label 
                  className="block mb-[4px] text-[9px] uppercase tracking-[0.05em]"
                  style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
                >
                  Hair
                </label>
                <input
                  type="text"
                  value={measurements.hair}
                  onChange={(e) => setMeasurements(prev => ({ ...prev, hair: e.target.value }))}
                  placeholder="Brown"
                  className="w-full px-[10px] py-[8px] bg-[var(--cv-elevated)] border border-[var(--cv-subtle-border)] rounded-[4px]"
                  style={{ 
                    fontFamily: 'var(--font-mono)', 
                    fontSize: '12px', 
                    color: 'var(--cv-primary-text)'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Agent Notes Field */}
          <div>
            <label 
              className="block mb-[8px] text-[9px] uppercase tracking-[0.1em]"
              style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
            >
              AGENT NOTES
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Initial observations..."
              className="w-full h-[80px] px-[12px] py-[12px] bg-[var(--cv-elevated)] border border-[var(--cv-subtle-border)] rounded-[4px] resize-none"
              style={{ 
                fontFamily: 'var(--font-mono)', 
                fontSize: '13px', 
                color: 'var(--cv-primary-text)'
              }}
            />
          </div>

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            className="w-full py-[12px] bg-[var(--cv-primary-text)] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80 cursor-pointer"
            style={{ 
              fontFamily: 'var(--font-mono)', 
              color: 'var(--cv-background)'
            }}
          >
            CONTINUE TO DIGITALS →
          </button>
        </div>
      </div>
    </div>
  );
}