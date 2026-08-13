import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export interface TransitionState {
  targetPath: string;
  bookRect: DOMRect;
}

interface BookTransitionContextValue {
  transition: TransitionState | null;
  isTransitioning: boolean;
  startTransition: (targetPath: string, bookRect: DOMRect) => void;
  clearTransition: () => void;
}

const BookTransitionContext = createContext<BookTransitionContextValue | null>(null);

export function BookTransitionProvider({ children }: { children: ReactNode }) {
  const [transition, setTransition] = useState<TransitionState | null>(null);

  const startTransition = useCallback((targetPath: string, bookRect: DOMRect) => {
    setTransition({ targetPath, bookRect });
  }, []);

  const clearTransition = useCallback(() => {
    setTransition(null);
  }, []);

  return (
    <BookTransitionContext.Provider
      value={{
        transition,
        isTransitioning: transition !== null,
        startTransition,
        clearTransition,
      }}
    >
      {children}
    </BookTransitionContext.Provider>
  );
}

export function useBookTransition() {
  const ctx = useContext(BookTransitionContext);
  if (!ctx) throw new Error('useBookTransition must be used inside BookTransitionProvider');
  return ctx;
}
