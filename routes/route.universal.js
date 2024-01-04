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
router.get('/sales-agent/details', salesAgentBodyGuard, getSalesAgent);
router.get('/sales-agent/single/:id', singleSalesAgent  );
router.put('/sales-agent/edit',salesAgentBodyGuard, editSalesAgent  );
router.get('/sales-agent/all',salesAgentBodyGuard, allSalesAgent  );
router.delete('/sales-agent/delete',salesAgentBodyGuard, deleteSalesAgent  );


router.all('/*', (req, res) => {
    throw new CoreError(`route not found ${req.originalUrl} using ${req.method} method`, 404);
})

module.exports = router;
