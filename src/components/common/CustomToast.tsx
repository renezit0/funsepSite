import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import type { CustomToast as ToastType } from '@/hooks/useCustomToast';

interface CustomToastProps {
  toast: ToastType;
  onRemove: (id: number) => void;
}

const CustomToast: React.FC<CustomToastProps> = ({ toast, onRemove }) => {
  const getConfig = () => {
    switch (toast.tipo) {
      case 'sucesso':
        return {
          borderColor: 'hsl(var(--success, 142 76% 36%))',
          iconBg: 'hsl(142 76% 36% / 0.1)',
          iconColor: 'hsl(var(--success, 142 76% 36%))',
          Icon: CheckCircle,
          title: 'Sucesso!'
        };
      case 'erro':
        return {
          borderColor: 'hsl(var(--destructive))',
          iconBg: 'hsl(var(--destructive) / 0.1)',
          iconColor: 'hsl(var(--destructive))',
          Icon: XCircle,
          title: 'Erro!'
        };
      case 'aviso':
        return {
          borderColor: 'hsl(38 92% 50%)',
          iconBg: 'hsl(38 92% 50% / 0.1)',
          iconColor: 'hsl(38 92% 50%)',
          Icon: AlertTriangle,
          title: 'Atenção!'
        };
      default:
        return {
          borderColor: 'hsl(var(--primary))',
          iconBg: 'hsl(var(--primary) / 0.1)',
          iconColor: 'hsl(var(--primary))',
          Icon: Info,
          title: 'Informação'
        };
    }
  };

  const config = getConfig();
  const IconComponent = config.Icon;

  return (
    <div
      className="bg-background border border-border rounded-xl shadow-lg flex items-center gap-3 min-w-[300px] max-w-[400px] transition-all duration-300 pointer-events-auto"
      style={{
        padding: '16px 20px',
        transform: toast.show ? 'translateX(0)' : 'translateX(400px)',
        opacity: toast.show ? 1 : 0,
        borderLeftWidth: '4px',
        borderLeftColor: config.borderColor
      }}
    >
      {/* Ícone */}
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: config.iconBg }}
      >
        <IconComponent className="w-3 h-3" style={{ color: config.iconColor }} />
      </div>

      {/* Conteúdo */}
      <div className="flex-1">
        <div className="font-semibold text-sm text-foreground mb-0.5">
          {config.title}
        </div>
        <div className="text-sm text-muted-foreground">
          {toast.mensagem}
        </div>
      </div>

      {/* Botão fechar */}
      <button
        onClick={() => onRemove(toast.id)}
        className="text-muted-foreground hover:text-foreground transition-colors p-1"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default CustomToast;
