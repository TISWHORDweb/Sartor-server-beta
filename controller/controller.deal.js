const dotenv = require("dotenv")
dotenv.config()
const { useAsync, utils, errorHandle, } = require('../core');
const ModelSalesAgent = require("../models/model.salesAgent");
const ModelDeal = require("../models/model.deal");
const Joi = require("joi");
const { modelName } = require("../models/model.company");
const ModelProduct = require("../models/model.product");
const ModelCompany = require("../models/model.company");
const ModelDealProduct = require("../models/model.dealProduct");

exports.deal = useAsync(async (req, res) => {

    try {

        // let salesAgentID;
        // let adminID;

        // if (req.salesAgentID) {
        //     salesAgentID = req.salesAgentID
        // } else if (req.adminID) {
        //     adminID = req.adminID
        // }

        // //create data if all data available
        // req.body.deal.salesAgentID = salesAgentID
        // req.body.deal.adminID = adminID

        const dealData = req.body.deal
        const productData = req.body.product

        const newDeal = new ModelDeal(dealData)
        const savedDeal = await newDeal.save();
        const dealId = savedDeal._id

        const productWithDealId = productData.map((product) => ({
            ...product,
            dealID: dealId
        }));

        const product = await ModelDealProduct.insertMany(productWithDealId)

        return res.json(utils.JParser('Deal created successfully', !!product, { newDeal, product }));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }

})

exports.editDeal = useAsync(async (req, res) => {

    try {

        const dealID = req.body.id
        const body = req.body

        if (!dealID) return res.status(402).json(utils.JParser('provide the Deal id', false, []));

        await ModelDeal.updateOne({ _id: dealID }, body).then(async () => {
            const deal = await ModelDeal.find({ _id: dealID });
            return res.json(utils.JParser('Deal update Successfully', !!deal, deal));
        })

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.getSalesAgentDeal = useAsync(async (req, res) => {

    try {

        const salesAgentID = req.salesAgentID

        const salesAgent = await ModelSalesAgent.findOne(salesAgentID)

        const deals = await ModelDeal.find({ salesAgentID: salesAgentID })
        const dealPromises = deals.map(async (deal) => {
            const products = await ModelDealProduct.find({ dealID: deal._id });
            return { ...deal.toJSON(), products };
        });

        const Deal = await Promise.all(dealPromises);

        return res.json(utils.JParser('Deal fetch successfully', !!salesAgent, { salesAgent, Deal }));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.singleDeal = useAsync(async (req, res) => {

    try {
        const dealID = req.params.id
        if (!dealID) return res.status(402).json(utils.JParser('provide the Deal id', false, []));

        const deal = await ModelDeal.findOne({ _id: dealID });

        if (deal) {
            const products = await ModelDealProduct.find({ dealID: deal._id })
            const salesAgent = await ModelSalesAgent.findOne({ _id: deal.salesAgentID })
            const company = await ModelCompany.findOne({ _id: deal.companyID });

            res.json(utils.JParser('Deal fetch successfully', !!deal, { deal, company, salesAgent, products }));
        }


    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.companyDeal = useAsync(async (req, res) => {

    try {
        const companyID = req.params.id;

        if (!companyID) return res.status(402).json(utils.JParser('provide the Company id', false, []));

        const deals = await ModelDeal.find({ companyID: companyID });

        if (deals) {
            const company = await ModelCompany.findOne({ _id: companyID })

            const dealPromises = deals.map(async (deal) => {
                const products = await ModelDealProduct.find({ dealID: deal._id });
                return { ...deal.toJSON(), products };
            });
    
            const Deal = await Promise.all(dealPromises);

            res.json(utils.JParser('Deal fetch successfully', true, { company, Deal }));
        } else {
            res.json(utils.JParser('Deal not found', false, null));
        }

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.allDeal = useAsync(async (req, res) => {

    try {
        const deals = await ModelDeal.find();

        // const Deal = await promises.all(deals.map(async (deal) => {
        //     const products = await ModelDealProduct.find({ dealID: deal._id })
        //     return { ...deal.toJSON(), products }
        // }))

        const dealPromises = deals.map(async (deal) => {
            const products = await ModelDealProduct.find({ dealID: deal._id });
            return { ...deal.toJSON(), products };
        });

        const Deal = await Promise.all(dealPromises);

        return res.json(utils.JParser('All Deals fetch successfully', !!Deal, Deal));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.deleteDeal = useAsync(async (req, res) => {
    try {
        const dealID = req.body.id
        if (!dealID) return res.status(402).json(utils.JParser('provide the deal id', false, []));

        const deal = await ModelDeal.deleteOne({ _id: dealID })
        return res.json(utils.JParser('Deal deleted successfully', !!deal, []));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }

});

