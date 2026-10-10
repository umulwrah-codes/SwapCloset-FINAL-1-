import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="center notfound">
      <h1>404</h1>
      <h2>Page not found</h2>
      <p>The page you're looking for doesn't exist.</p>
      <Link className="btn" to="/">
        Go home
      </Link>
    </div>
  );
}