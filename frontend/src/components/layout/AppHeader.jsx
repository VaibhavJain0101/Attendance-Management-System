import { useEffect, useMemo, useState } from 'react';
import { Bell, Clock3, Menu, Search } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

const roleBadgeVariant = {
  employee: 'default',
  manager: 'info',
  admin: 'warning'
};

const AppHeader = ({ user, onMenuClick }) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const dayText = useMemo(
    () =>
      now.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
    [now]
  );

  const timeText = useMemo(
    () =>
      now.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
      }),
    [now]
  );

  const initials =
    user?.name
      ?.split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join('') || 'U';

  return (
    <header className="sticky top-0 z-30 mb-5 rounded-3xl border border-white/80 bg-white/80 px-4 py-3 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.55)] backdrop-blur-xl sm:px-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" size="icon" className="md:hidden" onClick={onMenuClick} aria-label="Open menu">
          <Menu size={18} />
        </Button>
           <div className='text-4xl'>Welcome {user?.name || 'User'}</div>
    

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-600 lg:flex">
            <Clock3 size={15} className="text-emerald-600" />
            <span>{dayText}</span>
            <span className="text-slate-400">|</span>
            <span className="font-semibold text-slate-800">{timeText}</span>
          </div>

         

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-2 py-1.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 text-xs font-bold text-white">
              {initials}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-slate-800">{user?.name || 'User'}</p>
            </div>
            <Badge variant={roleBadgeVariant[String(user?.role || '').toLowerCase()] || 'neutral'}>
              {String(user?.role || '').toUpperCase() || '-'}
            </Badge>
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-600 lg:hidden">
        <Clock3 size={15} className="text-emerald-600" />
        <span>{dayText}</span>
        <span className="text-slate-400">|</span>
        <span className="font-semibold text-slate-800">{timeText}</span>
      </div>
    </header>
  );
};

export default AppHeader;