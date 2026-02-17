const dotenv = require("dotenv");
dotenv.config();
const { useAsync, utils, errorHandle } = require("../core");
const ModelProduct = require("../models/model.product");
const Joi = require("joi");
const ModelRestock = require("../models/model.restock");
const ModelSupplier = require("../models/model.supplier");
const { genID, genStockID } = require("../core/core.utils");
const ModelBatch = require("../models/model.batch");
const ModelUser = require("../models/model.user");
const ModelRestockProduct = require("../models/model.restockProduct");
const ModelStocks = require("../models/model.stocks");
const ModelCustomer = require("../models/model.customer");
const ModelTask = require("../models/model.task");
const ModelLabel = require("../models/model.Label");

const generatePin = (length = 10) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

exports.CreateProduct = useAsync(async (req, res) => {
  try {
    const accountType = req.userType;
    const accountID = req.userId;
    // if (!req.is('multipart/form-data')) {
    //   throw new errorHandle('Content-Type must be multipart/form-data', 400);
    // }

    const {
      productName,
      barcodeNumber,
      manufacturer,
      description,
      productImage,
    } = req.body;

    if (!productName) {
      return res
        .status(400)
        .json(utils.JParser("Product name is required", false, []));
    }

    let admin;
    // if (!productName || typeof productName !== 'string') {
    //   throw new errorHandle('Product name is required and must be a string', 400);
    // }

    // if (barcodeNumber && typeof barcodeNumber !== 'string') {
    //   throw new errorHandle('Barcode must be a string', 400);
    // }

    if (accountType === "user") {
      const user = await ModelUser.findOne({ _id: accountID });
      if (!user) {
        return res
          .status(400)
          .json(utils.JParser("Invalid user, Try again later", false, []));
      }
      admin = user.admin;
    } else {
      admin = accountID;
    }

    const batchId = await genID(2);

    const product = await ModelProduct.create({
      productName,
      barcodeNumber: barcodeNumber || null,
      manufacturer: manufacturer || null,
      description: description || null,
      productImage: productImage || null,
      batchId,
      admin,
    });

    return res.json(
      utils.JParser("Product created successfully", !!product, product),
    );
  } catch (e) {
    throw new errorHandle(e.message, e.statusCode || 500);
  }
});

exports.UpdateProduct = useAsync(async (req, res) => {
  try {
    const { id } = req.params;
    const schema = Joi.object({
      productName: Joi.string().optional(),
      manufacturer: Joi.string().optional(),
      barcodeNumber: Joi.string().optional(),
      description: Joi.string().optional(),
      productImage: Joi.string().optional(),
      status: Joi.string().optional(),
    });

    const validator = await schema.validateAsync(req.body);
    validator.updated_at = Date.now(); // Auto-update timestamp

    const updatedProduct = await ModelProduct.findByIdAndUpdate(id, validator, {
      new: true,
    });

    if (!updatedProduct) {
      return res
        .status(404)
        .json(utils.JParser("Product not found", false, null));
    }

    return res.json(
      utils.JParser(
        "Product updated successfully",
        !!updatedProduct,
        updatedProduct,
      ),
    );
  } catch (e) {
    throw new errorHandle(e.message, 500);
  }
});

exports.DeleteProduct = useAsync(async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await ModelProduct.findByIdAndUpdate(
      id,
      {
        isDeleted: true,
        updated_at: Date.now(),
      },
      { new: true },
    );

    if (!deletedProduct) {
      return res
        .status(404)
        .json(utils.JParser("Product not found", false, null));
    }

    return res.json(
      utils.JParser(
        "Product deleted successfully",
        !!deletedProduct,
        deletedProduct,
      ),
    );
  } catch (e) {
    throw new errorHandle(e.message, 500);
  }
});

exports.GetAllProducts = useAsync(async (req, res) => {
  try {
    const accountType = req.userType;
    const accountID = req.userId;
    const page = parseInt(req.query.page) || 1;
    const limit =
      req.query.limit === "all" ? null : parseInt(req.query.limit) || 10;
    const skip = req.query.limit === "all" ? 0 : (page - 1) * limit;
    const search = req.query.search ? req.query.search.trim() : null;

    let filter = {};
    if (accountType === "user") {
      const user = await ModelUser.findOne({ _id: accountID });
      if (!user) {
        return res
          .status(400)
          .json(utils.JParser("Invalid user, Try again later", false, []));
      }
      filter = { admin: user.admin };
    } else if (accountType === "admin") {
      filter = { admin: accountID };
    }

    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { productName: regex },
        { batchNumber: regex },
        { barcodeNumber: regex },
        { manufacturer: regex },
        { description: regex },
        { status: regex },
      ];
    }

    let query = ModelProduct.find(filter).sort({ _id: -1 }).lean();
    if (limit !== null) query = query.skip(skip).limit(limit);
    const products = await query.exec();

    const productIds = products.map((p) => p._id);

    const batches = await ModelBatch.find({
      product: { $in: productIds },
    }).lean();

    const supplierIds = [
      ...new Set(batches.filter((b) => b.supplier).map((b) => b.supplier)),
    ];

    const suppliers = await ModelSupplier.find({ _id: { $in: supplierIds } })
      .lean()
      .then((data) =>
        data.reduce((acc, s) => {
          acc[s._id.toString()] = s;
          return acc;
        }, {}),
      );

    const restocks = await ModelRestockProduct.find({
      product: { $in: productIds },
    })
      .sort({ creationDateTime: -1 })
      .lean();

    const batchesByProduct = batches.reduce((acc, batch) => {
      if (!batch.product) return acc;

      const productId = batch.product.toString();
      if (!acc[productId]) acc[productId] = [];

      acc[productId].push({
        ...batch,
        supplier: batch.supplier
          ? suppliers[batch.supplier.toString()] || null
          : null,
      });

      return acc;
    }, {});

    const restocksByProduct = restocks.reduce((acc, restock) => {
      if (!restock.product) return acc;

      const productId = restock.product.toString();
      if (!acc[productId]) acc[productId] = [];

      acc[productId].push(restock);
      return acc;
    }, {});

    const productsWithData = products.map((product) => {
      const productId = product._id.toString();
      const productBatches = batchesByProduct[productId] || [];
      const productRestocks = restocksByProduct[productId] || [];

      const totalQuantityAvailable = productBatches.reduce((sum, b) => {
        if (!b.quantity) return sum;
        return sum + Number(b.quantity);
      }, 0);

      const lastRestock =
        productRestocks.length > 0 ? productRestocks[0].creationDateTime : null;

      // Find newest batch (by creationDateTime descending)
      const newestBatch =
        productBatches.length > 0
          ? productBatches.sort((a, b) => {
              const aTime = a.creationDateTime || 0;
              const bTime = b.creationDateTime || 0;
              return bTime - aTime;
            })[0]
          : null;

      return {
        ...product,
        batches: productBatches,
        lastRestock,
        totalQuantityAvailable,
        sellingPrice: newestBatch?.sellingPrice || null,
        supplyPrice: newestBatch?.supplyPrice || null,
        expiryDate: newestBatch?.expiryDate || null,
      };
    });

    const response = utils.JParser("Products fetched successfully", true, {
      data: productsWithData,
    });

    if (limit !== null) {
      const totalProducts = await ModelProduct.countDocuments(filter);
      response.data.pagination = {
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        totalProducts,
        limit,
      };
    }

    return res.json(response);
  } catch (e) {
    throw new errorHandle(e.message, 500);
  }
});

