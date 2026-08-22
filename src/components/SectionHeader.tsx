import React from 'react';

interface SectionHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, description, actions }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5"
      style={{ borderBottom: '1px solid rgba(0,224,255,0.10)' }}
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-adcc-textPrimary flex items-center gap-3">
          <span
            className="inline-block w-1 h-6 rounded-full shrink-0"
            style={{ background: 'linear-gradient(180deg, #00E0FF 0%, rgba(0,224,255,0.25) 100%)', boxShadow: '0 0 10px rgba(0,224,255,0.4)' }}
          />
          {title}
        </h1>
        {description && (
          <p className="text-sm text-adcc-textMuted leading-relaxed pl-4">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
};
export default SectionHeader;
