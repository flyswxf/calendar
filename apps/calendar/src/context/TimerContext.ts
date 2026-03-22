import { createContext, useContext } from 'react';
import { Task } from '../types';

interface TimerContextType {
  isOpen: boolean;
  openTimer: (task?: Task) => void;
  closeTimer: () => void;
  currentTask: Task | null;
}

export const TimerContext = createContext<TimerContextType | null>(null);

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) throw new Error('useTimer must be used within TimerProvider');
  return context;
};
