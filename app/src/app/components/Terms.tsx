import React from 'react';
import { Link } from 'react-router';

export function Terms() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#080808', padding: '64px 24px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <Link to="/" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#888880', letterSpacing: '0.08em', textDecoration: 'none', textTransform: 'uppercase' }}>
          ← Back
        </Link>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', fontWeight: 300, color: '#F0F0EC', margin: '32px 0 8px' }}>
          Terms of Service
        </h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#888880', marginBottom: '48px', letterSpacing: '0.05em' }}>
          Last updated: June 2026
        </p>
        {[
          {
            title: '1. Acceptance of Terms',
            body: `By creating an account and using CastView, you agree to these Terms of Service. If you do not agree, do not use the service.`
          },
          {
            title: '2. Description of Service',
            body: `CastView is an AI-powered talent evaluation platform for modeling agencies. The service includes prospect management, AI alignment evaluations, roster management, and model communication tools.`
          },
          {
            title: '3. Account Responsibilities',
            body: `You are responsible for maintaining the security of your account credentials. You agree not to share your account with others or use the service for any unlawful purpose.`
          },
          {
            title: '4. Subscription and Payment',
            body: `CastView offers paid subscription plans billed monthly. All plans include a 14-day free trial. After the trial, a valid payment method is required to continue using the service. You may cancel at any time and will retain access through the end of your billing period.`
          },
          {
            title: '5. Refund Policy',
            body: `We offer a full refund within 7 days of your first charge if you are not satisfied. Contact hello@castview.org to request a refund.`
          },
          {
            title: '6. Content and Data',
            body: `You retain ownership of all content you upload to CastView, including digital images and prospect data. You grant CastView a limited license to process this content solely for the purpose of providing the service.`
          },
          {
            title: '7. AI Evaluations',
            body: `CastView's AI evaluations are provided as guidance tools only. They do not constitute professional talent advice. Booking and signing decisions remain solely at the discretion of your agency.`
          },
          {
            title: '8. Termination',
            body: `We reserve the right to suspend or terminate accounts that violate these terms. You may cancel your account at any time from the Settings page.`
          },
          {
            title: '9. Limitation of Liability',
            body: `CastView is provided "as is." We are not liable for any indirect, incidental, or consequential damages arising from use of the service.`
          },
          {
            title: '10. Contact',
            body: `For questions about these terms, contact us at hello@castview.org.`
          },
        ].map(({ title, body }) => (
          <div key={title} style={{ marginBottom: '40px' }}>
            <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#F0F0EC', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
              {title}
            </h2>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#888880', lineHeight: 1.8 }}>
              {body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