exports.GetSingleProduct = useAsync(async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Fetch the product
    const product = await ModelProduct.findById(id).lean();

    if (!product) {
      return res
        .status(404)
        .json(utils.JParser("Product not found", false, null));
    }

    // 2. Fetch all batches for this product (sorted by newest first)
    const batches = await ModelBatch.find({ product: id })
      .sort({ creationDateTime: -1 })
      .lean();

    // 3. Get all unique supplier IDs from batches
    const supplierIds = [
      ...new Set(batches.map((b) => b.supplier).filter(Boolean)),
    ];

    // 4. Fetch all suppliers in one query
    const suppliers = await ModelSupplier.find({ _id: { $in: supplierIds } })
      .lean()
      .then((supps) =>
        supps.reduce((acc, s) => {
          acc[s._id.toString()] = s;
          return acc;
        }, {}),
      );

    // 5. Attach supplier info to each batch
    const batchesWithSuppliers = batches.map((batch) => ({
      ...batch,
      supplier: batch.supplier ? suppliers[batch.supplier.toString()] : null,
    }));

    // 6. Fetch all restocks for this product
    const restocks = await ModelRestock.find({ product: id })
      .sort({ creationDateTime: -1 })
      .select("quantity creationDateTime updated_at")
      .lean();

    // 7. Calculate total quantity
    const totalQuantityAvailable = batches.reduce((sum, b) => {
      if (!b.quantity) return sum;
      return sum + Number(b.quantity);
    }, 0);

    // 8. Find newest batch (by creationDateTime descending)
    const newestBatch =
      batches.length > 0
        ? batches.sort((a, b) => {
            const aTime = a.creationDateTime || 0;
            const bTime = b.creationDateTime || 0;
            return bTime - aTime;
          })[0]
        : null;

    // 9. Combine all data
    const productWithData = {
      ...product,
      batches: batchesWithSuppliers,
      restocks: restocks,
      totalQuantityAvailable,
      sellingPrice: newestBatch?.sellingPrice || null,
      supplyPrice: newestBatch?.supplyPrice || null,
      expiryDate: newestBatch?.expiryDate || null,
    };

    return res.json(
      utils.JParser("Product fetched successfully", true, productWithData),
    );
  } catch (e) {
    throw new errorHandle(e.message, 500);
  }
});

exports.GetAllProductBatch = useAsync(async (req, res) => {
  try {
    const { id } = req.params;
    const batches = await ModelBatch.find({ product: id })
      .populate("supplier")
      .sort({ _id: -1 })
      .lean();

    if (!batches) {
      return res
        .status(404)
        .json(utils.JParser("batches not found", false, null));
    }

    return res.json(
      utils.JParser("batches fetched successfully", true, batches),
    );
  } catch (e) {
    throw new errorHandle(e.message, 500);
  }
});

//////////////////////////////////////////////////////////////////////////////////////
////RESTOCK ROUTES
//////////////////////////////////////////////////////////////////////////////////////

exports.CreateRestock = useAsync(async (req, res) => {
  try {
    const accountType = req.userType;
    const accountID = req.userId;

    const productSchema = Joi.object({
      product: Joi.string().required(),
      quantity: Joi.string().required(),
    });

    const schema = Joi.object({
      supplier: Joi.string().required(),
      products: Joi.array().items(productSchema).min(1).required(),
    });

    const { supplier, products } = await schema.validateAsync(req.body);

    let adminId;
    if (accountType === "user") {
      const user = await ModelUser.findOne({ _id: accountID }).lean();
      if (!user) {
        return res.json(
          utils.JParser("Invalid user, Try again later", false, []),
        );
      }
      adminId = user.admin;
    } else {
      adminId = accountID;
    }

    const restock = await ModelRestock.create({
      supplier,
      admin: adminId,
    });

    const restockProductsData = products.map((item) => ({
      restock: restock._id,
      product: item.product,
      quantity: item.quantity,
    }));

    const restockProducts =
      await ModelRestockProduct.insertMany(restockProductsData);

    return res.json(
      utils.JParser(
        `Restock created with ${restockProducts.length} products`,
        true,
        { restock, restockProducts },
      ),
    );
  } catch (e) {
    throw new errorHandle(e.message, 500);
  }
});

