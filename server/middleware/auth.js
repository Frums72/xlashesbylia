function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  // For API requests, return 401
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Unauthorized', redirect: '/login' });
  }
  // For page requests, redirect to login
  res.redirect('/login');
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.userId && req.session.role === 'admin') {
    return next();
  }
  if (req.path.startsWith('/api/')) {
    return res.status(403).json({ error: 'Forbidden - Admin access required' });
  }
  res.redirect('/dashboard');
}

module.exports = { requireAuth, requireAdmin };
