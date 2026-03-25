import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronRight, Lock } from 'lucide-react';

const digitals = [
  { label: 'Front', image: 'https://images.unsplash.com/photo-1726232409367-04682eb856a3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwbW9kZWwlMjBwb3J0cmFpdCUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NzMwODU2NjF8MA&ixlib=rb-4.1.0&q=80&w=400' },
  { label: 'Profile', image: 'https://images.unsplash.com/photo-1672675389084-5415d558dfd7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwbW9kZWwlMjBzaWRlJTIwcHJvZmlsZXxlbnwxfHx8fDE3NzMwODU2NjF8MA&ixlib=rb-4.1.0&q=80&w=400' },
  { label: '3/4', image: 'https://images.unsplash.com/photo-1674713406394-8f994f26432c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2RlbCUyMHBvcnRyYWl0JTIwYW5nbGUlMjB2aWV3fGVufDF8fHx8MTc3MzA4NTY2Nnww&ixlib=rb-4.1.0&q=80&w=400' },
  { label: 'Full Body', image: 'https://images.unsplash.com/photo-1593126858836-e3e95653d270?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwbW9kZWwlMjBmdWxsJTIwYm9keSUyMHN0dWRpb3xlbnwxfHx8fDE3NzMwODU2NjJ8MA&ixlib=rb-4.1.0&q=80&w=400' }
];

const measurements = [
  { key: 'Height', value: '177cm' },
  { key: 'Bust', value: '82cm' },
  { key: 'Waist', value: '61cm' },
  { key: 'Hips', value: '89cm' },
  { key: 'Shoe', value: '39' },
  { key: 'Hair', value: 'Brown' },
  { key: 'Eyes', value: 'Green' }
];

const contexts = [
  'Fragrance', 'Editorial', 'Runway', 
  'Campaign', 'Beauty', 'Sportswear', 
  'Swimwear', 'Couture', 'Street'
];

const qualities = ['Standard', 'High', 'Ultra'];

