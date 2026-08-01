const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const authMiddleware = require('../middleware/authMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware');

router.use(authMiddleware);

router.post('/upload', uploadMiddleware.single('file'), documentController.uploadDocument);
router.get('/classroom/:classroomId', documentController.getClassroomDocuments);
router.get('/:id', documentController.getDocumentById);
router.delete('/:id', documentController.deleteDocument);

module.exports = router;
