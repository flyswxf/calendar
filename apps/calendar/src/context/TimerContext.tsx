import { createContext, useContext, useState } from 'react';
import { Task } from '../types';
import { TimerOverlay } from '../components/Timer/TimerOverlay';

interface TimerContextType {
  isOpen: boolean;
  openTimer: (task?: Task) => void;
  closeTimer: () => void;
  currentTask: Task | null;
}

const TimerContext = createContext<TimerContextType | null>(null);

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) throw new Error('useTimer must be used within TimerProvider');
  return context;
};

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);

  const openTimer = (task?: Task) => {
    setCurrentTask(task || null);
    setIsOpen(true);
  };

  const closeTimer = () => {
    setIsOpen(false);
    setCurrentTask(null);
  };

  return (
    <TimerContext.Provider value={{ isOpen, openTimer, closeTimer, currentTask }}>
      {children}
      {isOpen && <TimerOverlay />}
    </TimerContext.Provider>
  );
};
