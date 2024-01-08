const dotenv = require("dotenv")
dotenv.config()
const { useAsync, utils, errorHandle, } = require('../core');
const Joi = require("joi");
const ModelCompany = require("../models/model.company");
const ModelCompanyType = require("../models/model.companyType");

exports.company = useAsync(async (req, res) => {

    try {

        const salesAgentID = req.salesAgentID

        const CheckcompanyName = await ModelCompany.findOne({ companyName: req.body.companyName })

        if (CheckcompanyName) return res.status(402).json(utils.JParser('Theres a company with this name already, kindly change and retry', false, []));

        //create data if all data available
        const schema = Joi.object({
            companyName: Joi.string().min(1).required(),
            typeOfCompanyID: Joi.string().min(1).required(),
            email: Joi.string().min(1).required(),
            address: Joi.string().min(1).required(),
            typeOfCompany: Joi.string().optional(),
            phone: Joi.string().optional(),
            managerName: Joi.string().optional(),
            managerEmail: Joi.string().optional(),
            managerPhone: Joi.string().optional(),
            image: Joi.string().optional(),
            checkType: Joi.optional(),
            location: Joi.string().optional(),
        })

        //capture data
        const { companyName, typeOfCompanyID, email, address, typeOfCompany, phone, managerName, managerEmail, managerPhone, image, location, checkType } = req.body;

        //validate data
        const validator = await schema.validateAsync(req.body);

        validator.salesAgentID = salesAgentID

        const company = await ModelCompany.create(validator)
        return res.json(utils.JParser('Company created successfully', !!company, company));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }

})

exports.editCompany = useAsync(async (req, res) => {

    try {

        const companyID = req.body.id
        const body = req.body

        if (!companyID) return res.status(402).json(utils.JParser('provide the company id', false, []));

        await ModelCompany.updateOne({ _id: companyID }, body).then(async () => {
            const company = await ModelCompany.find({ _id: companyID });
            return res.json(utils.JParser('Company update Successfully', !!company, company));
        })

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.getSalesAgentCompany = useAsync(async (req, res) => {

    try {

        const salesAgentID = req.salesAgentID

        const company = await ModelCompany.find({ salesAgentID: salesAgentID });
        return res.json(utils.JParser('Company fetch successfully', !!company, company));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.getCompanyByType = useAsync(async (req, res) => {

    try {

        const typeOfCompanyID = req.params.id

        const company = await ModelCompany.find({ typeOfCompanyID: typeOfCompanyID });
        return res.json(utils.JParser('Company fetch successfully', !!company, company));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.singleCompany = useAsync(async (req, res) => {

    try {
        const companyID = req.params.id

        if (!companyID) return res.status(402).json(utils.JParser('provide the company id', false, []));

        const company = await ModelCompany.findOne({ _id: companyID })
        return res.json(utils.JParser('Product fetch successfully', !!company, company));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.allCompany = useAsync(async (req, res) => {

    try {
        const company = await ModelCompany.find();
        return res.json(utils.JParser('All Company fetch successfully', !!company, company));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.deleteCompany = useAsync(async (req, res) => {
    try {
        const companyID = req.body.id
        if (!companyID) return res.status(402).json(utils.JParser('provide the company id', false, []));

        const company = await ModelCompany.deleteOne({ _id: companyID })
        return res.json(utils.JParser('Product deleted successfully', !!company, []));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }

});


//************************************************************************************************
// TYPE OF COMPANY ////////////////////////////////////////////////////////////////
//************************************************************************************************

exports.companyType = useAsync(async (req, res) => {

    try {

        const CheckcompanyTypeName = await ModelCompanyType.findOne({ typeOfCompany: req.body.typeOfCompany })

        if (CheckcompanyTypeName) return res.status(402).json(utils.JParser('This company type is created already, kindly change and retry', false, []));

        //create data if all data available
        const schema = Joi.object({
            typeOfCompany: Joi.string().min(1).required()
        })

        //capture data
        const { typeOfCompany } = req.body;

        //validate data
        const validator = await schema.validateAsync(req.body);

        const companyType = await ModelCompanyType.create(validator)
        return res.json(utils.JParser('Company type created successfully', !!companyType, companyType));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }

})


exports.editCompanyType = useAsync(async (req, res) => {

    try {

        const companyTypeID = req.body.id
        const body = req.body

        if (!companyTypeID) return res.status(402).json(utils.JParser('provide the company type id', false, []));

        await ModelCompanyType.updateOne({ _id: companyTypeID }, body).then(async () => {
            const companyType = await ModelCompanyType.find({ _id: companyTypeID });
            return res.json(utils.JParser('Company type update Successfully', !!companyType, companyType));
        })

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.singleCompanyType = useAsync(async (req, res) => {

    try {
        const companyTypeID = req.params.id

        if (!companyTypeID) {
            return res.status(402).json(utils.JParser('provide the company type id', false, []));
        } else {
            const companyType = await ModelCompanyType.findOne({ _id: companyTypeID })
            return res.json(utils.JParser('Company type fetch successfully', !!companyType, companyType));
        }
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.allCompanyType = useAsync(async (req, res) => {

    try {
        const companyType = await ModelCompanyType.find();
        return res.json(utils.JParser('All Company type fetch successfully', !!companyType, companyType));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.deleteCompanyType = useAsync(async (req, res) => {
    try {
        const companyTypeID = req.body.id
        if (!companyTypeID) return res.status(402).json(utils.JParser('provide the company type id', false, []));

        const companyType = await ModelCompanyType.deleteOne({ _id: companyTypeID })
        return res.json(utils.JParser('Company deleted successfully', !!companyType, []));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }

});