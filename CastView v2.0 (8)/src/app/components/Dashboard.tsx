import { Link } from 'react-router';
import { useState } from 'react';

type ClientResponseStatus = 'SENT' | 'VIEWED' | 'RESPONDED';

interface ClientResponse {
  id: string;
  prospectName: string;
  contexts: string;
  sentTime: string;
  status: ClientResponseStatus;
  openedTime?: string;
  responseTime?: string;
}

const clientResponses: ClientResponse[] = [
  {
    id: 'camille-rousseau',
    prospectName: 'Camille Rousseau',
    contexts: 'Fragrance, Editorial',
    sentTime: 'Sent 3 days ago',
    status: 'VIEWED',
    openedTime: '3 hours ago'
  },
  {
    id: 'lucas-petit',
    prospectName: 'Lucas Petit',
    contexts: 'Campaign',
    sentTime: 'Sent 1 day ago',
    status: 'SENT'
  }
];

const prospectStats = [
  { label: 'TOTAL PROSPECTS', value: '24' },
  { label: 'SHORTLISTED', value: '6' },
  { label: 'AWAITING REVIEW', value: '8' }
];

const rosterStats = [
  { label: 'ACTIVE MODELS', value: '18' },
  { label: 'EVALUATIONS THIS MONTH', value: '34' },
  { label: 'ON HOLD', value: '3' }
];

const recentProspects = [
  {
    id: 'sumith-chittimalla',
    name: 'Sumith Chittimalla',
    status: 'In Review',
    statusColor: '#C8A96E',
    timeAgo: '2 hours ago',
    image: 'https://i.imgur.com/39KyFLK.jpg'
  },
  {
    id: 'marcus-chen',
    name: 'Marcus Chen',
    status: 'In Review',
    statusColor: '#4d3d5d',
    timeAgo: '5 hours ago',
    image: 'https://images.unsplash.com/photo-1618008797651-3eb256213400?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWxlJTIwbW9kZWwlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzMwMDgzMzR8MA&ixlib=rb-4.1.0&q=80&w=200'
  },
  {
    id: 'ava-laurent',
    name: 'Ava Laurent',
    status: 'In Review',
    statusColor: '#4d3d5d',
    timeAgo: '1 day ago',
    image: 'https://images.unsplash.com/photo-1627161683077-e34782c24d81?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmZW1hbGUlMjBtb2RlbCUyMGhlYWRzaG90fGVufDF8fHx8MTc3MzA4NTY2M3ww&ixlib=rb-4.1.0&q=80&w=200'
  },
  {
    id: 'luca-moretti',
    name: 'Luca Moretti',
    status: 'New',
    statusColor: '#3d4d5d',
    timeAgo: '1 day ago',
    image: 'https://images.unsplash.com/photo-1672675389084-5415d558dfd7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwbW9kZWwlMjBzaWRlJTIwcHJvZmlsZXxlbnwxfHx8fDE3NzMwODU2NjF8MA&ixlib=rb-4.1.0&q=80&w=200'
  },
  {
    id: 'isabella-novak',
    name: 'Isabella Novak',
    status: 'Shortlisted',
    statusColor: '#7d6d4d',
    timeAgo: '2 days ago',
    image: 'https://images.unsplash.com/photo-1674713406394-8f994f26432c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2RlbCUyMHBvcnRyYWl0JTIwYW5nbGUlMjB2aWV3fGVufDF8fHx8MTc3MzA4NTY2Nnww&ixlib=rb-4.1.0&q=80&w=200'
  }
];

const rosterActivity = [
  {
    id: 'sumith-chittimalla',
    name: 'Sumith Chittimalla',
    activity: 'New evaluation — Fragrance',
    timeAgo: '1 hour ago',
    image: 'https://i.imgur.com/39KyFLK.jpg'
  },
  {
    id: 'marcus-chen',
    name: 'Marcus Chen',
    activity: 'Status updated',
    timeAgo: '3 hours ago',
    image: 'https://images.unsplash.com/photo-1768742466928-7eb18e2fcb6c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWxlJTIwZmFzaGlvbiUyMG1vZGVsJTIwaGVhZHNob3R8ZW58MXx8fHwxNzczMTY1MjgzfDA&ixlib=rb-4.1.0&q=80&w=200'
  },
  {
    id: 'ava-laurent',
    name: 'Ava Laurent',
    activity: 'Package shared',
    timeAgo: '6 hours ago',
    image: 'https://images.unsplash.com/photo-1646805925007-510be75f20f7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmZW1hbGUlMjBtb2RlbCUyMGVkaXRvcmlhbCUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MzE2NTI4NHww&ixlib=rb-4.1.0&q=80&w=200'
  },
  {
    id: 'luca-moretti',
    name: 'Luca Moretti',
    activity: 'New evaluation — Editorial',
    timeAgo: '1 day ago',
    image: 'https://images.unsplash.com/photo-1758613653843-87c253aea8cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwbW9kZWwlMjBwcm9mZXNzaW9uYWwlMjBwaG90b3xlbnwxfHx8fDE3NzMxNjUyODR8MA&ixlib=rb-4.1.0&q=80&w=200'
  },
  {
    id: 'isabella-novak',
    name: 'Isabella Novak',
    activity: 'New evaluation — Campaign',
    timeAgo: '2 days ago',
    image: 'https://images.unsplash.com/photo-1616002430110-ab30442021fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2RlbCUyMHBvcnRmb2xpbyUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MzE2NTI4NHww&ixlib=rb-4.1.0&q=80&w=200'
  }
];

