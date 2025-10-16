/**
 * 
 */
const {bodyParser, authSartorMiddleware} = require('../middleware/middleware.protects');

const express = require('express');
const router = express.Router();
const CoreError = require('./../core/core.error');
const { allCompanys, getSingleCompany, toggleAdminStatus, GetGlobalDashboardSummary } = require('../controller/controller.sartor');
const { useAsync } = require('../core');
const ModelAuditLog = require('../models/model.auditLog');

/**
 * auth routes
 */

router.all('/*', (authSartorMiddleware), async (req, res, next) => {
    try {
        if (req.method !== "GET") {
            const u = req.user
            if (u) {
                const rs = {
                    admin: u?._id,
                    title: "["+req.method + "] "+req.originalUrl,
                    agent: u?.fullName + " (" + u?.email + ")",
                    reasons: u.fullName + ` ${req.method} data to [${req.originalUrl}] with [${JSON.stringify(req.params)}] params`
                }
                const newLog = new ModelAuditLog(rs);
                await newLog.save();
            }
        }
    } catch (e) {
        console.log(e)
    }
    next()
})

// SARTOR
router.get('/dashboard', useAsync(authSartorMiddleware), GetGlobalDashboardSummary);
router.get('/companys', useAsync(authSartorMiddleware), allCompanys);
router.get('/company/:id', useAsync(authSartorMiddleware), getSingleCompany);
router.patch('/company/status/:id', useAsync(authSartorMiddleware), toggleAdminStatus);

/**
 * Export lastly
 */
router.all('/*', (req, res) => {
    throw new CoreError(`route not found ${req.originalUrl} using ${req.method} method`, 404);
})

module.exports = router;