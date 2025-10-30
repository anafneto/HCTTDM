const express = require('express');
const router = express.Router();
const specialNeedsController = require('../controllers/special_needsController');

router.post('/', specialNeedsController.create);
router.get('/', specialNeedsController.findAll);
router.get('/:id', specialNeedsController.findOne);
router.put('/:id', specialNeedsController.update);
router.delete('/:id', specialNeedsController.delete);

module.exports = router;