exports.UpdateRestock = useAsync(async (req, res) => {
  try {
    const { id } = req.params;

    const schema = Joi.object({
      supplier: Joi.string().optional(),
    });

    const validator = await schema.validateAsync(req.body);
    validator.updated_at = Date.now();

    const updatedRestock = await ModelRestock.findByIdAndUpdate(id, validator, {
      new: true,
    });

    if (!updatedRestock) {
      return res
        .status(404)
        .json(utils.JParser("Restock not found", false, null));
    }

    return res.json(
      utils.JParser("Restock updated successfully", true, updatedRestock),
    );
  } catch (e) {
    throw new errorHandle(e.message, 500);
  }
});

exports.DeleteRestock = useAsync(async (req, res) => {
  try {
    const { id } = req.params;

    const deletedRestock = await ModelRestock.findByIdAndUpdate(
      id,
      { isDeleted: true, updated_at: Date.now() },
      { new: true },
    );

    if (!deletedRestock) {
      return res
        .status(404)
        .json(utils.JParser("Restock not found", false, null));
    }

    // Soft delete all child products
    await ModelRestockProduct.updateMany(
      { restock: id },
      { isDeleted: true, updated_at: Date.now() },
    );

    return res.json(
      utils.JParser("Restock deleted successfully", true, deletedRestock),
    );
  } catch (e) {
    throw new errorHandle(e.message, 500);
  }
});

exports.GetAllRestocks = useAsync(async (req, res) => {
  try {
    const accountType = req.userType;
    const accountID = req.userId;

    const page = parseInt(req.query.page) || 1;
    const limit =
      req.query.limit === "all" ? null : parseInt(req.query.limit) || 10;
    const skip = limit ? (page - 1) * limit : 0;

    let filter = {};

    if (accountType === "user") {
      filter.admin = req.userAdmin; // or derive admin based on your logic
    } else if (accountType === "admin") {
      filter.admin = accountID;
    }

    const query = ModelRestock.find(filter)
      .populate("supplier")
      .sort({ _id: -1 })
      .lean();

    if (limit) query.skip(skip).limit(limit);

    const restocks = await query.exec();

    // Attach products for each restock
    for (let restock of restocks) {
      restock.products = await ModelRestockProduct.find({
        restock: restock._id,
      })
        .populate("product")
        .lean();
    }

    const response = utils.JParser("Restocks fetched successfully", true, {
      data: restocks,
    });

    if (limit) {
      const totalRestocks = await ModelRestock.countDocuments(filter);
      response.data.pagination = {
        currentPage: page,
        totalPages: Math.ceil(totalRestocks / limit),
        totalRestocks,
        limit,
      };
    }

    return res.json(response);
  } catch (e) {
    throw new errorHandle(e.message, 500);
  }
});

exports.GetSingleRestock = useAsync(async (req, res) => {
  try {
    const { id } = req.params;

    const restock = await ModelRestock.findById(id).populate("supplier").lean();

    if (!restock) {
      return res
        .status(404)
        .json(utils.JParser("Restock not found", false, null));
    }

    // Attach its products
    const products = await ModelRestockProduct.find({ restock: id })
      .populate("product")
      .lean();

    restock.products = products;

    return res.json(
      utils.JParser("Restock fetched successfully", true, restock),
    );
  } catch (e) {
    throw new errorHandle(e.message, 500);
  }
});

exports.UpdateRestockProduct = useAsync(async (req, res) => {
  try {
    const { id } = req.params;

    const schema = Joi.object({
      product: Joi.string().optional(),
      quantity: Joi.string().optional(),
    });

    const validator = await schema.validateAsync(req.body);
    validator.updated_at = Date.now();

    // Update but do not allow updating deleted product
    const updatedProduct = await ModelRestockProduct.findOneAndUpdate(
      { _id: id, isDeleted: false },
      validator,
      { new: true },
    ).populate("product");

    if (!updatedProduct) {
      return res
        .status(404)
        .json(utils.JParser("Restock product not found", false, null));
    }

    return res.json(
      utils.JParser(
        "Restock product updated successfully",
        true,
        updatedProduct,
      ),
    );
  } catch (e) {
    throw new errorHandle(e.message, 500);
  }
});

//////////////////////////////////////////////////////////////////////////////////////
////SUPPLIER ROUTES
//////////////////////////////////////////////////////////////////////////////////////

exports.CreateSupplier = useAsync(async (req, res) => {
  try {
    const accountType = req.userType;
    const accountID = req.userId;

    const schema = Joi.object({
      name: Joi.string().required(),
      product: Joi.string().optional(),
      contactName: Joi.string().optional(),
      contactRole: Joi.string().optional(),
      contactNumber: Joi.string().optional(),
      phone: Joi.string().optional(),
      address: Joi.string().optional(),
      email: Joi.string().email().required(),
      branch: Joi.string().optional(),
    });

    const validator = await schema.validateAsync(req.body);

    if (accountType === "user") {
      const user = await ModelUser.findOne({ _id: accountID });
      if (!user) {
        return res
          .status(400)
          .json(utils.JParser("Invalid user, Try again later", false, []));
      }
      validator.admin = user.admin;
    } else {
      validator.admin = accountID;
    }

    const validates = await ModelSupplier.findOne({ email: validator.email });
    if (validates) {
      return res.json(
        utils.JParser("There is another supplier with this email", false, []),
      );
    } else {
      const supplier = await ModelSupplier.create(validator);
      return res.json(
        utils.JParser("Supplier created successfully", !!supplier, supplier),
      );
    }
  } catch (e) {
    throw new errorHandle(e.message, 500);
  }
});

