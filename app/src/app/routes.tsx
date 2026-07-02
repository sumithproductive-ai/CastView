import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { Layout } from './layouts/Layout';
import { Login } from './components/Login';
import { Signup } from './components/Signup';
import { ResetPassword } from './components/ResetPassword';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { Terms } from './components/Terms';
import { useAuth } from './context/AuthContext';

const Dashboard = lazy(() =>
  import('./components/Dashboard').then((m) => ({ default: m.Dashboard })),
);
const Profile = lazy(() =>
  import('./components/Profile').then((m) => ({ default: m.Profile })),
);
const Rendering = lazy(() =>
  import('./components/Rendering').then((m) => ({ default: m.Rendering })),
);
const Results = lazy(() =>
  import('./components/Results').then((m) => ({ default: m.Results })),
);
const Roster = lazy(() =>
  import('./components/Roster').then((m) => ({ default: m.Roster })),
);
const ProspectsIndex = lazy(() =>
  import('./components/ProspectsIndex').then((m) => ({ default: m.ProspectsIndex })),
);
const ProspectRenderHistory = lazy(() =>
  import('./components/ProspectRenderHistory').then((m) => ({
    default: m.ProspectRenderHistory,
  })),
);
const Settings = lazy(() =>
  import('./components/Settings').then((m) => ({ default: m.Settings })),
);
const NewProspectBasicInfo = lazy(() =>
  import('./components/NewProspectBasicInfo').then((m) => ({
    default: m.NewProspectBasicInfo,
  })),
);
const NewProspectDigitals = lazy(() =>
  import('./components/NewProspectDigitals').then((m) => ({
    default: m.NewProspectDigitals,
  })),
);
const NewProspectReview = lazy(() =>
  import('./components/NewProspectReview').then((m) => ({
    default: m.NewProspectReview,
  })),
);
const NewModelBasicInfo = lazy(() =>
  import('./components/NewModelBasicInfo').then((m) => ({
    default: m.NewModelBasicInfo,
  })),
);
const NewModelDigitals = lazy(() =>
  import('./components/NewModelDigitals').then((m) => ({
    default: m.NewModelDigitals,
  })),
);
const NewModelReview = lazy(() =>
  import('./components/NewModelReview').then((m) => ({
    default: m.NewModelReview,
  })),
);
const ProspectConsent = lazy(() =>
  import('./components/ProspectConsent').then((m) => ({
    default: m.ProspectConsent,
  })),
);
const CompareMode = lazy(() =>
  import('./components/CompareMode').then((m) => ({ default: m.CompareMode })),
);
const CompareResults = lazy(() =>
  import('./components/CompareResults').then((m) => ({ default: m.CompareResults })),
);
const UploadDigitalSet = lazy(() =>
  import('./components/UploadDigitalSet').then((m) => ({
    default: m.UploadDigitalSet,
  })),
);
const ClientLayout = lazy(() =>
  import('./components/ClientLayout').then((m) => ({ default: m.ClientLayout })),
);
const ClientPortal = lazy(() =>
  import('./components/ClientPortal').then((m) => ({ default: m.ClientPortal })),
);
const OnboardingAgencySetup = lazy(() =>
  import('./components/OnboardingAgencySetup').then((m) => ({
    default: m.OnboardingAgencySetup,
  })),
);
const OnboardingFirstProspect = lazy(() =>
  import('./components/OnboardingFirstProspect').then((m) => ({
    default: m.OnboardingFirstProspect,
  })),
);
const Notifications = lazy(() =>
  import('./components/Notifications').then((m) => ({ default: m.Notifications })),
);
const AdminRequests = lazy(() =>
  import('./components/AdminRequests').then((m) => ({ default: m.AdminRequests })),
);
const AuthLayout = lazy(() =>
  import('./layouts/AuthLayout').then((m) => ({ default: m.AuthLayout })),
);

function RouteLoadingFallback() {
  return (
    <div
      className="castview-fadein"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--cv-background)',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        color: 'var(--cv-secondary-text)',
      }}
    >
      Loading...
    </div>
  );
}

