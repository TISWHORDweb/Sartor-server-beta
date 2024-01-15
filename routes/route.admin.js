/**
 * 
 */
const { adminBodyGuard} = require('../middleware/middleware.protects');

const express = require('express');
const router = express.Router();
const CoreError = require('../core/core.error');
const { getAdmin, singleAdmin, editAdmin, allAdmin, deleteAdmin, createSalesAgent } = require('../controller/controller.admin');
const { product, singleProduct, allProduct, deleteProduct, editProduct, getAdminProduct, productCategory, singleProductCategory, editProductCategory, allProductCategory, deleteProductCategory, getProductsByCategory } = require('../controller/controller.product');

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
router.post('/create/sales-agent',adminBodyGuard, createSalesAgent  );

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

/**
 * Export lastly
 */
router.all('/*', (req, res) => {
    throw new CoreError(`route not found ${req.originalUrl} using ${req.method} method`, 404);
})

module.exports = router;
