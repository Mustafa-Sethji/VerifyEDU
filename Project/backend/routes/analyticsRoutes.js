const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

router.get('/teacher', roleMiddleware(['TEACHER']), analyticsController.getTeacherAnalytics);
router.get('/student', roleMiddleware(['STUDENT']), analyticsController.getStudentAnalytics);
router.get('/classrooms/:id/leaderboard', analyticsController.getClassroomLeaderboard);

module.exports = router;
