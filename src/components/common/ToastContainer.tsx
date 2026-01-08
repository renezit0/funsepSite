import React from 'react';
import CustomToast from './CustomToast';
import type { CustomToast as ToastType } from '@/hooks/useCustomToast';

interface ToastContainerProps {
  toasts: ToastType[];
  onRemove: (id: number) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div
      className="fixed top-5 right-5 z-[999999] flex flex-col gap-2.5 pointer-events-none"
    >
      {toasts.map((toast) => (
        <CustomToast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

export default ToastContainer;
