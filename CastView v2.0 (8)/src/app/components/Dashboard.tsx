import React from 'react';
import { Link } from 'react-router';
import { useMemo, useState } from 'react';
import { useProspects } from '../context/ProspectsContext';
import { useRoster } from '../context/RosterContext';

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
    id: '1',
    prospectName: 'Sumith Chittimalla',
    contexts: 'Fragrance · Editorial',
    sentTime: '2 days ago',
    status: 'VIEWED',
    openedTime: '1 day ago',
  },
  {
    id: '2',
    prospectName: 'Sumith Chittimalla',
    contexts: 'Campaign · Beauty',
    sentTime: '5 days ago',
    status: 'RESPONDED',
    openedTime: '4 days ago',
    responseTime: '3 days ago',
  },
];

function submissionDateRank(submissionDate: string): number {
  const value = submissionDate.toLowerCase().trim();
  if (value === 'today') return 0;

  const hoursMatch = value.match(/(\d+)\s*hours?\s*ago/);
  if (hoursMatch) return Number(hoursMatch[1]) / 24;

  const daysMatch = value.match(/(\d+)\s*days?\s*ago/);
  if (daysMatch) return Number(daysMatch[1]);

  const weeksMatch = value.match(/(\d+)\s*weeks?\s*ago/);
  if (weeksMatch) return Number(weeksMatch[1]) * 7;

  return Number.MAX_SAFE_INTEGER;
}

type RosterActivityItem = {
  id: string;
  name: string;
  activity: string;
  timeAgo: string;
  image: string;
};

const rosterActivity: RosterActivityItem[] = [
  {
    id: 'sumith-chittimalla-roster',
    name: 'Sumith Chittimalla',
    activity: 'New evaluation completed — Fragrance 94%',
    timeAgo: '3 days ago',
    image: 'https://i.imgur.com/F70z8kX.jpg',
  },
  {
    id: 'john-doe-roster',
    name: 'John Doe',
    activity: 'Digital set comparison run — Fragrance improved',
    timeAgo: '1 week ago',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
  },
];

export function Dashboard() {
  const [showSavingsTooltip, setShowSavingsTooltip] = useState(false);
  const { prospects } = useProspects();
  const { models } = useRoster();

  const activeModelsCount = models.filter(
    (m) => m.status === 'ACTIVE'
  ).length;

  const totalRosterEvaluations = models.reduce(
    (sum, m) =>
      sum +
      m.digitalSets.reduce((s, ds) => s + ds.evaluations.length, 0),
    0
  );

  const onHoldCount = models.filter(
    (m) => m.status === 'ON HOLD'
  ).length;

  const totalProspects = prospects.length;
  const shortlistedCount = prospects.filter((p) => p.status === 'SHORTLISTED').length;
  const awaitingReviewCount = prospects.filter((p) => p.status === 'IN REVIEW').length;

  const recentProspects = useMemo(
    () =>
      [...prospects]
        .filter((prospect) => prospect.image)
        .sort(
          (a, b) =>
            submissionDateRank(a.submissionDate) -
            submissionDateRank(b.submissionDate),
        )
        .slice(0, 3),
    [prospects],
  );
  
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
                {totalProspects}
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
                {shortlistedCount}
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
                {awaitingReviewCount}
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
                  2 evaluations completed · $2,350 avg test shoot cost avoided
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
                {activeModelsCount}
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
                {totalRosterEvaluations}
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
                {onHoldCount}
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
          {clientResponses.length > 0 && (
            <span
              className="w-[6px] h-[6px] rounded-full inline-block ml-[8px] mb-[1px]"
              style={{ backgroundColor: '#f0f0ec' }}
            />
          )}
        </div>

        {/* Response list or empty state */}
        {clientResponses.length === 0 ? (
          <div 
            className="text-center py-[32px] text-[12px]"
            style={{ fontFamily: 'var(--font-mono)', color: '#888880' }}
          >
            No packages sent yet.
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
                    style={{ objectPosition: 'center 15%' }}
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
                  {prospect.submissionDate}
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
          
          <div className="mb-[24px]">
            {rosterActivity.length === 0 ? (
              <div
                className="text-center py-[32px] text-[12px]"
                style={{ fontFamily: 'var(--font-mono)', color: '#888880' }}
              >
                No roster activity yet.
              </div>
            ) : (
              <div className="space-y-[16px]">
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
                        style={{ objectPosition: 'center 15%' }}
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
            )}
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