import { useState } from 'react';

import { Link, useNavigate, useParams } from 'react-router';

import { ChevronRight } from 'lucide-react';

import { SUMITH_DIGITAL_SET_V1, SUMITH_PROSPECT_NAME } from '../constants/sumithProspect';

import type { DigitalSet, Evaluation } from '../types/talent';



const sumithProspectData = {

  name: SUMITH_PROSPECT_NAME,

  status: 'IN REVIEW',

  statusColor: '#C8A96E',

  digitalSets: [SUMITH_DIGITAL_SET_V1],

};



const sofiaDigitalSet: DigitalSet = {

  id: 'digitals-v1',

  uploadedAt: 'March 2026',

  title: 'Initial Submission',

  front:

    'https://images.unsplash.com/photo-1761329842950-f3551938e4da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmFncmFuY2UlMjBlZGl0b3JpYWwlMjBtb2RlbCUyMHBob3RvfGVufDF8fHx8MTc3MzE2NTMzMnww&ixlib=rb-4.1.0&q=80&w=1080',

  profile:

    'https://images.unsplash.com/photo-1708170236080-6cb6d2d5497c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlZGl0b3JpYWwlMjBmYXNoaW9uJTIwdmVydGljYWwlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzMxNjUzMzF8MA&ixlib=rb-4.1.0&q=80&w=1080',

  threeQuarter:

    'https://images.unsplash.com/photo-1697677103505-dd4b2dbf1b1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW1wYWlnbiUyMGZhc2hpb24lMjBzaG9vdHxlbnwxfHx8fDE3NzMxNjUzMzJ8MA&ixlib=rb-4.1.0&q=80&w=1080',

  fullBody:

    'https://images.unsplash.com/photo-1759873911657-8140566c29a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWF1dHklMjBlZGl0b3JpYWwlMjBwb3J0cmFpdCUyMHNxdWFyZXxlbnwxfHx8fDE3NzMxNjUzMzN8MA&ixlib=rb-4.1.0&q=80&w=1080',

  additionalImages: [],

  notes: '',

  tags: [],

  evaluations: [

    {

      id: 'eval-1',

      completedAt: 'March 12, 2026',

      contexts: [

        {

          context: 'Fragrance',

          alignmentScore: 94,

          fitLabel: 'STRONG ALIGNMENT',

          reasoning: '',

          strengths: [],

          risks: [],

          marketSignals: [],

          suggestedNextSteps: [],

        },

        {

          context: 'Editorial',

          alignmentScore: 96,

          fitLabel: 'STRONG ALIGNMENT',

          reasoning: '',

          strengths: [],

          risks: [],

          marketSignals: [],

          suggestedNextSteps: [],

        },

        {

          context: 'Campaign',

          alignmentScore: 88,

          fitLabel: 'STRONG ALIGNMENT',

          reasoning: '',

          strengths: [],

          risks: [],

          marketSignals: [],

          suggestedNextSteps: [],

        },

        {

          context: 'Runway',

          alignmentScore: 91,

          fitLabel: 'STRONG ALIGNMENT',

          reasoning: '',

          strengths: [],

          risks: [],

          marketSignals: [],

          suggestedNextSteps: [],

        },

      ],

    },

  ],

};



const prospectData = {

  name: 'Sofia Andersen',

  status: 'IN REVIEW',

  statusColor: '#4d3d5d',

  digitalSets: [sofiaDigitalSet],

};



function countDigitalsOnFile(digitalSet: DigitalSet) {

  return [digitalSet.front, digitalSet.profile, digitalSet.threeQuarter, digitalSet.fullBody].filter(

    Boolean

  ).length;

}



function getEvaluationTopScore(evaluation: Evaluation) {

  if (evaluation.contexts.length === 0) return 0;

  return Math.max(...evaluation.contexts.map((context) => context.alignmentScore));

}



function getAlignmentLabel(score: number) {

  if (score >= 88) return { label: 'STRONG ALIGNMENT', color: '#4a7a4a' };

  if (score >= 72) return { label: 'MODERATE ALIGNMENT', color: '#7a6a3a' };

  return { label: 'LOW ALIGNMENT', color: '#7a3a3a' };

}



function hasAnyEvaluations(digitalSets: DigitalSet[]) {

  return digitalSets.some((digitalSet) => digitalSet.evaluations.length > 0);

}