exports.UpdateSupplier = useAsync(async (req, res) => {
  try {
    const { id } = req.params;
    const schema = Joi.object({
      name: Joi.string().optional(),
      product: Joi.string().optional(),
      contactName: Joi.string().optional(),
      contactRole: Joi.string().optional(),
      contactNumber: Joi.string().optional(),
      phone: Joi.string().optional(),
      address: Joi.string().optional(),
      email: Joi.string().email().optional(),
      branch: Joi.string().optional(),
    });

    const validator = await schema.validateAsync(req.body);
    validator.updated_at = Date.now();

    const updatedSupplier = await ModelSupplier.findByIdAndUpdate(
      id,
      validator,
      { new: true },
    );

    if (!updatedSupplier) {
      return res
        .status(404)
        .json(utils.JParser("Supplier not found", false, null));
    }

    return res.json(
      utils.JParser(
        "Supplier updated successfully",
        !!updatedSupplier,
        updatedSupplier,
      ),
    );
  } catch (e) {
    throw new errorHandle(e.message, 500);
  }
});

exports.DeleteSupplier = useAsync(async (req, res) => {
  try {
    const { id } = req.params;
    const deletedSupplier = await ModelSupplier.findByIdAndUpdate(
      id,
      {
        isDeleted: true,
        updated_at: Date.now(),
      },
      { new: true },
    );

    if (!deletedSupplier) {
      return res
        .status(404)
        .json(utils.JParser("Supplier not found", false, null));
    }

    return res.json(
      utils.JParser(
        "Supplier deleted successfully",
        !!deletedSupplier,
        deletedSupplier,
      ),
    );
  } catch (e) {
    throw new errorHandle(e.message, 500);
  }
});

exports.GetAllSuppliers = useAsync(async (req, res) => {
  try {
    const accountType = req.userType;
    const accountID = req.userId;

    let filter = {};
    if (accountType === "user") {
      const user = await ModelUser.findOne({ _id: accountID });
      if (!user) {
        return res
          .status(400)
          .json(utils.JParser("Invalid user, Try again later", false, []));
      }
      filter = { admin: user.admin };
    } else if (accountType === "admin") {
      filter = { admin: accountID };
    }

    // 🔍 Search filter
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i"); // case-insensitive
      filter.$or = [
        { name: searchRegex },
        { product: searchRegex },
        { contactName: searchRegex },
        { contactRole: searchRegex },
        { contactNumber: searchRegex },
        { phone: searchRegex },
        { email: searchRegex },
        { branch: searchRegex },
        { address: searchRegex },
      ];
    }

    const page = parseInt(req.query.page) || 1;
    const limit =
      req.query.limit === "all" ? null : parseInt(req.query.limit) || 10;
    const skip = req.query.limit === "all" ? 0 : (page - 1) * limit;

    const query = ModelSupplier.find(filter).lean();
    if (limit !== null) query.skip(skip).limit(limit);
    const suppliers = await query.exec();

    const supplierIds = suppliers.map((s) => s._id);

    const products = await ModelProduct.find({
      supplier: { $in: supplierIds },
    }).lean();
    const restocks = await ModelRestock.find({
      supplier: { $in: supplierIds },
    }).lean();

    const productsBySupplier = products.reduce((acc, product) => {
      if (!acc[product.supplier]) acc[product.supplier] = [];
      acc[product.supplier].push(product);
      return acc;
    }, {});

    const restocksBySupplier = restocks.reduce((acc, restock) => {
      if (!acc[restock.supplier]) acc[restock.supplier] = [];
      acc[restock.supplier].push(restock);
      return acc;
    }, {});

    const suppliersWithDetails = suppliers.map((supplier) => ({
      ...supplier,
      products: productsBySupplier[supplier._id] || [],
      restocks: restocksBySupplier[supplier._id] || [],
    }));

    const response = utils.JParser("Suppliers fetched successfully", true, {
      data: suppliersWithDetails,
    });

    if (limit !== null) {
      const totalSuppliers = await ModelSupplier.countDocuments(filter); // ✅ count with filter
      response.data.pagination = {
        currentPage: page,
        totalPages: Math.ceil(totalSuppliers / limit),
        totalSuppliers,
        limit,
      };
    }

    return res.json(response);
  } catch (e) {
    throw new errorHandle(e.message, 500);
  }
});

exports.GetSingleSupplier = useAsync(async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Fetch supplier
    const supplier = await ModelSupplier.findById(id).lean();
    if (!supplier) {
      return res
        .status(404)
        .json(utils.JParser("Supplier not found", false, null));
    }

    // 2. Fetch related products and restocks
    const [products, restocks] = await Promise.all([
      ModelProduct.find({ supplier: id })
        // .select('productName quantity _id')
        .lean(),
      ModelRestock.find({ supplier: id })
        // .select('quantity creationDateTime product')
        .populate("product", "productName _id")
        .lean(),
    ]);

    // 3. Combine data
    const supplierWithDetails = {
      ...supplier,
      products,
      restocks,
    };

    return res.json(
      utils.JParser("Supplier fetched successfully", true, supplierWithDetails),
    );
  } catch (e) {
    throw new errorHandle(e.message, 500);
  }
});

//////////////////////////////////////////////////////////////////////////////////////
////BATCH ROUTES
//////////////////////////////////////////////////////////////////////////////////////