export function Profile() {
  const navigate = useNavigate();
  const [selectedContexts, setSelectedContexts] = useState<string[]>(['Fragrance', 'Editorial']);
  const [selectedQuality, setSelectedQuality] = useState('High');
  
  const toggleContext = (context: string) => {
    setSelectedContexts(prev => 
      prev.includes(context) 
        ? prev.filter(c => c !== context)
        : [...prev, context]
    );
  };
  
  const handleGenerate = () => {
    navigate('/rendering');
  };
  
  const contextDescriptions: Record<string, string> = {
    'Fragrance':  'Luxury fragrance campaigns — close-up, dramatic lighting, strong facial geometry',
    'Editorial':  'Fashion magazine editorial — expressive, high-concept, versatile styling',
    'Runway':     'Catwalk and show presentation — proportions, movement, silhouette',
    'Campaign':   'Brand advertising campaigns — commercial appeal, consistent and readable',
    'Beauty':     'Skincare and cosmetics — skin clarity, facial symmetry, close-up detail',
    'Sportswear': 'Athletic and activewear — physicality, energy, movement range',
    'Couture':    'High fashion and haute couture — architecture, proportion, refinement',
    'Swimwear':   'Swimwear and resort — body confidence, natural ease, outdoor light',
    'Street':     'Street style and contemporary fashion — personality, edge, urban context',
  };
  
  return (
    <div className="p-[48px]">
      <div className="flex items-center gap-[8px] mb-[48px]">
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#a0a09a' }}>
          Prospects
        </span>
        <ChevronRight size={14} style={{ color: '#a0a09a' }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#f0f0ec' }}>
          Sofia Andersen
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-[48px]">
        {/* Left Column */}
        <div>
          <div className="grid grid-cols-2 gap-[16px] mb-[16px]">
            {digitals.map((digital) => (
              <div key={digital.label}>
                <div className="aspect-square bg-[#111111] border border-[#2a2a2a] rounded-[4px] mb-[12px] overflow-hidden">
                  <img src={digital.image} alt={digital.label} className="w-full h-full object-cover" />
                </div>
                <div 
                  className="text-[11px] uppercase tracking-[0.1em]"
                  style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
                >
                  {digital.label}
                </div>
              </div>
            ))}
          </div>
          
          {/* Privacy Notice */}
          <div className="flex items-center gap-[8px] pt-[12px] mb-[24px]">
            <Lock size={12} style={{ color: '#888880' }} />
            <div 
              className="text-[11px]"
              style={{ fontFamily: 'var(--font-mono)', color: '#888880' }}
            >
              Digitals are stored securely and used only for evaluation.{' '}
              <span className="underline cursor-pointer hover:opacity-70 transition-opacity">
                View our data policy.
              </span>
            </div>
          </div>
          
          <div className="bg-[#111111] border border-[#2a2a2a] rounded-[4px] p-[24px]">
            <div 
              className="text-[11px] uppercase tracking-[0.1em] mb-[24px]"
              style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
            >
              Measurements
            </div>
            <div className="space-y-[12px]">
              {measurements.map((m) => (
                <div key={m.key} className="flex justify-between">
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#a0a09a' }}>
                    {m.key}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#f0f0ec' }}>
                    {m.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Right Column */}
        <div>
          <h1 
            className="text-[56px] mb-[24px]" 
            style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
          >
            Sofia Andersen
          </h1>
          
          <div className="flex gap-[8px] mb-[32px]">
            {['New York', 'London', 'Paris'].map((market) => (
              <span 
                key={market}
                className="px-[12px] py-[6px] bg-[#111111] border border-[#2a2a2a] rounded-[4px] text-[11px] uppercase tracking-[0.1em]"
                style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
              >
                {market}
              </span>
            ))}
          </div>
          
          <div className="mb-[32px]">
            <label 
              className="block mb-[12px] text-[11px] uppercase tracking-[0.1em]"
              style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
            >
              Agent Notes
            </label>
            <textarea 
              className="w-full h-[120px] bg-[#111111] border border-[#2a2a2a] rounded-[4px] p-[16px] resize-none"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#f0f0ec' }}
              placeholder="Strong runway presence, versatile look..."
            />
          </div>
          
          <div className="mb-[32px]">
            <label 
              className="block mb-[16px] text-[11px] uppercase tracking-[0.1em]"
              style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
            >
              Select Evaluation Context
            </label>
            <div className="grid grid-cols-3 gap-[12px]" data-tutorial="context-grid">
              {contexts.map((context) => {
                const isSelected = selectedContexts.includes(context);
                return (
                  <div key={context} className="relative group">
                    <button
                      title={contextDescriptions[context] || ''}
                      onClick={() => toggleContext(context)}
                      className="px-[16px] py-[10px] border rounded-[4px] transition-all text-[11px] uppercase tracking-[0.1em] w-full cursor-pointer"
                      style={{ 
                        fontFamily: 'var(--font-label)',
                        backgroundColor: isSelected ? '#f0f0ec' : 'transparent',
                        borderColor: isSelected ? '#f0f0ec' : '#2a2a2a',
                        color: isSelected ? '#080808' : '#a0a09a'
                      }}
                    >
                      {context}
                    </button>
                    
                    <div 
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-[8px] px-[10px] py-[6px] rounded-[4px] text-center pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        color: '#c8c8c2',
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #2a2a2a',
                        width: '180px',
                        lineHeight: '1.5',
                        whiteSpace: 'normal'
                      }}
                    >
                      {contextDescriptions[context]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="mb-[48px]">
            <label 
              className="block mb-[16px] text-[11px] uppercase tracking-[0.1em]"
              style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
            >
              Evaluation Quality
            </label>
            <div className="flex gap-[12px]">
              {qualities.map((quality) => {
                const isSelected = selectedQuality === quality;
                const timeEstimates: { [key: string]: string } = {
                  'Standard': '~2 min',
                  'High': '~5 min',
                  'Ultra': '~12 min'
                };
                return (
                  <div key={quality} className="flex-1 text-center">
                    <button
                      onClick={() => setSelectedQuality(quality)}
                      className="w-full px-[16px] py-[10px] border rounded-[4px] transition-all text-[11px] uppercase tracking-[0.1em]"
                      style={{ 
                        fontFamily: 'var(--font-label)',
                        backgroundColor: isSelected ? '#1a1a1a' : 'transparent',
                        borderColor: isSelected ? '#c8c8c2' : '#2a2a2a',
                        color: isSelected ? '#f0f0ec' : '#a0a09a'
                      }}
                    >
                      {quality}
                    </button>
                    <div 
                      className="mt-[8px] text-[11px]"
                      style={{ fontFamily: 'var(--font-mono)', color: '#6a6a64' }}
                    >
                      {timeEstimates[quality]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <button
            onClick={handleGenerate}
            className="w-full py-[16px] rounded-[4px] text-[13px] uppercase tracking-[0.1em] transition-colors mb-[24px]"
            style={{ 
              fontFamily: 'var(--font-label)',
              backgroundColor: '#f0f0ec',
              color: '#080808',
              cursor: 'pointer'
            }}
          >
            Run Evaluation
          </button>

          {/* Status Row */}
          <div className="flex items-center gap-[16px]">
            <div 
              className="px-[16px] py-[8px] rounded-full text-[9px] uppercase tracking-[0.1em]"
              style={{ 
                fontFamily: 'var(--font-label)', 
                backgroundColor: '#7d6d4d33',
                color: '#7d6d4d',
                border: '1px solid #7d6d4d'
              }}
            >
              Shortlisted
            </div>
            <button
              className="text-[13px] hover:opacity-70 transition-opacity"
              style={{ fontFamily: 'var(--font-mono)', color: '#6a6a64' }}
            >
              Change Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}