'use client';

import { useEffect, useState } from 'react';

interface InlineErrorProps {
  message: string;
  onClose?: () => void;
}

export const InlineError = ({ message, onClose }: InlineErrorProps) => {
  const [visible, setVisible] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      setIsClosing(false);
      const timer = setTimeout(() => {
        setIsClosing(true);
        setTimeout(() => {
          setVisible(false);
          onClose?.();
        }, 300); // Wait for fade animation
      }, 10000); // 10 seconds
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message || !visible) return null;

  return (
    <div className={`bg-red-500/10 border border-red-500/30 rounded-lg p-4 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
      <p className="text-sm text-red-300">{message}</p>
    </div>
  );
};
