import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { ProgressBar } from './components/ProgressBar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Profile } from './components/Profile';
import { Rendering } from './components/Rendering';
import { Results } from './components/Results';
import { Share } from './components/Share';
import { MassSend } from './components/MassSend';
import { Roster } from './components/Roster';
import { ProspectsIndex } from './components/ProspectsIndex';
import { ProspectRenderHistory } from './components/ProspectRenderHistory';
import { Settings } from './components/Settings';
import { RenderLab } from './components/RenderLab';
import { NewProspectBasicInfo } from './components/NewProspectBasicInfo';
import { NewProspectDigitals } from './components/NewProspectDigitals';
import { NewProspectReview } from './components/NewProspectReview';
import { NewModelBasicInfo } from './components/NewModelBasicInfo';
import { NewModelDigitals } from './components/NewModelDigitals';
import { NewModelReview } from './components/NewModelReview';
import { ProspectConsent } from './components/ProspectConsent';
import { CompareMode } from './components/CompareMode';
import { ClientLayout } from './components/ClientLayout';
import { ClientPortal } from './components/ClientPortal';
import { OnboardingAgencySetup } from './components/OnboardingAgencySetup';
import { OnboardingInviteTeam } from './components/OnboardingInviteTeam';
import { OnboardingFirstProspect } from './components/OnboardingFirstProspect';
import { Notifications } from './components/Notifications';
import { AuthLayout } from './layouts/AuthLayout';
import { Login } from './components/Login';
import { TutorialOverlay } from './components/TutorialOverlay';
import { useTutorial } from './context/TutorialContext';

function Layout({ children }: { children: React.ReactNode }) {
  const { isTutorialOpen, closeTutorial } = useTutorial();

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#080808', fontFamily: 'var(--font-mono)' }}>
      <ProgressBar />
      <div className="flex flex-1 items-stretch">
        <Sidebar />
        <main className="flex-1 pb-[64px] md:pb-0">
          {children}
        </main>
      </div>
      {isTutorialOpen && <TutorialOverlay onClose={closeTutorial} />}
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Layout>
        <Dashboard />
      </Layout>
    ),
  },
  {
    path: '/profile',
    element: (
      <Layout>
        <Profile />
      </Layout>
    ),
  },
  {
    path: '/rendering',
    element: (
      <Layout>
        <Rendering />
      </Layout>
    ),
  },
  {
    path: '/results',
    element: (
      <Layout>
        <Results />
      </Layout>
    ),
  },
  {
    path: '/share',
    element: (
      <Layout>
        <Share />
      </Layout>
    ),
  },
  {
    path: '/mass-send',
    element: (
      <Layout>
        <MassSend />
      </Layout>
    ),
  },
  {
    path: '/roster',
    element: (
      <Layout>
        <Roster />
      </Layout>
    ),
  },
  {
    path: '/roster/new',
    element: (
      <Layout>
        <NewModelBasicInfo />
      </Layout>
    ),
  },
  {
    path: '/roster/new/digitals',
    element: (
      <Layout>
        <NewModelDigitals />
      </Layout>
    ),
  },
  {
    path: '/roster/new/review',
    element: (
      <Layout>
        <NewModelReview />
      </Layout>
    ),
  },
  {
    path: '/roster/:modelId',
    element: (
      <Layout>
        <ProspectRenderHistory profileType="model" />
      </Layout>
    ),
  },
  {
    path: '/roster/:modelId/history',
    element: (
      <Layout>
        <ProspectRenderHistory profileType="model" />
      </Layout>
    ),
  },
  {
    path: '/prospects',
    element: (
      <Layout>
        <ProspectsIndex />
      </Layout>
    ),
  },
  {
    path: '/prospects/new',
    element: (
      <Layout>
        <NewProspectBasicInfo />
      </Layout>
    ),
  },
  {
    path: '/prospects/new/consent',
    element: (
      <AuthLayout>
        <ProspectConsent />
      </AuthLayout>
    ),
  },
  {
    path: '/prospects/new/digitals',
    element: (
      <Layout>
        <NewProspectDigitals />
      </Layout>
    ),
  },
  {
    path: '/prospects/new/review',
    element: (
      <Layout>
        <NewProspectReview />
      </Layout>
    ),
  },
  {
    path: '/compare',
    element: (
      <Layout>
        <CompareMode />
      </Layout>
    ),
  },
  {
    path: '/prospects/:prospectId',
    element: (
      <Layout>
        <ProspectRenderHistory profileType="prospect" />
      </Layout>
    ),
  },
  {
    path: '/settings',
    element: (
      <Layout>
        <Settings />
      </Layout>
    ),
  },
  {
    path: '/render-lab',
    element: (
      <Layout>
        <RenderLab />
      </Layout>
    ),
  },
  {
    path: '/notifications',
    element: (
      <Layout>
        <Notifications />
      </Layout>
    ),
  },
  {
    path: '/client-portal',
    element: (
      <ClientLayout>
        <ClientPortal />
      </ClientLayout>
    ),
  },
  {
    path: '/onboarding',
    element: (
      <Layout>
        <OnboardingAgencySetup />
      </Layout>
    ),
  },
  {
    path: '/onboarding/invite',
    element: (
      <Layout>
        <OnboardingInviteTeam />
      </Layout>
    ),
  },
  {
    path: '/onboarding/first-prospect',
    element: (
      <Layout>
        <OnboardingFirstProspect />
      </Layout>
    ),
  },
  {
    path: '/login',
    element: (
      <AuthLayout>
        <Login />
      </AuthLayout>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);