const jwt = require('jsonwebtoken');
const User = require('../models/User');

/** FR-3 / NFR-6: verify the JWT and attach the user to req.user */
async function protect(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Authentication required' });

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  const user = await User.findById(payload.id);
  if (!user) return res.status(401).json({ message: 'User no longer exists' });

  req.user = user;
  next();
}

/** FR-4: role-based access control. Usage: authorize('provider', 'admin') */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to do this' });
    }
    next();
  };
}

function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
}

module.exports = { protect, authorize, signToken };
