const dotenv = require("dotenv")
dotenv.config()
const { useAsync, utils, errorHandle, } = require('../core');
const { genID } = require("../core/core.utils");
const bcrypt = require('bcryptjs')
const CryptoJS = require("crypto-js")
const sha1 = require('sha1');
const { generatePasswordWithDate } = require("../core/core.notify");
const ModelUser = require("../models/model.user");
const ModelCustomer = require("../models/model.customer");
const ModelLpoProduct = require("../models/model.lpoProduct");
const ModelLpo = require("../models/model.lpo");
const ModelProduct = require("../models/model.product");
const ModelLead = require("../models/model.lead");
const ModelTask = require("../models/model.task");
const EmailService = require("../services");
const ModelContact = require("../models/model.contact");
const ModelCommission = require("../models/moddel.commision");


exports.editUser = useAsync(async (req, res) => {

    try {

        const userId = req.body.id
        const body = req.body

        if (!userId) return res.status(402).json(utils.JParser('provide the user id', false, []));

        await ModelUser.updateOne({ _id: userId }, body).then(async () => {
            const user = await ModelUser.find({ _id: userId });
            return res.json(utils.JParser('User Update Successfully', !!user, user));
        })

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.getUser = useAsync(async (req, res) => {

    try {

        const userId = req.userId

        const user = await ModelUser.findOne({ _id: userId });
        return res.json(utils.JParser('User fetch successfully', !!user, user));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.singleUser = useAsync(async (req, res) => {

    try {

        const userId = req.params.id
        const user = await ModelUser.findOne({ _id: userId });
        return res.json(utils.JParser('User fetch successfully', !!user, user));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.allUser = useAsync(async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = req.query.limit === 'all' ? null : parseInt(req.query.limit) || 10;
        const skip = req.query.limit === 'all' ? 0 : (page - 1) * limit;

        const query = ModelUser.find({ userRole: { $ne: 'admin' } })
            .select('-password') // Exclude password field
            .lean();

        if (limit !== null) query.skip(skip).limit(limit);
        const users = await query.exec();

        const response = utils.JParser('Users fetched successfully', !!users, { data: users });

        if (limit !== null) {
            const totalUsers = await ModelUser.countDocuments({ userRole: { $ne: 'admin' } });
            response.data.pagination = {
                currentPage: page,
                totalPages: Math.ceil(totalUsers / limit),
                totalUsers,
                limit
            };
        }

        return res.json(response);
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// Get users by specific role (sales rep, manager, etc.)
exports.GetUsersByRole = useAsync(async (req, res) => {
    try {
        const role = req.params.id;
        const validRoles = ["Manager", "Admin", "Sales Rep", "Inventory Manager", "Merchandiser"];

        if (!validRoles.includes(role)) {
            return res.status(400).json(utils.JParser('Invalid user role specified', false, []));
        }

        const page = parseInt(req.query.page) || 1;
        const limit = req.query.limit === 'all' ? null : parseInt(req.query.limit) || 10;
        const skip = req.query.limit === 'all' ? 0 : (page - 1) * limit;

        const query = ModelUser.find({ role })
            .select('-password') // Exclude password field
            .lean();

        if (limit !== null) query.skip(skip).limit(limit);
        const users = await query.exec();

        const response = utils.JParser(`Users with ${role} role fetched successfully`, !!users, {
            data: users,
            role: role
        });

        if (limit !== null) {
            const totalUsers = await ModelUser.countDocuments({ role });
            response.data.pagination = {
                currentPage: page,
                totalPages: Math.ceil(totalUsers / limit),
                totalUsers,
                limit
            };
        }

        return res.json(response);
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});


exports.deleteUser = useAsync(async (req, res) => {
    try {
        const userId = req.body.id
        if (!userId) return res.status(402).json(utils.JParser('provide the user id', false, []));

        const user = await ModelUser.findByIdAndUpdate(
            userId,
            {
                isDeleted: false,
                updated_at: Date.now()
            },
            { new: true }
        );
        return res.json(utils.JParser('User deleted successfully', !!user, []));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }

});


exports.createUser = useAsync(async (req, res) => {

    try {

        req.body.adminID = req.userId

        if (!req.body.email, !req.body.role, !req.body.phone) return res.json(utils.JParser('please check the fields', false, []));
        const userId = await genID(1);
        req.body.token = sha1(req.body.email + new Date())
        req.body.lastLogin = CryptoJS.AES.encrypt(JSON.stringify(new Date()), process.env.SECRET_KEY).toString()
        req.body.userId = userId


        const validates = await ModelUser.findOne({ email: req.body.email })
        if (validates) {
            return res.json(utils.JParser('There is another user with this email', false, []));
        } else {

            const generateNewPassword = await generatePasswordWithDate(req.body.fullName)

            if (generateNewPassword) {
                req.body.password = await bcrypt.hash(generateNewPassword, 13)

                let user = await new ModelUser(req.body)

                await user.save().then(data => {

                    data.password = "********************************"

                    const emailData = {
                        email: data.email,
                        name: data.fullName,
                        password: generateNewPassword
                    }

                    EmailService.sendNewEmployeeCredentials(emailData)

                    return res.json(utils.JParser('Congratulation Account created successfully', !!data, data));

                })
            } else {
                return res.status(400).json(utils.JParser('Unknown error occured, Try again later', false, []));
            }
        }
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.GetDashboardSummary = useAsync(async (req, res) => {
    try {
        const totalCustomers = await ModelCustomer.countDocuments();
        const totalLpos = await ModelLpo.countDocuments();

        const allLpos = await ModelLpo.find().lean();
        const lpoIds = allLpos.map(lpo => lpo._id);
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

        const totalSales = allLpos.reduce((sum, lpo) => {
            const lpoProducts = productsByLpoId[lpo._id] || [];
            const lpoAmount = lpoProducts.reduce((lpoSum, product) => {
                return lpoSum + (product.amount || 0);
            }, 0);
            return sum + lpoAmount;
        }, 0);

        const totalProducts = await ModelProduct.countDocuments();

        const currentYear = new Date().getFullYear();
        const monthlyCustomerCounts = Array(12).fill(0);
        const customers = await ModelCustomer.find().populate('lead');

        customers.forEach(customer => {
            if (customer.creationDateTime) {
                const date = new Date(customer.creationDateTime);
                if (date.getFullYear() === currentYear) {
                    const month = date.getMonth();
                    monthlyCustomerCounts[month]++;
                }
            }
        });

        const topRegions = await ModelLead.aggregate([
            { $match: { lga: { $exists: true, $ne: null } } },
            { $group: { _id: "$lga", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            { $project: { lga: "$_id", count: 1, _id: 0 } }
        ]);

        const monthlyRevenue = Array(12).fill(0);
        allLpos.forEach(lpo => {
            if (lpo.creationDateTime) {
                const date = new Date(lpo.creationDateTime);
                if (date.getFullYear() === currentYear) {
                    const month = date.getMonth();
                    const lpoProducts = productsByLpoId[lpo._id] || [];
                    const lpoAmount = lpoProducts.reduce((sum, product) => sum + (product.amount || 0), 0);
                    monthlyRevenue[month] += lpoAmount;
                }
            }
        });

        const topProducts = await ModelLpoProduct.aggregate([
            {
                $lookup: {
                    from: "modelbatches",
                    localField: "batch",
                    foreignField: "_id",
                    as: "batchDetails"
                }
            },
            { $unwind: "$batchDetails" },

            {
                $lookup: {
                    from: "modelproducts",
                    localField: "batchDetails.product",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            { $unwind: "$productDetails" },

            {
                $group: {
                    _id: "$productDetails._id",
                    productName: { $first: "$productDetails.productName" },
                    totalOrders: { $sum: 1 },
                    totalQuantity: { $sum: "$quantity" },
                    totalRevenue: {
                        $sum: {
                            $multiply: ["$quantity", "$batchDetails.sellingPrice"]
                        }
                    }
                }
            },
            { $sort: { totalRevenue: -1 } },
            { $limit: 5 }
        ]);

        const topSalesReps = await ModelTask.aggregate([
            {
                $match: {
                    status: "Completed",
                    user: { $exists: true, $ne: null }
                }
            },
            {
                $group: {
                    _id: "$user",
                    completedTasks: { $sum: 1 }
                }
            },
            { $sort: { completedTasks: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "model-users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            { $unwind: "$userDetails" },
            {
                $project: {
                    _id: 0,
                    userId: "$_id",
                    fullName: "$userDetails.fullName",
                    completedTasks: 1,
                    image: "$userDetails.image"
                }
            }
        ]);

        const response = utils.JParser('Dashboard summary fetched successfully', true, {
            // Card data
            cards: {
                totalCustomers,
                totalLpos,
                totalSales: parseFloat(totalSales.toFixed(2)),
                totalProducts
            },
            // Customer chart
            customerChart: {
                monthlyCounts: monthlyCustomerCounts
            },
            // Top regions
            topRegions: topRegions,
            // Revenue chart
            revenueChart: {
                monthlyRevenue: monthlyRevenue.map(amount => parseFloat(amount.toFixed(2)))
            },
            // Top products
            topProducts: topProducts.map(product => ({
                productName: product.productName,
                unitPrice: product.unitPrice,
                orders: product.totalOrders,
                totalPaid: product.totalPaid
            })),
            // Top sales reps
            topSalesReps: topSalesReps.map(rep => ({
                name: rep.fullName,
                completedTasks: rep.completedTasks,
                image: rep.image
            }))
        });

        return res.json(response);

    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// CREATE Contact
exports.CreateContact = useAsync(async (req, res) => {
    try {
        const contact = await ModelContact.create(req.body);

        // Send email (already have email function)
        // await sendEmail(contact.businessEmail, "Thanks for contacting us", "We have received your message and will get back to you soon.");

        return res.json(utils.JParser('Contact created successfully', true,  contact ));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// GET All Contacts with Pagination
exports.GetAllContacts = useAsync(async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = req.query.limit === 'all' ? null : parseInt(req.query.limit) || 10;
        const skip = req.query.limit === 'all' ? 0 : (page - 1) * limit;

        const query = ModelContact.find().lean();

        if (limit !== null) query.skip(skip).limit(limit);
        const contacts = await query.exec();

        const response = utils.JParser('Contacts fetched successfully', !!contacts, { data: contacts });

        if (limit !== null) {
            const totalContacts = await ModelContact.countDocuments();
            response.data.pagination = {
                currentPage: page,
                totalPages: Math.ceil(totalContacts / limit),
                totalContacts,
                limit
            };
        }

        return res.json(response);
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// GET Single Contact
exports.GetContact = useAsync(async (req, res) => {
    try {
        const contact = await ModelContact.findById(req.params.id).lean();
        if (!contact) throw new errorHandle("Contact not found", 404);
        return res.json(utils.JParser('Contact fetched successfully', true, { data: contact }));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// UPDATE Contact
exports.UpdateContact = useAsync(async (req, res) => {
    try {
        const updated = await ModelContact.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) throw new errorHandle("Contact not found", 404);
        return res.json(utils.JParser('Contact updated successfully', true, { data: updated }));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

// DELETE Contact
exports.DeleteContact = useAsync(async (req, res) => {
    try {
        const deleted = await ModelContact.findByIdAndUpdate(
            req.params.id,
            {
                isDeleted: false,
                updated_at: Date.now()
            },
            { new: true }
        );
        if (!deleted) throw new errorHandle("Contact not found", 404);
        return res.json(utils.JParser('Contact deleted successfully', true));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

////////////////////////////////////////////////////////////////////////////////////////////////
//COMMISSION
////////////////////////////////////////////////////////////////////////////////////////////////
exports.UpdateCommission = useAsync(async (req, res) => {
    try {
        const updated = await ModelCommission.updateOne({status:true}, {price: Number(req.body.price)}, { new: true });
        if (!updated) throw new errorHandle("Commission not found", 404);
        return res.json(utils.JParser('Commission updated successfully', true, []));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});

exports.GetCommision = useAsync(async (req, res) => {
    try {
        const Commission = await ModelCommission.findOne({status:true}).lean();
        if (!Commission) throw new errorHandle("Commission not found", 404);
        return res.json(utils.JParser('Commission fetched successfully', true, { data: Commission }));
    } catch (e) {
        throw new errorHandle(e.message, 500);
    }
});