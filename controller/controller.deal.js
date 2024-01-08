const dotenv = require("dotenv")
dotenv.config()
const { useAsync, utils, errorHandle, } = require('../core');
const ModelSalesAgent = require("../models/model.salesAgent");
const ModelDeal = require("../models/model.deal");
const Joi = require("joi");
const { modelName } = require("../models/model.company");
const ModelProduct = require("../models/model.product");
const ModelCompany = require("../models/model.company");

exports.deal = useAsync(async (req, res) => {

    try {

        const salesAgentID = req.salesAgentID

        const validate =  await ModelDeal.findOne({companyID:req.body.companyID, productID:req.body.productID})

        if(validate){
            return res.status(402).json(utils.JParser('Theres a created deal for this company and product already', false, []));
        }
        //create data if all data available
        const schema = Joi.object({
            productID: Joi.string().min(1).required(),
            companyID: Joi.string().min(1).required(),
            dealName: Joi.optional(),
        })

        //capture data
        const { dealName, companyID, productID } = req.body;

        //validate data
        const validator = await schema.validateAsync(req.body);

        validator.salesAgentID = salesAgentID

        const deal = await ModelDeal.create(validator)
        return res.json(utils.JParser('Deal created successfully', !!deal, deal));

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

        const deal = await ModelDeal.find({ salesAgentID: salesAgentID });
        return res.json(utils.JParser('Deal fetch successfully', !!deal, deal));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.singleDeal = useAsync(async (req, res) => {

    try {
        const dealID = req.params.id
        if (!dealID) return res.status(402).json(utils.JParser('provide the Deal id', false, []));

        const deal = await ModelDeal.findOne({ dealID: dealID });

        if (deal) {
            const product = await ModelDeal.findOne({ productID: deal.productID });
            const company = await ModelDeal.findOne({ companyID: deal.companyID });

            res.json(utils.JParser('Deal fetch successfully', !!deal, { deal, company, product }));
        }


    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.companyDeal = useAsync(async (req, res) => {

    try {
        const companyID = req.params.id;

        if (!companyID) return res.status(402).json(utils.JParser('provide the Company id', false, []));
        
        const deal = await ModelDeal.find({ companyID: companyID });
        
        if (deal) {
            const company = await ModelCompany.findOne({ _id: companyID })
            const eachproducts = await Promise.all(deal.map(async (dealItem) => {
                let each = await ModelProduct.findOne({ _id: dealItem?.productID }).lean();
                return {
                    each
                };
            }));

            const products = eachproducts.map(item => item.each)
        
            res.json(utils.JParser('Deal fetch successfully', true, {company,products}));
        } else {
            res.json(utils.JParser('Deal not found', false, null));
        }        

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.allDeal = useAsync(async (req, res) => {

    try {
        const deal = await ModelDeal.find();
        return res.json(utils.JParser('All Deals fetch successfully', !!deal, deal));
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

