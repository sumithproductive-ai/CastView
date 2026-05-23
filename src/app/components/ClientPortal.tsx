import { useState } from 'react';
import { toast } from 'sonner';

export function ClientPortal() {
  const [response, setResponse] = useState<'interested' | 'pass' | null>(null);
  const [note, setNote] = useState('');

  const renderCards = [
    {
      id: 1,
      context: 'FRAGRANCE',
      score: 94,
      image: 'https://images.unsplash.com/photo-1761329842950-f3551938e4da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmFncmFuY2UlMjBlZGl0b3JpYWwlMjBtb2RlbCUyMHBob3RvfGVufDF8fHx8MTc3MzE2NTMzMnww&ixlib=rb-4.1.0&q=80&w=1080',
      isFeatured: true
    },
    {
      id: 2,
      context: 'EDITORIAL',
      score: 96,
      image: 'https://images.unsplash.com/photo-1708170236080-6cb6d2d5497c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlZGl0b3JpYWwlMjBmYXNoaW9uJTIwdmVydGljYWwlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzMxNjUzMzF8MA&ixlib=rb-4.1.0&q=80&w=1080',
      isFeatured: false
    },
    {
      id: 3,
      context: 'CAMPAIGN',
      score: 88,
      image: 'https://images.unsplash.com/photo-1697677103505-dd4b2dbf1b1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW1wYWlnbiUyMGZhc2hpb24lMjBzaG9vdHxlbnwxfHx8fDE3NzMxNjUzMzJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
      isFeatured: false
    },
    {
      id: 4,
      context: 'BEAUTY',
      score: 91,
      image: 'https://images.unsplash.com/photo-1759873911657-8140566c29a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWF1dHklMjBlZGl0b3JpYWwlMjBwb3J0cmFpdCUyMHNxdWFyZXxlbnwxfHx8fDE3NzMxNjUzMzN8MA&ixlib=rb-4.1.0&q=80&w=1080',
      isFeatured: false
    }
  ];

  const markets = ['NEW YORK', 'LONDON', 'PARIS'];

  return (
    <div 
      className="w-full mx-auto p-[48px]"
      style={{ maxWidth: '1000px', backgroundColor: '#080808' }}
    >
      {/* Header Section */}
      <div className="mb-[48px]">
        {/* Model Name */}
        <h1 
          className="text-[56px] mb-[12px]" 
          style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
        >
          Sofia Andersen
        </h1>

        {/* Sender Info */}
        <p 
          className="text-[12px] mb-[16px]"
          style={{ fontFamily: 'var(--font-mono)', color: '#888880' }}
        >
          Sent by Admin · [Your Agency Name] · March 14, 2026
        </p>

        {/* Market Tags */}
        <div className="flex flex-wrap gap-[8px]">
          {markets.map((market) => (
            <div
              key={market}
              className="px-[12px] py-[6px] border border-[#2a2a2a] rounded-full text-[9px] uppercase tracking-[0.1em]"
              style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
            >
              {market}
            </div>
          ))}
        </div>
      </div>

      {/* PDF Export Action */}
      <div className="mb-[24px]">
        <div className="flex justify-end mb-[8px]">
          <button
            onClick={() => toast.success('PDF package downloaded · castview-package.pdf')}
            className="flex items-center gap-[8px] px-[20px] py-[12px] bg-[#f0f0ec] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
            style={{ fontFamily: 'var(--font-mono)', color: '#080808', cursor: 'pointer' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v9M4 7l3 3 3-3M1 12h12" stroke="#080808" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            DOWNLOAD PDF PACKAGE
          </button>
        </div>
        <div className="flex justify-end">
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#888880' }}>
            Includes all evaluations and scores in this package
          </p>
        </div>
      </div>

      {/* 2x2 Render Grid */}
      <div className="grid grid-cols-2 gap-[24px] mb-[48px]">
        {renderCards.map((card) => (
          <div 
            key={card.id}
            className="rounded-[4px] overflow-hidden"
            style={{ 
              backgroundColor: '#111111',
              border: card.isFeatured ? '1px solid #f0f0ec' : '1px solid #2a2a2a'
            }}
          >
            {/* Render Image */}
            <div className="aspect-[4/5] bg-[#1a1a1a]">
              <img 
                src={card.image} 
                alt={card.context}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Card Info */}
            <div className="p-[16px]">
              {/* Context Label */}
              <div 
                className="text-[9px] uppercase tracking-[0.1em] mb-[8px]"
                style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
              >
                {card.context}
              </div>

              {/* Score */}
              <div 
                className="text-[32px] mb-[12px]"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
              >
                {card.score}%
              </div>

              {/* Progress Bar */}
              <div className="h-[4px] bg-[#2a2a2a] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#f0f0ec] rounded-full"
                  style={{ width: `${card.score}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Agent Notes Section */}
      <div className="mb-[48px]">
        <div 
          className="text-[11px] uppercase tracking-[0.1em] mb-[12px]"
          style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
        >
          AGENT NOTES
        </div>
        <p 
          className="text-[13px]"
          style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec', lineHeight: 1.6 }}
        >
          Strong fragrance potential — follow up with client brief from Maison Margiela. Available March–June.
        </p>
      </div>

      {/* Response Panel */}
      <div 
        className="rounded-[4px] p-[24px] mb-[48px]"
        style={{ backgroundColor: '#111111', border: '1px solid #2a2a2a' }}
      >
        {/* Label */}
        <div 
          className="text-[11px] uppercase tracking-[0.1em] mb-[16px]"
          style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
        >
          YOUR RESPONSE
        </div>

        {/* Response Buttons */}
        <div className="grid grid-cols-2 gap-[12px] mb-[16px]">
          <button
            onClick={() => setResponse('interested')}
            className="py-[16px] rounded-[4px] border text-[11px] uppercase tracking-[0.1em] transition-all"
            style={{ 
              fontFamily: 'var(--font-label)',
              borderColor: response === 'interested' ? '#4a7a4a' : '#2a2a2a',
              backgroundColor: response === 'interested' ? '#1a2a1a' : 'transparent',
              color: response === 'interested' ? '#6ababa' : '#f0f0ec',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              if (response !== 'interested') {
                e.currentTarget.style.backgroundColor = '#1a2a1a';
              }
            }}
            onMouseLeave={(e) => {
              if (response !== 'interested') {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            INTERESTED
          </button>

          <button
            onClick={() => setResponse('pass')}
            className="py-[16px] rounded-[4px] border text-[11px] uppercase tracking-[0.1em] transition-all"
            style={{ 
              fontFamily: 'var(--font-label)',
              borderColor: response === 'pass' ? '#7a4a4a' : '#2a2a2a',
              backgroundColor: response === 'pass' ? '#2a1a1a' : 'transparent',
              color: response === 'pass' ? '#ba6a6a' : '#f0f0ec',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              if (response !== 'pass') {
                e.currentTarget.style.backgroundColor = '#2a1a1a';
              }
            }}
            onMouseLeave={(e) => {
              if (response !== 'pass') {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            PASS
          </button>
        </div>

        {/* Note Textarea */}
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Leave a note for the agent..."
          className="w-full h-[100px] px-[16px] py-[12px] bg-[#080808] border border-[#2a2a2a] rounded-[4px] resize-none mb-[16px]"
          style={{ 
            fontFamily: 'var(--font-mono)', 
            fontSize: '13px', 
            color: '#f0f0ec'
          }}
        />

        {/* Send Button */}
        <div className="flex justify-end">
          <button
            className="px-[20px] py-[10px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
            style={{ 
              fontFamily: 'var(--font-label)',
              backgroundColor: '#f0f0ec',
              color: '#080808',
              cursor: 'pointer'
            }}
            onClick={() => {
              if (response) {
                toast.success(`Response sent: ${response}`);
              } else {
                toast.error('Please select a response');
              }
            }}
          >
            SEND RESPONSE
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center">
        <p 
          className="text-[11px]"
          style={{ fontFamily: 'var(--font-mono)', color: '#6a6a64' }}
        >
          This package was shared via CastView · Link expires March 17, 2026 · Password protected
        </p>
      </div>
    </div>
  );
}