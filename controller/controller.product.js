const dotenv = require("dotenv")
dotenv.config()
const { useAsync, utils, errorHandle, } = require('../core');
const ModelProduct = require("../models/model.product");
const Joi = require("joi");
const ModelRestock = require("../models/model.restock");
const ModelSupplier = require("../models/model.supplier");
const { genID } = require("../core/core.utils");
const ModelBatch = require("../models/model.batch");


exports.CreateProduct = useAsync(async (req, res) => {
  try {
    // if (!req.is('multipart/form-data')) {
    //   throw new errorHandle('Content-Type must be multipart/form-data', 400);
    // }

    const { 
      productName, 
      barcodeNumber, 
      manufacturer, 
      description 
    } = req.body;

    // if (!productName || typeof productName !== 'string') {
    //   throw new errorHandle('Product name is required and must be a string', 400);
    // }

    // if (barcodeNumber && typeof barcodeNumber !== 'string') {
    //   throw new errorHandle('Barcode must be a string', 400);
    // }

    const batchId = await genID(2);

    const product = await ModelProduct.create({
      productName,
      barcodeNumber: barcodeNumber || null,
      manufacturer: manufacturer || null,
      description: description || null,
      batchId
    });

    return res.json(utils.JParser('Product created successfully', !!product, product));
  } catch (e) {
    throw new errorHandle(e.message, e.statusCode || 500);
  }
});

