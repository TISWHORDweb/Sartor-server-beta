const dotenv = require("dotenv")
dotenv.config()
const { useAsync, utils, errorHandle, } = require('../core');
const ModelSalesAgent = require("../models/model.salesAgent");
const ModelProduct = require("../models/model.product");
const Joi = require("joi");
const ModelProductCategory = require("../models/model.productCategory");

exports.product = useAsync(async (req, res) => {

    try {

        const adminID = req.adminID

        //create data if all data available
        const schema = Joi.object({
            productName: Joi.string().min(1).required(),
            productID: Joi.string().min(1).required(),
            categoryID: Joi.string().min(1).required(),
            buyingPrice: Joi.string().min(1).required(),
            quantity: Joi.string().min(1).required(),
            unit: Joi.required(),
            expiryDate: Joi.string().min(1).required(),
            productImage: Joi.string().min(1).required(),
            sellingPrice: Joi.string().min(1).required()
        })

        //capture data
        const { productName, productID, categoryID, buyingPrice, quantity, unit, expiryDate, productImage, sellingPrice } = req.body;

        //validate data
        const validator = await schema.validateAsync(req.body);

        validator.adminID = adminID

        const product = await ModelProduct.create(validator)
        return res.json(utils.JParser('Product created successfully', !!product, product));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }

})

exports.editProduct = useAsync(async (req, res) => {

    try {

        const productID = req.body.id
        const body = req.body

        if (!productID) return res.status(402).json(utils.JParser('provide the Product id', false, []));

        await ModelProduct.updateOne({ _id: productID }, body).then(async () => {
            const product = await ModelProduct.find({ _id: productID });
            return res.json(utils.JParser('Product update Successfully', !!product, product));
        })

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.getAdminProduct = useAsync(async (req, res) => {

    try {

        const adminID = req.adminID

        const product = await ModelProduct.find({ adminID: adminID });
        return res.json(utils.JParser('Product fetch successfully', !!product, product));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.singleProduct = useAsync(async (req, res) => {

    try {
        const productID = req.params.id

        const product = await ModelProduct.findOne({ productID: productID });

        if (!product) {
            const product = await ModelProduct.findOne({ _id: productID })
            return res.json(utils.JParser('Product fetch successfully', !!product, product));
        }

        res.json(utils.JParser('Product fetch successfully', !!product, product));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.allProduct = useAsync(async (req, res) => {

    try {
        const product = await ModelProduct.find();
        return res.json(utils.JParser('All Products fetch successfully', !!product, product));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.deleteProduct = useAsync(async (req, res) => {
    try {
        const productID = req.body.id
        if (!productID) return res.status(402).json(utils.JParser('provide the product id', false, []));

        const product = await ModelProduct.deleteOne({ _id: productID })
        return res.json(utils.JParser('Product deleted successfully', !!product, []));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }

});

exports.getProductsByCategory = useAsync(async (req, res) => {

    try {

        const categoryID = req.params.id

        const category = await ModelProductCategory.findOne({ _id: categoryID });
        if (category) {
            const product = await ModelProduct.find({ categoryID: categoryID });
            return res.json(utils.JParser('Product fetch successfully', !!category, { category, product }));
        } else {
            return res.status(402).json(utils.JParser('Product not found', !!category, []));
        }

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

//////////////////////////////////////////////////////////////////////////////
// PRODUCT CATEGORY
//////////////////////////////////////////////////////////////////////////////

exports.productCategory = useAsync(async (req, res) => {

    try {

        const adminID = req.adminID

        //create data if all data available
        const schema = Joi.object({
            category: Joi.string().min(1).required(),
        })

        //capture data
        const { category } = req.body;

        //validate data
        const validator = await schema.validateAsync(req.body);

        validator.adminID = adminID

        const productCategory = await ModelProductCategory.create(validator)
        return res.json(utils.JParser('Product category created successfully', !!productCategory, productCategory));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }

})

exports.editProductCategory = useAsync(async (req, res) => {

    try {

        const categoryID = req.body.id
        const body = req.body

        if (!categoryID) return res.status(402).json(utils.JParser('provide the Product category id', false, []));

        await ModelProductCategory.updateOne({ _id: categoryID }, body).then(async () => {
            const category = await ModelProductCategory.find({ _id: categoryID });
            return res.json(utils.JParser('Product category update Successfully', !!category, category));
        })

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})


exports.singleProductCategory = useAsync(async (req, res) => {

    try {
        const categoryID = req.params.id

        const category = await ModelProductCategory.findOne({ _id: categoryID });

        if (!category) {
            return res.json(utils.JParser('Product not found', false, []));
        }

        res.json(utils.JParser('Product category fetch successfully', !!category, category));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.allProductCategory = useAsync(async (req, res) => {

    try {
        const category = await ModelProductCategory.find();
        return res.json(utils.JParser('All product category fetch successfully', !!category, category));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.deleteProductCategory = useAsync(async (req, res) => {
    try {
        const categoryID = req.body.id
        if (!categoryID) return res.status(402).json(utils.JParser('provide the product category id', false, []));

        const category = await ModelProductCategory.deleteOne({ _id: categoryID })
        return res.json(utils.JParser('Product deleted successfully', !!category, []));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }

});