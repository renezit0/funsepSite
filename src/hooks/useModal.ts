import { useState, useCallback } from 'react';

export type ModalFeedbackType = 'sucesso' | 'erro' | 'aviso' | 'info';

export interface ModalFeedbackState {
  show: boolean;
  tipo: ModalFeedbackType;
  titulo: string;
  mensagem: string;
}

export interface ModalConfirmState {
  show: boolean;
  titulo: string;
  mensagem: string;
  onConfirm: (() => void) | null;
}

export const useModal = () => {
  const [modalFeedback, setModalFeedback] = useState<ModalFeedbackState>({
    show: false,
    tipo: 'info',
    titulo: '',
    mensagem: ''
  });

  const [modalConfirm, setModalConfirm] = useState<ModalConfirmState>({
    show: false,
    titulo: '',
    mensagem: '',
    onConfirm: null
  });

  const mostrarFeedback = useCallback((tipo: ModalFeedbackType, titulo: string, mensagem: string) => {
    setModalFeedback({ show: true, tipo, titulo, mensagem });
  }, []);

  const fecharFeedback = useCallback(() => {
    setModalFeedback({ show: false, tipo: 'info', titulo: '', mensagem: '' });
  }, []);

  const mostrarConfirmacao = useCallback((titulo: string, mensagem: string, onConfirm: () => void) => {
    setModalConfirm({ show: true, titulo, mensagem, onConfirm });
  }, []);

  const fecharConfirmacao = useCallback(() => {
    setModalConfirm({ show: false, titulo: '', mensagem: '', onConfirm: null });
  }, []);

  const confirmarAcao = useCallback(() => {
    if (modalConfirm.onConfirm) {
      modalConfirm.onConfirm();
    }
    fecharConfirmacao();
  }, [modalConfirm.onConfirm, fecharConfirmacao]);

  return {
    modalFeedback,
    mostrarFeedback,
    fecharFeedback,
    modalConfirm,
    mostrarConfirmacao,
    fecharConfirmacao,
    confirmarAcao
  };
};
