const ErrorMessage = ({ message }) => (
  <div className="card error">
    <strong>Error:</strong> {message || 'Something went wrong'}
  </div>
);

export default ErrorMessage;
