const express = require('express');
const router = express.Router();
const promptController = require('../controllers/promptController');

router.post('/', promptController.sendPrompt);
router.post('/annotation', promptController.processAnnotation);
router.post('/consolidate', promptController.consolidateKnowledge);

module.exports = router;