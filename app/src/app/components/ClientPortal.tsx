import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { resolveDigitalImageForDisplay, supabase } from '../../lib/supabase';
import { DigitalImage } from './DigitalImage';

type PortalEvaluationCard = {
  id: string;
  context: string;
  alignmentScore: number;
  fitLabel: string;
  reasoning: string;
  image: string | null;
};

export function ClientPortal() {
  const [searchParams] = useSearchParams();
  const { agencyName } = useAuth();
  const prospectName = searchParams.get('name')
    ? decodeURIComponent(searchParams.get('name')!)
    : 'Prospect';
  const prospectId = searchParams.get('prospectId') || '';
  const evaluationId = searchParams.get('evaluationId') || '';
  const contextsParam = searchParams.get('contexts') || '';
  const selectedContexts = contextsParam.split(',').filter(Boolean);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markets, setMarkets] = useState<string[]>([]);
  const [agentNotes, setAgentNotes] = useState('');
  const [evaluationCards, setEvaluationCards] = useState<PortalEvaluationCard[]>([]);
  const [response, setResponse] = useState<'interested' | 'pass' | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!prospectId) {
        setLoading(false);
        setError('Missing prospect reference for this package.');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data: prospect, error: prospectError } = await supabase
          .from('prospects')
          .select('name, markets')
          .eq('id', prospectId)
          .maybeSingle();

        if (prospectError) throw prospectError;

        if (!cancelled && prospect) {
          setMarkets((prospect.markets ?? []).map((market: string) => market.toUpperCase()));
        }

        let evaluationQuery = supabase
          .from('evaluations')
          .select('id, agent_notes, digital_set_id, completed_at')
          .eq('entity_id', prospectId)
          .order('completed_at', { ascending: false });

        if (evaluationId) {
          evaluationQuery = evaluationQuery.eq('id', evaluationId);
        }

        const { data: evaluations, error: evaluationError } = await evaluationQuery.limit(1);
        if (evaluationError) throw evaluationError;

        const evaluation = evaluations?.[0];
        if (!evaluation) {
          if (!cancelled) {
            setError('No evaluation package found for this prospect yet.');
            setEvaluationCards([]);
          }
          return;
        }

        if (!cancelled) {
          setAgentNotes(evaluation.agent_notes ?? '');
        }

        const { data: contextRows, error: contextError } = await supabase
          .from('context_evaluations')
          .select('context, alignment_score, fit_label, reasoning')
          .eq('evaluation_id', evaluation.id);

        if (contextError) throw contextError;

        const filteredContexts = (contextRows ?? []).filter((row) => {
          if (selectedContexts.length === 0) return true;
          return selectedContexts.some(
            (ctx) => ctx.toLowerCase() === row.context?.toLowerCase(),
          );
        });

        let previewImage: string | null = null;
        if (evaluation.digital_set_id) {
          const { data: digitalSet } = await supabase
            .from('digital_sets')
            .select('front')
            .eq('id', evaluation.digital_set_id)
            .maybeSingle();

          if (digitalSet?.front) {
            previewImage = await resolveDigitalImageForDisplay(digitalSet.front);
          }
        }

        const cards = filteredContexts.map((row, index) => ({
          id: `${evaluation.id}-${index}`,
          context: row.context?.toUpperCase() ?? 'CONTEXT',
          alignmentScore: row.alignment_score ?? 0,
          fitLabel: row.fit_label ?? '',
          reasoning: row.reasoning ?? '',
          image: previewImage,
        }));

        if (!cancelled) {
          setEvaluationCards(cards);
        }
      } catch (loadError) {
        console.error('[ClientPortal] load error:', loadError);
        if (!cancelled) {
          setError('Could not load this client package.');
          setEvaluationCards([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [prospectId, evaluationId, contextsParam]);

  const displayCards = useMemo(() => evaluationCards, [evaluationCards]);

  return (
    <div
      className="w-full mx-auto p-[48px]"
      style={{ maxWidth: '1000px', backgroundColor: '#080808' }}
    >
      <div className="mb-[48px]">
        <h1
          className="text-[56px] mb-[12px]"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
        >
          {prospectName}
        </h1>

        <p
          className="text-[12px] mb-[16px]"
          style={{ fontFamily: 'var(--font-mono)', color: '#888880' }}
        >
          {`Sent by ${agencyName ?? 'CastView Agency'} · ${new Date().toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}`}
        </p>

        {markets.length > 0 && (
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
        )}
      </div>

      {loading && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#888880' }}>
          Loading package...
        </p>
      )}

      {!loading && error && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#c87a7a' }}>
          {error}
        </p>
      )}

      {!loading && !error && displayCards.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-[24px] mb-[48px]">
            {displayCards.map((card, index) => (
              <div
                key={card.id}
                className="rounded-[4px] overflow-hidden"
                style={{
                  backgroundColor: '#111111',
                  border: index === 0 ? '1px solid #f0f0ec' : '1px solid #2a2a2a',
                }}
              >
                <div className="aspect-[4/5] bg-[#1a1a1a]">
                  {card.image ? (
                    <DigitalImage
                      storageRef={card.image}
                      alt={card.context}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-[11px] uppercase tracking-[0.1em]"
                      style={{ fontFamily: 'var(--font-mono)', color: '#888880' }}
                    >
                      Preview unavailable
                    </div>
                  )}
                </div>

                <div className="p-[16px]">
                  <div
                    className="text-[9px] uppercase tracking-[0.1em] mb-[8px]"
                    style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
                  >
                    {card.context}
                  </div>

                  <div
                    className="text-[32px] mb-[8px]"
                    style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: '#f0f0ec' }}
                  >
                    {card.alignmentScore}%
                  </div>

                  <div
                    className="text-[10px] uppercase tracking-[0.08em] mb-[12px]"
                    style={{ fontFamily: 'var(--font-label)', color: '#c8a96e' }}
                  >
                    {card.fitLabel}
                  </div>

                  <p
                    className="text-[12px]"
                    style={{ fontFamily: 'var(--font-mono)', color: '#c8c8c2', lineHeight: 1.6 }}
                  >
                    {card.reasoning}
                  </p>

                  <div className="h-[4px] bg-[#2a2a2a] rounded-full overflow-hidden mt-[12px]">
                    <div
                      className="h-full bg-[#f0f0ec] rounded-full"
                      style={{ width: `${card.alignmentScore}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {agentNotes && (
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
                {agentNotes}
              </p>
            </div>
          )}
        </>
      )}

      <div
        className="rounded-[4px] p-[24px] mb-[48px]"
        style={{ backgroundColor: '#111111', border: '1px solid #2a2a2a' }}
      >
        <div
          className="text-[11px] uppercase tracking-[0.1em] mb-[16px]"
          style={{ fontFamily: 'var(--font-label)', color: '#a0a09a' }}
        >
          YOUR RESPONSE
        </div>

        <div className="grid grid-cols-2 gap-[12px] mb-[16px]">
          <button
            type="button"
            onClick={() => setResponse('interested')}
            className="py-[16px] rounded-[4px] border text-[11px] uppercase tracking-[0.1em] transition-all"
            style={{
              fontFamily: 'var(--font-label)',
              borderColor: response === 'interested' ? '#4a7a4a' : '#2a2a2a',
              backgroundColor: response === 'interested' ? '#1a2a1a' : 'transparent',
              color: response === 'interested' ? '#6ababa' : '#f0f0ec',
              cursor: 'pointer',
            }}
          >
            INTERESTED
          </button>

          <button
            type="button"
            onClick={() => setResponse('pass')}
            className="py-[16px] rounded-[4px] border text-[11px] uppercase tracking-[0.1em] transition-all"
            style={{
              fontFamily: 'var(--font-label)',
              borderColor: response === 'pass' ? '#7a4a4a' : '#2a2a2a',
              backgroundColor: response === 'pass' ? '#2a1a1a' : 'transparent',
              color: response === 'pass' ? '#ba6a6a' : '#f0f0ec',
              cursor: 'pointer',
            }}
          >
            PASS
          </button>
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Leave a note for the agent..."
          className="w-full h-[100px] px-[16px] py-[12px] bg-[#080808] border border-[#2a2a2a] rounded-[4px] resize-none mb-[16px]"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            color: '#f0f0ec',
          }}
        />

        <div className="flex justify-end">
          <button
            type="button"
            className="px-[20px] py-[10px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
            style={{
              fontFamily: 'var(--font-label)',
              backgroundColor: '#f0f0ec',
              color: '#080808',
              cursor: 'pointer',
            }}
            onClick={() => {
              if (response) {
                toast.success(`Response recorded: ${response}`);
              } else {
                toast.error('Please select a response');
              }
            }}
          >
            SEND RESPONSE
          </button>
        </div>
      </div>

      <div className="text-center">
        <p
          className="text-[11px]"
          style={{ fontFamily: 'var(--font-mono)', color: '#6a6a64' }}
        >
          This package was shared via CastView
        </p>
      </div>
    </div>
  );
}
