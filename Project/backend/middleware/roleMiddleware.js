/**
 * Middleware to restrict route access to specific user roles.
 * @param {string[]} allowedRoles Array of allowed roles e.g. ['TEACHER', 'STUDENT']
 */
const roleMiddleware = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized. User context missing.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Forbidden. This action requires one of the following roles: ${allowedRoles.join(', ')}. Your role is ${req.user.role}.`,
      });
    }

    next();
  };
};

module.exports = roleMiddleware;
