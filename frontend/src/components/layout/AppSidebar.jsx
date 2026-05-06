import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarClock,
  ChartNoAxesCombined,
  Fence,
  Home,
  LogOut,
  ShieldCheck,
  UserRound,
  Users,
  X
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import { ROLES } from '../../utils/constants';

const iconMap = {
  Dashboard: Home,
  Attendance: CalendarClock,
  Reports: ChartNoAxesCombined,
  Geofence: Fence,
  Account: UserRound,
  'User Management': Users
};

const roleLabel = {
  [ROLES.EMPLOYEE]: 'Employee',
  [ROLES.MANAGER]: 'Manager',
  [ROLES.ADMIN]: 'Admin'
};

const AppSidebar = ({ links, user, onLogout, open, onClose }) => {
  const location = useLocation();

  const nav = (
    <aside className="flex h-full w-full max-w-[284px] flex-col rounded-3xl border border-white/70 bg-white/78 p-4 shadow-[0_30px_80px_-45px_rgba(2,6,23,0.52)] backdrop-blur-xl sm:p-5">
      <div className="mb-6 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Attandance Management</p>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">D-Table Analytics</h2>
          </div>
        </div>
        <button type="button" className="secondary inline-flex md:hidden" onClick={onClose} aria-label="Close menu">
          <X size={16} />
        </button>
      </div>

      <div className="mb-5 rounded-2xl border border-slate-200/90 bg-gradient-to-r from-emerald-50 to-cyan-50 p-3">
        <p className="text-sm font-semibold text-slate-900">{user?.name || 'User'}</p>
        <div className="mt-2 flex items-center gap-2">
          <Badge variant="default">{roleLabel[user?.role] || user?.role || '-'}</Badge>
          <Badge variant="neutral">Authenticated</Badge>
        </div>
      </div>

      <nav className="grid gap-2">
        {links.map((link) => {
          const Icon = iconMap[link.label] || Home;
          const isActive = location.pathname.startsWith(link.to);

          return (
            <Link
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={cn(
                'group relative overflow-hidden rounded-xl border px-3 py-3 text-sm font-semibold transition duration-200',
                isActive
                  ? 'border-emerald-300 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-700'
                  : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-900'
              )}
            >
              <span className="flex items-center gap-3">
                <span
                  className={cn(
                    'grid h-8 w-8 place-items-center rounded-lg transition',
                    isActive ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                  )}
                >
                  <Icon size={16} />
                </span>
                {link.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4">
        <Button className="w-full justify-center" variant="danger" onClick={onLogout}>
          <LogOut size={16} />
          Logout
        </Button>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden h-[calc(100vh-2rem)] md:sticky md:top-4 md:block">{nav}</div>
      <AnimatePresence>
        {open ? (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-slate-900/45 backdrop-blur-[1px] md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.div
              className="fixed inset-y-0 left-0 z-50 w-[88%] max-w-[320px] p-3 md:hidden"
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -40, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {nav}
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
};

export default AppSidebar;
