const prisma = require('../config/db');

// @desc    Get user activity history
// @route   GET /api/history
const getHistory = async (req, res) => {
  try {
    const history = await prisma.history.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return res.status(200).json(history);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching history.', error: error.message });
  }
};

module.exports = { getHistory };
