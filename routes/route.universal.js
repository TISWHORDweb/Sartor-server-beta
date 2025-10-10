/**
 * 
 */
const {authMiddleware, roleMiddleware} = require('../middleware/middleware.protects');

const express = require('express');
const router = express.Router();
const CoreError = require('../core/core.error');
const { getTasks, singleTask, taskComment, singleTaskComment, taskComments, changeTaskStatus, tasksByStatus } = require('../controller/controller.task');
const { getUser, deleteUser, singleUser, editUser, allUser, createUser, GetDashboardSummary, GetUsersByRole, CreateContact, GetAllContacts, GetContact, UpdateContact, DeleteContact, UpdateCommission, GetCommision, CreatePermission, GetAllPermissions, GetPermission, UpdatePermission, DeletePermission, UpdatePasswordChanged } = require('../controller/controller.user');
// const { product, singleProduct, allProduct, deleteProduct, editProduct, getAdminProduct, productCategory, singleProductCategory, editProductCategory, allProductCategory, deleteProductCategory, getProductsByCategory } = require('../controller/controller.product');
const { deleteTasks, CreateTask, editTask } = require('../controller/controller.task');
const { useAsync } = require('../core');
const { CreateLead, UpdateLead, DeleteLead, GetAllLeads, GetSingleLead, CreateLpo, UpdateLpo, DeleteLpo, GetAllLpos, GetSingleLpo, GetAllInvoices, GetSingleInvoice, DeleteInvoice, changeInvoiceStatus, updateLeadStatus, GetAllCustomer, UpdateCustomer, DeleteCustomer, GetCustomer, updateLPOStatus, GetAllUserLeads, GetAllUserLpos, GetAllUserCustomer, GetAllUserInvoices, GetAllUserCommision } = require('../controller/controller.customer');
const { CreateSupplier, UpdateSupplier, DeleteSupplier, GetAllSuppliers, GetSingleSupplier, CreateProduct, UpdateProduct, DeleteProduct, GetAllProducts, GetSingleProduct, CreateRestock, UpdateRestock, DeleteRestock, GetAllRestocks, GetSingleRestock, CreateBatch, GetAllBatches, GetSingleBatch, UpdateBatch, DeleteBatch, GetAllProductBatch, calculateProductPricing, updateProductPrice } = require('../controller/controller.product');
const { uploadLabel, labelTrainWebhook, CreateLabel, GetAllLabels, GetLabel, UpdateLabel, DeleteLabel, verifyLabel } = require('../controller/controller.label');
const { upload } = require('../core/core.utils');
const { universalSearch } = require('../controller/controller.search');
const { PasswordUpdate } = require('../controller/controller.auth');


/**
 * auth routes
 */

//USER
router.post('/user/create', useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), createUser );
router.get('/user/details', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), getUser);
router.put('/user/edit',useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), editUser  );
router.get('/users',useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), allUser  );
router.delete('/user/delete',useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), deleteUser  );
router.put('/user/password', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), UpdatePasswordChanged  );
router.get('/user/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), singleUser  );
router.get('/user/role/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), GetUsersByRole  );
router.get('/dashboard', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), GetDashboardSummary  );
router.put('/user/password-change', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), PasswordUpdate );

////TASKS
router.post('/task/create', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), CreateTask );
router.put('/task/edit', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), editTask );
router.delete('/task/delete', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), deleteTasks );
router.get('/tasks', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), getTasks );
router.get('/task/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), singleTask );
router.put('/task/status/update', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), changeTaskStatus );
router.get('/tasks/status/:status', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), tasksByStatus );

//TASKS COMMENT
router.post('/task/comment', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), taskComment );
router.get('/single/comment/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), singleTaskComment );
router.get('/task/comment/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), taskComments );

//LEADS
router.post('/lead', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), CreateLead );
router.put('/lead/edit/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), UpdateLead );
router.delete('/lead/delete/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), DeleteLead );
router.get('/leads', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), GetAllLeads );
router.get('/lead/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), GetSingleLead );
router.put('/lead/status/update', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), updateLeadStatus );

//LPO
router.post('/lpo', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), CreateLpo );
router.put('/lpo/edit/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), UpdateLpo );
router.delete('/lpo/delete/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), DeleteLpo );
router.get('/lpos', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), GetAllLpos );
router.get('/lpo/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), GetSingleLpo );
router.put('/lpo/status/update', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), updateLPOStatus );

//SUPPLIER
router.post('/supplier', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), CreateSupplier );
router.put('/supplier/edit/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), UpdateSupplier );
router.delete('/supplier/delete/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), DeleteSupplier );
router.get('/suppliers', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), GetAllSuppliers );
router.get('/supplier/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), GetSingleSupplier );

//PRODUCT
router.post('/product', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), CreateProduct );
router.put('/product/edit/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), UpdateProduct );
router.delete('/product/delete/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), DeleteProduct );
router.get('/products', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), GetAllProducts );
router.get('/product/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), GetSingleProduct );
router.get('/product/batches/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), GetAllProductBatch );
router.get('/product/price/suggestion/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), calculateProductPricing );
router.put('/product/price', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), updateProductPrice );

//RESTOCK
router.post('/restock', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), CreateRestock );
router.put('/restock/edit/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), UpdateRestock );
router.delete('/restock/delete/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), DeleteRestock );
router.get('/restocks', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), GetAllRestocks );
router.get('/restock/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), GetSingleRestock );

//INVOICE
router.delete('/invoice/delete/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), DeleteInvoice );
router.get('/invoices', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), GetAllInvoices );
router.get('/invoice/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), GetSingleInvoice );
router.put('/invoice/status/update', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), changeInvoiceStatus );

//BATCH
router.post('/batch',  useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), CreateBatch );
router.put('/batch/edit/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), UpdateBatch );
router.delete('/batch/delete/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), DeleteBatch );
router.get('/batchs', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), GetAllBatches );
router.get('/batch/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), GetSingleBatch );

//LABEL
router.post('/label/upload', upload.single('image'), uploadLabel );
router.post('/label/verify', upload.single('image'), verifyLabel );
router.post('/label/webhook', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), labelTrainWebhook );
router.post('/label', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), CreateLabel );
router.put('/label/edit/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), UpdateLabel );
router.delete('/label/delete/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), DeleteLabel );
router.get('/labels', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), GetAllLabels );
router.get('/label/:id',  GetLabel );

//CUSTOMER
router.get('/customers', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), GetAllCustomer );
router.put('/customer/edit/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])),  UpdateCustomer );
router.delete('/customer/delete/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), DeleteCustomer );
router.get('/customer/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), GetCustomer );

//UNIVERSAL SEARCH
router.post('/search', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), universalSearch );

//CONTACT
router.post('/contact', CreateContact );
router.put('/contact/edit/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), UpdateContact );
router.delete('/contact/delete/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), DeleteContact );
router.get('/contacts', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), GetAllContacts );
router.get('/contact/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), GetContact );

//COMMISSION
router.put('/commission/update', UpdateCommission );
router.get('/commission', GetCommision );
router.get('/commissions/:id', GetAllUserCommision );

//PERMISSION
router.post('/permission', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), CreatePermission );
router.put('/permission/edit/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), UpdatePermission );
router.delete('/permission/delete/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), DeletePermission );
router.get('/permissions', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), GetAllPermissions );
router.get('/permissions', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), GetAllPermissions );
router.get('/permission/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), GetPermission );

/**
 * Export lastly
 */


router.all('/*', (req, res) => {
    throw new CoreError(`route not found ${req.originalUrl} using ${req.method} method`, 404);
})

module.exports = router;
