import React, { useState } from 'react';
import { Link } from 'react-router';
import { Inbox as InboxIcon, AlertTriangle, X } from 'lucide-react';
import { useProspects, type Prospect } from '../context/ProspectsContext';
import { useAuth } from '../context/AuthContext';
import { DigitalImage } from './DigitalImage';
import type { DigitalSet } from '../types/talent';

// Email intake agent review queue. Sprint 3 built the read + correct flow;
// Sprint 4 added batch consent + promotion — selecting drafts and
// confirming moves them from PENDING_REVIEW to IN REVIEW (the same status
// a manually-added prospect gets after "Save and Render"), writing the
// same consent_at/consent_by fields the single-prospect consent flow
// writes (lib/prospectConsent.ts / ProspectConsent.tsx), just applied to
// every selected row in one action instead of via sessionStorage handoff.
// PENDING_REVIEW prospects are deliberately excluded from the main
// Prospects list (see ProspectsIndex.tsx) so they only live here until
// confirmed. Unconfirmed drafts stay in the queue indefinitely — no
// expiry, nothing promotes itself silently.

const IN_REVIEW_COLOR = '#4d3d5d';

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
  selected,
  onToggleSelect,
}: {
  prospect: Prospect;
  duplicateName: string | null;
  selected: boolean;
  onToggleSelect: () => void;
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
      className="bg-[var(--cv-surface)] border rounded-[4px] p-[24px] mb-[20px] transition-colors"
      style={{ borderColor: selected ? 'var(--cv-primary-text)' : 'var(--cv-subtle-border)' }}
    >
      <div className="flex items-start justify-between gap-[16px] mb-[20px]">
        <div className="flex items-start gap-[12px] flex-1 min-w-0">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            className="mt-[3px] cursor-pointer flex-shrink-0"
            style={{ width: '16px', height: '16px', accentColor: 'var(--cv-primary-text)' }}
            aria-label={`Select ${prospect.name}`}
          />
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

function BatchConsentModal({
  count,
  agentEmail,
  onCancel,
  onConfirm,
}: {
  count: number;
  agentEmail: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [isChecked, setIsChecked] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = async () => {
    if (!isChecked || confirming) return;
    setConfirming(true);
    await onConfirm();
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center px-[24px]"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
    >
      <div
        className="w-full max-w-[480px] bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px] p-[32px]"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
      >
        <h2
          className="mb-[16px]"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: '28px', color: 'var(--cv-primary-text)' }}
        >
          Confirm consent
        </h2>
        <p
          className="mb-[24px]"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--cv-secondary-text)', lineHeight: '1.7' }}
        >
          CastView analyses uploaded digitals to generate structured context alignment evaluations for internal agency use only. Evaluations are not shared with clients until you choose to share them.
        </p>

        <div className="flex items-start gap-[12px] mb-[28px]">
          <input
            type="checkbox"
            id="batch-consent-checkbox"
            checked={isChecked}
            onChange={(e) => setIsChecked(e.target.checked)}
            className="mt-[3px] cursor-pointer"
            style={{ width: '16px', height: '16px', accentColor: 'var(--cv-primary-text)' }}
          />
          <label
            htmlFor="batch-consent-checkbox"
            className="cursor-pointer"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--cv-primary-text)' }}
          >
            I've confirmed each of the {count} selected submission{count !== 1 ? 's' : ''} has consented to their photos being used for internal evaluation.
          </label>
        </div>

        <div className="flex gap-[12px] mb-[16px]">
          <button
            type="button"
            onClick={onCancel}
            className="px-[24px] py-[12px] border rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-colors hover:border-[var(--cv-primary-text)]"
            style={{
              fontFamily: 'var(--font-label)',
              borderColor: 'var(--cv-subtle-border)',
              color: 'var(--cv-secondary-text)',
              backgroundColor: 'transparent',
              cursor: 'pointer',
            }}
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isChecked || confirming}
            className="px-[24px] py-[12px] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity"
            style={{
              fontFamily: 'var(--font-label)',
              backgroundColor: isChecked ? 'var(--cv-primary-text)' : 'var(--cv-subtle-border)',
              color: isChecked ? 'var(--cv-background)' : 'var(--cv-secondary-text)',
              cursor: isChecked && !confirming ? 'pointer' : 'not-allowed',
              opacity: !isChecked ? 0.5 : confirming ? 0.7 : 1,
            }}
          >
            {confirming ? 'ADDING…' : 'CONFIRM & ADD TO PROSPECTS'}
          </button>
        </div>

        <div
          className="italic"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--cv-secondary-text)' }}
        >
          Stored: {new Date().toLocaleDateString()} · Agent: {agentEmail || 'Agent'}
        </div>
      </div>
    </div>
  );
}

export function InboxReview() {
  const { prospects, loading, updateProspect } = useProspects();
  const { user } = useAuth();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showConsentModal, setShowConsentModal] = useState(false);

  const drafts = prospects.filter((p) => p.status === 'PENDING_REVIEW');
  const nameById = new Map(prospects.map((p) => [p.id, p.name]));

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(drafts.map((d) => d.id)));
  const deselectAll = () => setSelected(new Set());

  const handleConfirmBatch = async () => {
    if (!user) return;
    const confirmedAt = new Date().toISOString();
    await Promise.all(
      Array.from(selected).map((id) =>
        updateProspect(id, {
          status: 'IN REVIEW',
          statusColor: IN_REVIEW_COLOR,
          consent_at: confirmedAt,
          consent_by: user.id,
        }),
      ),
    );
    setSelected(new Set());
    setShowConsentModal(false);
  };

  return (
    <div className="p-[20px] md:p-[48px]" style={{ paddingBottom: selected.size > 0 ? '100px' : undefined }}>
      <div className="flex items-start justify-between mb-[16px]">
        <div>
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
        {drafts.length > 0 && (
          <button
            type="button"
            onClick={selected.size === drafts.length ? deselectAll : selectAll}
            className="text-[11px] uppercase tracking-[0.1em] hover:opacity-70 transition-opacity flex-shrink-0"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)', cursor: 'pointer' }}
          >
            {selected.size === drafts.length ? 'DESELECT ALL' : 'SELECT ALL'}
          </button>
        )}
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
            selected={selected.has(draft.id)}
            onToggleSelect={() => toggleSelect(draft.id)}
          />
        ))
      )}

      {/* Batch Action Bar */}
      {selected.size > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 h-[64px] bg-[var(--cv-elevated)] border-t border-[var(--cv-subtle-border)] flex items-center px-[48px] z-50"
        >
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--cv-primary-text)' }}>
            {selected.size} selected
          </div>
          <div className="ml-auto flex items-center gap-[12px]">
            <button
              type="button"
              onClick={() => setShowConsentModal(true)}
              className="px-[20px] py-[10px] bg-[var(--cv-primary-text)] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-background)', border: 'none', cursor: 'pointer' }}
            >
              CONFIRM CONSENT & ADD TO PROSPECTS
            </button>
            <button type="button" onClick={deselectAll} className="p-[8px] hover:opacity-70 transition-opacity">
              <X size={20} color="var(--cv-primary-text)" />
            </button>
          </div>
        </div>
      )}

      {showConsentModal && (
        <BatchConsentModal
          count={selected.size}
          agentEmail={user?.email ?? ''}
          onCancel={() => setShowConsentModal(false)}
          onConfirm={handleConfirmBatch}
        />
      )}
    </div>
  );
}
