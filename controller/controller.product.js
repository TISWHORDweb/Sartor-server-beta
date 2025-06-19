const dotenv = require("dotenv")
dotenv.config()
const { useAsync, utils, errorHandle, } = require('../core');
const ModelProduct = require("../models/model.product");
const Joi = require("joi");
const ModelRestock = require("../models/model.restock");
const ModelSupplier = require("../models/model.supplier");
const { genID } = require("../core/core.utils");


exports.CreateProduct = useAsync(async (req, res) => {
    try {
        const schema = Joi.object({
            productName: Joi.string().required(),
            supplier: Joi.string().required(),
            // batchNumber: Joi.string().optional(),
            barcodeNumber: Joi.string().optional(),
            quantity: Joi.string().required(),
            unit: Joi.string().required(),
            buyingPrice: Joi.string().required(),
            expiryDate: Joi.string().optional(),
            description: Joi.string().optional(),
            sellingPrice: Joi.string().required(),
            productImage: Joi.string().optional()
        });

        const batchId = await genID(2);

        const validator = await schema.validateAsync(req.body);
        validator.batchId = batchId
        const product = await ModelProduct.create(validator);

        return res.json(utils.JParser('Product created successfully', !!product, product));
    } catch (e) {
        throw new Error(e.message);
    }
});


exports.UpdateProduct = useAsync(async (req, res) => {
    try {
        const { id } = req.params;
        const schema = Joi.object({
            productName: Joi.string().optional(),
            supplier: Joi.string().optional(),
            batchNumber: Joi.string().optional(),
            barcodeNumber: Joi.string().optional(),
            quantity: Joi.string().optional(),
            unit: Joi.string().optional(),
            buyingPrice: Joi.string().optional(),
            expiryDate: Joi.string().optional(),
            description: Joi.string().optional(),
            sellingPrice: Joi.string().optional(),
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
        throw new Error(e.message);
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
        throw new Error(e.message);
    }
});


exports.GetAllProducts = useAsync(async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = req.query.limit === 'all' ? null : parseInt(req.query.limit) || 10;
        const skip = req.query.limit === 'all' ? 0 : (page - 1) * limit;

        const query = ModelProduct.find()
            .populate('supplier')
            .lean();

        if (limit !== null) query.skip(skip).limit(limit);
        const products = await query.exec();

        const productIds = products.map(p => p._id);
        const restocks = await ModelRestock.find({ product: { $in: productIds } })
            .sort({ creationDateTime: -1 })
            .lean();

        const restocksByProduct = restocks.reduce((acc, restock) => {
            if (!acc[restock.product]) acc[restock.product] = [];
            acc[restock.product].push({
                quantity: restock.quantity,
                date: restock.creationDateTime
            });
            return acc;
        }, {});

        const productsWithRestocks = products.map(product => ({
            ...product,
            restocks: (restocksByProduct[product._id] || []).slice(0, 5) // Last 5 restocks
        }));

        const response = utils.JParser('Products fetched successfully', !!products,
            { data: productsWithRestocks }
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
        throw new Error(e.message);
    }
});

exports.GetSingleProduct = useAsync(async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Fetch the product (with supplier info)
        const product = await ModelProduct.findById(id)
            .populate('supplier')
            .lean();

        if (!product) {
            return res.status(404).json(utils.JParser('Product not found', false, null));
        }

        // 2. Fetch all restocks for this product
        const restocks = await ModelRestock.find({ product: id })
            .sort({ creationDateTime: -1 }) // Newest first
            .select('quantity creationDateTime updated_at')
            .lean();

        // 3. Attach restocks to the product
        const productWithRestocks = {
            ...product,
            restocks: restocks // Includes full restock history
        };

        return res.json(utils.JParser('Product fetched successfully', true, productWithRestocks));

    } catch (e) {
        throw new Error(e.message);
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
        throw new Error(e.message);
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
        throw new Error(e.message);
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
        throw new Error(e.message);
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
        throw new Error(e.message);
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
        throw new Error(e.message);
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
        throw new Error(e.message);
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
        throw new Error(e.message);
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
        throw new Error(e.message);
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
        throw new Error(e.message);
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
        throw new Error(e.message);
    }
});