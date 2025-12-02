const dotenv = require("dotenv")
dotenv.config()
const { useAsync, utils, errorHandle, } = require('../core');
const Joi = require("joi");
const ModelTask = require("../models/model.task");
const ModelTaskComment = require("../models/model.taskComment");
const ModelLead = require("../models/model.lead");
const ModelLeadContact = require("../models/model.leadContact");
const { genID, sendBulkNotification, generateNotification, generateDeliveryCode } = require("../core/core.utils");
const ModelLpo = require("../models/model.lpo");
const ModelLpoProduct = require("../models/model.lpoProduct");
const ModelInvoice = require("../models/model.invoice");
const ModelCustomer = require("../models/model.customer");
const { Types } = require('mongoose');
const ModelBatch = require("../models/model.batch");
const ModelCommission = require("../models/moddel.commision");
const ModelUser = require("../models/model.user");
const ModelAdmin = require("../models/model.admin");
const ModelAssignment = require("../models/model.assignment");
const EmailService = require("../services");
const ModelProduct = require("../models/model.product");



//////////////////////////////////////////////////////////////////////////////////////
////LPO ROUTES
//////////////////////////////////////////////////////////////////////////////////////
exports.CreateLpo = useAsync(async (req, res) => {
    try {

        const accountType = req.userType
        const accountID = req.userId
        const account = req.user

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
        if (lpo._id) {
            const invoice = await createInvoiceFromLpo(lpo._id);

            if (accountType === "user") {
                let managerEmail = null;
                let managerID = null;

                const admin = await ModelAdmin.findById(account.admin);
                const Allmanager = await ModelAssignment.find({ assignedUser: accountID }).populate('assignedtoUser', '_id email');

                if (Allmanager.length > 0) {
                    const manager = Allmanager[Allmanager.length - 1];
                    managerEmail = manager.assignedtoUser?.email;
                    managerID = manager?.assignedtoUser?._id;
                }

                const createdByData = { fullName: account?.fullName };
                const totalProducts = validator.product.length;
                const totalQuantity = validator.product.reduce((sum, item) => sum + (item.quantity || 0), 0);

                const message = `📋 New LPO: ${totalProducts} products (${totalQuantity} units) - ${validator.terms}`;

                // Send emails
                if (admin?.email) {
                    EmailService.sendLPOEmail(validator, createdByData, admin.email);
                }
                if (managerEmail) {
                    EmailService.sendLPOEmail(validator, createdByData, managerEmail);
                }

                // Send notifications only if we have valid recipients
                const notificationUserIds = [];
                if (admin?._id) notificationUserIds.push(admin._id.toString());
                if (managerID) notificationUserIds.push(managerID.toString());

                if (notificationUserIds.length > 0) {
                    await sendBulkNotification({
                        userIds: notificationUserIds,
                        message,
                        type: 4
                    });
                }
            }

            return res.json(utils.JParser('LPO created successfully', !!lpo, { lpo, products: createdProducts || [], invoice }));
        } else {
            return res.status(400).json(utils.JParser('unknown error occured, Try again later', false, []))

        }
    } catch (e) {
        console.log(e)
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
            const user = await ModelUser.findById(accountID);
            if (user?.role === "Inventory Manager") {
                filter.status = { $in: ["sorted", "processing"] };
                filter.admin = user.admin;
            } else if (user?.role === "Driver") {
                filter.status = { $in: ["sorted", "processing", "In Transit"] };
                filter.admin = user.admin;
            } else {
                filter.user = accountID;
            }
        } else if (accountType === "admin") {
            filter.admin = accountID;
        }

        const search = req.query.search ? req.query.search.trim() : null;
        if (search) {
            filter.$or = [
                { lpoId: { $regex: search, $options: "i" } },
                { status: { $regex: search, $options: "i" } },
                { terms: { $regex: search, $options: "i" } },
            ];
        }

        let query = ModelLpo.find(filter)
            .sort({ _id: -1 })
            .populate("user", "_id fullName")
            .populate("admin", "_id fullName")
            .populate("lead")
            .lean();

        if (limit !== null) {
            query = query.skip(skip).limit(limit);
        }

        const lpos = await query.exec();
        const lpoIds = lpos.map(lpo => lpo._id);

        const lpoProducts = await ModelLpoProduct.find({ lpo: { $in: lpoIds } })
            .populate("product")
            .lean();

        const productsByLpo = lpoProducts.reduce((acc, lp) => {
            if (!lp.lpo) return acc;
            if (!acc[lp.lpo]) acc[lp.lpo] = [];

            const quantity = Number(lp.quantity) || 0;
            const price = Number(lp.product?.price) || 0;
            const amount = quantity * price;

            acc[lp.lpo].push({
                ...lp,
                quantity,
                price,
                amount
            });

            return acc;
        }, {});

        const lposWithProducts = lpos.map(lpo => {
            const lpoProducts = productsByLpo[lpo._id] || [];
            const totalAmount = lpoProducts.reduce((sum, p) => sum + p.amount, 0);
            const totalQuantity = lpoProducts.reduce((sum, p) => sum + p.quantity, 0);

            return {
                ...lpo,
                // products: lpoProducts,
                totalAmount: parseFloat(totalAmount.toFixed(2)),
                totalQuantity
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
            .populate("lead");

        if (!lpo) {
            return res.status(404).json(utils.JParser('LPO not found', false, null));
        }

        const products = await ModelLpoProduct.find({ lpo: id }).populate('product').lean();

        const processedProducts = products.map(product => {
            const quantity = Number(product.quantity) || 0;
            const unitPrice = Number(product.product?.unitPrice) || 0;
            const amount = quantity * unitPrice;

            return {
                ...product,
                quantity,
                unitPrice,
                amount: parseFloat(amount.toFixed(2))
            };
        });

        const totalAmount = processedProducts.reduce((sum, product) => sum + product.amount, 0);
        const totalQuantity = processedProducts.reduce((sum, product) => sum + product.quantity, 0);

        return res.json(utils.JParser('LPO fetched successfully', true, {
            ...lpo,
            products: processedProducts,
            totalAmount: parseFloat(totalAmount.toFixed(2)),
            totalQuantity
        }));

    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});



exports.updateLPOStatus = useAsync(async (req, res) => {
    try {
        const { status, id, deliveredTo } = req.body;
        let deliveryCode = "";

        if (!status) {
            throw new errorHandle('Status is required', 400);
        }

        const lpo = await ModelLpo.findById(id).populate('lead');
        if (!lpo) {
            throw new errorHandle('LPO not found', 404);
        }
        const oldStatus = lpo.status || 'Unknown'
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

        if (status === "Processing") {
            if (lpo?.lead?.email) {
                deliveryCode = await generateDeliveryCode()

                const lpoData = {
                    createdAt: lpo.createdAt,
                    deliveryCode
                }
                const recipientData = {
                    fullName: lpo?.lead?.fullName,
                    email: lpo?.lead?.email
                }

                EmailService.sendLPOProcessingEmail(lpoData, recipientData);
            }
        }

        // Only update status if stock validation passes
        const updatedLPO = await ModelLpo.findByIdAndUpdate(
            id,
            {
                status,
                deliveryCode,
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

            await lpo.update({ deliveredStatus: true, deliveredTo })
        }

        if (status === "In Transit") {
            const lpoProducts = await ModelLpoProduct.find({ lpo: id }).populate("product");

            for (const lpoProduct of lpoProducts) {
                const productId = lpoProduct.product;
                const qtyToDeduct = Number(lpoProduct.quantity);

                const batches = await ModelBatch.find({ product: productId });
                const totalAvailable = batches.reduce((s, b) => s + Number(b.quantity || 0), 0);

                if (qtyToDeduct > totalAvailable) {
                    throw new errorHandle(
                        `Insufficient stock for product ${productId}. Available: ${totalAvailable}, Required: ${qtyToDeduct}`,
                        400
                    );
                }
            }

            for (const lpoProduct of lpoProducts) {
                const productId = lpoProduct.product;
                const qtyToDeduct = Number(lpoProduct.quantity);

                const batches = await ModelBatch.find({ product: productId });

                const fifoBatches = batches
                    .filter(b => Number(b.quantity) > 0)
                    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

                let remaining = qtyToDeduct;
                const totalAvailable = batches.reduce((s, b) => s + Number(b.quantity || 0), 0);

                for (const batch of fifoBatches) {
                    if (remaining <= 0) break;

                    const qty = Number(batch.quantity);

                    if (qty >= remaining) {
                        batch.quantity = qty - remaining;
                        remaining = 0;
                    } else {
                        batch.quantity = 0;
                        remaining -= qty;
                    }

                    await batch.save();
                }

                // If deduction consumed all stock → mark product out of stock
                if (qtyToDeduct === totalAvailable) {
                    await ModelProduct.findByIdAndUpdate(productId, {
                        status: "Out of Stock"
                    });
                }
            }
        }

        // Prepare response
        let responseMessage = 'LPO status updated successfully';
        let response = {
            updatedLPO
        };

        if (status === "Delivered" && !existingCustomer) {
            const customer = await ModelCustomer.findOne({ lead: lpo.lead });
            response.customer = customer;
            responseMessage = 'LPO status updated successfully and customer created';
        }

        const message = `📋 LPO Status Updated: ${oldStatus} → ${status || 'Unknown'}`;
        await generateNotification({ userId: lpo.user, message, type: 4 })

        return res.json(utils.JParser(responseMessage, true, response));

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
        const account = req.user
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
        const leadData = lead
        if (validator.contact && validator.contact.length > 0) {
            const contactsWithLeadId = validator.contact.map(contact => ({
                ...contact,
                lead: lead._id
            }));

            createdContacts = await ModelLeadContact.insertMany(contactsWithLeadId);
        }

        if (accountType === "user") {
            try {
                const [admin, assignments] = await Promise.all([
                    ModelAdmin.findById(account.admin),
                    ModelAssignment.find({ assignedUser: accountID }).populate('assignedtoUser', '_id email')
                ]);

                const recipients = {
                    admin: admin?._id ? { id: admin._id, email: admin.email } : null,
                    manager: assignments.length > 0 && assignments[assignments.length - 1].assignedtoUser?._id
                        ? {
                            id: assignments[assignments.length - 1].assignedtoUser._id,
                            email: assignments[assignments.length - 1].assignedtoUser.email
                        }
                        : null
                };

                const salesRepData = { fullName: account?.fullName || 'Sales Representative' };
                const message = `New lead captured: ${leadData?.name || 'Unknown Lead'} by ${salesRepData.fullName}`;

                // Send emails
                Object.values(recipients).forEach(recipient => {
                    if (recipient?.email) {
                        EmailService.sendNewLeadNotification(leadData, salesRepData, recipient.email);
                    }
                });

                // Send in-app notifications
                const notificationUserIds = Object.values(recipients)
                    .filter(recipient => recipient?.id)
                    .map(recipient => recipient.id.toString());

                if (notificationUserIds.length > 0) {
                    await sendBulkNotification({
                        userIds: notificationUserIds,
                        message,
                        type: 3
                    });
                }

                console.log(`Notifications sent: ${notificationUserIds.length} recipients`);

            } catch (error) {
                console.error('Notification error (non-critical):', error.message);
            }
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

exports.UpdateLeadContact = useAsync(async (req, res) => {
    try {
        const { id } = req.params;
        const schema = Joi.object({
            name: Joi.string().min(2).optional(),
            email: Joi.string().min(2).optional(),
            phone: Joi.string().min(2).optional(),
            role: Joi.string().min(2).optional(),
        });

        const validator = await schema.validateAsync(req.body);
        const updatedLeadContact = await ModelLeadContact.findByIdAndUpdate(id, validator, { new: true });

        if (!updatedLeadContact) {
            return res.status(404).json(utils.JParser('Lead contact not found', false, null));
        }

        return res.json(utils.JParser('Lead contact updated successfully', !!updatedLeadContact, updatedLeadContact));
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
            .sort({ _id: -1 })
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
        // Populate the lead field to get lead details
        const lpo = await ModelLpo.findById(lpoId).populate('lead');

        if (!lpo) {
            throw new Error('LPO not found');
        }

        if (!lpo.lead || !lpo.lead._id) {
            throw new Error('Lead not found or invalid lead reference');
        }

        const lpoProducts = await ModelLpoProduct.find({ lpo: lpoId }).populate('product');

        let totalAmount = 0;
        let totalQty = 0;

        lpoProducts.forEach(item => {
            const quantity = parseFloat(item.quantity) || 0;
            const price = item?.product?.price || 0;
            totalAmount += quantity * price;
            totalQty += quantity;
        });

        const productCount = lpoProducts.length;

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);

        // Create the invoice
        const invoice = await ModelInvoice.create({
            lpo: lpoId,
            lead: lpo.lead._id,
            user: lpo.user,
            admin: lpo.admin,
            name: lpo.lead.name || 'Unknown Lead',
            dueDate: dueDate.toISOString().split('T')[0],
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
            .sort({ _id: -1 })
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

        const lpoProducts = await ModelLpoProduct.find({ lpo: invoice?.lpo?._id }).populate('product');

        return res.json(utils.JParser('Invoice fetched successfully', !!invoice, { ...invoice, lpoProducts }));
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
            .sort({ _id: -1 })
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

        const query = ModelInvoice.find({ user: req.params.id }).sort({ _id: -1 }).lean();
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