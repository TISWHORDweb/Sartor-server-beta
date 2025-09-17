/**
 * Slantapp code and properties {www.slantapp.io}
 */

const { errorHandle, useAsync, utils } = require('../core');
const CryptoJS = require("crypto-js");
const ModelUser = require('../models/model.user');
const ModelAdmin = require('../models/model.admin');

//body safe state
exports.bodyParser = (req, res, next) => {
  if (!Object.keys(req.body).length > 0) throw new errorHandle("the document body is empty", 202);
  else next();
}

const PRIVILEGED_ROLES = ['admin'];

//universal
exports.authMiddleware = useAsync(async (req, res, next) => {
  const sToken = req.headers["s-token"];

  if (!sToken || sToken === "undefined") {
    return res
      .status(401)
      .json(utils.JParser("Unauthorized Access, Use a valid token and try again", false, []));
  }
  let adminID;
  // check user or admin
  let account = await ModelUser.findOne({ token: sToken });
  let accountType = "user";
  adminID = account?.admin

  if (!account) {
    account = await ModelAdmin.findOne({ token: sToken });
    accountType = "admin";
    adminID = account?._id
  }

  if (!account) {
    return res
      .status(401)
      .json(utils.JParser("Invalid token code or token, Use a valid token and try again", false, []));
  }

  // decrypt last login timestamp
  let lastLogin;
  try {
    const bytes = CryptoJS.AES.decrypt(account.lastLogin, process.env.SECRET_KEY);
    lastLogin = new Date(JSON.parse(bytes.toString(CryptoJS.enc.Utf8)));
  } catch (e) {
    return res
      .status(401)
      .json(utils.JParser("Corrupted last login timestamp", false, []));
  }

  const expirationMs = 24 * 60 * 60 * 1000;
  if (new Date() - lastLogin > expirationMs) {
    return res
      .status(401)
      .json(utils.JParser("Invalid or expired token, Use a valid token and try again", false, []));
  }

  if (account.blocked) {
    return res
      .status(403)
      .json(utils.JParser("Token is valid but not authorized for this route", false, []));
  }

  // attach to req
  req.userId = account._id;
  req.user = account;
  req.adminID = adminID;
  req.userType = accountType; // "user" or "admin"

  return next();
});


exports.roleMiddleware = (roles) => {
  return (req, res, next) => {
    const userRole = req.user.userRole;

    // Automatically allow privileged roles
    if (PRIVILEGED_ROLES.includes(userRole)) {
      return next();
    }

    // Check if user's role is included in the allowed roles
    if (!roles.includes(userRole)) {
      return res.status(403).send({ error: 'Access denied' });
    }

    next();
  };
};