/**
 * 
 */
const {salesAgentBodyGuard} = require('../middleware/middleware.protects');

const express = require('express');
const router = express.Router();
const CoreError = require('../core/core.error');
const { getSalesAgent, singleSalesAgent, editSalesAgent, allSalesAgent, deleteSalesAgent } = require('../controller/controller.salesAgent');
const { company, getSalesAgentCompany, editCompany, getCompanyByType, singleCompany, allCompany, deleteCompany, companyType, editCompanyType, singleCompanyType, allCompanyType, deleteCompanyType } = require('../controller/controller.company');
const { deal, editDeal, getSalesAgentDeal, singleDeal, companyDeal, allDeal, deleteDeal } = require('../controller/controller.deal');

/**
 * Export lastly
 */

//SALES AGENT
router.get('/sales-agent/details', salesAgentBodyGuard, getSalesAgent);
router.get('/sales-agent/single/:id', salesAgentBodyGuard, singleSalesAgent  );
router.put('/sales-agent/edit',salesAgentBodyGuard, editSalesAgent  );
router.get('/sales-agent/all', allSalesAgent  );
router.delete('/sales-agent/delete',salesAgentBodyGuard, deleteSalesAgent  );

//COMPANY
router.post('/sales-agent/company', salesAgentBodyGuard, company );
router.put('/sales-agent/company/edit', salesAgentBodyGuard, editCompany );
router.get('/sales-agent/company/created', salesAgentBodyGuard, getSalesAgentCompany );
router.delete('/sales-agent/company/delete', salesAgentBodyGuard, deleteCompany );
router.get('/sales-agent/company/all', salesAgentBodyGuard, allCompany );
router.get('/sales-agent/company/by/type/:id', salesAgentBodyGuard, getCompanyByType );
router.get('/sales-agent/company/:id', salesAgentBodyGuard, singleCompany );


// COMPANY TYPE
router.post('/sales-agent/company/type', salesAgentBodyGuard, companyType );
router.put('/sales-agent/company/type/edit', salesAgentBodyGuard, editCompanyType );
router.get('/sales-agent/company/type/all', salesAgentBodyGuard, allCompanyType );
router.delete('/sales-agent/company/type/delete', salesAgentBodyGuard, deleteCompanyType );
router.get('/sales-agent/company/type/:id', salesAgentBodyGuard, singleCompanyType );

// DEALS
router.post('/sales-agent/deal', salesAgentBodyGuard, deal );
router.put('/sales-agent/deal/edit', salesAgentBodyGuard, editDeal );
router.get('/sales-agent/all/deal', salesAgentBodyGuard, getSalesAgentDeal );
router.get('/sales-agent/deal/company/:id', salesAgentBodyGuard, companyDeal );
router.delete('/sales-agent/deal/delete', salesAgentBodyGuard, deleteDeal );
router.get('/sales-agent/deal/all', salesAgentBodyGuard, allDeal );
router.get('/sales-agent/deal/:id', salesAgentBodyGuard, singleDeal );


router.all('/*', (req, res) => {
    throw new CoreError(`route not found ${req.originalUrl} using ${req.method} method`, 404);
})

module.exports = router;
