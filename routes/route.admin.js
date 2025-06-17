/**
 * 
 */
const { authMiddleware, roleMiddleware} = require('../middleware/middleware.protects');

const express = require('express');
const router = express.Router();
const CoreError = require('../core/core.error');
const { getAdmin, singleAdmin, editAdmin, allAdmin, deleteAdmin, createEmployee } = require('../controller/controller.admin');
const { product, singleProduct, allProduct, deleteProduct, editProduct, getAdminProduct, productCategory, singleProductCategory, editProductCategory, allProductCategory, deleteProductCategory, getProductsByCategory } = require('../controller/controller.product');
const { editEmployee, singleEmployee, allEmployee, deleteEmployee } = require('../controller/controller.employee');
const { deleteAdminTasks, CreateTask, allTasks, tasksByStatusAdmin, editTask } = require('../controller/controller.task');
const { useAsync } = require('../core');

/**
 * auth routes
 */


//ADMIN
router.get('/data', useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), getAdmin);
router.put('/edit',useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), editAdmin  );
router.get('/all',useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), allAdmin  );
router.delete('/delete',useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), deleteAdmin  );
router.get('/single/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), singleAdmin  );

//SALES AGENT
router.post('/create/employee',useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), createEmployee  );
router.put('/employee/edit',useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), editEmployee  );
router.get('/employee/single/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), singleEmployee  );
router.get('/employee/all', useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), allEmployee  );
router.delete('/employee/delete',useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), deleteEmployee  );

//PRODUCTS
router.post('/product/create',useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), product );
router.get('/products', useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), getAdminProduct  );

router.put('/product/edit',useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), editProduct  );
router.get('/product/all',useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), allProduct  );
router.delete('/product/delete',useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), deleteProduct  );
router.get('/product/category/:id',useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), getProductsByCategory  );
router.get('/product/single/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), singleProduct );

//PRODUCT CATEGORY
router.post('/product/category/create',useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), productCategory );
router.put('/product/category/edit',useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), editProductCategory  );
router.delete('/product/category/delete',useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), deleteProductCategory  );
router.get('/product/categorys',useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), allProductCategory  );
router.get('/product/category/single/:id', useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), singleProductCategory );

////TASKS
router.post('/create/task', useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), CreateTask );
router.put('/task/edit', useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), editTask );
router.delete('/task/delete', useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), deleteAdminTasks );
router.get('/tasks', useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), allTasks );
router.get('/tasks/status/:status', useAsync(authMiddleware), useAsync(roleMiddleware(['admin'])), tasksByStatusAdmin );


/**
 * Export lastly
 */
router.all('/*', (req, res) => {
    throw new CoreError(`route not found ${req.originalUrl} using ${req.method} method`, 404);
})

module.exports = router;
