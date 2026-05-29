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
import { CompareResults } from './components/CompareResults';
import { UploadDigitalSet } from './components/UploadDigitalSet';
import { ClientLayout } from './components/ClientLayout';
import { ClientPortal } from './components/ClientPortal';
import { OnboardingAgencySetup } from './components/OnboardingAgencySetup';
import { OnboardingInviteTeam } from './components/OnboardingInviteTeam';
import { OnboardingFirstProspect } from './components/OnboardingFirstProspect';
import { Notifications } from './components/Notifications';
import { AuthLayout } from './layouts/AuthLayout';
import { Login } from './components/Login';
import { useAuth } from './context/AuthContext';
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#080808',
      fontFamily: 'var(--font-mono)',
      fontSize: '11px',
      color: '#888880'
    }}>
      Loading...
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout>
        <Dashboard />
      </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <Layout>
        <Profile />
      </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/rendering',
    element: (
      <ProtectedRoute>
        <Layout>
        <Rendering />
      </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/results',
    element: (
      <ProtectedRoute>
        <Layout>
        <Results />
      </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/share',
    element: (
      <ProtectedRoute>
        <Layout>
        <Share />
      </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/mass-send',
    element: (
      <ProtectedRoute>
        <Layout>
        <MassSend />
      </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/roster',
    element: (
      <ProtectedRoute>
        <Layout>
        <Roster />
      </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/roster/new',
    element: (
      <ProtectedRoute>
        <Layout>
        <NewModelBasicInfo />
      </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/roster/new/digitals',
    element: (
      <ProtectedRoute>
        <Layout>
        <NewModelDigitals />
      </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/roster/new/review',
    element: (
      <ProtectedRoute>
        <Layout>
        <NewModelReview />
      </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/roster/:modelId',
    element: (
      <ProtectedRoute>
        <Layout>
        <ProspectRenderHistory profileType="model" />
      </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/roster/:modelId/history',
    element: (
      <ProtectedRoute>
        <Layout>
        <ProspectRenderHistory profileType="model" />
      </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/prospects',
    element: (
      <ProtectedRoute>
        <Layout>
        <ProspectsIndex />
      </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/prospects/new',
    element: (
      <ProtectedRoute>
        <Layout>
        <NewProspectBasicInfo />
      </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/prospects/new/consent',
    element: (
      <ProtectedRoute>
        <AuthLayout>
        <ProspectConsent />
      </AuthLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/prospects/new/digitals',
    element: (
      <ProtectedRoute>
        <Layout>
        <NewProspectDigitals />
      </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/prospects/new/review',
    element: (
      <ProtectedRoute>
        <Layout>
        <NewProspectReview />
      </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/compare',
    element: (
      <ProtectedRoute>
        <Layout>
        <CompareMode />
      </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/compare/results',
    element: (
      <ProtectedRoute>
        <Layout>
        <CompareResults />
      </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/prospects/:prospectId',
    element: (
      <ProtectedRoute>
        <Layout>
        <ProspectRenderHistory profileType="prospect" />
      </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/prospects/:prospectId/upload-digitals',
    element: (
      <ProtectedRoute>
        <Layout>
        <UploadDigitalSet />
      </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/roster/:prospectId/upload-digitals',
    element: (
      <ProtectedRoute>
        <Layout>
        <UploadDigitalSet />
      </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings',
    element: (
      <ProtectedRoute>
        <Layout>
        <Settings />
      </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/render-lab',
    element: (
      <ProtectedRoute>
        <Layout>
        <RenderLab />
      </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/notifications',
    element: (
      <ProtectedRoute>
        <Layout>
        <Notifications />
      </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/client-portal',
    element: (
      <ProtectedRoute>
        <ClientLayout>
        <ClientPortal />
      </ClientLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/onboarding',
    element: (
      <ProtectedRoute>
        <Layout>
        <OnboardingAgencySetup />
      </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/onboarding/invite',
    element: (
      <ProtectedRoute>
        <Layout>
        <OnboardingInviteTeam />
      </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/onboarding/first-prospect',
    element: (
      <ProtectedRoute>
        <Layout>
        <OnboardingFirstProspect />
      </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '*',
    element: (
      <ProtectedRoute>
        <Navigate to="/" replace />
      </ProtectedRoute>
    ),
  },
]);