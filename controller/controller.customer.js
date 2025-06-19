const dotenv = require("dotenv")
dotenv.config()
const { useAsync, utils, errorHandle, } = require('../core');
const Joi = require("joi");
const ModelTask = require("../models/model.task");
const ModelTaskComment = require("../models/model.taskComment");
const ModelLead = require("../models/model.lead");
const ModelLeadContact = require("../models/model.leadContact");
const { getNextSMOId } = require("../core/core.utils");
const ModelLpo = require("../models/model.lpo");
const ModelLpoProduct = require("../models/model.lpoProduct");


//////////////////////////////////////////////////////////////////////////////////////
////LPO ROUTES
//////////////////////////////////////////////////////////////////////////////////////
exports.CreateLpo = useAsync(async (req, res) => {
    try {
        const schema = Joi.object({
            lead: Joi.string().min(3).required(),
            terms: Joi.string().min(3).required(),
            product: Joi.array().required()
        });

        const validator = await schema.validateAsync(req.body);

        const lpo = await ModelLpo.create(validator);

        if (validator.product && validator.product.length > 0) {
            const productsWithLpoId = validator.product.map(product => ({
                ...product,
                lpo: lpo._id
            }));

            await ModelLpoProduct.insertMany(productsWithLpoId);
        }

        return res.json(utils.JParser('LPO created successfully', !!lpo, lpo));

    } catch (e) {
        throw new Error(e.message);
    }
});

exports.UpdateLpo = useAsync(async (req, res) => {
    try {
        const { id } = req.params;
        const schema = Joi.object({
            lead: Joi.string().min(3).optional(),
            terms: Joi.string().min(3).optional(),
            status: Joi.string().min(3).optional(),
        });

        const validator = await schema.validateAsync(req.body);
        const updatedLpo = await ModelLpo.findByIdAndUpdate(id, validator, { new: true });

        if (!updatedLpo) {
            return res.status(404).json(utils.JParser('LPO not found', false, null));
        }

        return res.json(utils.JParser('LPO updated successfully', !!updatedLpo, updatedLpo));

    } catch (e) {
        throw new Error(e.message);
    }
});

exports.DeleteLpo = useAsync(async (req, res) => {
    try {
        const { id } = req.params;
        const deletedLpo = await ModelLpo.findByIdAndDelete(id);

        if (!deletedLpo) {
            return res.status(404).json(utils.JParser('LPO not found', false, null));
        }

        // Optional: Delete associated products
        await ModelLpoProduct.deleteMany({ lpo: id });

        return res.json(utils.JParser('LPO deleted successfully', !!deletedLpo, deletedLpo));

    } catch (e) {
        throw new Error(e.message);
    }
});


exports.GetAllLpos = useAsync(async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Fetch paginated LPOs
        const lpos = await ModelLpo.find().skip(skip).limit(limit).lean();

        // Fetch associated products in a single query
        const lpoIds = lpos.map(lpo => lpo._id);
        const products = await ModelLpoProduct.find({ lpo: { $in: lpoIds } });

        // Group products by LPO ID
        const productsByLpoId = products.reduce((acc, product) => {
            if (!acc[product.lpo]) acc[product.lpo] = [];
            acc[product.lpo].push(product);
            return acc;
        }, {});

        // Attach products to LPOs
        const lposWithProducts = lpos.map(lpo => ({
            ...lpo,
            products: productsByLpoId[lpo._id] || []
        }));

        // Pagination metadata
        const totalLpos = await ModelLpo.countDocuments();

        return res.json(utils.JParser('LPOs fetched successfully', true, {
            lpos: lposWithProducts,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalLpos / limit),
                totalLpos,
                limit
            }
        }));

    } catch (e) {
        throw new Error(e.message);
    }
});

exports.GetSingleLpo = useAsync(async (req, res) => {
    try {
        const { id } = req.params;
        const lpo = await ModelLpo.findById(id).lean();

        if (!lpo) {
            return res.status(404).json(utils.JParser('LPO not found', false, null));
        }

        // Fetch associated products
        const products = await ModelLpoProduct.find({ lpo: id });

        return res.json(utils.JParser('LPO fetched successfully', true, {
            ...lpo,
            products
        }));

    } catch (e) {
        throw new Error(e.message);
    }
});

