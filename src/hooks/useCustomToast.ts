import { useState, useCallback } from 'react';

export type ToastType = 'sucesso' | 'erro' | 'aviso' | 'info';

export interface CustomToast {
  id: number;
  tipo: ToastType;
  mensagem: string;
  show: boolean;
}

export const useCustomToast = () => {
  const [toasts, setToasts] = useState<CustomToast[]>([]);

  const mostrarToast = useCallback((tipo: ToastType, mensagem: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, tipo, mensagem, show: false }]);

    // Trigger animação de entrada
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, show: true } : t));
    }, 10);

    // Auto-remover após 3 segundos
    setTimeout(() => {
      removerToast(id);
    }, 3000);
  }, []);

  const removerToast = useCallback((id: number) => {
    // Primeiro anima a saída (esconde)
    setToasts(prev => prev.map(t => t.id === id ? { ...t, show: false } : t));

    // Depois remove do array (após animação de 300ms)
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300);
  }, []);

  return {
    toasts,
    mostrarToast,
    removerToast
  };
};
