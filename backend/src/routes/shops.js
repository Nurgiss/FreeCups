const { Router } = require('express');
const { listShops } = require('../controllers/shopsController');

const router = Router();

router.get('/', listShops);

module.exports = router;
