/**
 * 
 */
const { adminBodyGuard} = require('../middleware/middleware.protects');

const express = require('express');
const router = express.Router();
const CoreError = require('../core/core.error');
const { getAdmin, singleAdmin, editAdmin, allAdmin, deleteAdmin } = require('../controller/controller.admin');

/**
 * auth routes
 */


//ADMIN
router.get('/details', adminBodyGuard, getAdmin);
router.get('/single/:id', adminBodyGuard, singleAdmin  );
router.put('/edit',adminBodyGuard, editAdmin  );
router.get('/all',adminBodyGuard, allAdmin  );
router.delete('/delete',adminBodyGuard, deleteAdmin  );



/**
 * Export lastly
 */
router.all('/*', (req, res) => {
    throw new CoreError(`route not found ${req.originalUrl} using ${req.method} method`, 404);
})

module.exports = router;
