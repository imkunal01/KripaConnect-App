const express = require('express');
const router = express.Router();
const { getSubcategories } = require('../controllers/subcategoryController');

// Public listing
router.get('/', getSubcategories);

module.exports = router;
