/**
 * 
 */
const {authMiddleware, roleMiddleware} = require('../middleware/middleware.protects');

const express = require('express');
const router = express.Router();
const CoreError = require('../core/core.error');
const { getTasks, singleTask, taskComment, singleTaskComment, taskComments, changeTaskStatus, tasksByStatus } = require('../controller/controller.task');
const { getUser, deleteUser, singleUser, editUser, allUser, createUser } = require('../controller/controller.user');
// const { product, singleProduct, allProduct, deleteProduct, editProduct, getAdminProduct, productCategory, singleProductCategory, editProductCategory, allProductCategory, deleteProductCategory, getProductsByCategory } = require('../controller/controller.product');
const { deleteTasks, CreateTask, editTask } = require('../controller/controller.task');
const { useAsync } = require('../core');
const { CreateLead, UpdateLead, DeleteLead, GetAllLeads, GetSingleLead, CreateLpo, UpdateLpo, DeleteLpo, GetAllLpos, GetSingleLpo } = require('../controller/controller.customer');


/**
 * auth routes
 */

//USER
router.post('/user/create',useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), createUser );
router.get('/user/details', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), getUser);
router.put('/user/edit',useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), editUser  );
router.get('/users',useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), allUser  );
router.delete('/delete',useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), deleteUser  );
router.get('/user/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), singleUser  );

////TASKS
router.post('/task/create', useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), CreateTask );
router.put('/task/edit', useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), editTask );
router.delete('/task/delete', useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), deleteTasks );
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

//LPO
router.post('/lpo', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), CreateLpo );
router.put('/lpo/edit/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), UpdateLpo );
router.delete('/lpo/delete/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), DeleteLpo );
router.get('/lpos', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), GetAllLpos );
router.get('/lpo/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['user'])), GetSingleLpo );

//PRODUCTS
// router.post('/product/create',useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), product );
// router.get('/products', useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), getAdminProduct  );
// router.put('/product/edit',useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), editProduct  );
// router.get('/product/all',useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), allProduct  );
// router.delete('/product/delete',useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), deleteProduct  );
// router.get('/product/category/:id',useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), getProductsByCategory  );
// router.get('/product/single/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), singleProduct );

// //PRODUCT CATEGORY
// router.post('/product/category/create',useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), productCategory );
// router.put('/product/category/edit',useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), editProductCategory  );
// router.delete('/product/category/delete',useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), deleteProductCategory  );
// router.get('/product/categorys',useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), allProductCategory  );
// router.get('/product/category/single/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), singleProductCategory );

/**
 * Export lastly
 */

router.all('/*', (req, res) => {
    throw new CoreError(`route not found ${req.originalUrl} using ${req.method} method`, 404);
})

module.exports = router;
