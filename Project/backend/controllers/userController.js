const bcrypt = require('bcryptjs');
const prisma = require('../config/db');

// @desc    Get user profile details
// @route   GET /api/users/profile
const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileImage: true,
        createdAt: true,
        teacherProfile: true,
        studentProfile: true,
      },
    });
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching profile.', error: error.message });
  }
};

// @desc    Update user profile details
// @route   PUT /api/users/profile
const updateProfile = async (req, res) => {
  try {
    const { name, profileImage, department, gradeLevel, bio } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name: name || undefined,
        profileImage: profileImage || undefined,
      },
    });

    if (user.role === 'TEACHER' && (department !== undefined || bio !== undefined)) {
      await prisma.teacher.upsert({
        where: { userId: user.id },
        update: { department, bio },
        create: { userId: user.id, department, bio },
      });
    } else if (user.role === 'STUDENT' && (gradeLevel !== undefined || bio !== undefined)) {
      await prisma.student.upsert({
        where: { userId: user.id },
        update: { gradeLevel, bio },
        create: { userId: user.id, gradeLevel, bio },
      });
    }

    return res.status(200).json({ message: 'Profile updated successfully!', user });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating profile.', error: error.message });
  }
};

// @desc    Change password
// @route   PUT /api/users/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required.' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return res.status(200).json({ message: 'Password changed successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Error changing password.', error: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
};
