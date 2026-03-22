import React, { useState } from 'react';
import { TimerContext } from './TimerContext';
import { TimerOverlay } from '../components/Timer/TimerOverlay';
import { Task } from '../types';

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
