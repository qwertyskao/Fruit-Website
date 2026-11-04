const path = require('path');

const notFound = (req, res, next) => {
  const error = new Error(`Không tìm thấy đường dẫn - ${req.originalUrl}`);

  // API clients need a predictable JSON response, including for unknown API routes.
  if (req.path === '/api' || req.path.startsWith('/api/')) {
    res.status(404);
    return next(error);
  }

  // Render the existing customer-facing 404 page for normal website routes.
  return res.status(404).sendFile(
    path.join(__dirname, '..', 'fruitables-1.0.0', '404.html'),
    (sendError) => {
      if (sendError) next(sendError);
    }
  );
};

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { notFound, errorHandler };
