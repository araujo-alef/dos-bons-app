import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Home from '@/pages/Home';
import Chapter from '@/pages/Chapter';
import UpToDate from '@/pages/UpToDate';
import ComingSoon from '@/pages/ComingSoon';
import { BookTransitionProvider } from '@/context/BookTransitionContext';
import { BookTransitionOverlay } from '@/components/BookTransitionOverlay';
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
        <Route path="/" component={Home} />
        <Route path="/jornada"><Redirect to="/" /></Route>
        <Route path="/jornada/capitulo/:id" component={Chapter} />
        <Route path="/jornada/em-dia" component={UpToDate} />
        <Route path="/em-breve/:slug" component={ComingSoon} />
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
    </QueryClientProvider>
  );
}

export default App;
