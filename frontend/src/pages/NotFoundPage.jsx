import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div className="card">
    <h2>Page Not Found</h2>
    <p>The page you requested does not exist.</p>
    <Link to="/">Go Home</Link>
  </div>
);

export default NotFoundPage;