exports.CreateBatch = useAsync(async (req, res) => {
  try {
    const accountType = req.userType;
    const accountID = req.userId;

    let admin;

    if (accountType === "user") {
      const user = await ModelUser.findOne({ _id: accountID }).lean();
      if (!user) {
        return res
          .status(400)
          .json(utils.JParser("Invalid user, Try again later", false, []));
      }
      admin = user.admin;
    } else {
      admin = accountID;
    }

    const schema = Joi.object({
      manufacturer: Joi.string().required(),
      product: Joi.string().required(),
      invoiceNumber: Joi.string().required(),
      supplier: Joi.string().required(),
      image: Joi.string().allow(""),
      receipt: Joi.string().allow(""),
      batch: Joi.array()
        .items(
          Joi.object({
            quantity: Joi.number().min(1).required(),
            batchNumber: Joi.string().required(),
            expiryDate: Joi.number().required(),
            sellingPrice: Joi.number().min(0).allow(null),
            supplyPrice: Joi.number().min(0).allow(null),
          }),
        )
        .min(1)
        .required(),
    });

    const validator = await schema.validateAsync(req.body);

    // Process each batch item
    const batchPromises = validator.batch.map(async (batchItem) => {
      const batchNumber = batchItem.batchNumber;

      batchItem.admin = admin;

      if (batchNumber) {
        const existingBatch = await ModelBatch.findOne({ admin, batchNumber });
        if (existingBatch) {
          return res
            .status(400)
            .json(
              utils.JParser(
                `Batch with batchNumber ${batchNumber} already exists`,
                false,
                [],
              ),
            );
        }
      }

      const batchData = {
        ...batchItem,
        manufacturer: validator.manufacturer,
        product: validator.product,
        invoiceNumber: validator.invoiceNumber,
        supplier: validator.supplier,
        image: validator.image,
        receipt: validator.receipt,
        creationDateTime: Date.now(),
        updated_at: Date.now(),
      };

      const newBatch = await ModelBatch.create(batchData);

      // Generate pins and create labels for each unit in the batch
      const labels = [];
      for (let i = 0; i < batchItem.quantity; i++) {
        labels.push({
          batch: newBatch._id,
          product: validator.product,
          admin: admin,
          pin: generatePin(),
          status: "active",
        });
      }
      if (labels.length > 0) {
        await ModelLabel.insertMany(labels);
      }

      return newBatch;
    });

    const createdBatches = await Promise.all(batchPromises);
    await ModelProduct.findByIdAndUpdate(validator.product, {
      status: "In-Stock",
    });

    return res.json(
      utils.JParser(
        "Batches created successfully",
        !!createdBatches,
        createdBatches,
      ),
    );
  } catch (e) {
    throw new errorHandle(e.message, 400);
  }
});

exports.GetAllBatches = useAsync(async (req, res) => {
  try {
    const accountType = req.userType;
    const accountID = req.userId;

    let filter = {};
    if (accountType === "user") {
      const user = await ModelUser.findOne({ _id: accountID });
      if (!user) {
        return res
          .status(400)
          .json(utils.JParser("Invalid user, Try again later", false, []));
      }
      filter = { admin: user.admin };
    } else if (accountType === "admin") {
      filter = { admin: accountID };
    }

    // 🔍 Add search support
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i"); // case-insensitive

      filter.$or = [
        { batchNumber: searchRegex },
        { manufacturer: searchRegex },
        { invoiceNumber: searchRegex },
        { notes: searchRegex },
        { status: searchRegex },
      ];
    }

    const page = parseInt(req.query.page) || 1;
    const limit =
      req.query.limit === "all" ? null : parseInt(req.query.limit) || 10;
    const skip = req.query.limit === "all" ? 0 : (page - 1) * limit;

    const query = ModelBatch.find(filter)
      .populate("supplier")
      .populate("product")
      .sort({ _id: -1 })
      .lean();

    if (limit !== null) query.skip(skip).limit(limit);

    let batches = await query.exec();

    // ✅ Optional: also filter populated fields (supplier/product) in-memory
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i");
      batches = batches.filter(
        (b) =>
          searchRegex.test(b.batchNumber) ||
          searchRegex.test(b.manufacturer || "") ||
          searchRegex.test(b.invoiceNumber || "") ||
          searchRegex.test(b.notes || "") ||
          searchRegex.test(b.status || "") ||
          (b.supplier && searchRegex.test(b.supplier.name || "")) ||
          (b.product && searchRegex.test(b.product.productName || "")),
      );
    }

    const response = utils.JParser("Batches fetched successfully", true, {
      data: batches,
    });

    if (limit !== null) {
      // ⚠️ Count only with DB filter (before in-memory filtering of populated fields)
      const totalBatches = await ModelBatch.countDocuments(filter);
      response.data.pagination = {
        currentPage: page,
        totalPages: Math.ceil(totalBatches / limit),
        totalBatches,
        limit,
      };
    }

    return res.json(response);
  } catch (e) {
    throw new errorHandle(e.message, 500);
  }
});

// Get Single Batch
exports.GetSingleBatch = useAsync(async (req, res) => {
  try {
    const batch = await ModelBatch.findById(req.params.id)
      .populate("supplier")
      .populate("product")
      .lean();

    if (!batch) throw new errorHandle("Batch not found", 404);

    // Optionally include labels if requested
    if (req.query.includeLabels === "true") {
      const ModelLabel = require("../models/model.Label");
      batch.labels = await ModelLabel.find({ batch: batch._id }).lean();
    }

    return res.json(utils.JParser("Batch fetched successfully", true, batch));
  } catch (e) {
    throw new errorHandle(e.message, 400);
  }
});

