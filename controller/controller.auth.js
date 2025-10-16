const express = require('express')
const router = express.Router()
const verify = require("../verifyToken")
const bcrypt = require('bcryptjs')
let multer = require('multer')
let fs = require('fs')
let path = require('path');
const CryptoJS = require("crypto-js")
const dotenv = require("dotenv")
const sha1 = require('sha1');
dotenv.config()
const request = require('request');
const { notify, genID, checkEmailExist } = require('../core/core.utils');
const { useAsync, utils, errorHandle, } = require('./../core');
const ModelUser = require('../models/model.user')
const EmailService = require("../services");
const ModelAdmin = require('../models/model.admin')
const ModelPermission = require('../models/model.permission')
const Joi = require('joi')
const ModelSartor = require('../models/model.sartor')



exports.UserRegister = useAsync(async (req, res) => {

    if (req.body.password) {
        req.body.password = await bcrypt.hash(req.body.password, 13)
    }

    try {

        if (!req.body.email || !req.body.password) return res.json(utils.JParser('please check the fields', false, []));
        const userId = await genID(1);
        req.body.token = sha1(req.body.email + new Date())
        req.body.lastLogin = CryptoJS.AES.encrypt(JSON.stringify(new Date()), process.env.SECRET_KEY).toString()
        req.body.userId = userId

        const check = await checkEmailExist(req.body.email);
        if (check.exists) {
            return res.status(400).json(utils.JParser(`Email already exists, kindly use another email and try again`, false, []));
        }

        const validates = await ModelAdmin.findOne({ email: req.body.email })
        if (validates) {
            return res.status(400).json(utils.JParser('There is another user with this email', false, []));
        } else {

            let user = await new ModelAdmin(req.body)

            await user.save().then(data => {

                data.password = "********************************"

                return res.json(utils.JParser('Congratulation Account created successfully', !!data, data));

            })
        }
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.sartorRegister = useAsync(async (req, res) => {

    if (req.body.password) {
        req.body.password = await bcrypt.hash(req.body.password, 13)
    }

    try {

        if (!req.body.email || !req.body.password) return res.json(utils.JParser('please check the fields', false, []));
        const userId = await genID(1);
        req.body.token = sha1(req.body.email + new Date())
        req.body.lastLogin = CryptoJS.AES.encrypt(JSON.stringify(new Date()), process.env.SECRET_KEY).toString()
        req.body.userId = "SAR-" + userId

        const check = await checkEmailExist(req.body.email);
        if (check.exists) {
            return res.status(400).json(utils.JParser(`Email already exists, kindly use another email and try again`, false, []));
        }

        const validates = await ModelSartor.findOne({ email: req.body.email })
        if (validates) {
            return res.status(400).json(utils.JParser('There is another user with this email', false, []));
        } else {

            let user = await new ModelSartor(req.body)

            await user.save().then(data => {

                data.password = "********************************"

                return res.json(utils.JParser('Congratulation Account created successfully', !!data, data));

            })
        }
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.UserLogin = useAsync(async (req, res) => {
    try {

        const { email, password, token: deviceToken } = req.body;

        // find both accounts by email
        const user = await ModelUser.findOne({ email });
        const admin = await ModelAdmin.findOne({ email });
        const sartor = await ModelSartor.findOne({ email });

        let account = null;
        let accountType = null;
        let permission = null;


        // if both exist, check which password matches
        if (user && await bcrypt.compare(password, user.password)) {
            account = user;
            accountType = "user";
            permission = await ModelPermission.findOne({ user: user._id });
        } else if (admin && await bcrypt.compare(password, admin.password)) {
            account = admin;
            accountType = "admin";
            permission = "All"
        } else if (sartor && await bcrypt.compare(password, sartor.password)) {
            account = sartor;
            accountType = "sartor";
            permission = "All"
        } else {
            return res.status(400).json(utils.JParser("Invalid email or password", false, []));
        }

        // check blocked
        if (account.blocked) {
            return res.status(400).json(utils.JParser("Sorry your account is blocked", false, []));
        }

        // generate token and login info
        const newToken = sha1(email + new Date());
        const lastLogin = CryptoJS.AES.encrypt(JSON.stringify(new Date()), process.env.SECRET_KEY).toString();
        const online = new Date();

        // update the right model
        const Model = accountType === "user" ? ModelUser : accountType === "admin" ? ModelAdmin : ModelSartor
        await Model.updateOne(
            { _id: account._id },
            {
                $set: {
                    token: newToken,
                    lastLogin,
                    online,
                }
            }
        );

        // send login notification (optional for admins)
        // if (accountType === "user") {
        EmailService.sendLoginNotification({ name: account.fullName, email: account.email });
        // }

        // attach token for response
        account.token = newToken;
        account.password = "****************************"

        return res.json(
            utils.JParser("Logged in successfully", true, {
                accountType,
                ...account.toObject(),
                permission
            })
        );

    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});

exports.EmployeeRegister = useAsync(async (req, res) => {

    if (req.body.password) {
        req.body.password = await bcrypt.hash(req.body.password, 13)
    }

    try {
        if (!req.body.email || !req.body.password) return res.json(utils.JParser('please check the fields', false, []));

        req.body.token = sha1(req.body.email + new Date())
        req.body.lastLogin = CryptoJS.AES.encrypt(JSON.stringify(new Date()), process.env.SECRET_KEY).toString()

        const validates = await ModelEmployee.findOne({ email: req.body.email })
        if (validates) {
            return res.status(400).json(utils.JParser('There is another Sales agent with this email', false, []));
        } else {

            let Employee = await new ModelEmployee(req.body)

            await Employee.save().then(data => {

                data.password = "********************************"

                return res.json(utils.JParser('Congratulation Account created successfully', !!data, data));

            })
        }
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.EmployeeLogin = useAsync(async (req, res) => {

    try {
        res.header("Access-Control-Allow-Origin", "*");
        const Employee = await ModelEmployee.findOne({ email: req.body.email })
        let resultt;
        let employeePassword;
        let name;
        let body;
        let subject;

        if (Employee) {
            email = Employee.email;
            resultt = Employee.blocked;
            employeePassword = Employee.password;
            name = Employee.fullName;
            body = "Login detected";
            subject = "Login Notification";

            //update user if regToken is passed
            if (!!req.body.token) await Employee.update({ token: req.body.token })

        } else {
            return res.status(400).json(utils.JParser("Invalid email or password", false, []));
        }

        if (resultt === true) {
            return res.status(400).json(utils.JParser('Sorry your account is blocked', false, []));
        }

        if (employeePassword) {
            const originalPassword = await bcrypt.compare(req.body.password, employeePassword);

            if (!originalPassword) {
                return res.status(400).json(utils.JParser('Wrong password', false, []));
            } else {

                const token = sha1(req.body.email + new Date())
                const lastLogin = CryptoJS.AES.encrypt(JSON.stringify(new Date()), process.env.SECRET_KEY).toString()

                await ModelEmployee.updateOne({ _id: Employee._id }, { $set: { token: token, lastLogin: lastLogin } }).then(() => {
                    // EmailNote(email, name, body, subject)
                    Employee.token = token
                    return res.json(utils.JParser('logged in successfuly', true, Employee));
                })
            }
        }
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.PasswordUpdate = useAsync(async (req, res, next) => {
    const accountID = req.userId;
    const accountType = req.userType;

    try {
        // Validate input
        const schema = Joi.object({
            passwordOld: Joi.string().min(5).required(),
            password1: Joi.string().min(5).required(),
            password2: Joi.string().min(5).required(),
        });
        const data = await schema.validateAsync(req.body);

        if (data.password1 !== data.password2) {
            return res.json(utils.JParser("Password mis-matched", false, null));
        }

        let accountModel =
            accountType === "user" ? ModelUser : accountType === "admin" ? ModelAdmin : null;

        if (!accountModel) {
            return res.json(utils.JParser("Invalid account type", false, null));
        }

        const account = await accountModel.findById(accountID);
        if (!account) {
            return res.json(utils.JParser("Account not found", false, null));
        }

        const isMatch = await bcrypt.compare(data.passwordOld, account.password);
        if (!isMatch) {
            return res.json(utils.JParser("Invalid old password", false, null));
        }

        if (accountType === "user") {
            if (account.passwordChanged === false) {
                account.passwordChanged = true
            }
        }

        const hashedPassword = await bcrypt.hash(data.password1, 10);

        account.password = hashedPassword;
        await account.save();

        account.password = "***********************************"

        return res.json(utils.JParser("Password updated successfully", true, account));
    } catch (e) {
        throw new errorHandle(e.message, 400);
    }
});

// exports.userEmailVerify = useAsync(async (req, res) => {
//     try {

//         const user = await ModelPerson.findOne({ email: req.body.email });

//         if (user) {
//             return res.json(utils.JParser('Email taken already', false, []));
//         } else {
//             return res.json(utils.JParser('Email available', true, []));
//         }

//     } catch (e) {
//         throw new errorHandle(e.message, 400)
//     }
// })


// exports.updatePassword = useAsync(async (req, res) => {

//     const user = await ModelPerson.findOne({ email: req.body.email });

//     try {
//         if (!req.body.email) return res.status(400).json({ msg: 'provide the id ?', status: 400 })

//         if (!user) {
//             return res.json(utils.JParser('No User is registered with this id', true, []));
//         }

//         const NewPassword = await bcrypt.hash(req.body.password, 13)
//         await ModelPerson.updateOne({ email: req.body.email }, { password: NewPassword }).then(async () => {
//             // const New = await ModelPerson.findOne({ email: req.body.email });
//             return res.json(utils.JParser('Password changed Successfully ', true, []));

//         }).catch((err) => {
//             res.send(err)
//         })

//     } catch (e) {
//         throw new errorHandle(e.message, 400)
//     }

// })