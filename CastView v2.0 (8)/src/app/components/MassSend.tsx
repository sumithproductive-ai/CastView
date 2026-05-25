import React, { useMemo, useState } from 'react';
import { useProspects } from '../context/ProspectsContext';
import { useRoster } from '../context/RosterContext';

type MassSendEntry = {
  id: string;
  name: string;
  type: 'PROSPECT' | 'ROSTER';
  image: string | null;
  contexts: string[];
  link: string;
};

function buildShareLink(name: string) {
  const slug = name.toLowerCase().replace(/\s+/g, '-');
  const month = new Date()
    .toLocaleString('en-US', { month: 'long', year: 'numeric' })
    .toLowerCase()
    .replace(' ', '-');
  return `castview.io/share/${slug}-${month}`;
}

function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
  return Promise.resolve();
}

export function MassSend() {
  const { prospects } = useProspects();
  const { models } = useRoster();
  const [copiedRowId, setCopiedRowId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const allEntries = useMemo<MassSendEntry[]>(
    () => [
      ...prospects
        .filter((p) => p.evaluations > 0)
        .map((p) => ({
          id: p.id,
          name: p.name,
          type: 'PROSPECT' as const,
          image: p.image,
          contexts: p.contexts || [],
          link: buildShareLink(p.name),
        })),
      ...models
        .filter((m) =>
          m.digitalSets.some((ds) => ds.evaluations.length > 0),
        )
        .map((m) => ({
          id: m.id,
          name: m.name,
          type: 'ROSTER' as const,
          image: m.image,
          contexts: m.contexts || [],
          link: buildShareLink(m.name),
        })),
    ],
    [prospects, models],
  );

  const handleCopyRow = (entry: MassSendEntry) => {
    copyToClipboard(entry.link).then(() => {
      setCopiedRowId(entry.id);
      setTimeout(() => setCopiedRowId(null), 2000);
    });
  };

  const handleCopyAll = () => {
    const text = allEntries.map((entry) => entry.link).join('\n');
    if (!text) return;
    copyToClipboard(text).then(() => {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    });
  };

  return (
    <div className="p-[48px]">
      <div className="flex items-start justify-between gap-[24px] mb-[48px]">
        <div>
          <h1
            className="text-[48px] mb-[8px]"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 300,
              color: '#f0f0ec',
            }}
          >
            Mass Send
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: '#888880',
            }}
          >
            Share evaluation links for multiple prospects and models at once.
          </p>
        </div>
        {allEntries.length > 0 && (
          <button
            type="button"
            onClick={handleCopyAll}
            className="flex-shrink-0 border border-[#2a2a2a] font-mono text-[11px] text-[#a0a09a] px-[20px] py-[10px] rounded-[4px] hover:border-[#f0f0ec] transition-colors uppercase tracking-[0.1em] cursor-pointer"
          >
            {copiedAll ? 'COPIED' : 'COPY ALL LINKS'}
          </button>
        )}
      </div>

      {allEntries.length === 0 ? (
        <p
          className="text-center py-[80px]"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: '#666660',
          }}
        >
          No evaluations on file yet. Run an evaluation to generate share links.
        </p>
      ) : (
        <div>
          {allEntries.map((entry) => (
            <div
              key={`${entry.type}-${entry.id}`}
              className="bg-[#111111] border-b border-[#2a2a2a] px-[24px] py-[16px] flex items-center gap-[16px]"
            >
              {entry.image ? (
                <img
                  src={entry.image}
                  alt={entry.name}
                  className="w-[36px] h-[48px] object-cover rounded-[2px] flex-shrink-0"
                />
              ) : (
                <div
                  className="w-[36px] h-[48px] rounded-[2px] flex-shrink-0"
                  style={{ backgroundColor: '#1a1a1a' }}
                />
              )}

              <div className="min-w-0 flex-shrink-0">
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '16px',
                    fontWeight: 300,
                    color: '#f0f0ec',
                  }}
                >
                  {entry.name}
                </div>
                <span
                  className="inline-block mt-[4px] font-mono text-[9px] uppercase tracking-[0.1em] px-[6px] py-[2px] border border-[#2a2a2a] text-[#888880]"
                >
                  {entry.type}
                </span>
              </div>

              <div
                className="flex-1 truncate mx-[16px]"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: '#555550',
                }}
              >
                {entry.link}
              </div>

              <button
                type="button"
                onClick={() => handleCopyRow(entry)}
                className="flex-shrink-0 font-mono text-[9px] uppercase text-[#a0a09a] border border-[#2a2a2a] px-[10px] py-[4px] rounded-[2px] hover:border-[#f0f0ec] transition-colors cursor-pointer tracking-[0.1em]"
              >
                {copiedRowId === entry.id ? 'COPIED' : 'COPY'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