// Update Batch
exports.UpdateBatch = useAsync(async (req, res) => {
  try {
    const validator = req.body;
    const batch = await ModelBatch.findByIdAndUpdate(
      req.params.id,
      { ...validator, updated_at: Date.now() },
      { new: true },
    ).lean();

    if (!batch) throw new errorHandle("Batch not found", 404);

    return res.json(utils.JParser("Batch updated successfully", true, batch));
  } catch (e) {
    throw new errorHandle(e.message, 400);
  }
});

// Delete Batch
exports.DeleteBatch = useAsync(async (req, res) => {
  try {
    const batch = await ModelBatch.findByIdAndUpdate(
      req.params.id,
      {
        isDeleted: true,
        updated_at: Date.now(),
      },
      { new: true },
    );

    if (!batch) throw new errorHandle("Batch not found", 404);

    return res.json(utils.JParser("Batch deleted successfully", true, batch));
  } catch (e) {
    throw new errorHandle(e.message, 400);
  }
});

// Calculate average price and suggest selling price
exports.calculateProductPricing = useAsync(async (req, res) => {
  try {
    const { id } = req.params;
    const productId = id;

    if (!productId) {
      throw new errorHandle("Product ID is required", 400);
    }

    // Find the product
    const product = await ModelProduct.findById(productId);
    if (!product) {
      throw new errorHandle("Product not found", 404);
    }

    // Get all batches for this product with positive quantity
    const batches = await ModelBatch.find({
      product: productId,
    }).sort({ createdAt: 1 });

    if (batches.length === 0) {
      throw new errorHandle("No available batches found for this product", 404);
    }

    // Calculate weighted average cost price (using supplyPrice as cost)
    let totalCostValue = 0;
    let totalQuantity = 0;
    let totalSellingValue = 0;

    batches.forEach((batch) => {
      const quantity = batch.quantity === 0 ? 1 : batch.quantity;
      const supplyPrice = batch.supplyPrice || 0;
      const sellingPrice = batch.sellingPrice || 0;

      totalCostValue += supplyPrice * quantity;
      totalSellingValue += sellingPrice * quantity;
      totalQuantity += quantity;
    });

    const averageCostPrice = totalCostValue / totalQuantity;
    const averageSellingPrice = totalSellingValue / totalQuantity;

    // Calculate markup percentage: (selling price - cost) / cost × 100
    let markupPercentage = 0;
    if (averageCostPrice > 0) {
      markupPercentage =
        ((averageSellingPrice - averageCostPrice) / averageCostPrice) * 100;
    }

    // Round to 2 decimal places
    const roundedAverageCost = Math.round(averageCostPrice * 100) / 100;
    const roundedAverageSelling = Math.round(averageSellingPrice * 100) / 100;
    const roundedMarkupPercentage = Math.round(markupPercentage * 100) / 100;

    // Get current selling price for comparison
    const currentSellingPrice = product.price || 0;

    return res.json(
      utils.JParser("Pricing calculation successful", true, {
        product: {
          _id: product._id,
          name: product.productName,
        },
        batchStatistics: {
          totalBatches: batches.length,
          totalQuantity: totalQuantity,
          averageCostPrice: roundedAverageCost,
          averageSellingPrice: roundedAverageSelling,
          // markupPercentage: roundedMarkupPercentage,
          currentSellingPrice: currentSellingPrice,
        },
        batches: batches.map((batch) => ({
          batchNumber: batch.batchNumber,
          supplyPrice: batch.supplyPrice || 0,
          sellingPrice: batch.sellingPrice || 0,
          quantity: batch.quantity,
          batchMarkup:
            batch.supplyPrice > 0 && batch.sellingPrice > 0
              ? Math.round(
                  ((batch.sellingPrice - batch.supplyPrice) /
                    batch.supplyPrice) *
                    100 *
                    100,
                ) / 100
              : 0,
        })),
      }),
    );
  } catch (e) {
    throw new errorHandle(e.message, 400);
  }
});

// Update product selling price
exports.updateProductPrice = useAsync(async (req, res) => {
  try {
    const { price, productId } = req.body;

    if (!productId || !price) {
      throw new errorHandle("Product ID and selling price are required", 400);
    }

    if (typeof price !== "number" || price <= 0) {
      throw new errorHandle("Selling price must be a positive number", 400);
    }

    // Find the product
    const product = await ModelProduct.findById(productId);
    if (!product) {
      throw new errorHandle("Product not found", 404);
    }

    // Store old price for history/audit
    const oldPrice = product.price;

    // Update the product price
    const updatedProduct = await ModelProduct.findByIdAndUpdate(
      productId,
      {
        price: price,
        lastPriceUpdate: Date.now(),
        oldPrice: oldPrice,
      },
      { new: true },
    );

    return res.json(
      utils.JParser("Product price updated successfully", true, {
        product: {
          _id: updatedProduct._id,
          name: updatedProduct.productName,
          price: updatedProduct.price,
        },
      }),
    );
  } catch (e) {
    throw new errorHandle(e.message, 400);
  }
});

//////////////////////////////////////////////////////////////////////////////////////
////STOCK ROUTES
//////////////////////////////////////////////////////////////////////////////////////

