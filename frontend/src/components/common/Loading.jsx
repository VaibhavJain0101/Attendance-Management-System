import { Loader2 } from 'lucide-react';
import { Card } from '../ui/card';

const Loading = ({ label = 'Loading...' }) => (
  <Card className="flex items-center gap-3 text-slate-600">
    <Loader2 size={18} className="animate-spin text-emerald-600" />
    <span className="font-medium">{label}</span>
  </Card>
);

export default Loading;