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
        const deletedLpo = await ModelLpo.findByIdAndDelete(id);

        if (!deletedLpo) {
            return res.status(404).json(utils.JParser('LPO not found', false, null));
        }

        // Optional: Delete associated products
        await ModelLpoProduct.deleteMany({ lpo: id });

        return res.json(utils.JParser('LPO deleted successfully', !!deletedLpo, deletedLpo));

    } catch (e) {
       throw new errorHandle(e.message, 500);
    }
});


exports.GetAllLpos = useAsync(async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = req.query.limit === 'all' ? null : parseInt(req.query.limit) || 10;
        const skip = req.query.limit === 'all' ? 0 : (page - 1) * limit;

        const query = ModelLpo.find().lean().populate('lead');
        if (limit !== null) {
            query.skip(skip).limit(limit);
        }
        const lpos = await query.exec();

        const lpoIds = lpos.map(lpo => lpo._id);
        const products = await ModelLpoProduct.find({ lpo: { $in: lpoIds } }).populate('product');

        const productsByLpoId = products.reduce((acc, product) => {
            if (!product.lpo) return acc;
            if (!acc[product.lpo]) acc[product.lpo] = [];
            
            const quantity = parseFloat(product.quantity) || 0;
            const unitPrice = (product.product && !isNaN(parseFloat(product.product.unitPrice))) 
                ? parseFloat(product.product.unitPrice) 
                : 0;

            const productAmount = unitPrice * quantity;
            
            acc[product.lpo].push({
                ...product.toObject(),
                amount: productAmount,
                quantity: quantity
            });
            
            return acc;
        }, {});

        const lposWithProducts = lpos.map(lpo => {
            const lpoProducts = productsByLpoId[lpo._id] || [];
            
            const totalAmount = lpoProducts.reduce((sum, product) => {
                return sum + (product.amount || 0);
            }, 0);

            return {
                ...lpo,
                products: lpoProducts,
                totalAmount: parseFloat(totalAmount.toFixed(2))
            };
        });

        const response = utils.JParser('LPOs fetched successfully', true, { lpos: lposWithProducts });

        if (limit !== null) {
            const totalLpos = await ModelLpo.countDocuments();
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
        
        const lpo = await ModelLpo.findById(id).lean().populate('lead');

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

        const userId = await genID(4);

        //validate data
        const validator = await schema.validateAsync(req.body);
        validator.userId = userId

        const existingLead = await ModelLead.findOne({ email: validator.email })
        if (existingLead) {
            return res.json(utils.JParser('Sorry theres another lead register with this email, chabge it and try again ', false, []))
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
       throw new errorHandle(e.message, 500);
    }
});


exports.UpdateLead = useAsync(async (req, res) => {
    try {
        const { id } = req.params;
        const schema = Joi.object({
            name: Joi.string().min(3).optional(),
            address: Joi.string().min(3).optional(),
            phone: Joi.string().min(3).optional(),
            state: Joi.string().min(3).optional(),
            type: Joi.string().min(3).optional(),
            stores: Joi.number().optional(),
            dealSize: Joi.string().optional(),
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
       throw new errorHandle(e.message, 500);
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

        return res.json(utils.JParser('Lead deleted successfully', !!deletedLead, []));
    } catch (e) {
       throw new errorHandle(e.message, 500);
    }
});

exports.GetAllLeads = useAsync(async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Current page (default: 1)
        const limit = req.query.limit === 'all' ? null : parseInt(req.query.limit) || 10;
        const skip = req.query.limit === 'all' ? 0 : (page - 1) * limit;

        const query = ModelLead.find().lean();
        if (limit !== null) {
            query.skip(skip).limit(limit);
        }
        const leads = await query.exec();

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

        const response = utils.JParser('Leads fetched successfully', true, { leads: leadsWithContacts })

        if (limit !== null) {
            const totalLeads = await ModelLead.countDocuments();
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

        if (status === "Qualified") {
            // Check if this lead already exists as a customer
            const existingCustomer = await ModelCustomer.findOne({ lead: id });
            
            if (!existingCustomer) {
                // Generate customer ID (you can customize this logic)
                const customerId = await genID(3)
                
                // Create new customer
                const newCustomer = await ModelCustomer.create({
                    lead: id,
                    customerId,
                    status: "Active"
                });

            }
        }

        // Prepare response
        let response = {
            lead: updatedLead,
            message: 'Lead status updated successfully'
        };

        // Add customer info if qualified
        if (status === "Qualified") {
            const customer = await ModelCustomer.findOne({ lead: id });
            response.customer = customer;
            response.message += ' and customer created';
        }

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
            throw new Error('LPO not found');
        }

        // Calculate invoice values
        let totalAmount = 0;
        let totalQty = 0;

        lpoProducts.forEach(item => {
            const quantity = parseFloat(item.quantity) || 0;
            const price = parseFloat(parseInt(item?.product?.unit || 0)) || 0;
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
        const page = parseInt(req.query.page) || 1; // Current page (default: 1)
        const limit = req.query.limit === 'all' ? null : parseInt(req.query.limit) || 10;
        const skip = req.query.limit === 'all' ? 0 : (page - 1) * limit;

        const query = ModelInvoice.find().populate("lead").populate("lpo").lean();
        if (limit !== null) {
            query.skip(skip).limit(limit);
        }
        const invoices = await query.exec();

        const response = utils.JParser('Invoice fetched successfully', true, { invoices })

        if (limit !== null) {
            const totalInvoice = await ModelInvoice.countDocuments();
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
        const invoice = await ModelInvoice.findById(id).populate("lead").populate("lpo").lean();

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
        const deletedInvoice = await ModelInvoice.findByIdAndDelete(id);

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
        const page = parseInt(req.query.page) || 1;
        const limit = req.query.limit === 'all' ? null : parseInt(req.query.limit) || 10;
        const skip = req.query.limit === 'all' ? 0 : (page - 1) * limit;

        const query = ModelCustomer.find()
            .populate('lead')
            .lean();

        if (limit !== null) query.skip(skip).limit(limit);
        const customer = await query.exec();

        const response = utils.JParser('Customer fetched successfully', !!customer, { data: customer });

        if (limit !== null) {
            const totalLabels = await ModelCustomer.countDocuments();
            response.data.pagination = {
                currentPage: page,
                totalPages: Math.ceil(totalLabels / limit),
                totalLabels,
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
        const customer = await ModelCustomer.findById(req.params.id).populate('lead').lean();
        if (!customer) throw new errorHandle('Customer not found', 404);

        return res.json(utils.JParser('Label fetched successfully', true, customer));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});


exports.UpdateCustomer= useAsync(async (req, res) => {
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
        const customer = await ModelCustomer.findByIdAndDelete(req.params.id);
        if (!customer) throw new errorHandle('Customer not found', 404);

        return res.json(
            utils.JParser('Customer deleted successfully', true, null)
        );
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});