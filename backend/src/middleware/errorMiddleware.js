function notFoundHandler(req, res) {
  res.status(404).json({ error: 'API Endpoint Not Found' });
}

function globalErrorHandler(err, req, res, next) {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
  });
}

module.exports = {
  notFoundHandler,
  globalErrorHandler
};