export function Dashboard() {
  const [showSavingsTooltip, setShowSavingsTooltip] = useState(false);
  
  return (
    <div className="p-[20px] md:p-[48px]">
      <h1 
        className="text-[48px] mb-[48px]" 
        style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
      >
        Briefing
      </h1>

      {/* Unified Stats Row */}
      <div className="mb-[48px]" data-tutorial="stats-row">
        {/* Section Labels */}
        <div className="flex items-start mb-[8px]">
          <div 
            className="text-[9px] uppercase tracking-[0.1em]"
            style={{ fontFamily: 'var(--font-label)', color: '#888880', width: 'calc((100% - 1px) * 4 / 7)' }}
          >
            PROSPECTS
          </div>
          <div style={{ width: '1px' }} />
          <div 
            className="text-[9px] uppercase tracking-[0.1em] pl-[24px]"
            style={{ fontFamily: 'var(--font-label)', color: '#888880', width: 'calc((100% - 1px) * 3 / 7)' }}
          >
            ROSTER
          </div>
        </div>

        {/* Cards Row */}
        <div className="flex items-stretch gap-[12px]">
          {/* Prospect Cards */}
          <div className="flex items-stretch gap-[12px]" style={{ width: 'calc((100% - 1px) * 4 / 7)' }}>
            {/* Card 1: Total Prospects */}
            <div 
              className="flex-1 bg-[#111111] border border-[#1e1e1e] rounded-[4px] p-[16px] flex flex-col justify-between"
              style={{ height: '96px' }}
            >
              <div 
                className="text-[36px]" 
                style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
              >
                24
              </div>
              <div 
                className="text-[10px] uppercase tracking-[0.12em]" 
                style={{ fontFamily: 'var(--font-label)', color: '#888880' }}
              >
                TOTAL PROSPECTS
              </div>
            </div>

            {/* Card 2: Shortlisted */}
            <div 
              className="flex-1 bg-[#111111] border border-[#1e1e1e] rounded-[4px] p-[16px] flex flex-col justify-between"
              style={{ height: '96px' }}
            >
              <div 
                className="text-[36px]" 
                style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
              >
                6
              </div>
              <div 
                className="text-[10px] uppercase tracking-[0.12em]" 
                style={{ fontFamily: 'var(--font-label)', color: '#888880' }}
              >
                SHORTLISTED
              </div>
            </div>

            {/* Card 3: Awaiting Review */}
            <div 
              className="flex-1 bg-[#111111] border border-[#1e1e1e] rounded-[4px] p-[16px] flex flex-col justify-between"
              style={{ height: '96px' }}
            >
              <div 
                className="text-[36px]" 
                style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
              >
                8
              </div>
              <div 
                className="text-[10px] uppercase tracking-[0.12em]" 
                style={{ fontFamily: 'var(--font-label)', color: '#888880' }}
              >
                AWAITING REVIEW
              </div>
            </div>

            {/* Card 4: Saved This Month with tooltip */}
            <div 
              className="flex-1 bg-[#111111] border border-[#1e1e1e] rounded-[4px] p-[16px] flex flex-col justify-between relative cursor-help"
              style={{ height: '96px' }}
              onMouseEnter={() => setShowSavingsTooltip(true)}
              onMouseLeave={() => setShowSavingsTooltip(false)}
            >
              <div 
                className="text-[36px]" 
                style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
              >
                $4,700
              </div>
              <div 
                className="text-[10px] uppercase tracking-[0.12em]" 
                style={{ fontFamily: 'var(--font-label)', color: '#888880' }}
              >
                SAVED THIS MONTH
              </div>

              {/* Tooltip */}
              {showSavingsTooltip && (
                <div 
                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-[8px] px-[8px] py-[8px] rounded-[4px] whitespace-nowrap"
                  style={{ 
                    fontFamily: 'var(--font-mono)', 
                    fontSize: '11px', 
                    color: '#c8c8c2',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #2a2a2a',
                    zIndex: 10
                  }}
                >
                  2 avoided test shoots · $2,350 avg
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div 
            className="self-center"
            style={{ 
              width: '1px', 
              height: '48px', 
              backgroundColor: '#2a2a2a' 
            }}
          />

          {/* Roster Cards */}
          <div className="flex items-stretch gap-[12px]" style={{ width: 'calc((100% - 1px) * 3 / 7)' }}>
            {/* Card 5: Active Models */}
            <div 
              className="flex-1 bg-[#111111] border border-[#1e1e1e] rounded-[4px] p-[16px] flex flex-col justify-between"
              style={{ height: '96px' }}
            >
              <div 
                className="text-[36px]" 
                style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
              >
                18
              </div>
              <div 
                className="text-[10px] uppercase tracking-[0.12em]" 
                style={{ fontFamily: 'var(--font-label)', color: '#888880' }}
              >
                ACTIVE MODELS
              </div>
            </div>

            {/* Card 6: Evaluations */}
            <div 
              className="flex-1 bg-[#111111] border border-[#1e1e1e] rounded-[4px] p-[16px] flex flex-col justify-between"
              style={{ height: '96px' }}
            >
              <div 
                className="text-[36px]" 
                style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
              >
                34
              </div>
              <div 
                className="text-[10px] uppercase tracking-[0.12em]" 
                style={{ fontFamily: 'var(--font-label)', color: '#888880' }}
              >
                EVALUATIONS
              </div>
            </div>

            {/* Card 7: On Hold */}
            <div 
              className="flex-1 bg-[#111111] border border-[#1e1e1e] rounded-[4px] p-[16px] flex flex-col justify-between"
              style={{ height: '96px' }}
            >
              <div 
                className="text-[36px]" 
                style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
              >
                3
              </div>
              <div 
                className="text-[10px] uppercase tracking-[0.12em]" 
                style={{ fontFamily: 'var(--font-label)', color: '#888880' }}
              >
                ON HOLD
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Client Responses Panel */}
      <div className="bg-[#111111] border border-[#2a2a2a] rounded-[4px] p-[24px] mb-[48px]">
        {/* Header with count */}
        <div 
          className="text-[10px] uppercase tracking-[0.12em] mb-[24px] flex items-center"
          style={{ fontFamily: 'var(--font-label)', color: '#888880' }}
        >
          AWAITING CLIENT RESPONSE ({clientResponses.length})
          {/* Notification dot - hardcoded visible for prototype */}
          <span 
            className="w-[6px] h-[6px] rounded-full inline-block ml-[8px] mb-[1px]"
            style={{ backgroundColor: '#f0f0ec' }}
          />
        </div>

        {/* Response list or empty state */}
        {clientResponses.length === 0 ? (
          <div 
            className="text-center py-[32px] text-[12px]"
            style={{ fontFamily: 'var(--font-mono)', color: '#888880' }}
          >
            No packages awaiting response.
          </div>
        ) : (
          <div 
            className="space-y-[12px]"
            style={{ maxHeight: '200px', overflowY: 'auto' }}
          >
            {clientResponses.map((response) => {
              // Determine status pill styling
              const getStatusStyle = (status: ClientResponseStatus) => {
                switch (status) {
                  case 'SENT':
                    return { borderColor: '#555550', color: '#888880' };
                  case 'VIEWED':
                    return { borderColor: '#888880', color: '#c8c8c2' };
                  case 'RESPONDED':
                    return { borderColor: '#f0f0ec', color: '#f0f0ec' };
                }
              };

              const statusStyle = getStatusStyle(response.status);

              return (
                <div key={response.id}>
                  <Link
                    to={`/share/${response.id}`}
                    className="flex items-center gap-[16px] py-[12px] px-[16px] hover:bg-[#1a1a1a] rounded-[4px] transition-colors cursor-pointer"
                  >
                    {/* Prospect name */}
                    <div 
                      className="text-[13px] min-w-[160px]"
                      style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec' }}
                    >
                      {response.prospectName}
                    </div>

                    {/* Contexts shared */}
                    <div 
                      className="flex-1 text-[11px]"
                      style={{ fontFamily: 'var(--font-mono)', color: '#888880' }}
                    >
                      {response.contexts}
                    </div>

                    {/* Sent time */}
                    <div 
                      className="text-[11px] min-w-[100px] text-right"
                      style={{ fontFamily: 'var(--font-mono)', color: '#888880' }}
                    >
                      {response.sentTime}
                    </div>

                    {/* Status pill */}
                    <div 
                      className="px-[10px] py-[4px] rounded-full text-[9px] uppercase tracking-[0.1em] border"
                      style={{ 
                        fontFamily: 'var(--font-label)', 
                        borderColor: statusStyle.borderColor,
                        color: statusStyle.color,
                        backgroundColor: 'transparent'
                      }}
                    >
                      {response.status}
                    </div>
                  </Link>
                  
                  {/* Read receipt sub-line for VIEWED status */}
                  {response.status === 'VIEWED' && response.openedTime && (
                    <div 
                      className="px-[16px] pb-[8px] text-[11px] italic"
                      style={{ fontFamily: 'var(--font-mono)', color: '#888880' }}
                    >
                      Opened {response.openedTime} · No response yet
                    </div>
                  )}
                  
                  {/* Read receipt sub-line for RESPONDED status */}
                  {response.status === 'RESPONDED' && response.responseTime && (
                    <div 
                      className="px-[16px] pb-[8px] text-[11px] italic"
                      style={{ fontFamily: 'var(--font-mono)', color: '#888880' }}
                    >
                      Responded {response.responseTime} · ✓ Acknowledged
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Activity Panels Row */}
      <div className="flex flex-col md:flex-row gap-[24px]">
        {/* Recent Prospects Panel */}
        <div className="flex-1 bg-[#111111] border border-[#2a2a2a] rounded-[4px] p-[24px]">
          <div 
            className="text-[9px] uppercase tracking-[0.1em] mb-[24px]"
            style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
          >
            RECENT PROSPECTS
          </div>
          
          <div className="space-y-[16px] mb-[24px]">
            {recentProspects.map((prospect) => (
              <Link
                key={prospect.id}
                to={`/prospects/${prospect.id}`}
                className="flex items-center gap-[12px] hover:opacity-80 transition-opacity"
              >
                {/* Thumbnail */}
                <div className="w-[32px] h-[32px] rounded-[4px] bg-[#1a1a1a] border border-[#2a2a2a] overflow-hidden flex-shrink-0">
                  <img 
                    src={prospect.image} 
                    alt={prospect.name}
                    className="w-full h-full object-cover"
                    style={
                      prospect.id === 'sumith-chittimalla'
                        ? { objectFit: 'cover', objectPosition: 'center top' }
                        : undefined
                    }
                  />
                </div>

                {/* Name */}
                <div 
                  className="flex-1"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#f0f0ec' }}
                >
                  {prospect.name}
                </div>

                {/* Status Badge */}
                <div 
                  className="px-[8px] py-[2px] rounded-full text-[8px] uppercase tracking-[0.1em]"
                  style={{ 
                    fontFamily: 'var(--font-label)', 
                    backgroundColor: prospect.statusColor + '33',
                    color: prospect.statusColor,
                    border: `1px solid ${prospect.statusColor}`
                  }}
                >
                  {prospect.status}
                </div>

                {/* Time Ago */}
                <div 
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#6a6a64' }}
                >
                  {prospect.timeAgo}
                </div>
              </Link>
            ))}
          </div>

          {/* View All Link */}
          <Link
            to="/prospects"
            className="block text-center py-[8px] hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#a0a09a' }}
          >
            View all prospects →
          </Link>
        </div>

        {/* Recent Roster Activity Panel */}
        <div className="flex-1 bg-[#111111] border border-[#2a2a2a] rounded-[4px] p-[24px]">
          <div 
            className="text-[9px] uppercase tracking-[0.1em] mb-[24px]"
            style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
          >
            RECENT ROSTER ACTIVITY
          </div>
          
          <div className="space-y-[16px] mb-[24px]">
            {rosterActivity.map((item) => (
              <Link
                key={item.id}
                to={`/roster/${item.id}`}
                className="flex items-center gap-[12px] hover:opacity-80 transition-opacity"
              >
                {/* Thumbnail */}
                <div className="w-[32px] h-[32px] rounded-[4px] bg-[#1a1a1a] border border-[#2a2a2a] overflow-hidden flex-shrink-0">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                    style={
                      item.id === 'sumith-chittimalla'
                        ? { objectFit: 'cover', objectPosition: 'center top' }
                        : undefined
                    }
                  />
                </div>

                {/* Name */}
                <div 
                  className="flex-1"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#f0f0ec' }}
                >
                  {item.name}
                </div>

                {/* Activity Description */}
                <div 
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#6a6a64' }}
                >
                  {item.activity}
                </div>

                {/* Time Ago */}
                <div 
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#6a6a64' }}
                >
                  {item.timeAgo}
                </div>
              </Link>
            ))}
          </div>

          {/* View All Link */}
          <Link
            to="/roster"
            className="block text-center py-[8px] hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#a0a09a' }}
          >
            View full roster →
          </Link>
        </div>
      </div>
    </div>
  );
}