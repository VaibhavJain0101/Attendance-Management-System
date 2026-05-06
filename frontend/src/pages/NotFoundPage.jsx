import { Link } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';

const NotFoundPage = () => (
  <Card className="mx-auto mt-10 max-w-xl text-center">
    <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-amber-100 text-amber-600">
      <SearchX size={22} />
    </div>
    <h2 className="text-2xl font-bold">Page Not Found</h2>
    <p className="mt-2 text-slate-600">The page you requested does not exist.</p>
    <div className="mt-4">
      <Link to="/">
        <Button>Go Home</Button>
      </Link>
    </div>
  </Card>
);

export default NotFoundPage;