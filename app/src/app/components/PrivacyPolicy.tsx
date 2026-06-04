import React from 'react';
import { Link } from 'react-router';

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#080808', padding: '64px 24px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <Link to="/" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#888880', letterSpacing: '0.08em', textDecoration: 'none', textTransform: 'uppercase' }}>
          ← Back
        </Link>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', fontWeight: 300, color: '#F0F0EC', margin: '32px 0 8px' }}>
          Privacy Policy
        </h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#888880', marginBottom: '48px', letterSpacing: '0.05em' }}>
          Last updated: June 2026
        </p>
        {[
          {
            title: '1. Information We Collect',
            body: `We collect information you provide directly to us when creating an account, including your name, email address, agency name, and payment information. We also collect the digital images and evaluation data you upload to our platform.`
          },
          {
            title: '2. How We Use Your Information',
            body: `We use the information we collect to provide, maintain, and improve our services, process transactions, send transactional emails, and communicate with you about your account. We do not sell your personal information to third parties.`
          },
          {
            title: '3. Data Storage',
            body: `Your data is stored securely using Supabase infrastructure hosted on AWS. Digital images are stored in secure cloud storage. We retain your data for as long as your account is active or as needed to provide services.`
          },
          {
            title: '4. Model Digitals and Evaluation Data',
            body: `Digital images uploaded to CastView are used solely for the purpose of running AI evaluations. We do not use these images for training AI models, advertising, or any purpose other than generating alignment reports for your agency.`
          },
          {
            title: '5. Payments',
            body: `Payment processing is handled by Stripe. We do not store your full credit card details. Stripe's privacy policy governs the handling of your payment information.`
          },
          {
            title: '6. Cookies',
            body: `We use essential cookies to maintain your login session. We do not use tracking or advertising cookies.`
          },
          {
            title: '7. Your Rights',
            body: `You may request deletion of your account and associated data at any time by contacting us at hello@castview.org. We will process deletion requests within 30 days.`
          },
          {
            title: '8. Contact',
            body: `For privacy-related questions, contact us at hello@castview.org.`
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
