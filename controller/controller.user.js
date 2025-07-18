const dotenv = require("dotenv")
dotenv.config()
const { useAsync, utils, errorHandle, } = require('../core');
const { generatePassword, genID } = require("../core/core.utils");
const bcrypt = require('bcryptjs')
const CryptoJS = require("crypto-js")
const sha1 = require('sha1');
const { EmailNote } = require("../core/core.notify");
const ModelUser = require("../models/model.user");
const ModelCustomer = require("../models/model.customer");
const ModelLpoProduct = require("../models/model.lpoProduct");
const ModelLpo = require("../models/model.lpo");
const ModelProduct = require("../models/model.product");
const ModelLead = require("../models/model.lead");
const ModelTask = require("../models/model.task");


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
        const user = await ModelUser.find();
        return res.json(utils.JParser('All User fetch successfully', !!user, user));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.deleteUser = useAsync(async (req, res) => {
    try {
        const userId = req.body.id
        if (!userId) return res.status(402).json(utils.JParser('provide the user id', false, []));

        const user = await ModelUser.deleteOne({ _id: userId })
        return res.json(utils.JParser('User deleted successfully', !!user, []));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }

});


exports.createUser = useAsync(async (req, res) => {

    try {

        const Password = await generatePassword(9);
        const userId = await genID(1);

        if (Password) {
            req.body.password = await bcrypt.hash(Password, 13)
        }

        if (!req.body.email || !req.body.password) return res.json(utils.JParser('please check the fields', false, []));

        req.body.userId = userId
        req.body.userRole = "user"
        req.body.token = sha1(req.body.email + new Date())
        req.body.lastLogin = CryptoJS.AES.encrypt(JSON.stringify(new Date()), process.env.SECRET_KEY).toString()

        const validates = await ModelUser.findOne({ email: req.body.email })
        if (validates) {
            return res.json(utils.JParser('There is another user with this email', false, []));
        } else {

            let user = await new ModelUser(req.body)
            const email = req.body.email
            const body = {
                email: email,
                name: '',
                body: `Congratulastion an account has been created for you as ${user.role} in sator kindly use your login with your email and the following password - ${Password}`,
                subject: "Account creation"
            }

            await user.save().then(data => {

                data.password = "********************************"

                EmailNote(body.email, body.name, body.body, body.subject)

                return res.json(utils.JParser('Congratulation Account created successfully', !!data, data));

            })
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