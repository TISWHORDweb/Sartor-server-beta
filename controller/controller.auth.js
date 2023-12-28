const express = require('express')
const router = express.Router()
// const ModelPerson = require("../../../models/mongoro/auth/mongoroUser_md")
// const AuditModel = require("../../../models/mongoro/auth/user/audit/audit_md")
const verify = require("../verifyToken")
const bcrypt = require('bcryptjs')
let multer = require('multer')
let fs = require('fs')
let path = require('path');
const address = require('address');
const CryptoJS = require("crypto-js")
const axios = require('axios')
const nodemailer = require('nodemailer');
const jwt = require("jsonwebtoken")
const dotenv = require("dotenv")
const sha1 = require('sha1');
dotenv.config()
const request = require('request');
// const GlobalModel = require('../../../models/mongoro/admin/super_admin/global/global_md')
const { notify } = require('../core/core.utils');
const { useAsync, utils, errorHandle, } = require('./../core');
// const MindCastFavourite = require('../models/model.favourites')
const { EmailNote } = require('../core/core.notify')
const ModelAdmin = require('../models/model.admin')
const ModelSalesAgent = require('../models/model.salesAgent')



exports.AdminRegister = useAsync(async (req, res) => {

    if (req.body.password) {
        req.body.password = await bcrypt.hash(req.body.password, 13)
    }

    try {
        if (!req.body.email  || !req.body.password ) return res.json(utils.JParser('please check the fields', false, []));

        req.body.token = sha1(req.body.email + new Date())
        req.body.lastLogin = CryptoJS.AES.encrypt(JSON.stringify(new Date()), process.env.SECRET_KEY).toString()

        const validates = await ModelAdmin.findOne({ email: req.body.email })
        if (validates) {
            return res.json(utils.JParser('There is another admin with this email', false, []));
        } else {

            let admin = await new ModelAdmin(req.body)

            await admin.save().then(data => {

                data.password = "********************************"

                return res.json(utils.JParser('Congratulation Account created successfully', !!data, data));

            })
        }
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.AdminLogin = useAsync(async (req, res) => {
    try {
        res.header("Access-Control-Allow-Origin", "*");
        const admin = await ModelAdmin.findOne({ email: req.body.email })
        let resultt;
        let adminPassword;
        let name;
        let body;
        let subject;

        if (admin) {
            email= admin.email;
            resultt = admin.blocked;
            adminPassword = admin.password;
            name = admin.fullName;
            body = "Login detected";
            subject = "Login Notification";

            //update user if regToken is passed
            if (!!req.body.token) await admin.update({ token: req.body.token })

        } else {
            return res.json(utils.JParser("Invalid email or password", false, []));
        }
        
        if (resultt === true) {
            return res.json(utils.JParser('Sorry your account is blocked', false, []));
        }

        if (adminPassword) {
            const originalPassword = await bcrypt.compare(req.body.password, adminPassword);

            if (!originalPassword) {
                return res.json(utils.JParser('Wrong password', false, []));
            } else {

                const token = sha1(req.body.email + new Date())
                const lastLogin = CryptoJS.AES.encrypt(JSON.stringify(new Date()), process.env.SECRET_KEY).toString()

                await ModelAdmin.updateOne({ _id: admin._id }, { $set: {token: token, lastLogin: lastLogin } }).then(() => {
                    EmailNote(email,name,body,subject)
                    admin.token = token
                    return res.json(utils.JParser('logged in successfuly', true,  admin ));
                })
            }
        }
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.SalesAgentRegister = useAsync(async (req, res) => {

    if (req.body.password) {
        req.body.password = await bcrypt.hash(req.body.password, 13)
    }

    try {
        if (!req.body.email  || !req.body.password ) return res.json(utils.JParser('please check the fields', false, []));

        req.body.token = sha1(req.body.email + new Date())
        req.body.lastLogin = CryptoJS.AES.encrypt(JSON.stringify(new Date()), process.env.SECRET_KEY).toString()

        const validates = await ModelSalesAgent.findOne({ email: req.body.email })
        if (validates) {
            return res.json(utils.JParser('There is another Sales agent with this email', false, []));
        } else {

            let salesAgent = await new ModelSalesAgent(req.body)

            await salesAgent.save().then(data => {

                data.password = "********************************"

                return res.json(utils.JParser('Congratulation Account created successfully', !!data, data));

            })
        }
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.SalesAgentLogin = useAsync(async (req, res) => {

    try {
        res.header("Access-Control-Allow-Origin", "*");
        const salesAgent = await ModelSalesAgent.findOne({ email: req.body.email })
        let resultt;
        let salesAgentPassword;
        let name;
        let body;
        let subject;

        if (salesAgent) {
            email= salesAgent.email;
            resultt = salesAgent.blocked;
            salesAgentPassword = salesAgent.password;
            name = salesAgent.fullName;
            body = "Login detected";
            subject = "Login Notification";

            //update user if regToken is passed
            if (!!req.body.token) await salesAgent.update({ token: req.body.token })

        } else {
            return res.json(utils.JParser("Invalid email or password", false, []));
        }
        
        if (resultt === true) {
            return res.json(utils.JParser('Sorry your account is blocked', false, []));
        }

        if (salesAgentPassword) {
            const originalPassword = await bcrypt.compare(req.body.password, salesAgentPassword);

            if (!originalPassword) {
                return res.json(utils.JParser('Wrong password', false, []));
            } else {

                const token = sha1(req.body.email + new Date())
                const lastLogin = CryptoJS.AES.encrypt(JSON.stringify(new Date()), process.env.SECRET_KEY).toString()

                await ModelSalesAgent.updateOne({ _id: salesAgent._id }, { $set: {token: token, lastLogin: lastLogin } }).then(() => {
                    EmailNote(email,name,body,subject)
                    salesAgent.token = token
                    return res.json(utils.JParser('logged in successfuly', true,  salesAgent ));
                })
            }
        }
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})


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