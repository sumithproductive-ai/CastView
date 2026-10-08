import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router';
import { Check } from 'lucide-react';
import { useProspects, type Prospect } from '../context/ProspectsContext';
import { DigitalImage } from './DigitalImage';

export function NewProspectReview() {
  const { t } = useTranslation('newEntry');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addProspect } = useProspects();
  const prospectName = searchParams.get('name')?.trim() || 'Prospect';

  const front = searchParams.get('front') || '';
  const profile = searchParams.get('profile') || '';
  const threeQuarter = searchParams.get('threeQuarter') || '';
  const fullBody = searchParams.get('fullBody') || '';
  const marketsFromParams = searchParams.get('markets')?.split(',').filter(Boolean) ?? [];
  const height = searchParams.get('height') || '';
  const bust = searchParams.get('bust') || '';
  const waist = searchParams.get('waist') || '';
  const hips = searchParams.get('hips') || '';
  const shoe = searchParams.get('shoe') || '';
  const hair = searchParams.get('hair') || '';
  const notesFromParams = searchParams.get('notes') || '';

  const prospectData = {
    name: prospectName,
    markets: marketsFromParams.length > 0 ? marketsFromParams : ['NEW YORK', 'LONDON'],
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
    ],
    notes: notesFromParams,
    allDigitalsUploaded: Boolean(front && profile && threeQuarter && fullBody),
  };

  const buildNewProspect = (status: 'DRAFT' | 'IN REVIEW'): Prospect => {
    const name = searchParams.get('name')?.trim() || prospectName;
    const markets = searchParams.get('markets')?.split(',').filter(Boolean) ?? [];
    const source = searchParams.get('source') || undefined;
    const notes = searchParams.get('notes') || '';
    const now = Date.now();
    const uploadedAt = new Date().toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    return {
      id: crypto.randomUUID(),
      name,
      status,
      statusColor: status === 'DRAFT' ? '#666666' : '#C8A96E',
      evaluations: 0,
      submissionDate: 'Just now',
      source: source || undefined,
      image: front || null,
      contexts: [],
      renderedContexts: [],
      division: undefined,
      primaryContext: undefined,
      markets: markets.length > 0 ? markets : undefined,
      height: height || undefined,
      hair: hair || undefined,
      notes: notes || undefined,
      measurements: {
        chest: bust,
        waist,
        hips,
        shoe,
      },
      digitalSets: front
        ? [
            {
              id: crypto.randomUUID(),
              uploadedAt,
              title: 'Initial Submission',
              front: front || null,
              profile: profile || null,
              threeQuarter: threeQuarter || null,
              fullBody: fullBody || null,
              additionalImages: [],
              notes,
              tags: ['initial', 'submission'],
              evaluations: [],
            },
          ]
        : [],
    };
  };

  const handleSaveDraft = async () => {
    await addProspect(buildNewProspect('DRAFT'));
    navigate('/prospects');
  };

  const handleSaveAndRender = async () => {
    const newProspect = buildNewProspect('IN REVIEW');
    await addProspect(newProspect);
    navigate(
      `/profile?name=${encodeURIComponent(newProspect.name)}&prospectId=${newProspect.id}&profileType=prospect`,
    );
  };

  return (
    <div className="p-[48px]">
      {/* Page Title */}
      <h1 
        className="text-[48px] mb-[32px]" 
        style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: 'var(--cv-primary-text)' }}
      >
        {t('prospect.title')}
      </h1>

      {/* Step Indicator */}
      <div className="flex items-center gap-[16px] mb-[48px]">
        {/* Step 1 - Completed */}
        <div className="flex items-center gap-[12px]">
          <div 
            className="w-[32px] h-[32px] rounded-full flex items-center justify-center"
            style={{ 
              backgroundColor: 'var(--cv-primary-text)',
              color: 'var(--cv-background)'
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

        {/* Connector Line */}
        <div className="w-[40px] h-[1px] bg-[var(--cv-subtle-border)]" />

        {/* Step 2 - Completed */}
        <div className="flex items-center gap-[12px]">
          <div 
            className="w-[32px] h-[32px] rounded-full flex items-center justify-center"
            style={{ 
              backgroundColor: 'var(--cv-primary-text)',
              color: 'var(--cv-background)'
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

        {/* Connector Line */}
        <div className="w-[40px] h-[1px] bg-[var(--cv-subtle-border)]" />

        {/* Step 3 - Active */}
        <div className="flex items-center gap-[12px]">
          <div 
            className="w-[32px] h-[32px] rounded-full flex items-center justify-center text-[13px]"
            style={{ 
              fontFamily: 'var(--font-mono)', 
              backgroundColor: 'var(--cv-primary-text)',
              color: 'var(--cv-background)'
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

      {/* Section Header */}
      <div className="mb-[24px]">
        <div 
          className="text-[9px] uppercase tracking-[0.1em]"
          style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
        >
          {t('prospect.reviewHeading')}
        </div>
      </div>

      {/* Summary Card */}
      <div className="max-w-[480px] mx-auto bg-[var(--cv-surface)] border border-[var(--cv-subtle-border)] rounded-[4px] p-[32px]">
        {/* Prospect Name */}
        <h2 
          className="text-[32px] mb-[16px]" 
          style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: 'var(--cv-primary-text)' }}
        >
          {prospectData.name}
        </h2>

        {/* Market Tags */}
        <div className="flex gap-[8px] mb-[24px]">
          {prospectData.markets.map((market) => (
            <div
              key={market}
              className="px-[12px] py-[6px] border border-[var(--cv-subtle-border)] rounded-full text-[9px] uppercase tracking-[0.1em]"
              style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)' }}
            >
              {market}
            </div>
          ))}
        </div>

        {/* Upload Notice */}
        <div 
          className="text-[12px] mb-[16px]"
          style={{ fontFamily: 'var(--font-mono)', color: prospectData.allDigitalsUploaded ? '#5d7d5d' : '#c4a05d' }}
        >
          {prospectData.allDigitalsUploaded
            ? t('prospect.allUploadedMsg')
            : t('prospect.notAllUploadedMsg')}
        </div>

        {/* Digital Thumbnails */}
        <div className="grid grid-cols-4 gap-[12px] mb-[24px]">
          {prospectData.digitals.map((digital) => (
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
                <div className="aspect-square bg-[var(--cv-background)] border border-dashed rounded-[4px] flex items-center justify-center" style={{ borderColor: 'var(--cv-subtle-border)' }}>
                  <div 
                    className="text-[7px] uppercase tracking-[0.05em] text-center px-[4px]"
                    style={{ fontFamily: 'var(--font-label)', color: 'var(--cv-secondary-text)', lineHeight: 1.3 }}
                  >
                    {digital.label}<br />{t('review.notUploaded')}
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

        {/* Divider */}
        <div className="h-[1px] bg-[var(--cv-subtle-border)] mb-[24px]" />

        {/* Measurements */}
        <div className="grid grid-cols-2 gap-x-[24px] gap-y-[12px] mb-[24px]">
          {prospectData.measurements.map(({ label, value }) => (
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

        {/* Agent Notes */}
        {prospectData.notes && (
          <div 
            className="text-[13px] mb-[32px] italic"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--cv-secondary-text)' }}
          >
            {prospectData.notes}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-[12px]">
          <button
            onClick={handleSaveDraft}
            className="cv-btn-secondary w-full py-[12px] border border-[var(--cv-subtle-border)] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-colors hover:bg-[var(--cv-elevated)]"
            style={{ 
              fontFamily: 'var(--font-mono)', 
              color: 'var(--cv-primary-text)'
            }}
          >
            {t('prospect.saveAsDraft')}
          </button>
          <button
            onClick={handleSaveAndRender}
            className="cv-btn-primary w-full py-[12px] bg-[var(--cv-primary-text)] rounded-[4px] text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
            style={{ 
              fontFamily: 'var(--font-mono)', 
              color: 'var(--cv-background)'
            }}
          >
            {t('prospect.saveAndRunEvaluation')}
          </button>
          <button
            onClick={() => navigate(`/prospects/new/digitals${window.location.search}`)}
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