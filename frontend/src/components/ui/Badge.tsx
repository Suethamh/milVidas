import React from 'react';

const variants = {
  success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  danger: 'bg-red-100 text-red-700 border-red-200',
  info: 'bg-blue-100 text-blue-700 border-blue-200',
  warning: 'bg-amber-100 text-amber-700 border-amber-200',
  neutral: 'bg-gray-100 text-gray-600 border-gray-200',
  purple: 'bg-purple-100 text-purple-700 border-purple-200',
  pink: 'bg-pink-100 text-pink-700 border-pink-200',
};

interface BadgeProps {
  variant?: keyof typeof variants;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Badge({ variant = 'neutral', children, className = '', onClick }: BadgeProps) {
  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${onClick ? 'cursor-pointer hover:opacity-80' : ''} ${className}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: keyof typeof variants; label: string }> = {
    LENDO: { variant: 'purple', label: 'Lendo' },
    LIDO: { variant: 'success', label: 'Lido' },
    WISHLIST: { variant: 'pink', label: 'Wishlist' },
    PROXIMA_LEITURA: { variant: 'info', label: 'Próxima' },
    ABANDONADO: { variant: 'danger', label: 'Abandonado' },
  };
  const c = config[status] || { variant: 'neutral' as const, label: status };
  return <Badge variant={c.variant}>{c.label}</Badge>;
}

export function PrioridadeBadge({ prioridade, onClick }: { prioridade: string; onClick?: () => void }) {
  const config: Record<string, { variant: keyof typeof variants; label: string }> = {
    ALTA: { variant: 'danger', label: 'Alta' },
    MEDIA: { variant: 'warning', label: 'Média' },
    BAIXA: { variant: 'info', label: 'Baixa' },
  };
  const c = config[prioridade] || { variant: 'neutral' as const, label: prioridade };
  return <Badge variant={c.variant} onClick={onClick}>{c.label}</Badge>;
}
