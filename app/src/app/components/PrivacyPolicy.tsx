import React from 'react';
import { Link } from 'react-router';

const sectionStyle = { marginBottom: '40px' } as const;
const h2Style = {
  fontFamily: 'var(--font-mono)',
  fontSize: '13px',
  color: '#F0F0EC',
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  marginBottom: '12px',
};
const bodyStyle = {
  fontFamily: 'var(--font-mono)',
  fontSize: '13px',
  color: '#888880',
  lineHeight: 1.8,
  whiteSpace: 'pre-line' as const,
};

function Section({ id, title, body }: { id?: string; title: string; body: string }) {
  return (
    <div id={id} style={sectionStyle}>
      <h2 style={h2Style}>{title}</h2>
      <p style={bodyStyle}>{body}</p>
    </div>
  );
}

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#080808', padding: '64px 24px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <Link
          to="/"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: '#888880',
            letterSpacing: '0.08em',
            textDecoration: 'none',
            textTransform: 'uppercase',
          }}
        >
          ← Back
        </Link>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '48px',
            fontWeight: 300,
            color: '#F0F0EC',
            margin: '32px 0 8px',
          }}
        >
          Privacy Policy
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: '#888880',
            marginBottom: '24px',
            letterSpacing: '0.05em',
          }}
        >
          Last updated: June 2026 · Founding Agency Pilot
        </p>
        <p style={{ ...bodyStyle, marginBottom: '48px' }}>
          This policy describes how CastView collects, uses, and protects information during our
          founding-agency pilot. It applies to agency account holders. Prospect and model data is
          processed on behalf of your agency — see the{' '}
          <a href="#data-processing-agreement" style={{ color: '#c8c8c2' }}>
            Data Processing Agreement
          </a>{' '}
          below.
        </p>

        <Section
          title="1. Who We Are"
          body={`CastView provides an AI-assisted workflow platform for modeling and talent agencies. For agency account data, CastView is the data controller. For prospect and model personal data uploaded by your agency, your agency is the data controller and CastView acts as a data processor.`}
        />
        <Section
          title="2. Your Data Stays Yours"
          body={`All data you upload (submissions, digitals, development notes, evaluations) is stored under your agency's account and is fully isolated from every other agency using CastView, enforced at the database level (row-level security).

CastView does not sell, share, or license your data, or any model's images or information, to any third party.

We do not use your agency's data to train AI models beyond the evaluation requested at the time you run it.`}
        />
        <Section
          title="3. Information We Collect"
          body={`Agency accounts: name, work email, agency name, authentication credentials, billing status, and settings you configure in the product.

Prospect and model data (uploaded by your agency): photographic digitals, names, biographical details, evaluation results, messages, consent records, and related metadata your team enters.

Usage data: log data, device/browser type, IP address, and product interaction events needed to operate, secure, and improve the service.

Payment data: billing is handled by Stripe. We receive subscription status and customer identifiers, not full card numbers.`}
        />
        <Section
          title="4. How We Use Information"
          body={`We use information to provide and maintain CastView, run AI alignment evaluations, deliver agency-initiated communications, process subscriptions, authenticate users, prevent abuse, and respond to support requests. We do not sell personal information. We do not use your uploaded digitals or evaluations to train public AI models.`}
        />
        <Section
          title="5. AI Processing"
          body={`Evaluations are generated using third-party AI infrastructure (Anthropic's Claude). Image and text inputs are sent to generate structured alignment reports for your agency. Outputs are stored in your agency workspace. We configure these services for service delivery only — not for model training on your content beyond the evaluation requested at the time you run it.`}
        />
        <Section
          title="6. Email"
          body={`We send transactional email (account verification, password reset, billing notices) and agency-initiated messages to prospects or models when your team uses CastView messaging. Email delivery is handled by Resend. Inbound reply-by-email is optional and may not be enabled for all accounts during the pilot.`}
        />
        <Section
          title="7. Storage and Security"
          body={`Data is stored using Supabase on AWS in the United States (us-west-2). Digital images and application data are encrypted in transit (TLS) and at rest. Access is restricted by authentication and row-level security so each agency's data is fully isolated from every other agency on the platform.`}
        />
        <Section
          title="8. Subprocessors"
          body={`We use trusted infrastructure providers to run CastView, including Supabase (database, auth, storage), Anthropic (AI evaluations), Stripe (payments), Resend (email), and Vercel (application hosting). These providers process data only as needed to deliver the service.`}
        />
        <Section
          title="9. Data Deletion"
          body={`You can request deletion of your agency's account and associated data at any time by contacting us at sumith@castview.org, or by using the delete function within the platform.

Deletion requests are processed promptly and remove the associated data from active systems.

Individual prospect or model records may also be deleted by your agency from within CastView at any time.`}
        />
        <Section
          title="10. Retention"
          body={`We retain agency account data while your subscription or pilot access is active and for a reasonable period afterward for billing, legal, and security purposes. Prospect and model data is retained until deleted by your agency from the relevant profile, or until the agency account is deleted.`}
        />
        <Section
          title="11. Cookies"
          body={`We use essential cookies and local storage to maintain your login session and preferences. We do not use advertising or cross-site tracking cookies.`}
        />
        <Section
          title="12. Your Rights"
          body={`Depending on your location, you may have rights to access, correct, delete, or export personal data, or to object to certain processing. Agency users can contact sumith@castview.org for account-related requests. Prospects and models should contact their representing agency first; agencies can delete prospect data directly in CastView.`}
        />
        <Section
          title="13. International Transfers"
          body={`CastView is operated from the United States. If you access the service from outside the US, your information may be processed in the US and in other countries where our subprocessors operate. We take steps designed to protect data in line with this policy.`}
        />
        <Section
          title="14. Children"
          body={`CastView is a business tool for modeling agencies. It is not directed at children under 16. Agencies are responsible for ensuring they have appropriate consent before uploading prospect or model data.`}
        />
        <Section
          title="15. Changes"
          body={`We may update this policy from time to time. We will post the revised version on this page and update the "Last updated" date. Continued use of CastView after changes constitutes acceptance of the updated policy.`}
        />
        <Section
          title="16. Contact"
          body={`Privacy questions, deletion requests, or concerns: sumith@castview.org`}
        />

        <div
          id="data-processing-agreement"
          style={{
            marginTop: '64px',
            paddingTop: '48px',
            borderTop: '1px solid #2a2a2a',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '32px',
              fontWeight: 300,
              color: '#F0F0EC',
              marginBottom: '16px',
            }}
          >
            Data Processing Agreement
          </h2>
          <p style={{ ...bodyStyle, marginBottom: '32px' }}>
            This DPA applies when your agency uploads prospect or model personal data to CastView.
            By using CastView to process such data, your agency agrees to the terms below.
          </p>
          <Section
            title="A. Roles"
            body={`Your agency is the data controller. CastView is the data processor, processing personal data only on your documented instructions as reflected in your use of the product and this agreement.`}
          />
          <Section
            title="B. Subject Matter and Duration"
            body={`Processing covers photographic digitals, evaluation outputs, messages, and related prospect/model records for the duration of your agency's use of CastView and until data is deleted.`}
          />
          <Section
            title="C. Nature and Purpose"
            body={`Storage, organization, AI-assisted analysis, display to authorized agency users, and optional messaging — solely to support internal casting and roster workflows.`}
          />
          <Section
            title="D. Categories of Data"
            body={`Photographic images, names, biographical information, evaluation scores and narratives, communication content, and consent timestamps.`}
          />
          <Section
            title="E. Storage Location"
            body={`Primary storage is in the United States (AWS us-west-2 via Supabase). Subprocessors may process data in other regions as listed in Section 8 above.`}
          />
          <Section
            title="F. Security"
            body={`CastView implements access controls, encryption in transit and at rest, and logical separation between agencies enforced at the database level (row-level security). Agency users are responsible for safeguarding their login credentials.`}
          />
          <Section
            title="G. Deletion"
            body={`Your agency may delete individual prospect data from within CastView at any time. You can request deletion of your agency's account and associated data by contacting sumith@castview.org. Deletion requests are processed promptly and remove the associated data from active systems, subject to legal retention requirements.`}
          />
          <Section
            title="H. Agency Obligations"
            body={`Your agency is responsible for obtaining any consent or legal basis required before uploading prospect or model data, for responding to data subject requests directed to your agency, and for not uploading data you are not authorized to share.`}
          />
          <Section
            title="I. Subprocessors"
            body={`CastView may engage subprocessors listed in Section 8. We will ensure they are bound by obligations consistent with this DPA.`}
          />
          <Section
            title="J. Contact"
            body={`DPA and processor inquiries: sumith@castview.org`}
          />
        </div>

        <p style={{ ...bodyStyle, marginTop: '48px', fontStyle: 'italic', color: '#666660' }}>
          This notice is provided for transparency during CastView's pilot phase and does not
          constitute a binding legal contract in lieu of formal review by counsel as the platform
          scales.
        </p>
      </div>
    </div>
  );
}