//////////////////////////////////////////////////////////////////////////////////////
////LEADS ROUTES
//////////////////////////////////////////////////////////////////////////////////////
exports.CreateLead = useAsync(async (req, res) => {
    try {
        //create data if all data available
        const schema = Joi.object({
            name: Joi.string().min(3).required(),
            address: Joi.string().min(3).required(),
            email: Joi.string().min(3).required(),
            phone: Joi.string().min(3).optional(),
            state: Joi.string().min(3).required(),
            type: Joi.string().min(3).required(),
            stores: Joi.number().required(),
            dealSize: Joi.string().required(),
            status: Joi.string().min(3).required(),
            notes: Joi.string().min(3).optional(),
            contact: Joi.array().required(),
        });

        const userId = await getNextSMOId(1);

        //validate data
        const validator = await schema.validateAsync(req.body);
        validator.userId = userId

        let createdContacts;
        const lead = await ModelLead.create(validator);
        if (validator.contact && validator.contact.length > 0) {
            const contactsWithLeadId = validator.contact.map(contact => ({
                ...contact,
                lead: lead._id
            }));

            createdContacts = await ModelLeadContact.insertMany(contactsWithLeadId);
        }

        return res.json(utils.JParser('Lead and contacts created successfully', !!lead, {
            lead,
            contacts: createdContacts || []
        }));

    } catch (e) {
        throw new Error(e.message); // Note: It should be "Error" not "errorHandle" unless that's your custom class
    }
});


exports.UpdateLead = useAsync(async (req, res) => {
    try {
        const { id } = req.params;
        const schema = Joi.object({
            name: Joi.string().min(3).optional(),
            address: Joi.string().min(3).optional(),
            email: Joi.string().min(3).optional(),
            phone: Joi.string().min(3).optional(),
            state: Joi.string().min(3).optional(),
            type: Joi.string().min(3).optional(),
            stores: Joi.number().optional(),
            dealSize: Joi.string().optional(),
            status: Joi.string().min(3).optional(),
            notes: Joi.string().min(3).optional(),
            contact: Joi.array().optional(),
        });

        const validator = await schema.validateAsync(req.body);
        const updatedLead = await ModelLead.findByIdAndUpdate(id, validator, { new: true });

        if (!updatedLead) {
            return res.status(404).json(utils.JParser('Lead not found', false, null));
        }

        return res.json(utils.JParser('Lead updated successfully', !!updatedLead, updatedLead));
    } catch (e) {
        throw new Error(e.message);
    }
});

exports.DeleteLead = useAsync(async (req, res) => {
    try {
        const { id } = req.params;
        const deletedLead = await ModelLead.findByIdAndDelete(id);

        if (!deletedLead) {
            return res.status(404).json(utils.JParser('Lead not found', false, null));
        }

        // Optional: Delete associated contacts
        await ModelLeadContact.deleteMany({ lead: id });

        return res.json(utils.JParser('Lead deleted successfully', !!deletedLead, deletedLead));
    } catch (e) {
        throw new Error(e.message);
    }
});

exports.GetAllLeads = useAsync(async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Current page (default: 1)
        const limit = parseInt(req.query.limit) || 10; // Items per page (default: 10)
        const skip = (page - 1) * limit;

        // 1. Fetch paginated leads
        const leads = await ModelLead.find()
            .skip(skip)
            .limit(limit)
            .lean(); // Convert to plain JS object for modification

        // 2. Get all contacts for these leads in a single query
        const leadIds = leads.map(lead => lead._id);
        const contacts = await ModelLeadContact.find({ lead: { $in: leadIds } });

        // 3. Group contacts by lead
        const contactsByLeadId = contacts.reduce((acc, contact) => {
            if (!acc[contact.lead]) acc[contact.lead] = [];
            acc[contact.lead].push(contact);
            return acc;
        }, {});

        // 4. Attach contacts to leads
        const leadsWithContacts = leads.map(lead => ({
            ...lead,
            contacts: contactsByLeadId[lead._id] || []
        }));

        // 5. Get total count for pagination metadata
        const totalLeads = await ModelLead.countDocuments();
        const totalPages = Math.ceil(totalLeads / limit);

        return res.json(utils.JParser('Leads fetched successfully', true, {
            leads: leadsWithContacts,
            pagination: {
                currentPage: page,
                totalPages,
                totalLeads,
                limit
            }
        }));

    } catch (e) {
        throw new Error(e.message);
    }
});

exports.GetSingleLead = useAsync(async (req, res) => {
    try {
        const { id } = req.params;
        const lead = await ModelLead.findById(id);

        if (!lead) {
            return res.status(404).json(utils.JParser('Lead not found', false, null));
        }

        // Fetch contacts associated with this lead
        const contacts = await ModelLeadContact.find({ lead: id });

        // Attach contacts to the lead
        const leadWithContacts = {
            ...lead.toObject(),
            contacts
        };

        return res.json(utils.JParser('Lead fetched successfully', !!leadWithContacts, leadWithContacts));
    } catch (e) {
        throw new Error(e.message);
    }
});