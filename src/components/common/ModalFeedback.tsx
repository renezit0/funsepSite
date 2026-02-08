import React from 'react';
import { Check, X, AlertTriangle, Info } from 'lucide-react';
import type { ModalFeedbackType } from '@/hooks/useModal';

interface ModalFeedbackProps {
  show: boolean;
  tipo: ModalFeedbackType;
  titulo: string;
  mensagem: string;
  onClose: () => void;
}

const ModalFeedback: React.FC<ModalFeedbackProps> = ({ show, tipo, titulo, mensagem, onClose }) => {
  if (!show) return null;

  const getIconConfig = () => {
    switch (tipo) {
      case 'sucesso':
        return {
          Icon: Check,
          gradient: 'linear-gradient(135deg, hsl(142 76% 36%), hsl(142 76% 30%))',
          shadow: '0 4px 12px hsl(142 76% 36% / 0.3)',
          buttonBg: 'hsl(142 76% 36%)'
        };
      case 'erro':
        return {
          Icon: X,
          gradient: 'linear-gradient(135deg, hsl(var(--destructive)), hsl(0 84% 55%))',
          shadow: '0 4px 12px hsl(var(--destructive) / 0.3)',
          buttonBg: 'hsl(var(--destructive))'
        };
      case 'aviso':
        return {
          Icon: AlertTriangle,
          gradient: 'linear-gradient(135deg, hsl(38 92% 50%), hsl(38 92% 45%))',
          shadow: '0 4px 12px hsl(38 92% 50% / 0.3)',
          buttonBg: 'hsl(38 92% 50%)'
        };
      default:
        return {
          Icon: Info,
          gradient: 'linear-gradient(135deg, hsl(var(--primary)), hsl(217 91% 55%))',
          shadow: '0 4px 12px hsl(var(--primary) / 0.3)',
          buttonBg: 'hsl(var(--primary))'
        };
    }
  };

  const config = getIconConfig();
  const IconComponent = config.Icon;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10001]"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-background rounded-xl p-6 w-[90%] max-w-[450px] shadow-2xl"
      >
        {/* Header com ícone */}
        <div className="text-center mb-5">
          <div
            className="w-15 h-15 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{
              width: '60px',
              height: '60px',
              background: config.gradient,
              boxShadow: config.shadow
            }}
          >
            <IconComponent className="w-7 h-7 text-white" />
          </div>

          <h3 className="text-xl font-bold text-foreground mb-2">
            {titulo}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {mensagem}
          </p>
        </div>

        {/* Botão */}
        <button
          onClick={onClose}
          className="w-full py-3 text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-all hover:opacity-90"
          style={{ background: config.buttonBg }}
        >
          Entendi
        </button>
      </div>
    </div>
  );
};

export default ModalFeedback;
