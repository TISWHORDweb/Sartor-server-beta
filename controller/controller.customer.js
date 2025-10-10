const dotenv = require("dotenv")
dotenv.config()
const { useAsync, utils, errorHandle, } = require('../core');
const Joi = require("joi");
const ModelTask = require("../models/model.task");
const ModelTaskComment = require("../models/model.taskComment");
const ModelLead = require("../models/model.lead");
const ModelLeadContact = require("../models/model.leadContact");
const { genID } = require("../core/core.utils");
const ModelLpo = require("../models/model.lpo");
const ModelLpoProduct = require("../models/model.lpoProduct");
const ModelInvoice = require("../models/model.invoice");
const ModelCustomer = require("../models/model.customer");
const { Types } = require('mongoose');
const ModelBatch = require("../models/model.batch");
const ModelCommission = require("../models/moddel.commision");
const ModelUser = require("../models/model.user");


//////////////////////////////////////////////////////////////////////////////////////
////LPO ROUTES
//////////////////////////////////////////////////////////////////////////////////////
exports.CreateLpo = useAsync(async (req, res) => {
    try {

        const accountType = req.userType
        const accountID = req.userId

        const schema = Joi.object({
            lead: Joi.string().min(3).required(),
            terms: Joi.string().min(3).required(),
            product: Joi.array().required()
        });

        const validator = await schema.validateAsync(req.body);

        if (accountType === "user") {
            validator.user = accountID
            const user = await ModelUser.findOne({ _id: accountID })
            if (!user) {
                return res.status(400).json(utils.JParser('Invalid user, Try again later', false, []))
            }
            validator.admin = user.admin
        } else {
            validator.admin = accountID
        }

        validator.lpoId = await genID(7)

        const lpo = await ModelLpo.create(validator);

        let createdProducts;
        if (validator.product && validator.product.length > 0) {
            const productsWithLpoId = validator.product.map(product => ({
                ...product,
                lpo: lpo._id
            }));

            createdProducts = await ModelLpoProduct.insertMany(productsWithLpoId);
        }

        const invoice = await createInvoiceFromLpo(lpo._id);

        return res.json(utils.JParser('LPO created successfully', !!lpo, { lpo, products: createdProducts || [], invoice }));

    } catch (e) {
        throw new errorHandle(e.message, 500);
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
        throw new errorHandle(e.message, 500);
    }
});

