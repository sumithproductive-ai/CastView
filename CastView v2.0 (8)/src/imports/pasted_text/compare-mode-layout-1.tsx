import React from 'react';
Fully rewrite the return statement in CompareMode.tsx 
with a three-column layout:
Left column — BEFORE card
Middle column — AFTER card  
Right column — Analysis, reasoning, and actions

Everything fits on one screen with no scrolling.

Replace the entire return statement with:

return (
  <div className="p-[32px] h-screen flex 
    flex-col overflow-hidden">

    {/* HEADER — compact single line */}
    <div className="flex items-baseline 
      justify-between mb-[20px] flex-shrink-0">
      <div>
        <div className="mb-[4px]">
          <span style={{ 
            fontFamily: 'var(--font-mono)', 
            fontSize: '12px', color: '#6a6a64' 
          }}>
            Roster › Sofia Andersen › Compare
          </span>
        </div>
        <h1 style={{ 
          fontFamily: 'var(--font-display)', 
          fontWeight: 300, fontSize: '28px', 
          color: '#f0f0ec', lineHeight: 1.1
        }}>
          Fragrance — Before & After
        </h1>
        <p style={{ 
          fontFamily: 'var(--font-mono)', 
          fontSize: '12px', color: '#a0a09a',
          marginTop: '4px'
        }}>
          Sofia Andersen · Feb 2026 → Mar 2026
        </p>
      </div>
    </div>

    {/* THREE COLUMN BODY */}
    <div className="flex gap-[16px] flex-1 
      min-h-0">

      {/* ── LEFT — BEFORE card ── */}
      <div className="flex flex-col bg-[#111111] 
        border border-[#2a2a2a] rounded-[4px] 
        overflow-hidden"
        style={{ width: '260px', flexShrink: 0 }}
      >
        {/* Card label */}
        <div className="px-[14px] py-[10px] 
          border-b border-[#1e1e1e] flex-shrink-0">
          <div style={{ 
            fontFamily: 'var(--font-mono)', 
            fontSize: '9px', color: '#666660',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: '2px'
          }}>
            BEFORE
          </div>
          <div style={{ 
            fontFamily: 'var(--font-mono)', 
            fontSize: '13px', color: '#f0f0ec' 
          }}>
            February 2026
          </div>
          <div style={{ 
            fontFamily: 'var(--font-mono)', 
            fontSize: '11px', color: '#555550' 
          }}>
            Digitals V1
          </div>
        </div>

        {/* Image — fills available space */}
        <div className="flex-1 overflow-hidden 
          bg-[#1a1a1a]">
          <img
            src="https://images.unsplash.com/photo-1601288536613-fe4678ea999d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJmdW1lJTIwY2FtcGFpZ24lMjBtb2RlbCUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MzE3NTk4N3ww&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Before"
            style={{ 
              width: '100%', height: '100%', 
              objectFit: 'cover' 
            }}
          />
        </div>

        {/* Scores */}
        <div className="px-[14px] py-[14px] 
          space-y-[10px] flex-shrink-0 
          border-t border-[#1e1e1e]">
          {beforeScores.map((score) => (
            <div key={score.label}>
              <div className="flex justify-between 
                mb-[4px]">
                <span style={{ 
                  fontFamily: 'var(--font-mono)', 
                  fontSize: '11px', color: '#888880' 
                }}>
                  {score.label}
                </span>
                <span style={{ 
                  fontFamily: 'var(--font-mono)', 
                  fontSize: '11px', color: '#c8c8c2' 
                }}>
                  {score.value}%
                </span>
              </div>
              <div style={{ 
                height: '2px', 
                backgroundColor: '#2a2a2a',
                borderRadius: '2px', overflow: 'hidden'
              }}>
                <div style={{ 
                  height: '100%', 
                  width: `${score.value}%`,
                  backgroundColor: '#555550',
                  borderRadius: '2px'
                }} />
              </div>
            </div>
          ))}
          <div className="flex justify-between 
            items-center pt-[8px]"
            style={{ borderTop: '1px solid #1e1e1e' }}>
            <span style={{ 
              fontFamily: 'var(--font-mono)', 
              fontSize: '10px', color: '#555550',
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}>
              Overall
            </span>
            <span style={{ 
              fontFamily: 'var(--font-display)', 
              fontSize: '22px', fontWeight: 300,
              color: '#888880'
            }}>
              73%
            </span>
          </div>
        </div>
      </div>

      {/* ── MIDDLE — AFTER card ── */}
      <div className="flex flex-col bg-[#111111] 
        rounded-[4px] overflow-hidden"
        style={{ 
          width: '260px', flexShrink: 0,
          border: '1px solid rgba(240,240,236,0.25)'
        }}
      >
        {/* Card label */}
        <div className="px-[14px] py-[10px] 
          border-b border-[#1e1e1e] flex-shrink-0">
          <div style={{ 
            fontFamily: 'var(--font-mono)', 
            fontSize: '9px', color: '#4a7a4a',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: '2px'
          }}>
            AFTER
          </div>
          <div style={{ 
            fontFamily: 'var(--font-mono)', 
            fontSize: '13px', color: '#f0f0ec' 
          }}>
            March 2026
          </div>
          <div style={{ 
            fontFamily: 'var(--font-mono)', 
            fontSize: '11px', color: '#555550' 
          }}>
            Digitals V2
          </div>
        </div>

        {/* Image */}
        <div className="flex-1 overflow-hidden 
          bg-[#1a1a1a]">
          <img
            src="https://images.unsplash.com/photo-1761329842950-f3551938e4da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmFncmFuY2UlMjBlZGl0b3JpYWwlMjBtb2RlbCUyMHBob3RvfGVufDF8fHx8MTc3MzE2NTMzMnww&ixlib=rb-4.1.0&q=80&w=1080"
            alt="After"
            style={{ 
              width: '100%', height: '100%', 
              objectFit: 'cover' 
            }}
          />
        </div>

        {/* Scores with deltas */}
        <div className="px-[14px] py-[14px] 
          space-y-[10px] flex-shrink-0 
          border-t border-[#1e1e1e]">
          {afterScores.map((score) => (
            <div 
              key={score.label}
              className="cursor-pointer"
              onClick={() => setExpandedScore(
                expandedScore === score.label 
                  ? null : score.label
              )}
            >
              <div className="flex justify-between 
                items-center mb-[4px]">
                <span style={{ 
                  fontFamily: 'var(--font-mono)', 
                  fontSize: '11px', color: '#888880' 
                }}>
                  {score.label}
                </span>
                <div className="flex items-center 
                  gap-[5px]">
                  <span style={{ 
                    fontFamily: 'var(--font-mono)', 
                    fontSize: '11px', color: '#f0f0ec' 
                  }}>
                    {score.value}%
                  </span>
                  <ArrowUp size={9} 
                    style={{ color: '#4a7a4a' }} />
                  <span style={{ 
                    fontFamily: 'var(--font-mono)', 
                    fontSize: '10px', color: '#4a7a4a' 
                  }}>
                    +{score.delta}%
                  </span>
                  <span style={{ 
                    fontFamily: 'var(--font-mono)', 
                    fontSize: '10px',
                    color: expandedScore === score.label 
                      ? '#f0f0ec' : '#333330'
                  }}>
                    {expandedScore === score.label 
                      ? '▾' : '›'}
                  </span>
                </div>
              </div>
              <div style={{ 
                height: '2px', 
                backgroundColor: '#2a2a2a',
                borderRadius: '2px', overflow: 'hidden'
              }}>
                <div style={{ 
                  height: '100%', 
                  width: `${score.value}%`,
                  backgroundColor: '#f0f0ec',
                  borderRadius: '2px'
                }} />
              </div>
              {expandedScore === score.label && (
                <div style={{ 
                  fontFamily: 'var(--font-mono)', 
                  fontSize: '10px', color: '#888880',
                  lineHeight: '1.6', marginTop: '6px',
                  paddingLeft: '8px',
                  borderLeft: '2px solid #2a2a2a'
                }}>
                  {score.reason}
                </div>
              )}
            </div>
          ))}
          <div className="flex justify-between 
            items-center pt-[8px]"
            style={{ borderTop: '1px solid #1e1e1e' }}>
            <span style={{ 
              fontFamily: 'var(--font-mono)', 
              fontSize: '10px', color: '#555550',
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}>
              Overall
            </span>
            <div className="flex items-center 
              gap-[8px]">
              <span style={{ 
                fontFamily: 'var(--font-display)', 
                fontSize: '22px', fontWeight: 300,
                color: '#f0f0ec'
              }}>
                92%
              </span>
              <span style={{ 
                fontFamily: 'var(--font-mono)', 
                fontSize: '11px', color: '#4a7a4a'
              }}>
                +20%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT — Analysis panel ── */}
      <div className="flex-1 flex flex-col 
        min-w-0 gap-[12px]">

        {/* WHY THIS CHANGED */}
        <div className="bg-[#111111] border 
          border-[#2a2a2a] rounded-[4px] p-[20px] 
          flex-1 overflow-y-auto">
          <div className="flex items-center 
            justify-between mb-[14px]">
            <span style={{ 
              fontFamily: 'var(--font-mono)', 
              fontSize: '9px', color: '#888880',
              letterSpacing: '0.12em',
              textTransform: 'uppercase'
            }}>
              WHY THIS CHANGED
            </span>
            <span style={{ 
              fontFamily: 'var(--font-mono)', 
              fontSize: '12px', color: '#4a7a4a'
            }}>
              +20% · 8 months
            </span>
          </div>
          <p style={{ 
            fontFamily: 'var(--font-mono)', 
            fontSize: '12px', color: '#c8c8c2',
            lineHeight: '1.8', marginBottom: '14px'
          }}>
            The primary driver is Market Fit 
            (+23%) — Sofia's updated digitals now 
            reflect the coloring, structure, and 
            stillness that European fragrance 
            clients have been selecting for 
            consistently over the past 18 months.
          </p>
          <p style={{ 
            fontFamily: 'var(--font-mono)', 
            fontSize: '12px', color: '#c8c8c2',
            lineHeight: '1.8', marginBottom: '14px'
          }}>
            Style Match (+22%) follows: luxury 
            fragrance editorial rewards controlled, 
            minimal expression — her new shots 
            deliver exactly that.
          </p>
          <p style={{ 
            fontFamily: 'var(--font-mono)', 
            fontSize: '12px', color: '#a0a09a',
            lineHeight: '1.8'
          }}>
            Composition and Versatility gains 
            are secondary — driven by the addition 
            of profile and 3/4 angles in V2 
            digitals, which were absent in V1. 
            Tap any score row on the AFTER card 
            for dimension detail.
          </p>

          {/* Divider */}
          <div style={{ 
            height: '1px', 
            backgroundColor: '#1e1e1e',
            margin: '16px 0'
          }} />

          {/* Delta summary chips */}
          <div className="grid grid-cols-2 
            gap-[8px]">
            {afterScores.map((score) => (
              <div 
                key={score.label}
                className="bg-[#0d0d0d] border 
                border-[#2a2a2a] rounded-[4px] 
                px-[12px] py-[10px]"
              >
                <div style={{ 
                  fontFamily: 'var(--font-mono)', 
                  fontSize: '10px', color: '#666660',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '4px'
                }}>
                  {score.label}
                </div>
                <div className="flex items-baseline 
                  gap-[6px]">
                  <span style={{ 
                    fontFamily: 'var(--font-display)', 
                    fontSize: '20px', fontWeight: 300,
                    color: '#f0f0ec'
                  }}>
                    {score.value}%
                  </span>
                  <span style={{ 
                    fontFamily: 'var(--font-mono)', 
                    fontSize: '10px', color: '#4a7a4a'
                  }}>
                    +{score.delta}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-[8px] 
          flex-shrink-0">
          <button
            className="w-full py-[12px] 
            rounded-[4px] text-[11px] uppercase 
            tracking-[0.1em] transition-opacity 
            hover:opacity-80"
            style={{ 
              fontFamily: 'var(--font-mono)', 
              backgroundColor: '#f0f0ec',
              color: '#080808'
            }}
          >
            SHARE COMPARISON
          </button>
          <button
            className="w-full py-[12px] border 
            border-[#2a2a2a] rounded-[4px] 
            text-[11px] uppercase tracking-[0.1em] 
            transition-colors hover:bg-[#1a1a1a]"
            style={{ 
              fontFamily: 'var(--font-mono)', 
              color: '#a0a09a'
            }}
          >
            SET MARCH 2026 AS PRIMARY
          </button>
        </div>
      </div>

    </div>
  </div>
);

Replace the entire existing return statement.
Do not change anything outside the return 
statement.