exports.CreateStock = useAsync(async (req, res) => {
  try {
    const accountType = req.userType;
    const accountID = req.userId;

    const schema = Joi.object({
      contactNumber: Joi.string().optional(),
      address: Joi.string().optional(),
      notes: Joi.string().optional(),
      level: Joi.string().optional(),
      lastStock: Joi.string().optional(),
      status: Joi.string().valid("Low", "Medium", "High").optional(),
      price: Joi.number().min(0).optional(),
      product: Joi.string().required(),
      customer: Joi.string().required(),
    });

    const validator = await schema.validateAsync(req.body);

    let adminId;
    let userId = null;
    if (accountType === "user") {
      const user = await ModelUser.findOne({ _id: accountID }).lean();
      if (!user) {
        return res.json(
          utils.JParser("Invalid user, Try again later", false, []),
        );
      }
      adminId = user.admin;
      userId = accountID; // Set user ID for merchandiser
    } else {
      adminId = accountID;
    }

    // Generate stock ID
    const stockId = await genStockID();

    // Verify product exists
    const product = await ModelProduct.findById(validator.product);
    if (!product) {
      return res
        .status(404)
        .json(utils.JParser("Product not found", false, null));
    }

    // Verify customer exists
    const customer = await ModelCustomer.findById(validator.customer);
    if (!customer) {
      return res
        .status(404)
        .json(utils.JParser("Customer not found", false, null));
    }

    const stock = await ModelStocks.create({
      ...validator,
      ID: stockId,
      admin: adminId,
      user: userId, // Include user ID if it's a merchandiser
    });

    return res.json(
      utils.JParser("Stock created successfully", !!stock, stock),
    );
  } catch (e) {
    throw new errorHandle(e.message, 500);
  }
});

exports.UpdateStock = useAsync(async (req, res) => {
  try {
    const { id } = req.params;

    const schema = Joi.object({
      contactNumber: Joi.string().optional(),
      address: Joi.string().optional(),
      notes: Joi.string().optional(),
      level: Joi.string().optional(),
      lastStock: Joi.string().optional(),
      status: Joi.string().valid("Low", "Medium", "High").optional(),
      price: Joi.number().min(0).optional(),
      product: Joi.string().optional(),
      customer: Joi.string().optional(),
    });

    const validator = await schema.validateAsync(req.body);
    validator.updated_at = Date.now();

    // If product is being updated, verify it exists
    if (validator.product) {
      const product = await ModelProduct.findById(validator.product);
      if (!product) {
        return res
          .status(404)
          .json(utils.JParser("Product not found", false, null));
      }
    }

    // If customer is being updated, verify it exists
    if (validator.customer) {
      const customer = await ModelCustomer.findById(validator.customer);
      if (!customer) {
        return res
          .status(404)
          .json(utils.JParser("Customer not found", false, null));
      }
    }

    const updatedStock = await ModelStocks.findByIdAndUpdate(id, validator, {
      new: true,
    });

    if (!updatedStock) {
      return res
        .status(404)
        .json(utils.JParser("Stock not found", false, null));
    }

    return res.json(
      utils.JParser("Stock updated successfully", true, updatedStock),
    );
  } catch (e) {
    throw new errorHandle(e.message, 500);
  }
});

exports.DeleteStock = useAsync(async (req, res) => {
  try {
    const { id } = req.params;

    const deletedStock = await ModelStocks.findByIdAndUpdate(
      id,
      {
        isDeleted: true,
        updated_at: Date.now(),
      },
      { new: true },
    );

    if (!deletedStock) {
      return res
        .status(404)
        .json(utils.JParser("Stock not found", false, null));
    }

    return res.json(
      utils.JParser("Stock deleted successfully", true, deletedStock),
    );
  } catch (e) {
    throw new errorHandle(e.message, 500);
  }
});

exports.GetAllStocks = useAsync(async (req, res) => {
  try {
    const accountType = req.userType;
    const accountID = req.userId;

    const page = parseInt(req.query.page) || 1;
    const limit =
      req.query.limit === "all" ? null : parseInt(req.query.limit) || 10;
    const skip = req.query.limit === "all" ? 0 : (page - 1) * limit;
    const search = req.query.search ? req.query.search.trim() : null;

    let filter = {};

    if (accountType === "user") {
      const user = await ModelUser.findOne({ _id: accountID });
      if (!user) {
        return res
          .status(400)
          .json(utils.JParser("Invalid user, Try again later", false, []));
      }
      filter = { admin: user.admin };
    } else if (accountType === "admin") {
      filter = { admin: accountID };
    }

    // Add product filter if provided
    if (req.query.product) {
      filter.product = req.query.product;
    }

    // Add customer filter if provided
    if (req.query.customer) {
      filter.customer = req.query.customer;
    }

    // Add status filter if provided
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Search filter
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { ID: regex },
        { contactNumber: regex },
        { address: regex },
        { notes: regex },
        { level: regex },
        { lastStock: regex },
        { status: regex },
      ];
    }

    let query = ModelStocks.find(filter)
      .populate("product")
      .populate({
        path: "customer",
        populate: { path: "lead" },
      })
      .populate("admin", "-password -token")
      .populate("user", "-password -token")
      .sort({ _id: -1 })
      .lean();

    if (limit !== null) query = query.skip(skip).limit(limit);

    const stocks = await query.exec();

    const response = utils.JParser("Stocks fetched successfully", true, {
      data: stocks,
    });

    if (limit !== null) {
      const totalStocks = await ModelStocks.countDocuments(filter);
      response.data.pagination = {
        currentPage: page,
        totalPages: Math.ceil(totalStocks / limit),
        totalStocks,
        limit,
      };
    }

    return res.json(response);
  } catch (e) {
    throw new errorHandle(e.message, 500);
  }
});

exports.GetSingleStock = useAsync(async (req, res) => {
  try {
    const { id } = req.params;

    const stock = await ModelStocks.findById(id)
      .populate("product")
      .populate({
        path: "customer",
        populate: { path: "lead" },
      })
      .populate("admin", "-password -token")
      .populate("user", "-password -token")
      .lean();

    if (!stock) {
      return res
        .status(404)
        .json(utils.JParser("Stock not found", false, null));
    }

    return res.json(utils.JParser("Stock fetched successfully", true, stock));
  } catch (e) {
    throw new errorHandle(e.message, 500);
  }
});

