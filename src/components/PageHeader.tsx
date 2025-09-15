import { PropsWithChildren } from 'react';

type PageHeaderProps = {
  title: string;
  icon: string;
  accentFrom?: string;
  accentVia?: string;
  accentTo?: string;
  right?: React.ReactNode;
};

export default function PageHeader({ title, icon, accentFrom = 'from-yellow-300', accentVia = 'via-amber-300', accentTo = 'to-orange-400', right }: PropsWithChildren<PageHeaderProps>) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-yellow-400 to-amber-400 flex items-center justify-center text-lg sm:text-xl shrink-0">
          {icon}
        </div>
        <h1 className={`text-display text-2xl sm:text-3xl truncate bg-gradient-to-r ${accentFrom} ${accentVia} ${accentTo} bg-clip-text text-transparent`}>
          {title}
        </h1>
      </div>
      {right ? (
        <div className="w-full sm:w-auto">
          {right}
        </div>
      ) : null}
    </div>
  );
}


