/**
 * 
 */
const {bodyParser} = require('../middleware/middleware.protects');

const express = require('express');
const router = express.Router();
const CoreError = require('./../core/core.error');
const { AdminRegister, adminLogin } = require('../controller/controller.auth');

/**
 * auth routes
 */

router.post('/register', bodyParser, AdminRegister);
// router.put('/verified', bodyParser, userVerified);
// router.post('/veify', bodyParser, userVerify);
router.post('/login', bodyParser, adminLogin);
// router.post('/password/mail', bodyParser, userPasswordVerify);
// router.post('/password/update', bodyParser, updatePassword);
// router.get('/email/verify', bodyParser, userEmailVerify);
// router.get('/email/verify', bodyParser, userEmailVerify);

/**
 * Export lastly
 */
router.all('/*', (req, res) => {
    throw new CoreError(`route not found ${req.originalUrl} using ${req.method} method`, 404);
})

module.exports = router;