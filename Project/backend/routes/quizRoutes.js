const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const resultController = require('../controllers/resultController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/generate', quizController.generateQuiz);
router.get('/classroom/:classroomId', quizController.getClassroomQuizzes);
router.get('/:id', quizController.getQuizById);
router.post('/:id/submit', resultController.submitQuizAttempt);

module.exports = router;
