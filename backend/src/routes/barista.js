const { Router } = require('express');
const { handleBaristaScan, verifyBarista } = require('../controllers/baristaController');

const router = Router();

router.post('/verify', verifyBarista);
router.post('/scan', handleBaristaScan);

module.exports = router;
