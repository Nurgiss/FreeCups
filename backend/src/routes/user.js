const { Router } = require('express');
const { getUser } = require('../controllers/userController');

const router = Router();

router.get('/:id', getUser);

module.exports = router;
