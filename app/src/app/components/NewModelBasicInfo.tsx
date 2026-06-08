import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { LocationMarketField } from './LocationMarketField';

type Source = 'SCOUT' | 'INSTAGRAM' | 'EMAIL' | 'OPEN CALL' | 'REFERRAL';

export function NewModelBasicInfo() {
  const navigate = useNavigate();
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
    hair: '',
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
      bust: searchParams.get('bust') || '',
      waist: searchParams.get('waist') || '',
      hips: searchParams.get('hips') || '',
      shoe: searchParams.get('shoe') || '',
      hair: searchParams.get('hair') || '',
    });
    const no = searchParams.get('notes');
    if (no) setNotes(no);
  }, []);

  const handleContinue = () => {
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
      notes: notes,
    });
    navigate(`/roster/new/digitals?${params.toString()}`);
  };

  return (
    <div className="p-[48px]">
      <h1
        className="text-[48px] mb-[32px]"
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 300,
          color: '#f0f0ec',
        }}
      >
        New Model
      </h1>

      <div className="flex items-center gap-[16px] mb-[48px]">
        <div className="flex items-center gap-[12px]">
          <div
            className="w-[32px] h-[32px] rounded-full flex items-center justify-center text-[13px]"
            style={{
              fontFamily: 'var(--font-mono)',
              backgroundColor: '#f0f0ec',
              color: '#080808',
            }}
          >
            1
          </div>
          <span
            className="text-[13px]"
            style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec' }}
          >
            Basic Info
          </span>
        </div>

        <div className="w-[40px] h-[1px] bg-[#2a2a2a]" />

        <div className="flex items-center gap-[12px]">
          <div
            className="w-[32px] h-[32px] rounded-full border flex items-center justify-center text-[13px]"
            style={{
              fontFamily: 'var(--font-mono)',
              borderColor: '#2a2a2a',
              color: '#6a6a64',
            }}
          >
            2
          </div>
          <span
            className="text-[13px]"
            style={{ fontFamily: 'var(--font-mono)', color: '#6a6a64' }}
          >
            Digitals
          </span>
        </div>

        <div className="w-[40px] h-[1px] bg-[#2a2a2a]" />

        <div className="flex items-center gap-[12px]">
          <div
            className="w-[32px] h-[32px] rounded-full border flex items-center justify-center text-[13px]"
            style={{
              fontFamily: 'var(--font-mono)',
              borderColor: '#2a2a2a',
              color: '#6a6a64',
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

      <div
        className="max-w-[480px] mx-auto bg-[#111111] border border-[#2a2a2a] rounded-[4px] p-[32px]"
        data-tutorial="basic-info-form"
      >
        <div className="space-y-[20px]">
          <div>
            <label
              className="block mb-[8px] text-[9px] uppercase tracking-[0.1em]"
              style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
            >
              FULL NAME
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sofia Andersen"
              className="w-full px-[12px] py-[12px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-[4px]"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                color: '#f0f0ec',
              }}
            />
          </div>

          <div>
            <LocationMarketField
              label="LOCATION"
              value={location}
              onChange={setLocation}
              placeholder="e.g. Dallas, TX"
              labelClassName="block mb-[8px] text-[9px] uppercase tracking-[0.1em]"
            />
          </div>

          <div>
            <label
              className="block mb-[8px] text-[10px] uppercase tracking-[0.12em]"
              style={{ fontFamily: 'var(--font-label)', color: '#888880' }}
            >
              SOURCE
            </label>
            <div className="flex gap-[8px]">
              {(
                ['SCOUT', 'INSTAGRAM', 'EMAIL', 'OPEN CALL', 'REFERRAL'] as Source[]
              ).map((src) => (
                <button
                  key={src}
                  onClick={() => setSource(src)}
                  className="px-[16px] py-[8px] rounded-full text-[11px] uppercase tracking-[0.05em] transition-colors border cursor-pointer"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    backgroundColor: source === src ? '#f0f0ec' : 'transparent',
                    borderColor: source === src ? '#f0f0ec' : '#444440',
                    color: source === src ? '#080808' : '#888880',
                  }}
                >
                  {src}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              className="block mb-[8px] text-[9px] uppercase tracking-[0.1em]"
              style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
            >
              MEASUREMENTS
            </label>
            <div className="grid grid-cols-3 gap-[12px]">
              <div>
                <label
                  className="block mb-[4px] text-[9px] uppercase tracking-[0.05em]"
                  style={{ fontFamily: 'var(--font-label)', color: '#6a6a64' }}
                >
                  Height
                </label>
                <input
                  type="text"
                  value={measurements.height}
                  onChange={(e) =>
                    setMeasurements((prev) => ({ ...prev, height: e.target.value }))
                  }
                  placeholder="177cm"
                  className="w-full px-[10px] py-[8px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-[4px]"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: '#f0f0ec',
                  }}
                />
              </div>

              <div>
                <label
                  className="block mb-[4px] text-[9px] uppercase tracking-[0.05em]"
                  style={{ fontFamily: 'var(--font-label)', color: '#6a6a64' }}
                >
                  Bust
                </label>
                <input
                  type="text"
                  value={measurements.bust}
                  onChange={(e) =>
                    setMeasurements((prev) => ({ ...prev, bust: e.target.value }))
                  }
                  placeholder="82cm"
                  className="w-full px-[10px] py-[8px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-[4px]"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: '#f0f0ec',
                  }}
                />
              </div>

              <div>
                <label
                  className="block mb-[4px] text-[9px] uppercase tracking-[0.05em]"
                  style={{ fontFamily: 'var(--font-label)', color: '#6a6a64' }}
                >
                  Waist
                </label>
                <input
                  type="text"
                  value={measurements.waist}
                  onChange={(e) =>
                    setMeasurements((prev) => ({ ...prev, waist: e.target.value }))
                  }
                  placeholder="61cm"
                  className="w-full px-[10px] py-[8px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-[4px]"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: '#f0f0ec',
                  }}
                />
              </div>

              <div>
                <label
                  className="block mb-[4px] text-[9px] uppercase tracking-[0.05em]"
                  style={{ fontFamily: 'var(--font-label)', color: '#6a6a64' }}
                >
                  Hips
                </label>
                <input
                  type="text"
                  value={measurements.hips}
                  onChange={(e) =>
                    setMeasurements((prev) => ({ ...prev, hips: e.target.value }))
                  }
                  placeholder="89cm"
                  className="w-full px-[10px] py-[8px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-[4px]"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: '#f0f0ec',
                  }}
                />
              </div>

              <div>
                <label
                  className="block mb-[4px] text-[9px] uppercase tracking-[0.05em]"
                  style={{ fontFamily: 'var(--font-label)', color: '#6a6a64' }}
                >
                  Shoe
                </label>
                <input
                  type="text"
                  value={measurements.shoe}
                  onChange={(e) =>
                    setMeasurements((prev) => ({ ...prev, shoe: e.target.value }))
                  }
                  placeholder="39"
                  className="w-full px-[10px] py-[8px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-[4px]"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: '#f0f0ec',
                  }}
                />
              </div>

              <div>
                <label
                  className="block mb-[4px] text-[9px] uppercase tracking-[0.05em]"
                  style={{ fontFamily: 'var(--font-label)', color: '#6a6a64' }}
                >
                  Hair
                </label>
                <input
                  type="text"
                  value={measurements.hair}
                  onChange={(e) =>
                    setMeasurements((prev) => ({ ...prev, hair: e.target.value }))
                  }
                  placeholder="Brown"
                  className="w-full px-[10px] py-[8px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-[4px]"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: '#f0f0ec',
                  }}
                />
              </div>
            </div>
          </div>

          <div>
            <label
              className="block mb-[8px] text-[9px] uppercase tracking-[0.1em]"
              style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
            >
              AGENT NOTES
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Initial observations..."
              className="w-full h-[80px] px-[12px] py-[12px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-[4px] resize-none"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                color: '#f0f0ec',
              }}
            />
          </div>

          <button
            onClick={handleContinue}
            className="w-full py-[12px] bg-[#f0f0ec] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80 cursor-pointer"
            style={{
              fontFamily: 'var(--font-mono)',
              color: '#080808',
            }}
          >
            CONTINUE TO DIGITALS →
          </button>
        </div>
      </div>
    </div>
  );
}
