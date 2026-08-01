const prisma = require('../config/db');

// @desc    Get dashboard analytics for Teacher
// @route   GET /api/analytics/teacher
const getTeacherAnalytics = async (req, res) => {
  try {
    const teacherId = req.user.id;

    // 1. Get teacher classrooms
    const classrooms = await prisma.classroom.findMany({
      where: { teacherId },
      select: { id: true, name: true, code: true },
    });

    const classroomIds = classrooms.map((c) => c.id);

    // 2. Total Classrooms
    const totalClassrooms = classrooms.length;

    // 3. Total Unique Students across teacher's classrooms
    const members = await prisma.classroomMember.findMany({
      where: { classroomId: { in: classroomIds } },
      select: { studentId: true },
    });
    const uniqueStudentIds = [...new Set(members.map((m) => m.studentId))];
    const totalStudents = uniqueStudentIds.length;

    // 4. Total Documents
    const totalDocuments = await prisma.document.count({
      where: { classroomId: { in: classroomIds } },
    });

    // 5. Quizzes & Attempt Stats
    const quizzes = await prisma.quiz.findMany({
      where: { classroomId: { in: classroomIds } },
      select: { id: true, title: true, classroomId: true },
    });
    const quizIds = quizzes.map((q) => q.id);

    const attempts = await prisma.quizAttempt.findMany({
      where: { quizId: { in: quizIds } },
      include: {
        student: { select: { id: true, name: true, email: true, profileImage: true } },
        quiz: { select: { title: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });

    const totalQuizzes = quizzes.length;
    const totalAttempts = attempts.length;

    const avgScore = totalAttempts > 0
      ? parseFloat((attempts.reduce((sum, a) => sum + a.percentage, 0) / totalAttempts).toFixed(1))
      : 0;

    // 6. Recent activity
    const recentActivity = await prisma.history.findMany({
      where: { userId: teacherId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return res.status(200).json({
      totalClassrooms,
      totalStudents,
      totalDocuments,
      totalQuizzes,
      totalAttempts,
      averageScore: avgScore,
      recentAttempts: attempts.slice(0, 5),
      recentActivity,
    });
  } catch (error) {
    console.error('Error fetching teacher analytics:', error);
    return res.status(500).json({ message: 'Error fetching teacher analytics.', error: error.message });
  }
};

// @desc    Get dashboard analytics for Student
// @route   GET /api/analytics/student
const getStudentAnalytics = async (req, res) => {
  try {
    const studentId = req.user.id;

    // 1. Joined classrooms
    const joinedMemberships = await prisma.classroomMember.findMany({
      where: { studentId },
      include: {
        classroom: { select: { id: true, name: true, code: true } },
      },
    });

    // 2. Student Attempts
    const attempts = await prisma.quizAttempt.findMany({
      where: { studentId },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            classroom: { select: { name: true } },
          },
        },
      },
      orderBy: { submittedAt: 'asc' },
    });

    const completedQuizzes = attempts.length;

    const averageScore = completedQuizzes > 0
      ? parseFloat((attempts.reduce((sum, a) => sum + a.percentage, 0) / completedQuizzes).toFixed(1))
      : 0;

    // Progress trend data
    const scoreTrend = attempts.map((a, idx) => ({
      quizNumber: idx + 1,
      quizTitle: a.quiz.title,
      score: a.percentage,
      date: a.submittedAt,
    }));

    return res.status(200).json({
      joinedClassroomsCount: joinedMemberships.length,
      completedQuizzesCount: completedQuizzes,
      averageScore,
      scoreTrend,
      recentAttempts: [...attempts].reverse().slice(0, 5),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching student analytics.', error: error.message });
  }
};

// @desc    Get classroom leaderboard
// @route   GET /api/classrooms/:id/leaderboard
const getClassroomLeaderboard = async (req, res) => {
  try {
    const { id: classroomId } = req.params;

    // Get all students in classroom
    const members = await prisma.classroomMember.findMany({
      where: { classroomId },
      include: {
        student: { select: { id: true, name: true, email: true, profileImage: true } },
      },
    });

    // Get all quizzes in classroom
    const quizzes = await prisma.quiz.findMany({
      where: { classroomId },
      select: { id: true },
    });

    const quizIds = quizzes.map((q) => q.id);

    // Get attempts for these quizzes
    const attempts = await prisma.quizAttempt.findMany({
      where: { quizId: { in: quizIds } },
    });

    // Calculate student statistics
    const leaderboard = members.map((m) => {
      const studentAttempts = attempts.filter((a) => a.studentId === m.student.id);
      const quizCount = studentAttempts.length;
      const totalPercentage = studentAttempts.reduce((sum, a) => sum + a.percentage, 0);
      const avgPercentage = quizCount > 0 ? parseFloat((totalPercentage / quizCount).toFixed(1)) : 0;

      return {
        studentId: m.student.id,
        name: m.student.name,
        email: m.student.email,
        profileImage: m.student.profileImage,
        quizzesAttempted: quizCount,
        averageScore: avgPercentage,
        totalPoints: studentAttempts.reduce((sum, a) => sum + a.score, 0),
      };
    });

    // Sort by averageScore desc, then totalPoints desc
    leaderboard.sort((a, b) => b.averageScore - a.averageScore || b.totalPoints - a.totalPoints);

    return res.status(200).json(leaderboard);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching classroom leaderboard.', error: error.message });
  }
};

module.exports = {
  getTeacherAnalytics,
  getStudentAnalytics,
  getClassroomLeaderboard,
};
