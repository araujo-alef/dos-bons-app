import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Home from '@/pages/Home';
import Lesson from '@/pages/Lesson';
import HighlightsPage from '@/pages/Highlights';
import UpToDate from '@/pages/UpToDate';
import ComingSoon from '@/pages/ComingSoon';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import { BookTransitionProvider } from '@/context/BookTransitionContext';
import { BookTransitionOverlay } from '@/components/BookTransitionOverlay';
import { AuthProvider } from '@/context/AuthContext';
import { RequireAuth, RequireAuthOnly } from '@/components/ProtectedRoute';
import {
  Route,
  Switch,
  Redirect,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        {/* ── Public routes ── */}
        <Route path="/">
          {() => <RequireAuthOnly><Home /></RequireAuthOnly>}
        </Route>
        <Route path="/jornada">        <Redirect to="/" />        </Route>
        <Route path="/login"           component={Login} />
        <Route path="/cadastro"        component={Register} />
        <Route path="/recuperar-senha" component={ForgotPassword} />
        <Route path="/em-breve/:slug"  component={ComingSoon} />

        {/* ── Protected routes — require Firebase auth ── */}
        <Route path="/jornada/licao/:id">
          {() => <RequireAuth><Lesson /></RequireAuth>}
        </Route>
        <Route path="/jornada/destaques">
          {() => <RequireAuth><HighlightsPage /></RequireAuth>}
        </Route>
        <Route path="/jornada/em-dia">
          {() => <RequireAuth><UpToDate /></RequireAuth>}
        </Route>

        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <BookTransitionProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <Router />
              {/* Overlay must be inside WouterRouter to access useLocation */}
              <BookTransitionOverlay />
            </WouterRouter>
          </BookTransitionProvider>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
