/**
 * 
 */
const {universalBodyGuard} = require('../middleware/middleware.protects');

const express = require('express');
const router = express.Router();
const CoreError = require('../core/core.error');
const { company, getSalesAgentCompany, editCompany, getCompanyByType, singleCompany, allCompany, deleteCompany, companyType, editCompanyType, singleCompanyType, allCompanyType, deleteCompanyType } = require('../controller/controller.company');
const { deal, editDeal, getSalesAgentDeal, singleDeal, companyDeal, allDeal, deleteDeal } = require('../controller/controller.deal');
const { editTask, getTasks, singleTask, taskComment, singleTaskComment, taskComments, changeTaskStatus } = require('../controller/controller.task');
const { getEmployee } = require('../controller/controller.employee');

/**
 * Export lastly
 */

//SALES AGENT
router.get('/employee/details', universalBodyGuard, getEmployee);


//COMPANY
router.post('/sales-agent/company', universalBodyGuard, company );
router.put('/sales-agent/company/edit', universalBodyGuard, editCompany );
router.get('/sales-agent/company/created', universalBodyGuard, getSalesAgentCompany );
router.delete('/sales-agent/company/delete', universalBodyGuard, deleteCompany );
router.get('/sales-agent/company/all', universalBodyGuard, allCompany );
router.get('/sales-agent/company/by/type/:id', universalBodyGuard, getCompanyByType );
router.get('/sales-agent/company/:id', universalBodyGuard, singleCompany );


// COMPANY TYPE
router.post('/sales-agent/company/type', universalBodyGuard, companyType );
router.put('/sales-agent/company/type/edit', universalBodyGuard, editCompanyType );
router.get('/sales-agent/company/type/all', universalBodyGuard, allCompanyType );
router.delete('/sales-agent/company/type/delete', universalBodyGuard, deleteCompanyType );
router.get('/sales-agent/company/type/:id', universalBodyGuard, singleCompanyType );

// DEALS
router.post('/sales-agent/deal', universalBodyGuard, deal );
router.put('/sales-agent/deal/edit', universalBodyGuard, editDeal );
router.get('/sales-agent/all/deal', universalBodyGuard, getSalesAgentDeal );
router.get('/sales-agent/deal/company/:id', universalBodyGuard, companyDeal );
router.delete('/sales-agent/deal/delete', universalBodyGuard, deleteDeal );
router.get('/sales-agent/deal/all', universalBodyGuard, allDeal );
router.get('/sales-agent/deal/:id', universalBodyGuard, singleDeal );

////TASKS
router.put('/task/edit', universalBodyGuard, editTask );
router.get('/my/tasks', universalBodyGuard, getTasks );
router.get('/task/:id', universalBodyGuard, singleTask );
router.put('/task/status/update/:id', universalBodyGuard, changeTaskStatus );

//TASLS COMMENT
router.post('/task/comment', universalBodyGuard, taskComment );
router.get('/single/comment/:id', universalBodyGuard, singleTaskComment );
router.get('/task/comment/:id', universalBodyGuard, taskComments );


router.all('/*', (req, res) => {
    throw new CoreError(`route not found ${req.originalUrl} using ${req.method} method`, 404);
})

module.exports = router;
