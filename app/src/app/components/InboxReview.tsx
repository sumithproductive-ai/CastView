import React, { useState } from 'react';
import { Link } from 'react-router';
import { Inbox as InboxIcon, AlertTriangle } from 'lucide-react';
import { useProspects, type Prospect } from '../context/ProspectsContext';
import { DigitalImage } from './DigitalImage';
import type { DigitalSet } from '../types/talent';

// Sprint 3 of the email intake agent: a booker reviews and corrects what
// the extraction cron (Sprint 2) drafted before it becomes a real prospect.
// Read + correct only — no promotion/consent action here, that's Sprint 4.
// PENDING_REVIEW prospects are deliberately excluded from the main
// Prospects list (see ProspectsIndex.tsx) so they only live here until
// confirmed.

type AngleKey = 'front' | 'profile' | 'threeQuarter' | 'fullBody';

const ANGLE_SLOTS: { key: AngleKey; label: string }[] = [
  { key: 'front', label: 'FRONT' },
  { key: 'profile', label: 'PROFILE' },
  { key: 'threeQuarter', label: '3/4' },
  { key: 'fullBody', label: 'FULL BODY' },
];

const formFieldLabelStyle = {
  fontFamily: 'var(--font-mono)',
  fontSize: '9px',
  color: 'var(--cv-secondary-text)',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
};

const formInputStyle = {
  fontFamily: 'var(--font-mono)',
  fontSize: '13px',
  color: 'var(--cv-primary-text)',
};

function FieldInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block mb-[6px]" style={formFieldLabelStyle}>
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-[10px] py-[9px] bg-[var(--cv-elevated)] border border-[var(--cv-subtle-border)] rounded-[4px]"
        style={formInputStyle}
      />
    </div>
  );
}