function LazySuspense({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<RouteLoadingFallback />}>{children}</Suspense>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, session, loading } = useAuth();
  if (loading) return <RouteLoadingFallback />;
  if (!user || !session?.access_token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function ProtectedLayoutRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <LazySuspense>
        <Layout>{children}</Layout>
      </LazySuspense>
    </ProtectedRoute>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedLayoutRoute>
        <Dashboard />
      </ProtectedLayoutRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <ProtectedLayoutRoute>
        <Profile />
      </ProtectedLayoutRoute>
    ),
  },
  {
    path: '/rendering',
    element: (
      <ProtectedLayoutRoute>
        <Rendering />
      </ProtectedLayoutRoute>
    ),
  },
  {
    path: '/results',
    element: (
      <ProtectedLayoutRoute>
        <Results />
      </ProtectedLayoutRoute>
    ),
  },
  {
    path: '/roster',
    element: (
      <ProtectedLayoutRoute>
        <Roster />
      </ProtectedLayoutRoute>
    ),
  },
  {
    path: '/roster/new',
    element: (
      <ProtectedLayoutRoute>
        <NewModelBasicInfo />
      </ProtectedLayoutRoute>
    ),
  },
  {
    path: '/roster/new/digitals',
    element: (
      <ProtectedLayoutRoute>
        <NewModelDigitals />
      </ProtectedLayoutRoute>
    ),
  },
  {
    path: '/roster/new/review',
    element: (
      <ProtectedLayoutRoute>
        <NewModelReview />
      </ProtectedLayoutRoute>
    ),
  },
  {
    path: '/roster/:modelId',
    element: (
      <ProtectedLayoutRoute>
        <ProspectRenderHistory profileType="model" />
      </ProtectedLayoutRoute>
    ),
  },
  {
    path: '/prospects',
    element: (
      <ProtectedLayoutRoute>
        <ProspectsIndex />
      </ProtectedLayoutRoute>
    ),
  },
  {
    path: '/prospects/new',
    element: (
      <ProtectedLayoutRoute>
        <NewProspectBasicInfo />
      </ProtectedLayoutRoute>
    ),
  },
  {
    path: '/prospects/new/consent',
    element: (
      <ProtectedRoute>
        <LazySuspense>
          <AuthLayout>
            <ProspectConsent />
          </AuthLayout>
        </LazySuspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/prospects/new/digitals',
    element: (
      <ProtectedLayoutRoute>
        <NewProspectDigitals />
      </ProtectedLayoutRoute>
    ),
  },
  {
    path: '/prospects/new/review',
    element: (
      <ProtectedLayoutRoute>
        <NewProspectReview />
      </ProtectedLayoutRoute>
    ),
  },
  {
    path: '/compare',
    element: (
      <ProtectedLayoutRoute>
        <CompareMode />
      </ProtectedLayoutRoute>
    ),
  },
  {
    path: '/compare/results',
    element: (
      <ProtectedLayoutRoute>
        <CompareResults />
      </ProtectedLayoutRoute>
    ),
  },
  {
    path: '/prospects/:prospectId',
    element: (
      <ProtectedLayoutRoute>
        <ProspectRenderHistory profileType="prospect" />
      </ProtectedLayoutRoute>
    ),
  },
  {
    path: '/prospects/:prospectId/draft',
    element: (
      <ProtectedLayoutRoute>
        <ProspectRenderHistory profileType="prospect" />
      </ProtectedLayoutRoute>
    ),
  },
  {
    path: '/prospects/:prospectId/upload-digitals',
    element: (
      <ProtectedLayoutRoute>
        <UploadDigitalSet />
      </ProtectedLayoutRoute>
    ),
  },
  {
    path: '/roster/:prospectId/upload-digitals',
    element: (
      <ProtectedLayoutRoute>
        <UploadDigitalSet />
      </ProtectedLayoutRoute>
    ),
  },
  {
    path: '/settings',
    element: (
      <ProtectedLayoutRoute>
        <Settings />
      </ProtectedLayoutRoute>
    ),
  },
  {
    path: '/admin/requests',
    element: (
      <ProtectedLayoutRoute>
        <AdminRequests />
      </ProtectedLayoutRoute>
    ),
  },
  {
    path: '/notifications',
    element: (
      <ProtectedLayoutRoute>
        <Notifications />
      </ProtectedLayoutRoute>
    ),
  },
  {
    path: '/client-portal',
    element: (
      <ProtectedRoute>
        <LazySuspense>
          <ClientLayout>
            <ClientPortal />
          </ClientLayout>
        </LazySuspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/onboarding',
    element: (
      <ProtectedLayoutRoute>
        <OnboardingAgencySetup />
      </ProtectedLayoutRoute>
    ),
  },
  {
    path: '/onboarding/first-prospect',
    element: (
      <ProtectedLayoutRoute>
        <OnboardingFirstProspect />
      </ProtectedLayoutRoute>
    ),
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/signup',
    element: <Signup />,
  },
  {
    path: '/reset-password',
    element: <ResetPassword />,
  },
  {
    path: '/privacy',
    element: <PrivacyPolicy />,
  },
  {
    path: '/terms',
    element: <Terms />,
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
