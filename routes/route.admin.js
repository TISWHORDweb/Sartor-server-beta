/**
 * 
 */
const { adminBodyGuard} = require('../middleware/middleware.protects');

const express = require('express');
const router = express.Router();
const CoreError = require('../core/core.error');
const { getAdmin, singleAdmin, editAdmin, allAdmin, deleteAdmin, createEmployee } = require('../controller/controller.admin');
const { product, singleProduct, allProduct, deleteProduct, editProduct, getAdminProduct, productCategory, singleProductCategory, editProductCategory, allProductCategory, deleteProductCategory, getProductsByCategory } = require('../controller/controller.product');
const { editEmployee, singleEmployee, allEmployee, deleteEmployee } = require('../controller/controller.employee');
const { deleteAdminTasks, CreateTask, allTasks, tasksByStatusAdmin, editTask } = require('../controller/controller.task');

/**
 * auth routes
 */


//ADMIN
router.get('/data', adminBodyGuard, getAdmin);
router.put('/edit',adminBodyGuard, editAdmin  );
router.get('/all',adminBodyGuard, allAdmin  );
router.delete('/delete',adminBodyGuard, deleteAdmin  );
router.get('/single/:id', adminBodyGuard, singleAdmin  );

//SALES AGENT
router.post('/create/employee',adminBodyGuard, createEmployee  );
router.put('/employee/edit',adminBodyGuard, editEmployee  );
router.get('/employee/single/:id', adminBodyGuard, singleEmployee  );
router.get('/employee/all', adminBodyGuard, allEmployee  );
router.delete('/employee/delete',adminBodyGuard, deleteEmployee  );

//PRODUCTS
router.post('/product/create',adminBodyGuard, product );
router.get('/products', adminBodyGuard, getAdminProduct  );

router.put('/product/edit',adminBodyGuard, editProduct  );
router.get('/product/all',adminBodyGuard, allProduct  );
router.delete('/product/delete',adminBodyGuard, deleteProduct  );
router.get('/product/category/:id',adminBodyGuard, getProductsByCategory  );
router.get('/product/single/:id', adminBodyGuard, singleProduct );

//PRODUCT CATEGORY
router.post('/product/category/create',adminBodyGuard, productCategory );
router.put('/product/category/edit',adminBodyGuard, editProductCategory  );
router.delete('/product/category/delete',adminBodyGuard, deleteProductCategory  );
router.get('/product/categorys',adminBodyGuard, allProductCategory  );
router.get('/product/category/single/:id', adminBodyGuard, singleProductCategory );

////TASKS
router.post('/create/task', adminBodyGuard, CreateTask );
router.put('/task/edit', adminBodyGuard, editTask );
router.delete('/task/delete', adminBodyGuard, deleteAdminTasks );
router.get('/tasks', adminBodyGuard, allTasks );
router.get('/tasks/status/:status', adminBodyGuard, tasksByStatusAdmin );


/**
 * Export lastly
 */
router.all('/*', (req, res) => {
    throw new CoreError(`route not found ${req.originalUrl} using ${req.method} method`, 404);
})

module.exports = router;
