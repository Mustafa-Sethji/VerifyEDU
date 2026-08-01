const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/attempt/:attemptId', resultController.getAttemptResult);
router.get('/my-attempts', resultController.getMyAttempts);

module.exports = router;