exports.DeleteLpo = useAsync(async (req, res) => {
    try {
        const { id } = req.params;
        const deletedLpo = await ModelLpo.findByIdAndUpdate(
            id,
            {
                isDeleted: true,
                updated_at: Date.now()
            },
            { new: true }
        );;

        if (!deletedLpo) {
            return res.status(404).json(utils.JParser('LPO not found', false, null));
        }

        // Optional: Delete associated products
        // await ModelLpoProduct.deleteMany({ lpo: id });

        return res.json(utils.JParser('LPO deleted successfully', !!deletedLpo, deletedLpo));

    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});


exports.GetAllLpos = useAsync(async (req, res) => {
    try {
        const accountType = req.userType;
        const accountID = req.userId;

        const page = parseInt(req.query.page) || 1;
        const limit = req.query.limit === "all" ? null : parseInt(req.query.limit) || 10;
        const skip = req.query.limit === "all" ? 0 : (page - 1) * limit;

        let filter = {};
        if (accountType === "user") {
            filter.user = accountID;
        } else if (accountType === "admin") {
            filter.admin = accountID;
        }

        // 🔎 Revamped search
        const search = req.query.search ? req.query.search.trim() : null;
        if (search) {
            filter.$or = [
                { lpoId: { $regex: search, $options: "i" } },   // match LPO ID
                { status: { $regex: search, $options: "i" } },  // match status
                { terms: { $regex: search, $options: "i" } },   // match terms
            ];
        }

        let query = ModelLpo.find(filter)
            .populate("user", "_id fullName")
            .populate("admin", "_id fullName")
            .populate("lead") // can extend with fields
            .lean();

        if (limit !== null) {
            query.skip(skip).limit(limit);
        }

        const lpos = await query.exec();
        const lpoIds = lpos.map(lpo => lpo._id);

        const products = await ModelLpoProduct.find({ lpo: { $in: lpoIds } })
            .populate("product");

        const productsByLpoId = products.reduce((acc, product) => {
            if (!product.lpo) return acc;
            if (!acc[product.lpo]) acc[product.lpo] = [];

            const quantity = parseFloat(product.quantity) || 0;
            const unitPrice = (product.product && !isNaN(parseFloat(product.product.price)))
                ? parseFloat(product.product.price)
                : 0;

            const productAmount = unitPrice * quantity;

            acc[product.lpo].push({
                ...product.toObject(),
                amount: productAmount,
                quantity
            });

            return acc;
        }, {});

        const lposWithProducts = lpos.map(lpo => {
            const lpoProducts = productsByLpoId[lpo._id] || [];
            const totalAmount = lpoProducts.reduce((sum, product) => sum + (product.amount || 0), 0);

            return {
                ...lpo,
                products: lpoProducts,
                totalAmount: parseFloat(totalAmount.toFixed(2))
            };
        });

        const response = utils.JParser("LPOs fetched successfully", true, { lpos: lposWithProducts });

        if (limit !== null) {
            const totalLpos = await ModelLpo.countDocuments(filter);
            response.data.pagination = {
                currentPage: page,
                totalPages: Math.ceil(totalLpos / limit),
                totalLpos,
                limit
            };
        }

        return res.json(response);
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});



exports.GetSingleLpo = useAsync(async (req, res) => {
    try {
        const { id } = req.params;

        const lpo = await ModelLpo.findById(id).lean()
            .populate("user", "_id fullName")
            .populate("admin", "_id fullName")
            .populate('lead');

        if (!lpo) {
            return res.status(404).json(utils.JParser('LPO not found', false, null));
        }

        const products = await ModelLpoProduct.find({ lpo: id }).populate('product');

        const processedProducts = products.map(product => {
            const quantity = parseFloat(product.quantity) || 0;
            const unitPrice = (product.product?.unitPrice) ? parseFloat(product.product.unitPrice) : 0;
            const amount = unitPrice * quantity;

            return {
                ...product.toObject(),
                quantity,
                unitPrice,
                amount: parseFloat(amount.toFixed(2))
            };
        });

        const totalAmount = processedProducts.reduce((sum, product) => sum + product.amount, 0);

        return res.json(utils.JParser('LPO fetched successfully', true, {
            ...lpo,
            products: processedProducts,
            totalAmount: parseFloat(totalAmount.toFixed(2))
        }));

    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});


exports.updateLPOStatus = useAsync(async (req, res) => {
    try {
        const { status, id } = req.body;

        if (!status) {
            throw new errorHandle('Status is required', 400);
        }

        const lpo = await ModelLpo.findById(id);
        if (!lpo) {
            throw new errorHandle('LPO not found', 404);
        }

        // Check stock availability before any updates if status is "In Transit"
        if (status === "In Transit") {
            const lpoProducts = await ModelLpoProduct.find({ lpo: id }).populate('product');

            for (const lpoProduct of lpoProducts) {
                const productId = lpoProduct.product;
                const quantityToDeduct = lpoProduct.quantity;

                // Calculate total available quantity across all batches
                const batches = await ModelBatch.find({
                    product: productId,
                    quantity: { $gt: 0 }
                }).sort({ createdAt: 1 });

                const totalAvailableQuantity = batches.reduce((total, batch) => total + batch.quantity, 0);

                if (totalAvailableQuantity < quantityToDeduct) {
                    throw new errorHandle(`Insufficient stock for this product. Requested: ${quantityToDeduct}, Available: ${totalAvailableQuantity}`, 400);
                }
            }
        }

        // Only update status if stock validation passes
        const updatedLPO = await ModelLpo.findByIdAndUpdate(
            id,
            {
                status,
                updated_at: Date.now()
            },
            { new: true }
        );

        const existingCustomer = await ModelCustomer.findOne({ lead: lpo.lead });

        if (status === "Delivered") {
            if (!existingCustomer) {
                const customerId = await genID(3)
                const newCustomer = await ModelCustomer.create({
                    lead: lpo.lead,
                    user: updatedLPO.user,
                    admin: updatedLPO.admin,
                    customerId,
                    status: "Active"
                });
            }
        }

        if (status === "In Transit") {
            const lpoProducts = await ModelLpoProduct.find({ lpo: id }).populate('product');

            for (const lpoProduct of lpoProducts) {
                const productId = lpoProduct.product;
                const quantityToDeduct = lpoProduct.quantity;

                const batches = await ModelBatch.find({
                    product: productId,
                    quantity: { $gt: 0 }
                }).sort({ createdAt: 1 });

                let remainingQuantity = quantityToDeduct;

                for (const batch of batches) {
                    if (remainingQuantity <= 0) break;

                    const quantityInThisBatch = batch.quantity;

                    if (quantityInThisBatch >= remainingQuantity) {
                        batch.quantity -= remainingQuantity;
                        remainingQuantity = 0;
                    } else {
                        remainingQuantity -= quantityInThisBatch;
                        batch.quantity = 0;
                    }

                    await batch.save();
                }
            }
        }

        // Prepare response
        let response = {
            updatedLPO
        };

        if (status === "Delivered" && !existingCustomer) {
            const customer = await ModelCustomer.findOne({ lead: lpo.lead });
            response.customer = customer;
            response.message += ' and customer created';
        }

        return res.json(utils.JParser(response.message, true, response));

    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});

//////////////////////////////////////////////////////////////////////////////////////
////LEADS ROUTES
//////////////////////////////////////////////////////////////////////////////////////


exports.CreateLead = useAsync(async (req, res) => {
    try {

        const accountID = req.userId
        const accountType = req.userType


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

        const userId = await genID(4);

        //validate data
        const validator = await schema.validateAsync(req.body);
        if (accountType === "user") {
            validator.user = accountID
            const user = await ModelUser.findOne({ _id: accountID })
            if (!user) {
                return res.status(400).json(utils.JParser('Invalid user, Try again later', false, []))
            }
            validator.admin = user.admin
        } else {
            validator.admin = accountID
        }
        validator.userId = userId

        const existingLead = await ModelLead.findOne({ email: validator.email })
        if (existingLead) {
            return res.status(400).json(utils.JParser('Sorry theres another lead register with this email, chabge it and try again ', false, []))
        }

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
        console.log(e)
        throw new errorHandle(e.message, 500);
    }
});


exports.UpdateLead = useAsync(async (req, res) => {
    try {
        const { id } = req.params;
        const schema = Joi.object({
            name: Joi.string().min(3).optional(),
            email: Joi.string().min(3).optional(),
            address: Joi.string().min(3).optional(),
            image: Joi.string().optional(),
            phone: Joi.string().min(3).optional(),
            state: Joi.string().min(3).optional(),
            lga: Joi.string().min(3).optional(),
            type: Joi.string().min(3).optional(),
            stores: Joi.number().optional(),
            dealSize: Joi.string().optional(),
            note: Joi.string().min(3).optional(),
            contact: Joi.array().optional(),
        });

        const validator = await schema.validateAsync(req.body);
        const updatedLead = await ModelLead.findByIdAndUpdate(id, validator, { new: true });

        if (!updatedLead) {
            return res.status(404).json(utils.JParser('Lead not found', false, null));
        }

        return res.json(utils.JParser('Lead updated successfully', !!updatedLead, updatedLead));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

exports.DeleteLead = useAsync(async (req, res) => {
    try {
        const { id } = req.params;
        const deletedLead = await ModelLead.findByIdAndUpdate(
            id,
            {
                isDeleted: true,
                updated_at: Date.now()
            },
            { new: true }
        );;

        if (!deletedLead) {
            return res.status(404).json(utils.JParser('Lead not found', false, null));
        }

        // Optional: Delete associated contacts
        // await ModelLeadContact.deleteMany({ lead: id });

        return res.json(utils.JParser('Lead deleted successfully', !!deletedLead, []));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

exports.GetAllLeads = useAsync(async (req, res) => {
    try {
        const accountID = req.userId;
        const accountType = req.userType;

        const page = parseInt(req.query.page) || 1;
        const limit = req.query.limit === "all" ? null : parseInt(req.query.limit) || 10;
        const skip = req.query.limit === "all" ? 0 : (page - 1) * limit;

        let filter = {};
        if (accountType === "user") {
            filter.user = accountID;
        } else if (accountType === "admin") {
            filter.admin = accountID;
        }

        // 🔎 Add search
        const search = req.query.search ? req.query.search.trim() : null;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { phone: { $regex: search, $options: "i" } },
                { address: { $regex: search, $options: "i" } },
                { state: { $regex: search, $options: "i" } },
                { lga: { $regex: search, $options: "i" } },
                { type: { $regex: search, $options: "i" } },
                { dealSize: { $regex: search, $options: "i" } },
                { note: { $regex: search, $options: "i" } },
                { status: { $regex: search, $options: "i" } },
            ];
        }

        let query = ModelLead.find(filter)
            .populate("user", "_id fullName")
            .populate("admin", "_id fullName")
            .lean();

        if (limit !== null) {
            query.skip(skip).limit(limit);
        }

        const leads = await query.exec();
        const leadIds = leads.map((lead) => lead._id);

        // fetch contacts
        const contacts = await ModelLeadContact.find({ lead: { $in: leadIds } });

        const contactsByLeadId = contacts.reduce((acc, contact) => {
            if (!acc[contact.lead]) acc[contact.lead] = [];
            acc[contact.lead].push(contact);
            return acc;
        }, {});

        const leadsWithContacts = leads.map((lead) => ({
            ...lead,
            contacts: contactsByLeadId[lead._id] || []
        }));

        const response = utils.JParser("Leads fetched successfully", true, { leads: leadsWithContacts });

        if (limit !== null) {
            const totalLeads = await ModelLead.countDocuments(filter);
            response.data.pagination = {
                currentPage: page,
                totalPages: Math.ceil(totalLeads / limit),
                totalLeads,
                limit
            };
        }

        return res.json(response);

    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});



exports.GetSingleLead = useAsync(async (req, res) => {
    try {
        const { id } = req.params;
        const lead = await ModelLead.findById(id)
            .populate("user", "_id fullName")
            .populate("admin", "_id fullName")

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
        throw new errorHandle(e.message, 500);
    }
});

exports.updateLeadStatus = useAsync(async (req, res) => {
    try {
        const { status, id } = req.body;
        const userId = req.userId;

        if (!status) {
            throw new errorHandle('Status is required', 400);
        }

        const lead = await ModelLead.findById(id);
        if (!lead) {
            throw new errorHandle('Lead not found', 404);
        }

        const updatedLead = await ModelLead.findByIdAndUpdate(
            id,
            {
                status,
                updated_at: Date.now()
            },
            { new: true }
        );

        // Prepare response
        let response = {
            lead: updatedLead,
            message: 'Lead status updated successfully'
        };

        return res.json(utils.JParser(response.message, true, response));

    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});

//////////////////////////////////////////////////////////////////////////////////////
////INVOICE ROUTES
//////////////////////////////////////////////////////////////////////////////////////
const createInvoiceFromLpo = async (lpoId) => {
    try {

        const lpo = await ModelLpo.findById(lpoId).populate('lead');

        const lpoProducts = await ModelLpoProduct.find({ lpo: lpoId }).populate('product');

        if (!lpo) {
            throw new errorHandle('Lead not found', 404);
        }

        // Calculate invoice values
        let totalAmount = 0;
        let totalQty = 0;

        lpoProducts.forEach(item => {
            const quantity = parseFloat(item.quantity) || 0;
            const price = item?.product?.price || 0
            totalAmount += quantity * price;
            totalQty += quantity;
        });

        const productCount = lpoProducts.length;

        // Calculate due date (7 days from now)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);

        // Create the invoice
        const invoice = await ModelInvoice.create({
            lpo: lpoId,
            lead: lpo.lead._id,
            user: lpo.user,
            admin: lpo.admin,
            name: lpo.lead.name, // Assuming lead has a name property
            dueDate: dueDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
            totalAmount: totalAmount.toString(),
            qty: totalQty.toString(),
            products: productCount.toString(),
            invoiceId: await genID(5),
            status: "Processing"
        });

        return invoice;
    } catch (error) {
        throw new Error(`Failed to create invoice: ${error.message}`);
    }
};


exports.GetAllInvoices = useAsync(async (req, res) => {
    try {
        const accountID = req.userId;
        const accountType = req.userType;

        const page = parseInt(req.query.page) || 1;
        const limit = req.query.limit === "all" ? null : parseInt(req.query.limit) || 10;
        const skip = req.query.limit === "all" ? 0 : (page - 1) * limit;

        const search = req.query.search ? req.query.search.trim() : null;

        // Base filter by user/admin
        let filter = {};
        if (accountType === "user") {
            filter = { user: accountID };
        } else if (accountType === "admin") {
            filter = { admin: accountID };
        }

        // Add search conditions if provided
        if (search) {
            const searchRegex = new RegExp(search, "i"); // case-insensitive
            filter.$or = [
                { name: searchRegex },
                { invoiceId: searchRegex },
                { products: searchRegex },
                { status: searchRegex },
                // If lpo or lead has searchable fields, you’ll need aggregate or populate + filter after fetch
            ];
        }

        let query = ModelInvoice.find(filter)
            .populate("lead")
            .populate("lpo")
            .populate("admin", "_id fullName")
            .populate("user", "_id fullName")
            .lean();

        if (limit !== null) {
            query = query.skip(skip).limit(limit);
        }

        const invoices = await query.exec();

        const response = utils.JParser("Invoice fetched successfully", true, { invoices });

        if (limit !== null) {
            const totalInvoice = await ModelInvoice.countDocuments(filter);
            response.data.pagination = {
                currentPage: page,
                totalPages: Math.ceil(totalInvoice / limit),
                totalInvoice,
                limit
            };
        }

        return res.json(response);
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});



exports.GetSingleInvoice = useAsync(async (req, res) => {
    try {
        const { id } = req.params;
        const invoice = await ModelInvoice.findById(id)
            .populate("lead")
            .populate("lpo")
            .populate("admin", "_id fullName")
            .populate("user", "_id fullName")
            .lean();

        if (!invoice) {
            return res.status(404).json(utils.JParser('Invoice not found', false, null));
        }

        return res.json(utils.JParser('Invoice fetched successfully', !!invoice, invoice));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

exports.DeleteInvoice = useAsync(async (req, res) => {
    try {
        const { id } = req.params;
        const deletedInvoice = await ModelInvoice.findByIdAndUpdate(
            id,
            {
                isDeleted: true,
                updated_at: Date.now()
            },
            { new: true }
        );;

        if (!deletedInvoice) {
            return res.status(404).json(utils.JParser('Invoice not found', false, null));
        }

        return res.json(utils.JParser('Invoice deleted successfully', !!deletedInvoice, []));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

exports.changeInvoiceStatus = useAsync(async (req, res) => {

    try {

        const invoiceID = req.body.id
        const status = req.body.status

        if (!invoiceID) return res.status(402).json(utils.JParser('provide the tasks id', false, []));

        await ModelInvoice.updateOne({ _id: invoiceID }, { status }).then(async () => {
            const invoice = await ModelInvoice.find({ _id: invoiceID });
            return res.json(utils.JParser('Status changed update Successfully', !!invoice, invoice));
        })

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})



//////////////////////////////////////////////////////////////////////////////////////
////CUSTOMER ROUTES
//////////////////////////////////////////////////////////////////////////////////////

exports.GetAllCustomer = useAsync(async (req, res) => {
    try {
        const accountID = req.userId;
        const accountType = req.userType;

        const page = parseInt(req.query.page) || 1;
        const limit = req.query.limit === "all" ? null : parseInt(req.query.limit) || 10;
        const skip = req.query.limit === "all" ? 0 : (page - 1) * limit;

        const search = req.query.search ? req.query.search.trim() : null;

        // Base filter
        let filter = {};
        if (accountType === "user") {
            filter = { user: accountID };
        } else if (accountType === "admin") {
            filter = { admin: accountID };
        }

        // Add search
        if (search) {
            const searchRegex = new RegExp(search, "i"); // case-insensitive
            filter.$or = [
                { customerId: searchRegex },
                { status: searchRegex },
                // If lead has fields like name/email, aggregate or extra populate + filter needed
            ];
        }

        let query = ModelCustomer.find(filter)
            .populate("lead")
            .populate("admin", "_id fullName")
            .populate("user", "_id fullName")
            .lean();

        if (limit !== null) query = query.skip(skip).limit(limit);

        const customers = await query.exec();

        const response = utils.JParser("Customer fetched successfully", true, { customers });

        if (limit !== null) {
            const totalCustomers = await ModelCustomer.countDocuments(filter);
            response.data.pagination = {
                currentPage: page,
                totalPages: Math.ceil(totalCustomers / limit),
                totalCustomers,
                limit
            };
        }

        return res.json(response);
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});



exports.GetCustomer = useAsync(async (req, res) => {
    try {
        const customer = await ModelCustomer.findById(req.params.id)
            .populate("lead")
            .populate("admin", "_id fullName")
            .populate("user", "_id fullName")
            .lean();

        if (!customer) throw new errorHandle('Customer not found', 404);

        return res.json(utils.JParser('Label fetched successfully', true, customer));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});


exports.UpdateCustomer = useAsync(async (req, res) => {
    try {
        const updatedCustomer = await ModelCustomer.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updated_at: Date.now() },
            { new: true, runValidators: true }
        ).lean();

        if (!updatedCustomer) throw new errorHandle('Customer not found', 404);

        return res.json(
            utils.JParser('Customer updated successfully', true, updatedCustomer)
        );
    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});

exports.DeleteCustomer = useAsync(async (req, res) => {
    try {
        const customer = await ModelCustomer.findByIdAndUpdate(
            req.params.id,
            {
                isDeleted: true,
                updated_at: Date.now()
            },
            { new: true }
        );
        if (!customer) throw new errorHandle('Customer not found', 404);

        return res.json(
            utils.JParser('Customer deleted successfully', true, null)
        );
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});


//////////////////////////////////////////////////////////////////////////////////////
////COMMISSION ROUTES
//////////////////////////////////////////////////////////////////////////////////////
exports.GetAllUserCommision = useAsync(async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = req.query.limit === 'all' ? null : parseInt(req.query.limit) || 10;
        const skip = req.query.limit === 'all' ? 0 : (page - 1) * limit;

        const query = ModelInvoice.find({ user: req.params.id }).lean();
        if (limit !== null) {
            query.skip(skip).limit(limit);
        }
        const invoices = await query.exec();
        const Commission = await ModelCommission.findOne({ status: true })

        const invoicesWithCommission = invoices.map((invoice, index) => {
            const now = new Date();
            const yearLastTwo = now.getFullYear().toString().slice(-2);
            const month = (now.getMonth() + 1).toString().padStart(2, '0');
            const indexPadded = (index + 1).toString().padStart(2, '0');
            const commissionID = `COM${yearLastTwo}${month}-${indexPadded}`;

            const earned = invoice.totalAmount / Commission.price

            return {
                ...invoice,
                commissionID,
                earned: parseFloat(earned.toFixed(2))
            };
        });

        const response = utils.JParser('Commision fetched successfully', true, {
            commission: invoicesWithCommission
        });

        if (limit !== null) {
            const totalInvoice = await ModelInvoice.countDocuments({ user: req.params.id });
            response.data.pagination = {
                currentPage: page,
                totalPages: Math.ceil(totalInvoice / limit),
                totalInvoice,
                limit
            };
        }

        return res.json(response);

    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});