function InboxDraftCard({
  prospect,
  duplicateName,
}: {
  prospect: Prospect;
  duplicateName: string | null;
}) {
  const { updateProspect, removeProspect } = useProspects();
  const digitalSet: DigitalSet | undefined = prospect.digitalSets[0];

  const [name, setName] = useState(prospect.name);
  const [height, setHeight] = useState(prospect.height ?? '');
  const [hair, setHair] = useState(prospect.hair ?? '');
  const [chest, setChest] = useState(prospect.measurements?.chest ?? '');
  const [waist, setWaist] = useState(prospect.measurements?.waist ?? '');
  const [hips, setHips] = useState(prospect.measurements?.hips ?? '');
  const [shoe, setShoe] = useState(prospect.measurements?.shoe ?? '');
  const [images, setImages] = useState<Record<AngleKey, string | null>>({
    front: digitalSet?.front ?? null,
    profile: digitalSet?.profile ?? null,
    threeQuarter: digitalSet?.threeQuarter ?? null,
    fullBody: digitalSet?.fullBody ?? null,
  });

  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  const reassignImage = (fromKey: AngleKey, toKey: AngleKey) => {
    if (fromKey === toKey) return;
    setImages((prev) => {
      const next = { ...prev };
      const temp = next[toKey];
      next[toKey] = next[fromKey];
      next[fromKey] = temp;
      return next;
    });
    setJustSaved(false);
  };

  const markDirty = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setJustSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedDigitalSets: DigitalSet[] = digitalSet
        ? [
            {
              ...digitalSet,
              front: images.front,
              profile: images.profile,
              threeQuarter: images.threeQuarter,
              fullBody: images.fullBody,
            },
            ...prospect.digitalSets.slice(1),
          ]
        : prospect.digitalSets;

      await updateProspect(prospect.id, {
        name: name.trim() || prospect.name,
        height,
        hair,
        measurements: { chest, waist, hips, shoe },
        digitalSets: updatedDigitalSets,
      });
      setJustSaved(true);
    } catch (err) {
      console.error('[InboxReview] save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDismiss = async () => {
    if (!window.confirm(`Discard the draft for "${prospect.name}"? This can't be undone.`)) return;
    setDismissing(true);
    try {
      await removeProspect(prospect.id);
    } catch (err) {
      console.error('[InboxReview] dismiss error:', err);
      setDismissing(false);
    }
  };

  return (
    <div
      className="bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px] p-[24px] mb-[20px]"
    >
      <div className="flex items-start justify-between gap-[16px] mb-[20px]">
        <div className="flex-1 min-w-0">
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--cv-secondary-text)', letterSpacing: '0.08em', marginBottom: '4px' }}>
            {prospect.email || 'UNKNOWN SENDER'} · {prospect.submissionDate}
          </div>
          {duplicateName && (
            <Link
              to={`/prospects/${prospect.possibleDuplicateOf}`}
              className="inline-flex items-center gap-[6px] px-[8px] py-[4px] rounded-[4px] mb-[10px] hover:opacity-80 transition-opacity"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.05em',
                color: '#d4a574',
                backgroundColor: 'rgba(212, 165, 116, 0.1)',
                border: '1px solid rgba(212, 165, 116, 0.2)',
              }}
            >
              <AlertTriangle size={11} />
              Possible duplicate of {duplicateName}
            </Link>
          )}
        </div>
        {prospect.notes && (
          <div
            className="text-right max-w-[280px]"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--cv-secondary-text)', fontStyle: 'italic' }}
          >
            {prospect.notes}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.3fr] gap-[24px]">
        {/* Digitals with reassignable angles */}
        <div className="grid grid-cols-2 gap-[10px]">
          {ANGLE_SLOTS.map(({ key, label }) => {
            const imageRef = images[key];
            const otherSlots = ANGLE_SLOTS.filter((s) => s.key !== key);
            return (
              <div key={key}>
                <div
                  className="flex items-center justify-between mb-[6px]"
                  style={formFieldLabelStyle}
                >
                  <span>{label}</span>
                  {imageRef && (
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) reassignImage(key, e.target.value as AngleKey);
                        e.target.value = '';
                      }}
                      className="bg-transparent border-none text-right cursor-pointer"
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--cv-secondary-text)' }}
                    >
                      <option value="">Move to…</option>
                      {otherSlots.map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                {imageRef ? (
                  <div
                    className="bg-[var(--cv-background)] border border-[var(--cv-subtle-border)] rounded-[4px] overflow-hidden"
                    style={{ height: '160px' }}
                  >
                    <DigitalImage
                      storageRef={imageRef}
                      alt={label}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%', display: 'block' }}
                    />
                  </div>
                ) : (
                  <div
                    className="flex items-center justify-center bg-[var(--cv-background)] border border-dashed rounded-[4px]"
                    style={{ borderColor: 'var(--cv-subtle-border)', height: '160px' }}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--cv-secondary-text)' }}>
                      No image
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Editable extracted fields */}
        <div>
          <div className="mb-[12px]">
            <FieldInput label="NAME" value={name} onChange={markDirty(setName)} placeholder="Full name" />
          </div>
          <div className="grid grid-cols-3 gap-[10px] mb-[12px]">
            <FieldInput label="HEIGHT" value={height} onChange={markDirty(setHeight)} placeholder="e.g. 177cm" />
            <FieldInput label="HAIR" value={hair} onChange={markDirty(setHair)} placeholder="e.g. Brown" />
            <FieldInput label="SHOE" value={shoe} onChange={markDirty(setShoe)} placeholder="e.g. 9" />
          </div>
          <div className="grid grid-cols-3 gap-[10px] mb-[20px]">
            <FieldInput label="BUST/CHEST" value={chest} onChange={markDirty(setChest)} placeholder="—" />
            <FieldInput label="WAIST" value={waist} onChange={markDirty(setWaist)} placeholder="—" />
            <FieldInput label="HIPS" value={hips} onChange={markDirty(setHips)} placeholder="—" />
          </div>

          <div className="flex items-center gap-[12px]">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-[20px] py-[10px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
              style={{
                fontFamily: 'var(--font-mono)',
                backgroundColor: 'var(--cv-primary-text)',
                color: 'var(--cv-background)',
                border: 'none',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'SAVING…' : justSaved ? 'SAVED' : 'SAVE CHANGES'}
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              disabled={dismissing}
              className="px-[16px] py-[10px] border border-[var(--cv-subtle-border)] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-colors hover:border-[#5d3d3d] hover:text-[#a86a6a]"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--cv-secondary-text)',
                background: 'transparent',
                cursor: dismissing ? 'not-allowed' : 'pointer',
                opacity: dismissing ? 0.6 : 1,
              }}
            >
              {dismissing ? 'DISCARDING…' : 'DISCARD'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function InboxReview() {
  const { prospects, loading } = useProspects();

  const drafts = prospects.filter((p) => p.status === 'PENDING_REVIEW');
  const nameById = new Map(prospects.map((p) => [p.id, p.name]));

  return (
    <div className="p-[20px] md:p-[48px]">
      <div className="mb-[16px]">
        <h1
          className="text-[48px] mb-[8px]"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: 'var(--cv-primary-text)' }}
        >
          Inbox
        </h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--cv-secondary-text)' }}>
          Drafts pulled from your connected inbox — correct anything the agent got wrong, then confirm to add to Prospects.
        </p>
      </div>

      <div className="mb-[40px]" style={{ borderBottom: '1px solid var(--cv-subtle-border)' }} />

      {loading ? (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--cv-secondary-text)' }}>
          Loading…
        </div>
      ) : drafts.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center text-center py-[80px]"
          style={{ color: 'var(--cv-secondary-text)' }}
        >
          <InboxIcon size={32} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
            No drafts waiting on review.
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', marginTop: '6px', opacity: 0.7 }}>
            New submissions land here once your labeled Gmail inbox is synced.
          </div>
        </div>
      ) : (
        drafts.map((draft) => (
          <InboxDraftCard
            key={draft.id}
            prospect={draft}
            duplicateName={draft.possibleDuplicateOf ? nameById.get(draft.possibleDuplicateOf) ?? 'a prospect' : null}
          />
        ))
      )}
    </div>
  );
}
