/**
 * 
 */
const {salesAgentBodyGuard} = require('../middleware/middleware.protects');

const express = require('express');
const router = express.Router();
const CoreError = require('../core/core.error');
const { getSalesAgent, singleSalesAgent, editSalesAgent, allSalesAgent, deleteSalesAgent } = require('../controller/controller.salesAgent');

/**
 * Export lastly
 */

//SALES AGENT
router.get('/details', salesAgentBodyGuard, getSalesAgent);
router.get('/single/:id', salesAgentBodyGuard, singleSalesAgent  );
router.put('/edit',salesAgentBodyGuard, editSalesAgent  );
router.get('/all',salesAgentBodyGuard, allSalesAgent  );
router.delete('/delete',salesAgentBodyGuard, deleteSalesAgent  );


router.all('/*', (req, res) => {
    throw new CoreError(`route not found ${req.originalUrl} using ${req.method} method`, 404);
})

module.exports = router;
