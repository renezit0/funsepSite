import React, { createContext, useContext, ReactNode } from 'react';
import { useCustomToast, ToastType } from '@/hooks/useCustomToast';
import { useModal, ModalFeedbackType } from '@/hooks/useModal';
import ToastContainer from '@/components/common/ToastContainer';
import ModalFeedback from '@/components/common/ModalFeedback';
import ModalConfirm from '@/components/common/ModalConfirm';

interface FeedbackContextType {
  mostrarToast: (tipo: ToastType, mensagem: string) => void;
  mostrarFeedback: (tipo: ModalFeedbackType, titulo: string, mensagem: string) => void;
  mostrarConfirmacao: (titulo: string, mensagem: string, onConfirm: () => void) => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};

interface FeedbackProviderProps {
  children: ReactNode;
}

export const FeedbackProvider: React.FC<FeedbackProviderProps> = ({ children }) => {
  const { toasts, mostrarToast, removerToast } = useCustomToast();
  const {
    modalFeedback,
    mostrarFeedback,
    fecharFeedback,
    modalConfirm,
    mostrarConfirmacao,
    fecharConfirmacao,
    confirmarAcao
  } = useModal();

  return (
    <FeedbackContext.Provider value={{ mostrarToast, mostrarFeedback, mostrarConfirmacao }}>
      {children}
      
      <ToastContainer toasts={toasts} onRemove={removerToast} />
      
      <ModalFeedback
        show={modalFeedback.show}
        tipo={modalFeedback.tipo}
        titulo={modalFeedback.titulo}
        mensagem={modalFeedback.mensagem}
        onClose={fecharFeedback}
      />
      
      <ModalConfirm
        show={modalConfirm.show}
        titulo={modalConfirm.titulo}
        mensagem={modalConfirm.mensagem}
        onConfirm={confirmarAcao}
        onCancel={fecharConfirmacao}
      />
    </FeedbackContext.Provider>
  );
};
