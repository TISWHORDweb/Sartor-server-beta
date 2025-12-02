const dotenv = require("dotenv")
dotenv.config()
const { useAsync, utils, errorHandle, } = require('../core');
const { genID, checkEmailExist } = require("../core/core.utils");
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
const ModelPermission = require("../models/model.permission");
const Joi = require("joi");
const ModelNotification = require("../models/model.notification");
const ModelAssignment = require("../models/model.assignment");
const ModelAdmin = require("../models/model.admin");
const { default: mongoose } = require("mongoose");


exports.GetGlobalDashboardSummary = useAsync(async (req, res) => {
  try {

    const allAdmins = await ModelAdmin.find({ isDeleted: false }).lean();

    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())); // Sunday
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalAdmins = allAdmins.length;
    const adminsThisWeek = allAdmins.filter(
      (a) => a.creationDateTime >= startOfWeek.getTime()
    ).length;
    const adminsThisMonth = allAdmins.filter(
      (a) => a.creationDateTime >= startOfMonth.getTime()
    ).length;

    const monthlyAdminCounts = Array(12).fill(0);
    const currentYear = new Date().getFullYear();

    allAdmins.forEach((admin) => {
      const date = new Date(admin.creationDateTime);
      if (date.getFullYear() === currentYear) {
        monthlyAdminCounts[date.getMonth()]++;
      }
    });

    const topAdmins = await ModelLpo.aggregate([
      {
        $group: {
          _id: "$admin",
          totalLpos: { $sum: 1 },
        },
      },
      { $sort: { totalLpos: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "model-admins",
          localField: "_id",
          foreignField: "_id",
          as: "adminDetails",
        },
      },
      { $unwind: "$adminDetails" },
      {
        $project: {
          _id: 0,
          adminId: "$_id",
          fullName: "$adminDetails.fullName",
          email: "$adminDetails.email",
          totalLpos: 1,
        },
      },
    ]);

    const disabledAdmins = allAdmins.filter((a) => a.isDisabled).length;

    const activeAdmins = allAdmins.filter((a) => a.isDisabled).length;

    return res.json(
      utils.JParser("Global dashboard summary fetched successfully", true, {
        cards: {
          totalAdmins,
          adminsThisWeek,
          adminsThisMonth,
          disabledAdmins,
          activeAdmins,
        },
        charts: {
          monthlyAdminRegistration: monthlyAdminCounts,
        },
        topAdmins,
      })
    );
  } catch (e) {
    throw new errorHandle(e.message, 500);
  }
});


exports.allCompanys = useAsync(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = req.query.limit === "all" ? null : parseInt(req.query.limit) || 10;
    const skip = req.query.limit === "all" ? 0 : (page - 1) * limit;

    const filter = {};

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i");
      filter.$or = [
        { fullName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { address: searchRegex },
        { role: searchRegex },
      ];
    }

    const query = ModelAdmin.find(filter)
      .select("-password")
      .sort({ _id: -1 })
      .lean();

    if (limit !== null) query.skip(skip).limit(limit);
    const admins = await query.exec();

    const [products, lpos, leads, users] = await Promise.all([
      ModelProduct.find({ admin: { $in: admins.map((a) => a._id) } }).lean(),
      ModelLpo.find({ admin: { $in: admins.map((a) => a._id) } }).lean(),
      ModelLead.find({ admin: { $in: admins.map((a) => a._id) } }).lean(),
      ModelUser.find({ admin: { $in: admins.map((a) => a._id) } }).select('-password -token').lean(),
    ]);

    const data = admins.map((admin) => ({
      ...admin,
      products: products.filter((p) => String(p.admin) === String(admin._id)),
      lpos: lpos.filter((l) => String(l.admin) === String(admin._id)),
      leads: leads.filter((l) => String(l.admin) === String(admin._id)),
      users: users.filter((u) => String(u.admin) === String(admin._id)),
    }));

    const response = utils.JParser("Companies fetched successfully", true, {
      data,
    });

    if (limit !== null) {
      const total = await ModelAdmin.countDocuments(filter);
      response.data.pagination = {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        total,
        limit,
      };
    }

    return res.json(response);
  } catch (e) {
    throw new errorHandle(e.message, 500);
  }
});


exports.toggleAdminStatus = useAsync(async (req, res) => {
  const { id } = req.params;

  const admin = await ModelAdmin.findById(id);
  if (!admin) throw new errorHandle("Admin not found", 404);

  admin.isDisabled = !admin.isDisabled;
  await admin.save();

  const statusText = admin.isDisabled ? "disabled" : "enabled";
  return res.json(utils.JParser(`Admin successfully ${statusText}`, true, admin));
});