exports.GetUserStocks = useAsync(async (req, res) => {
  try {
    const accountID = req.userId;
    const page = parseInt(req.query.page) || 1;
    const limit =
      req.query.limit === "all" ? null : parseInt(req.query.limit) || 10;
    const skip = req.query.limit === "all" ? 0 : (page - 1) * limit;
    const search = req.query.search ? req.query.search.trim() : null;

    // Filter by user ID (merchandiser)
    let filter = { user: accountID };

    // Add product filter if provided
    if (req.query.product) {
      filter.product = req.query.product;
    }

    // Add customer filter if provided
    if (req.query.customer) {
      filter.customer = req.query.customer;
    }

    // Add status filter if provided
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Search filter
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { ID: regex },
        { contactNumber: regex },
        { address: regex },
        { notes: regex },
        { level: regex },
        { lastStock: regex },
        { status: regex },
      ];
    }

    let query = ModelStocks.find(filter)
      .populate("product")
      .populate({
        path: "customer",
        populate: { path: "lead" },
      })
      .populate("admin", "-password -token")
      .populate("user", "-password -token")
      .sort({ _id: -1 })
      .lean();

    if (limit !== null) query = query.skip(skip).limit(limit);

    const stocks = await query.exec();

    const response = utils.JParser("User stocks fetched successfully", true, {
      data: stocks,
    });

    if (limit !== null) {
      const totalStocks = await ModelStocks.countDocuments(filter);
      response.data.pagination = {
        currentPage: page,
        totalPages: Math.ceil(totalStocks / limit),
        totalStocks,
        limit,
      };
    }

    return res.json(response);
  } catch (e) {
    throw new errorHandle(e.message, 500);
  }
});

exports.GetCompanyStocks = useAsync(async (req, res) => {
  try {
    const accountType = req.userType;
    const accountID = req.userId;

    const page = parseInt(req.query.page) || 1;
    const limit =
      req.query.limit === "all" ? null : parseInt(req.query.limit) || 10;
    const skip = req.query.limit === "all" ? 0 : (page - 1) * limit;
    const search = req.query.search ? req.query.search.trim() : null;

    let filter = {};

    // Get admin ID based on account type
    if (accountType === "user") {
      const user = await ModelUser.findOne({ _id: accountID });
      if (!user) {
        return res
          .status(400)
          .json(utils.JParser("Invalid user, Try again later", false, []));
      }
      filter = { admin: user.admin };
    } else if (accountType === "admin") {
      filter = { admin: accountID };
    }

    // Add product filter if provided
    if (req.query.product) {
      filter.product = req.query.product;
    }

    // Add customer filter if provided
    if (req.query.customer) {
      filter.customer = req.query.customer;
    }

    // Add status filter if provided
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Add user filter if provided (to filter by specific merchandiser)
    if (req.query.user) {
      filter.user = req.query.user;
    }

    // Search filter
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { ID: regex },
        { contactNumber: regex },
        { address: regex },
        { notes: regex },
        { level: regex },
        { lastStock: regex },
        { status: regex },
      ];
    }

    let query = ModelStocks.find(filter)
      .populate("product")
      .populate({
        path: "customer",
        populate: { path: "lead" },
      })
      .populate("admin", "-password -token")
      .populate("user", "-password -token")
      .sort({ _id: -1 })
      .lean();

    if (limit !== null) query = query.skip(skip).limit(limit);

    const stocks = await query.exec();

    const response = utils.JParser(
      "Company stocks fetched successfully",
      true,
      { data: stocks },
    );

    if (limit !== null) {
      const totalStocks = await ModelStocks.countDocuments(filter);
      response.data.pagination = {
        currentPage: page,
        totalPages: Math.ceil(totalStocks / limit),
        totalStocks,
        limit,
      };
    }

    return res.json(response);
  } catch (e) {
    throw new errorHandle(e.message, 500);
  }
});

exports.GetMerchandiserOverview = useAsync(async (req, res) => {
  try {
    const accountID = req.userId;

    // Verify user exists
    const user = await ModelUser.findOne({ _id: accountID });
    if (!user) {
      return res
        .status(400)
        .json(utils.JParser("Invalid user, Try again later", false, []));
    }

    // 1. Get total tasks assigned to the merchandiser
    const totalTasks = await ModelTask.countDocuments({ user: accountID });

    // 2. Get total products (distinct products from stocks created by the merchandiser)
    const userStocks = await ModelStocks.find({ user: accountID })
      .select("product")
      .lean();
    const uniqueProductIds = [
      ...new Set(
        userStocks.map((stock) => stock.product?.toString()).filter(Boolean),
      ),
    ];
    const totalProducts = uniqueProductIds.length;

    // 3. Get top 10 products with product name, image, level, price
    // Group stocks by product and get the most recent stock for each product
    const stocksWithProducts = await ModelStocks.find({ user: accountID })
      .populate("product", "productName productImage")
      .select("product level price")
      .sort({ _id: -1 })
      .lean();

    // Group by product and get the latest stock entry for each product
    const productMap = new Map();
    stocksWithProducts.forEach((stock) => {
      if (stock.product && stock.product._id) {
        const productId = stock.product._id.toString();
        if (!productMap.has(productId)) {
          productMap.set(productId, {
            productName: stock.product.productName || "Unknown Product",
            productImage: stock.product.productImage || null,
            level: stock.level || null,
            price: stock.price || null,
          });
        }
      }
    });

    // Convert to array and limit to top 10
    const topProducts = Array.from(productMap.values()).slice(0, 10);

    return res.json(
      utils.JParser("Merchandiser overview fetched successfully", true, {
        totalTasks,
        totalProducts,
        topProducts,
      }),
    );
  } catch (e) {
    throw new errorHandle(e.message, 500);
  }
});