exports.UpdateProduct = useAsync(async (req, res) => {
    try {
        const { id } = req.params;
        const schema = Joi.object({
            productName: Joi.string().optional(),
            manufacturer: Joi.string().optional(),
            barcodeNumber: Joi.string().optional(),
            description: Joi.string().optional(),
            productImage: Joi.string().optional(),
            status: Joi.string().optional()
        });

        const validator = await schema.validateAsync(req.body);
        validator.updated_at = Date.now(); // Auto-update timestamp

        const updatedProduct = await ModelProduct.findByIdAndUpdate(id, validator, { new: true });

        if (!updatedProduct) {
            return res.status(404).json(utils.JParser('Product not found', false, null));
        }

        return res.json(utils.JParser('Product updated successfully', !!updatedProduct, updatedProduct));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});


exports.DeleteProduct = useAsync(async (req, res) => {
    try {
        const { id } = req.params;
        const deletedProduct = await ModelProduct.findByIdAndDelete(id);

        if (!deletedProduct) {
            return res.status(404).json(utils.JParser('Product not found', false, null));
        }

        return res.json(utils.JParser('Product deleted successfully', !!deletedProduct, deletedProduct));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});


exports.GetAllProducts = useAsync(async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = req.query.limit === 'all' ? null : parseInt(req.query.limit) || 10;
        const skip = req.query.limit === 'all' ? 0 : (page - 1) * limit;

        // Get products without populate
        const query = ModelProduct.find().lean();
        if (limit !== null) query.skip(skip).limit(limit);
        const products = await query.exec();

        // Get all product IDs
        const productIds = products.map(p => p._id);

        // Get batches for these products with supplier information
        const batches = await ModelBatch.find({ product: { $in: productIds } })
            .lean();

        // Get supplier IDs from batches
        const supplierIds = [...new Set(batches.map(b => b.supplier).filter(Boolean))];
        
        // Get all suppliers in one query
        const suppliers = await ModelSupplier.find({ _id: { $in: supplierIds } })
            .lean()
            .then(supps => supps.reduce((acc, s) => {
                acc[s._id.toString()] = s;
                return acc;
            }, {}));

        // Get restock data
        const restocks = await ModelRestock.find({ product: { $in: productIds } })
            .sort({ creationDateTime: -1 })
            .lean();

        // Organize data for efficient joining
        const batchesByProduct = batches.reduce((acc, batch) => {
            const productId = batch.product.toString();
            if (!acc[productId]) acc[productId] = [];
            
            // Attach supplier info if exists
            const batchWithSupplier = {
                ...batch,
                supplier: batch.supplier ? suppliers[batch.supplier.toString()] : null
            };
            
            acc[productId].push(batchWithSupplier);
            return acc;
        }, {});

        const restocksByProduct = restocks.reduce((acc, restock) => {
            const productId = restock.product.toString();
            if (!acc[productId]) acc[productId] = [];
            acc[productId].push({
                quantity: restock.quantity,
                date: restock.creationDateTime
            });
            return acc;
        }, {});

        // Combine all data
        const productsWithData = products.map(product => {
            const productId = product._id.toString();
            return {
                ...product,
                batches: batchesByProduct[productId] || [],
                restocks: (restocksByProduct[productId] || []).slice(0, 5)
            };
        });

        const response = utils.JParser('Products fetched successfully', !!products,
            { data: productsWithData }
        );

        if (limit !== null) {
            const totalProducts = await ModelProduct.countDocuments();
            response.data.pagination = {
                currentPage: page,
                totalPages: Math.ceil(totalProducts / limit),
                totalProducts,
                limit
            };
        }

        return res.json(response);
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

exports.GetSingleProduct = useAsync(async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Fetch the product
        const product = await ModelProduct.findById(id).lean();

        if (!product) {
            return res.status(404).json(utils.JParser('Product not found', false, null));
        }

        // 2. Fetch all batches for this product
        const batches = await ModelBatch.find({ product: id }).lean();

        // 3. Get all unique supplier IDs from batches
        const supplierIds = [...new Set(batches.map(b => b.supplier).filter(Boolean))];

        // 4. Fetch all suppliers in one query
        const suppliers = await ModelSupplier.find({ _id: { $in: supplierIds } })
            .lean()
            .then(supps => supps.reduce((acc, s) => {
                acc[s._id.toString()] = s;
                return acc;
            }, {}));

        // 5. Attach supplier info to each batch
        const batchesWithSuppliers = batches.map(batch => ({
            ...batch,
            supplier: batch.supplier ? suppliers[batch.supplier.toString()] : null
        }));

        // 6. Fetch all restocks for this product
        const restocks = await ModelRestock.find({ product: id })
            .sort({ creationDateTime: -1 }) // Newest first
            .select('quantity creationDateTime updated_at')
            .lean();

        // 7. Combine all data
        const productWithData = {
            ...product,
            batches: batchesWithSuppliers,
            restocks: restocks
        };

        return res.json(utils.JParser('Product fetched successfully', true, productWithData));

    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

exports.GetAllProductBatch= useAsync(async (req, res) => {
    try {
        const { id } = req.params;
        const batches = await ModelBatch.find({product: id})
            .populate('supplier')
            .lean();

        if (!batches) {
            return res.status(404).json(utils.JParser('batches not found', false, null));
        }

        return res.json(utils.JParser('batches fetched successfully', true, batches));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

//////////////////////////////////////////////////////////////////////////////////////
////RESTOCK ROUTES
//////////////////////////////////////////////////////////////////////////////////////


exports.CreateRestock = useAsync(async (req, res) => {
    try {
        // Define schema for a single restock item
        const itemSchema = Joi.object({
            supplier: Joi.string().required(),
            product: Joi.string().required(),
            quantity: Joi.string().required()
        });

        // Validate the entire array
        const schema = Joi.array().items(itemSchema).required();
        const validator = await schema.validateAsync(req.body);

        // Create all restocks in a single operation
        const restocks = await ModelRestock.insertMany(validator);

        return res.json(utils.JParser(
            `${restocks.length} restocks created successfully`,
            true,
            restocks
        ));

    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

exports.UpdateRestock = useAsync(async (req, res) => {
    try {
        const { id } = req.params;
        const schema = Joi.object({
            supplier: Joi.string().optional(),
            product: Joi.string().optional(),
            quantity: Joi.string().optional()
        });

        const validator = await schema.validateAsync(req.body);
        validator.updated_at = Date.now();

        const updatedRestock = await ModelRestock.findByIdAndUpdate(id, validator, { new: true });

        if (!updatedRestock) {
            return res.status(404).json(utils.JParser('Restock not found', false, null));
        }

        return res.json(utils.JParser('Restock updated successfully', !!updatedRestock, updatedRestock));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

exports.DeleteRestock = useAsync(async (req, res) => {
    try {
        const { id } = req.params;
        const deletedRestock = await ModelRestock.findByIdAndDelete(id);

        if (!deletedRestock) {
            return res.status(404).json(utils.JParser('Restock not found', false, null));
        }

        return res.json(utils.JParser('Restock deleted successfully', !!deletedRestock, deletedRestock));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

exports.GetAllRestocks = useAsync(async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = req.query.limit === 'all' ? null : parseInt(req.query.limit) || 10;
        const skip = req.query.limit === 'all' ? 0 : (page - 1) * limit;

        const query = ModelRestock.find()
            .populate('supplier')
            .populate('product')
            .lean();

        if (limit !== null) query.skip(skip).limit(limit);
        const restocks = await query.exec();

        const response = utils.JParser('Restocks fetched successfully', !!restocks,
            { data: restocks });

        if (limit !== null) {
            const totalRestocks = await ModelRestock.countDocuments();
            response.data.pagination = {
                currentPage: page,
                totalPages: Math.ceil(totalRestocks / limit),
                totalRestocks,
                limit
            };
        }

        return res.json(response);
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

exports.GetSingleRestock = useAsync(async (req, res) => {
    try {
        const { id } = req.params;
        const restock = await ModelRestock.findById(id)
            .populate('supplier')
            .populate('product')
            .lean();

        if (!restock) {
            return res.status(404).json(utils.JParser('Restock not found', false, null));
        }

        return res.json(utils.JParser('Restock fetched successfully', true, restock));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

//////////////////////////////////////////////////////////////////////////////////////
////SUPPLIER ROUTES
//////////////////////////////////////////////////////////////////////////////////////


exports.CreateSupplier = useAsync(async (req, res) => {
    try {
        const schema = Joi.object({
            name: Joi.string().required(),
            product: Joi.string().optional(),
            contactName: Joi.string().optional(),
            contactRole: Joi.string().optional(),
            contactNumber: Joi.string().optional(),
            phone: Joi.string().optional(),
            address: Joi.string().optional(),
            email: Joi.string().email().required(),
            branch: Joi.string().optional()
        });

        const validator = await schema.validateAsync(req.body);

        const validates = await ModelSupplier.findOne({ email: validator.email })
        if (validates) {
            return res.json(utils.JParser('There is another supplier with this email', false, []));
        } else {
            const supplier = await ModelSupplier.create(validator);
            return res.json(utils.JParser('Supplier created successfully', !!supplier, supplier));
        }
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

exports.UpdateSupplier = useAsync(async (req, res) => {
    try {
        const { id } = req.params;
        const schema = Joi.object({
            name: Joi.string().optional(),
            product: Joi.string().optional(),
            contactName: Joi.string().optional(),
            contactRole: Joi.string().optional(),
            contactNumber: Joi.string().optional(),
            phone: Joi.string().optional(),
            address: Joi.string().optional(),
            email: Joi.string().email().optional(),
            branch: Joi.string().optional()
        });

        const validator = await schema.validateAsync(req.body);
        validator.updated_at = Date.now();

        const updatedSupplier = await ModelSupplier.findByIdAndUpdate(id, validator, { new: true });

        if (!updatedSupplier) {
            return res.status(404).json(utils.JParser('Supplier not found', false, null));
        }

        return res.json(utils.JParser('Supplier updated successfully', !!updatedSupplier, updatedSupplier));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

exports.DeleteSupplier = useAsync(async (req, res) => {
    try {
        const { id } = req.params;
        const deletedSupplier = await ModelSupplier.findByIdAndDelete(id);

        if (!deletedSupplier) {
            return res.status(404).json(utils.JParser('Supplier not found', false, null));
        }

        return res.json(utils.JParser('Supplier deleted successfully', !!deletedSupplier, deletedSupplier));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});


exports.GetAllSuppliers = useAsync(async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = req.query.limit === 'all' ? null : parseInt(req.query.limit) || 10;
        const skip = req.query.limit === 'all' ? 0 : (page - 1) * limit;

        const query = ModelSupplier.find().lean();
        if (limit !== null) query.skip(skip).limit(limit);
        const suppliers = await query.exec();


        const supplierIds = suppliers.map(s => s._id);

        const products = await ModelProduct.find({ supplier: { $in: supplierIds } })
            // .select('productName quantity _id supplier')
            .lean();

        const restocks = await ModelRestock.find({ supplier: { $in: supplierIds } })
            // .select('quantity creationDateTime product')
            .lean();

        const productsBySupplier = products.reduce((acc, product) => {
            if (!acc[product.supplier]) acc[product.supplier] = [];
            acc[product.supplier].push(product);
            return acc;
        }, {});

        const restocksBySupplier = restocks.reduce((acc, restock) => {
            if (!acc[restock.supplier]) acc[restock.supplier] = [];
            acc[restock.supplier].push(restock);
            return acc;
        }, {});

        const suppliersWithDetails = suppliers.map(supplier => ({
            ...supplier,
            products: productsBySupplier[supplier._id] || [],
            restocks: restocksBySupplier[supplier._id] || []
        }));

        const response = utils.JParser('Suppliers fetched successfully', true,
            { data: suppliersWithDetails }
        );

        if (limit !== null) {
            const totalSuppliers = await ModelSupplier.countDocuments();
            response.data.pagination = {
                currentPage: page,
                totalPages: Math.ceil(totalSuppliers / limit),
                totalSuppliers,
                limit
            };
        }

        return res.json(response);
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

exports.GetSingleSupplier = useAsync(async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Fetch supplier
        const supplier = await ModelSupplier.findById(id).lean();
        if (!supplier) {
            return res.status(404).json(utils.JParser('Supplier not found', false, null));
        }

        // 2. Fetch related products and restocks
        const [products, restocks] = await Promise.all([
            ModelProduct.find({ supplier: id })
                // .select('productName quantity _id')
                .lean(),
            ModelRestock.find({ supplier: id })
                // .select('quantity creationDateTime product')
                .populate('product', 'productName _id')
                .lean()
        ]);

        // 3. Combine data
        const supplierWithDetails = {
            ...supplier,
            products,
            restocks
        };

        return res.json(utils.JParser('Supplier fetched successfully', true, supplierWithDetails));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

//////////////////////////////////////////////////////////////////////////////////////
////BATCH ROUTES
//////////////////////////////////////////////////////////////////////////////////////

exports.CreateBatch = useAsync(async (req, res) => {
    try {
        const schema = Joi.object({
            manufacturer: Joi.string().required(),
            product: Joi.string().required(),
            invoiceNumber: Joi.string().required(),
            supplier: Joi.string().required(),
            image: Joi.string().allow(''),
            receipt: Joi.string().allow(''),
            batch: Joi.array().items(
                Joi.object({
                    quantity: Joi.number().min(1).required(),
                    batchNumber: Joi.string().required(),
                    expiryDate: Joi.number().required(),
                    sellingPrice: Joi.number().min(0).allow(null),
                    supplyPrice: Joi.number().min(0).allow(null)
                })
            ).min(1).required()
        });

        const validator = await schema.validateAsync(req.body);
        
        // Process each batch item
        const batchPromises = validator.batch.map(async (batchItem) => {

             const batchNumber = batchItem.batchNumber

             if (batchNumber) {
                const existingBatch = await ModelBatch.findOne({ batchNumber });
                if (existingBatch) {
                    return res.status(400).json(utils.JParser(`Batch with batchNumber ${batchNumber} already exists`, false, []));
                }
            }

            const batchData = {
                ...batchItem,
                manufacturer: validator.manufacturer,
                product: validator.product,
                invoiceNumber: validator.invoiceNumber,
                supplier: validator.supplier,
                image: validator.image,
                receipt: validator.receipt,
                creationDateTime: Date.now(),
                updated_at: Date.now()
            };
            return ModelBatch.create(batchData);
        });

        const createdBatches = await Promise.all(batchPromises);

        return res.json(utils.JParser('Batches created successfully', !!createdBatches, createdBatches));
    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});

// Get All Batches
exports.GetAllBatches = useAsync(async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = req.query.limit === 'all' ? null : parseInt(req.query.limit) || 10;
        const skip = req.query.limit === 'all' ? 0 : (page - 1) * limit;

        const query = ModelBatch.find()
            .populate('supplier')
            .populate('product')
            .lean();

        if (limit !== null) query.skip(skip).limit(limit);
        const batches = await query.exec();

        const response = utils.JParser('Batches fetched successfully', !!batches, { data: batches });

        if (limit !== null) {
            const totalBatches = await ModelBatch.countDocuments();
            response.data.pagination = {
                currentPage: page,
                totalPages: Math.ceil(totalBatches / limit),
                totalBatches,
                limit
            };
        }

        return res.json(response);
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Get Single Batch
exports.GetSingleBatch = useAsync(async (req, res) => {
    try {
        const batch = await ModelBatch.findById(req.params.id)
            .populate('supplier')
            .populate('product')
            .lean();

        if (!batch) throw new errorHandle('Batch not found', 404);

        return res.json(utils.JParser('Batch fetched successfully', true, batch));
    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});

// Update Batch
exports.UpdateBatch = useAsync(async (req, res) => {
    try {

        const validator = req.body;
        const batch = await ModelBatch.findByIdAndUpdate(
            req.params.id,
            { ...validator, updated_at: Date.now() },
            { new: true }
        ).lean();

        if (!batch) throw new errorHandle('Batch not found', 404);

        return res.json(utils.JParser('Batch updated successfully', true, batch));
    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});

// Delete Batch
exports.DeleteBatch = useAsync(async (req, res) => {
    try {
        const batch = await ModelBatch.findByIdAndDelete(req.params.id).lean();

        if (!batch) throw new errorHandle('Batch not found', 404);

        return res.json(utils.JParser('Batch deleted successfully', true, batch));
    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});