exports.getSingleCompany = useAsync(async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await ModelAdmin.findById(id).select("-password").lean();
    if (!admin) throw new errorHandle("Company not found", 404);

    const [products, lpos, leads, users] = await Promise.all([
      ModelProduct.find({ admin: id }).lean(),
      ModelLpo.find({ admin: id }).lean(),
      ModelLead.find({ admin: id }).lean(),
      ModelUser.find({ admin: id }).select('-password -token').lean(),
    ]);

    const lpoIds = lpos.map(lpo => lpo._id);
    const lpoProducts = await ModelLpoProduct.find({ lpo: { $in: lpoIds } })
      .populate("product");

    const productsByLpoId = lpoProducts.reduce((acc, product) => {
      if (!product.lpo) return acc;
      if (!acc[product.lpo]) acc[product.lpo] = [];
      const quantity = parseFloat(product.quantity) || 0;
      const unitPrice = product.product?.price ? parseFloat(product.product.price) : 0;
      const productAmount = unitPrice * quantity;
      acc[product.lpo].push({ ...product.toObject(), amount: productAmount, quantity });
      return acc;
    }, {});

    const totalSales = lpos.reduce((sum, lpo) => {
      const lpoProducts = productsByLpoId[lpo._id] || [];
      const lpoAmount = lpoProducts.reduce((s, p) => s + (p.amount || 0), 0);
      return sum + lpoAmount;
    }, 0);

    const totalCustomers = await ModelCustomer.countDocuments({ admin: id });
    const totalLpos = lpos.length;
    const totalProducts = products.length;

    const currentYear = new Date().getFullYear();
    const monthlyCustomerCounts = Array(12).fill(0);
    const customers = await ModelCustomer.find({ admin: id }).lean();
    customers.forEach(customer => {
      if (customer.creationDateTime) {
        const date = new Date(customer.creationDateTime);
        if (date.getFullYear() === currentYear) {
          monthlyCustomerCounts[date.getMonth()]++;
        }
      }
    });

    const topRegions = await ModelLead.aggregate([
      { $match: { admin: mongoose.Types.ObjectId(id), lga: { $exists: true, $ne: null } } },
      { $group: { _id: "$lga", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: { lga: "$_id", count: 1, _id: 0 } }
    ]);

    const monthlyRevenue = Array(12).fill(0);
    lpos.forEach(lpo => {
      if (lpo.creationDateTime) {
        const date = new Date(lpo.creationDateTime);
        if (date.getFullYear() === currentYear) {
          const month = date.getMonth();
          const lpoProducts = productsByLpoId[lpo._id] || [];
          const lpoAmount = lpoProducts.reduce((s, p) => s + (p.amount || 0), 0);
          monthlyRevenue[month] += lpoAmount;
        }
      }
    });

    const topProducts = await ModelLpoProduct.aggregate([
      { $match: { lpo: { $in: lpoIds } } },
      {
        $lookup: {
          from: "model-products",
          localField: "product",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      { $unwind: "$productDetails" },
      {
        $group: {
          _id: "$productDetails._id",
          productName: { $first: "$productDetails.productName" },
          unitPrice: { $first: "$productDetails.price" },
          totalOrders: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
          totalRevenue: { $sum: { $multiply: ["$quantity", "$productDetails.price"] } }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 }
    ]);

    const topSalesReps = await ModelTask.aggregate([
      {
        $match: {
          admin: mongoose.Types.ObjectId(id),
          status: "Completed",
          user: { $exists: true, $ne: null }
        }
      },
      { $group: { _id: "$user", completedTasks: { $sum: 1 } } },
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

    const data = {
      ...admin,
      stats: {
        totalCustomers,
        totalLpos,
        totalSales: parseFloat(totalSales.toFixed(2)),
        totalProducts
      },
      products,
      lpos,
      leads,
      users,
      charts: {
        customerGrowth: monthlyCustomerCounts,
        revenue: monthlyRevenue.map(v => parseFloat(v.toFixed(2)))
      },
      topRegions,
      topProducts: topProducts.map(p => ({
        productName: p.productName,
        unitPrice: p.unitPrice,
        orders: p.totalOrders,
        totalQuantity: p.totalQuantity,
        totalRevenue: parseFloat(p.totalRevenue.toFixed(2))
      })),
      topSalesReps
    };

    return res.json(utils.JParser("Company dashboard fetched successfully", true, data));
  } catch (e) {
    throw new errorHandle(e.message, 500);
  }
});
