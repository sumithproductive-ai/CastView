import React from 'react';
Fully rewrite the return statement in CompareMode.tsx 
with a clean two-card layout. Keep all existing data 
arrays (beforeScores, afterScores, useState for 
expandedScore) unchanged — only the JSX changes.

The new layout has three sections stacked vertically:
1. Page header (breadcrumb + title + subtitle)
2. Two equal portrait cards side by side
3. WHY THIS CHANGED panel full width below

Replace the entire return statement with:

return (
  <div className="p-[40px]" style={{ maxWidth: '780px' }}>

    {/* HEADER */}
    <div className="mb-[32px]">
      <div className="mb-[12px]">
        <span style={{ 
          fontFamily: 'var(--font-mono)', 
          fontSize: '13px', color: '#6a6a64' 
        }}>
          Roster › Sofia Andersen › Compare
        </span>
      </div>
      <h1 style={{ 
        fontFamily: 'var(--font-display)', 
        fontWeight: 300, fontSize: '32px', 
        color: '#f0f0ec', marginBottom: '6px' 
      }}>
        Fragrance — Before & After
      </h1>
      <p style={{ 
        fontFamily: 'var(--font-mono)', 
        fontSize: '13px', color: '#a0a09a',
        marginBottom: '4px'
      }}>
        Sofia Andersen · Fragrance · 
        February 2026 → March 2026
      </p>
      <p style={{ 
        fontFamily: 'var(--font-mono)', 
        fontSize: '11px', color: '#666660',
        fontStyle: 'italic'
      }}>
        Renders compared across different digitals 
        versions. Score changes may reflect 
        appearance updates, not just context 
        development.
      </p>
    </div>

    {/* TWO CARDS */}
    <div className="flex gap-[16px] mb-[20px]">

      {/* BEFORE CARD */}
      <div 
        className="flex-1 bg-[#111111] border 
        border-[#2a2a2a] rounded-[4px] 
        overflow-hidden"
      >
        {/* Card header */}
        <div className="px-[16px] py-[12px] 
          border-b border-[#2a2a2a]">
          <div style={{ 
            fontFamily: 'var(--font-mono)', 
            fontSize: '9px', 
            color: '#888880',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '2px'
          }}>
            BEFORE
          </div>
          <div style={{ 
            fontFamily: 'var(--font-mono)', 
            fontSize: '12px', color: '#f0f0ec' 
          }}>
            February 2026
          </div>
          <div style={{ 
            fontFamily: 'var(--font-mono)', 
            fontSize: '11px', color: '#666660' 
          }}>
            Digitals V1
          </div>
        </div>

        {/* Image */}
        <div style={{ 
          aspectRatio: '3/4', 
          overflow: 'hidden',
          backgroundColor: '#1a1a1a'
        }}>
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
        <div className="px-[16px] py-[16px] 
          space-y-[12px]">
          {beforeScores.map((score) => (
            <div key={score.label}>
              <div className="flex justify-between 
                mb-[5px]">
                <span style={{ 
                  fontFamily: 'var(--font-mono)', 
                  fontSize: '12px', color: '#a0a09a' 
                }}>
                  {score.label}
                </span>
                <span style={{ 
                  fontFamily: 'var(--font-mono)', 
                  fontSize: '12px', color: '#f0f0ec' 
                }}>
                  {score.value}%
                </span>
              </div>
              <div style={{ 
                height: '2px', 
                backgroundColor: '#2a2a2a',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  height: '100%', 
                  width: `${score.value}%`,
                  backgroundColor: '#f0f0ec',
                  borderRadius: '2px'
                }} />
              </div>
            </div>
          ))}

          {/* Overall score */}
          <div className="pt-[12px] mt-[4px]"
            style={{ borderTop: '1px solid #1e1e1e' }}>
            <div className="flex justify-between">
              <span style={{ 
                fontFamily: 'var(--font-mono)', 
                fontSize: '11px', color: '#666660',
                textTransform: 'uppercase',
                letterSpacing: '0.08em'
              }}>
                Overall
              </span>
              <span style={{ 
                fontFamily: 'var(--font-display)', 
                fontSize: '24px', 
                fontWeight: 300,
                color: '#f0f0ec' 
              }}>
                73%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* AFTER CARD */}
      <div 
        className="flex-1 bg-[#111111] border 
        border-[#f0f0ec] rounded-[4px] 
        overflow-hidden"
        style={{ borderColor: 'rgba(240,240,236,0.3)' }}
      >
        {/* Card header */}
        <div className="px-[16px] py-[12px] 
          border-b border-[#2a2a2a]">
          <div style={{ 
            fontFamily: 'var(--font-mono)', 
            fontSize: '9px', 
            color: '#4a7a4a',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '2px'
          }}>
            AFTER
          </div>
          <div style={{ 
            fontFamily: 'var(--font-mono)', 
            fontSize: '12px', color: '#f0f0ec' 
          }}>
            March 2026
          </div>
          <div style={{ 
            fontFamily: 'var(--font-mono)', 
            fontSize: '11px', color: '#666660' 
          }}>
            Digitals V2
          </div>
        </div>

        {/* Image */}
        <div style={{ 
          aspectRatio: '3/4', 
          overflow: 'hidden',
          backgroundColor: '#1a1a1a'
        }}>
          <img
            src="https://images.unsplash.com/photo-1761329842950-f3551938e4da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmFncmFuY2UlMjBlZGl0b3JpYWwlMjBtb2RlbCUyMHBob3RvfGVufDF8fHx8MTc3MzE2NTMzMnww&ixlib=rb-4.1.0&q=80&w=1080"
            alt="After"
            style={{ 
              width: '100%', height: '100%', 
              objectFit: 'cover' 
            }}
          />
        </div>

        {/* Scores */}
        <div className="px-[16px] py-[16px] 
          space-y-[12px]">
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
                items-center mb-[5px]">
                <span style={{ 
                  fontFamily: 'var(--font-mono)', 
                  fontSize: '12px', color: '#a0a09a' 
                }}>
                  {score.label}
                </span>
                <div className="flex items-center 
                  gap-[6px]">
                  <span style={{ 
                    fontFamily: 'var(--font-mono)', 
                    fontSize: '12px', color: '#f0f0ec' 
                  }}>
                    {score.value}%
                  </span>
                  <ArrowUp size={10} 
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
                      ? '#f0f0ec' : '#444440'
                  }}>
                    {expandedScore === score.label 
                      ? '▾' : '›'}
                  </span>
                </div>
              </div>
              <div style={{ 
                height: '2px', 
                backgroundColor: '#2a2a2a',
                borderRadius: '2px',
                overflow: 'hidden'
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
                  fontSize: '11px', color: '#a0a09a',
                  lineHeight: '1.7',
                  marginTop: '8px',
                  paddingLeft: '10px',
                  borderLeft: '2px solid #2a2a2a'
                }}>
                  {score.reason}
                </div>
              )}
            </div>
          ))}

          {/* Overall score */}
          <div className="pt-[12px] mt-[4px]"
            style={{ borderTop: '1px solid #1e1e1e' }}>
            <div className="flex justify-between 
              items-center">
              <span style={{ 
                fontFamily: 'var(--font-mono)', 
                fontSize: '11px', color: '#666660',
                textTransform: 'uppercase',
                letterSpacing: '0.08em'
              }}>
                Overall
              </span>
              <div className="flex items-center 
                gap-[8px]">
                <span style={{ 
                  fontFamily: 'var(--font-display)', 
                  fontSize: '24px', 
                  fontWeight: 300,
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
      </div>
    </div>

    {/* WHY THIS CHANGED PANEL */}
    <div 
      className="bg-[#111111] border 
      border-[#2a2a2a] rounded-[4px] 
      p-[24px] mb-[20px]"
    >
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
          +20% overall · 8 months
        </span>
      </div>
      <p style={{ 
        fontFamily: 'var(--font-mono)', 
        fontSize: '12px', color: '#c8c8c2',
        lineHeight: '1.8', marginBottom: '12px'
      }}>
        The primary driver is Market Fit (+23%) — 
        Sofia's updated digitals now reflect the 
        coloring, structure, and stillness that 
        European fragrance clients have been 
        selecting for consistently over the past 
        18 months. Style Match (+22%) follows: 
        luxury fragrance editorial rewards 
        controlled, minimal expression and her 
        new shots deliver exactly that.
      </p>
      <p style={{ 
        fontFamily: 'var(--font-mono)', 
        fontSize: '12px', color: '#a0a09a',
        lineHeight: '1.8'
      }}>
        Composition and Versatility gains are 
        secondary — driven by the inclusion of 
        profile and 3/4 shots in the updated 
        digitals, which were absent in V1. 
        Tap any score row on the AFTER card 
        for dimension-level detail.
      </p>
    </div>

    {/* ACTION BUTTONS */}
    <div className="flex justify-end gap-[12px]">
      <button
        className="px-[20px] py-[12px] border 
        border-[#2a2a2a] rounded-[4px] text-[11px] 
        uppercase tracking-[0.1em] transition-colors 
        hover:bg-[#1a1a1a]"
        style={{ 
          fontFamily: 'var(--font-mono)', 
          color: '#f0f0ec' 
        }}
      >
        SHARE COMPARISON
      </button>
      <button
        className="px-[20px] py-[12px] rounded-[4px] 
        text-[11px] uppercase tracking-[0.1em] 
        transition-opacity hover:opacity-80"
        style={{ 
          fontFamily: 'var(--font-mono)', 
          backgroundColor: '#f0f0ec',
          color: '#080808' 
        }}
      >
        SET MARCH 2026 AS PRIMARY
      </button>
    </div>

  </div>
);

Replace the entire existing return statement 
with the above. Do not change anything outside 
the return statement — keep all data arrays, 
useState declarations, and imports as they are.