export function ProspectRenderHistory() {

  const { prospectId } = useParams();

  const activeProspectData =

    prospectId === 'sofia-andersen' ? prospectData : sumithProspectData;



  const [status, setStatus] = useState(activeProspectData.status);

  const [statusColor, setStatusColor] = useState(activeProspectData.statusColor);

  const [pendingStatusChange, setPendingStatusChange] = useState<null | {

    previousStatus: string;

    previousColor: string;

    newStatus: string;

    newColor: string;

  }>(null);

  const navigate = useNavigate();



  const [notesSaved, setNotesSaved] = useState(false);

  const [notesValue, setNotesValue] = useState('Re-ran after digitals update...');



  const digitalSlots = (digitalSet: DigitalSet) => [

    { label: 'FRONT', src: digitalSet.front },

    { label: 'PROFILE', src: digitalSet.profile },

    { label: '3/4', src: digitalSet.threeQuarter },

    { label: 'FULL BODY', src: digitalSet.fullBody },

  ];



  const handleStatusChange = (newStatus: string, newColor: string) => {

    setPendingStatusChange({

      previousStatus: status,

      previousColor: statusColor,

      newStatus: newStatus,

      newColor: newColor,

    });



    setStatus(newStatus);

    setStatusColor(newColor);



    setTimeout(() => setPendingStatusChange(null), 5000);

  };



  const handleUndoStatusChange = () => {

    if (!pendingStatusChange) return;

    setStatus(pendingStatusChange.previousStatus);

    setStatusColor(pendingStatusChange.previousColor);

    setPendingStatusChange(null);

  };



  const showEmptyState = !hasAnyEvaluations(activeProspectData.digitalSets);



  return (

    <div className="p-[20px] md:p-[48px]">

      {/* Breadcrumb */}

      <div className="flex items-center gap-[8px] mb-[48px]">

        <Link

          to="/prospects"

          className="text-[13px] hover:opacity-70 transition-opacity"

          style={{ fontFamily: 'var(--font-mono)', color: '#a0a09a' }}

        >

          Prospects

        </Link>

        <ChevronRight size={14} style={{ color: '#6a6a64' }} />

        <span

          className="text-[13px]"

          style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec' }}

        >

          {activeProspectData.name}

        </span>

      </div>



      <h1

        className="text-[48px] mb-[48px]"

        style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}

      >

        {activeProspectData.name} — Evaluation History

      </h1>



      {/* Status Actions */}

      <div className="bg-[#111111] border border-[#2a2a2a] rounded-[4px] p-[24px] mb-[24px]">

        <div

          className="text-[10px] uppercase tracking-[0.12em] mb-[16px]"

          style={{ fontFamily: 'var(--font-label)', color: '#888880' }}

        >

          CURRENT STATUS

        </div>



        <div

          className="text-[16px] mb-[24px]"

          style={{ fontFamily: 'var(--font-mono)', color: statusColor }}

        >

          {status}

        </div>



        <div className="flex gap-[12px]">

          <button

            onClick={() => handleStatusChange('SHORTLISTED', '#7d6d4d')}

            className="px-[16px] py-[10px] border border-[#f0f0ec] bg-transparent rounded-[4px] text-[11px] uppercase tracking-[0.1em] hover:bg-[#f0f0ec] hover:text-[#080808] transition-colors"

            style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec' }}

          >

            SHORTLIST

          </button>



          <button

            onClick={() => handleStatusChange('PASSED', '#5d3d3d')}

            className="px-[16px] py-[10px] border border-[#f0f0ec] bg-transparent rounded-[4px] text-[11px] uppercase tracking-[0.1em] hover:bg-[#f0f0ec] hover:text-[#080808] transition-colors"

            style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec' }}

          >

            PASS

          </button>

        </div>

      </div>



      <div className="mb-[24px]">

        <div

          className="text-[10px] uppercase tracking-[0.12em] mb-[16px]"

          style={{ fontFamily: 'var(--font-label)', color: '#888880' }}

        >

          DIGITAL SETS

        </div>



        <div className="space-y-[12px] mb-[12px]">

          {activeProspectData.digitalSets.map((digitalSet) => (

            <div

              key={digitalSet.id}

              className="bg-[#111111] border border-[#2a2a2a] rounded-[4px] p-[24px] flex gap-[24px]"

            >

              <div className="flex-1">

                <div

                  style={{

                    fontFamily: 'var(--font-display)',

                    fontSize: '16px',

                    fontWeight: 300,

                    color: '#f0f0ec',

                    marginBottom: '4px',

                  }}

                >

                  {digitalSet.title}

                </div>

                <div

                  style={{

                    fontFamily: 'var(--font-mono)',

                    fontSize: '10px',

                    color: '#888880',

                    marginBottom: '12px',

                  }}

                >

                  {digitalSet.uploadedAt}

                </div>

                {digitalSet.tags.length > 0 && (

                  <div className="flex flex-wrap gap-[8px]">

                    {digitalSet.tags.map((tag) => (

                      <span

                        key={tag}

                        className="px-[12px] py-[6px] bg-[#111111] border border-[#2a2a2a] rounded-[4px] text-[11px] uppercase tracking-[0.1em]"

                        style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}

                      >

                        {tag}

                      </span>

                    ))}

                  </div>

                )}

              </div>



              <div>

                <div className="flex gap-[8px] mb-[8px]">

                  {[

                    digitalSet.front,

                    digitalSet.profile,

                    digitalSet.threeQuarter,

                    digitalSet.fullBody,

                  ].map((src, index) => (

                    <div

                      key={index}

                      className="bg-[#1a1a1a] rounded-[4px] overflow-hidden"

                      style={{ width: '48px', height: '48px' }}

                    >

                      {src && (

                        <img src={src} alt="" className="w-full h-full object-cover" />

                      )}

                    </div>

                  ))}

                </div>

                <span

                  style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#888880' }}

                >

                  {digitalSet.evaluations.length} evaluation

                  {digitalSet.evaluations.length !== 1 ? 's' : ''} completed

                </span>

              </div>

            </div>

          ))}

        </div>



        <button

          className="w-full px-[16px] py-[10px] border border-[#f0f0ec] bg-transparent rounded-[4px] text-[11px] uppercase tracking-[0.1em] hover:bg-[#f0f0ec] hover:text-[#080808] transition-colors"

          style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec', cursor: 'pointer' }}

        >

          + UPLOAD NEW DIGITAL SET

        </button>

      </div>



      <button

        onClick={() => navigate('/profile')}

        className="w-full py-[16px] rounded-[4px] text-[13px] uppercase tracking-[0.1em] transition-colors mb-[24px]"

        style={{

          fontFamily: 'var(--font-label)',

          backgroundColor: '#f0f0ec',

          color: '#080808',

          cursor: 'pointer',

        }}

      >

        New Evaluation

      </button>



      <div

        className="text-[10px] uppercase tracking-[0.12em] mb-[16px]"

        style={{ fontFamily: 'var(--font-label)', color: '#888880' }}

      >

        DIGITAL ANALYSIS HISTORY

      </div>



      {showEmptyState ? (

        <p

          className="mb-[48px]"

          style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#a0a09a', lineHeight: 1.6 }}

        >

          No evaluations yet. Upload digitals and run an alignment analysis to begin building

          evaluation history.

        </p>

      ) : (

        <div className="space-y-[24px] mb-[48px]">

          {activeProspectData.digitalSets.map((digitalSet) => {

            const digitalsOnFile = countDigitalsOnFile(digitalSet);



            return (

              <div key={digitalSet.id}>

                <div className="bg-[#111111] border border-[#2a2a2a] rounded-[4px] overflow-hidden">

                  <div className="px-[24px] py-[16px] bg-[#1a1a1a] border-b border-[#2a2a2a]">

                    <span

                      className="text-[10px] uppercase tracking-[0.12em]"

                      style={{ fontFamily: 'var(--font-label)', color: '#888880' }}

                    >

                      {digitalSet.title.toUpperCase()} · {digitalSet.uploadedAt}

                    </span>

                  </div>



                  <div className="p-[24px]">

                    <div className="flex gap-[12px] mb-[8px]">

                      {digitalSlots(digitalSet).map((slot) => (

                        <div key={slot.label} className="flex-1">

                          <div

                            className="bg-[#1a1a1a] rounded-[4px] overflow-hidden mb-[4px]"

                            style={{ height: '60px' }}

                          >

                            {slot.src && (

                              <img

                                src={slot.src}

                                alt={slot.label}

                                className="w-full h-full object-cover"

                              />

                            )}

                          </div>

                          <span

                            className="block text-center"

                            style={{

                              fontFamily: 'var(--font-mono)',

                              fontSize: '8px',

                              color: '#888880',

                            }}

                          >

                            {slot.label}

                          </span>

                        </div>

                      ))}

                    </div>



                    <span

                      className="block mb-[24px]"

                      style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#888880' }}

                    >

                      Digitals on file: {digitalsOnFile} of 4

                    </span>



                    <div className="space-y-[12px] mb-[24px]">

                      {digitalSet.evaluations.map((evaluation) => (
                          <div

                            key={evaluation.id}

                            className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-[4px] p-[16px]"

                          >

                            <div

                              className="text-[13px] mb-[4px]"

                              style={{ fontFamily: 'var(--font-mono)', color: '#f0f0ec' }}

                            >

                              {evaluation.completedAt}

                            </div>

                            <div

                              className="text-[13px] mb-[12px]"

                              style={{ fontFamily: 'var(--font-mono)', color: '#a0a09a' }}

                            >

                              {evaluation.contexts.length} context

                              {evaluation.contexts.length !== 1 ? 's' : ''} evaluated

                            </div>

                            <div className="flex gap-[8px] mb-[12px]">

                              {digitalSlots(digitalSet).map((slot) => (

                                <div key={slot.label} className="flex-1">

                                  <div

                                    className="bg-[#111111] rounded-[4px] overflow-hidden mb-[4px]"

                                    style={{ height: '48px' }}

                                  >

                                    {slot.src && (

                                      <img

                                        src={slot.src}

                                        alt={slot.label}

                                        className="w-full h-full object-cover"

                                      />

                                    )}

                                  </div>

                                  <span

                                    className="block text-center"

                                    style={{

                                      fontFamily: 'var(--font-mono)',

                                      fontSize: '8px',

                                      color: '#888880',

                                    }}

                                  >

                                    {slot.label}

                                  </span>

                                </div>

                              ))}

                            </div>

                            <div className="space-y-[10px]">

                              {evaluation.contexts.map((contextEvaluation) => {

                                const alignment = getAlignmentLabel(contextEvaluation.alignmentScore);

                                return (

                                  <div key={contextEvaluation.context}>

                                    <div className="flex items-center justify-between mb-[4px]">

                                      <span

                                        className="text-[9px] uppercase tracking-[0.1em]"

                                        style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}

                                      >

                                        {contextEvaluation.context}

                                      </span>

                                      <span

                                        className="text-[20px]"

                                        style={{

                                          fontFamily: 'var(--font-display)',

                                          fontWeight: 300,

                                          color: '#f0f0ec',

                                        }}

                                      >

                                        {contextEvaluation.alignmentScore}%

                                      </span>

                                    </div>

                                    <div

                                      style={{

                                        fontFamily: 'var(--font-mono)',

                                        fontSize: '10px',

                                        color: alignment.color,

                                        letterSpacing: '0.15em',

                                        textTransform: 'uppercase',

                                      }}

                                    >

                                      {contextEvaluation.fitLabel || alignment.label}

                                    </div>

                                  </div>

                                );

                              })}

                            </div>

                          </div>

                        ))}

                    </div>



                    <div>

                      <label

                        className="block mb-[8px] text-[11px] uppercase tracking-[0.1em]"

                        style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}

                      >

                        Session Notes

                      </label>

                      <textarea

                        placeholder="e.g. Re-ran after digitals update"

                        value={notesValue}

                        onChange={(e) => {

                          setNotesValue(e.target.value);

                          setNotesSaved(false);

                          setTimeout(() => setNotesSaved(true), 800);

                        }}

                        className="w-full h-[80px] px-[16px] py-[10px] bg-[#080808] border border-[#2a2a2a] rounded-[4px] resize-none"

                        style={{

                          fontFamily: 'var(--font-mono)',

                          fontSize: '13px',

                          color: '#f0f0ec',

                        }}

                      />

                      <p

                        style={{

                          fontFamily: 'var(--font-mono)',

                          fontSize: '11px',

                          color: notesSaved ? '#5d7d5d' : '#888880',

                          marginTop: '6px',

                          transition: 'color 0.3s ease',

                        }}

                      >

                        {notesSaved ? '✓ Saved' : 'Unsaved changes'}

                      </p>

                    </div>

                  </div>

                </div>

              </div>

            );

          })}

        </div>

      )}



      {/* Undo Toast */}

      {pendingStatusChange && (

        <div

          className="fixed bottom-[80px] left-1/2 -translate-x-1/2 flex items-center gap-[16px] px-[20px] py-[14px] border rounded-[4px] z-50"

          style={{

            backgroundColor: '#1a1a1a',

            borderColor: '#2a2a2a',

            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',

          }}

        >

          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#f0f0ec' }}>

            Status updated

          </span>

          <button

            onClick={handleUndoStatusChange}

            style={{

              fontFamily: 'var(--font-mono)',

              fontSize: '11px',

              color: '#f0f0ec',

              textDecoration: 'underline',

              cursor: 'pointer',

            }}

          >

            UNDO

          </button>

        </div>

      )}

    </div>

  );

}


