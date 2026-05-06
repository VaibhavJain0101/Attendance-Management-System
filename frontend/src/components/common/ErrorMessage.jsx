import { AlertTriangle } from 'lucide-react';
import { Card } from '../ui/card';

const ErrorMessage = ({ message }) => (
  <Card className="error flex items-start gap-3">
    <AlertTriangle size={18} className="mt-0.5 text-rose-600" />
    <div>
      <strong className="text-rose-700">Error:</strong>{' '}
      <span className="text-rose-700">{message || 'Something went wrong'}</span>
    </div>
  </Card>
);

export default ErrorMessage;