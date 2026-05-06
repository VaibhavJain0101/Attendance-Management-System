import { motion } from 'framer-motion';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';
import { cn } from '../../lib/utils';

const tones = {
  emerald: {
    panel: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
    icon: 'from-emerald-500 to-teal-600',
    stroke: '#10b981',
    fill: 'rgba(16,185,129,0.18)'
  },
  amber: {
    panel: 'from-amber-500/10 via-amber-500/5 to-transparent',
    icon: 'from-amber-500 to-orange-600',
    stroke: '#f59e0b',
    fill: 'rgba(245,158,11,0.18)'
  },
  blue: {
    panel: 'from-blue-500/10 via-blue-500/5 to-transparent',
    icon: 'from-blue-500 to-cyan-600',
    stroke: '#3b82f6',
    fill: 'rgba(59,130,246,0.18)'
  },
  rose: {
    panel: 'from-rose-500/10 via-rose-500/5 to-transparent',
    icon: 'from-rose-500 to-red-600',
    stroke: '#f43f5e',
    fill: 'rgba(244,63,94,0.18)'
  }
};

const buildFallbackSeries = (value) => {
  const numericValue = Number(value);
  const seed = Number.isFinite(numericValue) ? Math.max(numericValue, 1) : 2;
  return [
    { value: seed * 0.2 },
    { value: seed * 0.3 },
    { value: seed * 0.25 },
    { value: seed * 0.45 },
    { value: seed * 0.4 },
    { value: seed * 0.6 },
    { value: seed * 0.55 },
    { value: seed * 0.8 }
  ];
};

const StatCard = ({ title, value, subtitle, icon: Icon = Activity, tone = 'emerald', series }) => {
  const palette = tones[tone] || tones.emerald;
  const chartSeries = Array.isArray(series) && series.length ? series : buildFallbackSeries(value);

  return (
    <motion.section
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-white/70 bg-white/85 p-5 shadow-[0_20px_40px_-30px_rgba(15,23,42,0.6)] backdrop-blur-xl',
        `bg-gradient-to-br ${palette.panel}`
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</p>
          <h3 className="text-3xl font-bold tracking-tight text-slate-900">{value}</h3>
          {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
        </div>

        <div className={cn('grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br text-white shadow-lg', palette.icon)}>
          <Icon size={18} />
        </div>
      </div>

      <div className="mt-5 h-14">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartSeries}>
            <Area type="monotone" dataKey="value" stroke={palette.stroke} fill={palette.fill} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.section>
  );
};

export default StatCard;