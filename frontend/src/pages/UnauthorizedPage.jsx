import { ShieldBan } from 'lucide-react';
import { Card } from '../components/ui/card';

const UnauthorizedPage = () => (
  <Card className="mx-auto mt-10 max-w-xl text-center">
    <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-rose-100 text-rose-600">
      <ShieldBan size={22} />
    </div>
    <h2 className="text-2xl font-bold">Unauthorized</h2>
    <p className="mt-2 text-slate-600">You do not have permission to access this page.</p>
  </Card>
);

export default UnauthorizedPage;