import React from 'react';
import { Link } from 'react-router';

export function Terms() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--cv-background)', padding: '64px 24px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <Link to="/" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--cv-secondary-text)', letterSpacing: '0.08em', textDecoration: 'none', textTransform: 'uppercase' }}>
          ← Back
        </Link>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', fontWeight: 300, color: 'var(--cv-primary-text)', margin: '32px 0 8px' }}>
          Terms of Use
        </h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--cv-secondary-text)', marginBottom: '48px', letterSpacing: '0.05em' }}>
          Last updated: June 2026 · Founding Agency Pilot
        </p>
        {[
          {
            title: '1. What CastView Is',
            body: `CastView is an AI-assisted workflow platform for modeling and talent agencies, currently in a free founding-agency pilot. By using CastView, you ("the Agency") agree to the terms below.`,
          },
          {
            title: '2. AI Evaluations',
            body: `Evaluations are generated using a third-party AI model (Anthropic's Claude) based on the images and information you provide.

Evaluations are a decision-support tool, not a guarantee of market outcome, booking success, or industry placement. Final judgment is yours.`,
          },
          {
            title: '3. Founding Pilot Terms',
            body: `Access during the pilot period is provided free of charge for 45 days from the date your agency account is activated.

After the 45-day pilot, your agency will move to founder-locked pricing on the plan tier discussed with you (Solo $49/mo, Studio $99/mo, or Boutique Team $149/mo) unless you choose to opt out — we'll reach out before the pilot ends so there are no surprises, and confirm your locked rate at that time.

Because this is an active pilot, features may change, and you may encounter bugs. We'll fix issues as quickly as possible and welcome you flagging them.`,
          },
          {
            title: '4. No Warranty / Limitation of Liability',
            body: `CastView is provided "as is" during this pilot phase, without warranty of any kind, express or implied.

CastView and its founder are not liable for any indirect, incidental, or consequential damages arising from use of the platform, including but not limited to data loss, missed opportunities, or business decisions made based on AI evaluation output.`,
          },
          {
            title: '5. Models Whose Images Are Uploaded',
            body: `The Agency confirms it has the right to upload and store the images and information of any model or prospect entered into CastView, and is responsible for obtaining any necessary consent from that individual.`,
          },
          {
            title: '6. Contact',
            body: `Questions, deletion requests, or concerns: sumith@castview.org`,
          },
        ].map(({ title, body }) => (
          <div key={title} style={{ marginBottom: '40px' }}>
            <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--cv-primary-text)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
              {title}
            </h2>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--cv-secondary-text)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
              {body}
            </p>
          </div>
        ))}
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--cv-secondary-text)', lineHeight: 1.8, marginTop: '16px', fontStyle: 'italic' }}>
          This notice is provided for transparency during CastView's pilot phase and does not constitute a binding legal contract in lieu of formal review by counsel as the platform scales.
        </p>
      </div>
    </div>
  );
}
