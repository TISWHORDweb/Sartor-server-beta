/**
 * Slantapp code and properties {www.slantapp.io}
 */

const { errorHandle, useAsync, utils } = require('../core');
const CryptoJS = require("crypto-js");
const ModelUser = require('../models/model.user');

//body safe state
exports.bodyParser = (req, res, next) => {
    if (!Object.keys(req.body).length > 0) throw new errorHandle("the document body is empty", 202);
    else next();
}

const PRIVILEGED_ROLES = ['admin'];

//universal
exports.authMiddleware = useAsync(async (req, res, next) => {
  const sToken = req.headers['s-token'];

  if (!sToken || sToken === 'undefined') {
    return res
      .status(401)
      .json(utils.JParser("Unauthorized Access, Use a valid token and try again", false, []));
  }

  const isValid = await ModelUser.findOne({ token: sToken });

  if (!isValid) {
    return res
      .status(400)
      .json(utils.JParser("Invalid token code or token, Use a valid token and try again", false, []));
  }

  const bytes = CryptoJS.AES.decrypt(isValid.lastLogin, process.env.SECRET_KEY);
  let lastLogin = bytes.toString(CryptoJS.enc.Utf8);

  try {
    lastLogin = new Date(JSON.parse(lastLogin));
  } catch (e) {
    return res
      .status(400)
      .json(utils.JParser("Corrupted last login timestamp", false, []));
  }

  const oneHour = 1440 * 1440 * 1000; // 4 hours, confirm if this is intentional

  if ((new Date() - lastLogin) > oneHour) {
    return res
      .status(401)
      .json(utils.JParser("Invalid or expired token, Use a valid token and try again", false, []));
  }

  if (isValid.blocked) {
    return res
      .status(400)
      .json(utils.JParser("Token is valid but not authorized for this route", false, []));
  }

  req.userId = isValid._id;
  req.user = isValid;
  return next(); // proceed only if all checks passed
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