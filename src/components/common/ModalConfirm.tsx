import React from 'react';
import { HelpCircle } from 'lucide-react';

interface ModalConfirmProps {
  show: boolean;
  titulo: string;
  mensagem: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ModalConfirm: React.FC<ModalConfirmProps> = ({ show, titulo, mensagem, onConfirm, onCancel }) => {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10002]"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-background rounded-xl p-6 w-[90%] max-w-[450px] shadow-2xl"
      >
        {/* Ícone de pergunta */}
        <div className="text-center mb-5">
          <div
            className="w-15 h-15 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, hsl(38 92% 50%), hsl(38 92% 45%))',
              boxShadow: '0 4px 12px hsl(38 92% 50% / 0.3)'
            }}
          >
            <HelpCircle className="w-7 h-7 text-white" />
          </div>

          <h3 className="text-xl font-bold text-foreground mb-2">
            {titulo}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {mensagem}
          </p>
        </div>

        {/* Botões */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-muted text-foreground border-none rounded-lg text-sm font-semibold cursor-pointer transition-all hover:bg-muted/80"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(217 91% 55%))' }}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirm;
