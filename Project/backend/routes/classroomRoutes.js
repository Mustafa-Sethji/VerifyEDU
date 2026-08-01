const express = require('express');
const router = express.Router();
const classroomController = require('../controllers/classroomController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

// Teacher only classroom creation
router.post('/', roleMiddleware(['TEACHER']), classroomController.createClassroom);

// Student join classroom by code
router.post('/join', roleMiddleware(['STUDENT']), classroomController.joinClassroom);

// List classrooms
router.get('/', classroomController.getClassrooms);

// Classroom details
router.get('/:id', classroomController.getClassroomById);

// Teacher edit classroom
router.put('/:id', roleMiddleware(['TEACHER']), classroomController.updateClassroom);

// Teacher delete classroom
router.delete('/:id', roleMiddleware(['TEACHER']), classroomController.deleteClassroom);

// Student leave classroom
router.post('/:id/leave', roleMiddleware(['STUDENT']), classroomController.leaveClassroom);

// Teacher remove student
router.delete('/:id/students/:studentId', roleMiddleware(['TEACHER']), classroomController.removeStudent);

module.exports = router;
