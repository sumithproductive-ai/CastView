import React from 'react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router';
import { Check } from 'lucide-react';
import { useRoster, type RosterModel } from '../context/RosterContext';
import { DigitalImage } from './DigitalImage';
import {
  clearNewModelDigitals,
  loadNewModelDigitals,
} from '../utils/newModelDigitalsStorage';

export function NewModelReview() {
  const { t } = useTranslation('newEntry');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addModel } = useRoster();
  const [saving, setSaving] = useState(false);

  const modelName = searchParams.get('name')?.trim() || 'New Model';
  const storedDigitals = useMemo(() => loadNewModelDigitals(), []);
  const front = storedDigitals?.front || searchParams.get('front') || '';
  const profile = storedDigitals?.profile || searchParams.get('profile') || '';
  const threeQuarter =
    storedDigitals?.threeQuarter || searchParams.get('threeQuarter') || '';
  const fullBody = storedDigitals?.fullBody || searchParams.get('fullBody') || '';
  const marketsFromParams =
    searchParams.get('markets')?.split(',').filter(Boolean) ?? [];
  const height = searchParams.get('height') || '';
  const bust = searchParams.get('bust') || '';
  const waist = searchParams.get('waist') || '';
  const hips = searchParams.get('hips') || '';
  const shoe = searchParams.get('shoe') || '';
  const notesFromParams = searchParams.get('notes') || '';

  const modelData = {
    name: modelName,
    markets: marketsFromParams,
    digitals: [
      { label: t('digitals.angleFront'), url: front || null },
      { label: t('digitals.angleProfile'), url: profile || null },
      { label: t('digitals.angleThreeQuarter'), url: threeQuarter || null },
      { label: t('digitals.angleFullBody'), url: fullBody || null },
    ],
    measurements: [
      { label: t('fields.height'), value: height },
      { label: t('fields.bust'), value: bust },
      { label: t('fields.waist'), value: waist },
      { label: t('fields.hips'), value: hips },
      { label: t('fields.shoe'), value: shoe },
    ],
    notes: notesFromParams,
    allDigitalsUploaded: Boolean(front && profile && threeQuarter && fullBody),
  };

  const handleAddToRoster = async () => {
    if (saving) return;
    setSaving(true);

    const name = searchParams.get('name')?.trim() || modelName;
    const notes = searchParams.get('notes') || '';

    const newModel: RosterModel = {
      id: crypto.randomUUID(),
      name,
      email: '',
      image: front || null,
      location: marketsFromParams.join(', '),
      primaryContext: 'EDITORIAL',
      contexts: ['ED'],
      renderedContexts: [],
      topScore: 0,
      lastEvaluation: 'Not yet evaluated',
      status: 'ACTIVE',
      recentlySigned: true,
      division: 'men',
      digitalSets: [
        {
          id: crypto.randomUUID(),
          uploadedAt: new Date().toLocaleString('en-US', {
            month: 'long',
            year: 'numeric',
          }),
          title: 'Initial Digitals',
          front: front || '',
          profile: profile || '',
          threeQuarter: threeQuarter || '',
          fullBody: fullBody || '',
          additionalImages: [],
          notes: notes || '',
          tags: ['initial'],
          evaluations: [],
        },
      ],
    };

    try {
      await addModel(newModel);
      clearNewModelDigitals();
      navigate('/roster');
    } catch (err) {
      console.error('[NewModelReview] addModel failed:', err);
      setSaving(false);
    }
  };

  return (
    <div className="p-[48px]">
      <h1
        className="text-[48px] mb-[32px]"
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 300,
          color: 'var(--cv-primary-text)',
        }}
      >
        {t('model.titleReview')}
      </h1>

      <div className="flex items-center gap-[16px] mb-[48px]">
        <div className="flex items-center gap-[12px]">
          <div
            className="w-[32px] h-[32px] rounded-full flex items-center justify-center"
            style={{
              backgroundColor: 'var(--cv-primary-text)',
              color: 'var(--cv-background)',
            }}
          >
            <Check size={16} />
          </div>
          <span
            className="text-[13px]"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-primary-text)' }}
          >
            {t('steps.basicInfo')}
          </span>
        </div>

        <div className="w-[40px] h-[1px] bg-[var(--cv-subtle-border)]" />

        <div className="flex items-center gap-[12px]">
          <div
            className="w-[32px] h-[32px] rounded-full flex items-center justify-center"
            style={{
              backgroundColor: 'var(--cv-primary-text)',
              color: 'var(--cv-background)',
            }}
          >
            <Check size={16} />
          </div>
          <span
            className="text-[13px]"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-primary-text)' }}
          >
            {t('steps.digitals')}
          </span>
        </div>

        <div className="w-[40px] h-[1px] bg-[var(--cv-subtle-border)]" />

        <div className="flex items-center gap-[12px]">
          <div
            className="w-[32px] h-[32px] rounded-full flex items-center justify-center text-[13px]"
            style={{
              fontFamily: 'var(--font-mono)',
              backgroundColor: 'var(--cv-primary-text)',
              color: 'var(--cv-background)',
            }}
          >
            3
          </div>
          <span
            className="text-[13px]"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-primary-text)' }}
          >
            {t('steps.review')}
          </span>
        </div>
      </div>

      <div className="mb-[24px]">
        <div
          className="text-[9px] uppercase tracking-[0.1em]"
          style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
        >
          {t('model.reviewHeading')}
        </div>
      </div>

      <div className="max-w-[480px] mx-auto bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px] p-[32px]">
        <h2
          className="text-[32px] mb-[16px]"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 300,
            color: 'var(--cv-primary-text)',
          }}
        >
          {modelData.name}
        </h2>

        <div className="flex gap-[8px] mb-[24px]">
          {modelData.markets.map((market) => (
            <div
              key={market}
              className="px-[12px] py-[6px] border border-[var(--cv-subtle-border)] rounded-full text-[9px] uppercase tracking-[0.1em]"
              style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
            >
              {market}
            </div>
          ))}
        </div>

        <div
          className="text-[12px] mb-[16px]"
          style={{
            fontFamily: 'var(--font-mono)',
            color: modelData.allDigitalsUploaded ? '#5d7d5d' : '#c4a05d',
          }}
        >
          {modelData.allDigitalsUploaded
            ? t('model.allUploadedMsg')
            : t('model.notAllUploadedMsg')}
        </div>

        <div className="grid grid-cols-4 gap-[12px] mb-[24px]">
          {modelData.digitals.map((digital) => (
            <div key={digital.label} className="flex flex-col gap-[8px]">
              {digital.url ? (
                <div className="aspect-square bg-[var(--cv-elevated)] rounded-[4px] overflow-hidden">
                  <DigitalImage
                    storageRef={digital.url}
                    alt={digital.label}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div
                  className="aspect-square bg-[var(--cv-background)] border border-dashed rounded-[4px] flex items-center justify-center"
                  style={{ borderColor: 'var(--cv-subtle-border)' }}
                >
                  <div
                    className="text-[7px] uppercase tracking-[0.05em] text-center px-[4px]"
                    style={{
                      fontFamily: 'var(--font-label)',
                      color: 'var(--cv-secondary-text)',
                      lineHeight: 1.3,
                    }}
                  >
                    {digital.label}
                    <br />
                    {t('review.notUploaded')}
                  </div>
                </div>
              )}
              <div
                className="text-[8px] uppercase tracking-[0.05em] text-center"
                style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
              >
                {digital.label}
              </div>
            </div>
          ))}
        </div>

        <div className="h-[1px] bg-[var(--cv-subtle-border)] mb-[24px]" />

        <div className="grid grid-cols-2 gap-x-[24px] gap-y-[12px] mb-[24px]">
          {modelData.measurements.map(({ label, value }) => (
            <div key={label} className="flex justify-between">
              <span
                className="text-[11px] uppercase tracking-[0.05em]"
                style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
              >
                {label}
              </span>
              <span
                className="text-[13px]"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-primary-text)' }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>

        {modelData.notes && (
          <div
            className="text-[13px] mb-[32px] italic"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}
          >
            {modelData.notes}
          </div>
        )}

        <div className="space-y-[12px]">
          <button
            type="button"
            onClick={handleAddToRoster}
            disabled={saving}
            className="w-full py-[12px] bg-[var(--cv-primary-text)] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--cv-background)',
            }}
          >
            {saving ? t('model.addingToRoster') : t('model.addToRoster')}
          </button>
          <button
            type="button"
            onClick={() =>
              navigate(`/roster/new/digitals${window.location.search}`)
            }
            className="w-full text-center text-[12px] transition-opacity hover:opacity-70"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}
          >
            {t('review.backToEdit')}
          </button>
        </div>
      </div>
    </div>
  );
}
