const dotenv = require("dotenv")
dotenv.config()
const { useAsync, utils, errorHandle, } = require('../core');
const { generatePassword, genID } = require("../core/core.utils");
const bcrypt = require('bcryptjs')
const CryptoJS = require("crypto-js")
const sha1 = require('sha1');
const { EmailNote } = require("../core/core.notify");
const ModelUser = require("../models/model.user");


exports.editUser = useAsync(async (req, res) => {

    try {

        const userId = req.body.id 
        const body = req.body

        if (!userId)   return res.status(402).json(utils.JParser('provide the user id', false, []));

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
        if (!userId)   return res.status(402).json(utils.JParser('provide the user id', false, []));

        const user = await ModelUser.deleteOne({ _id: userId })
        return res.json(utils.JParser('User deleted successfully', !!user, []));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }

});


exports.createUser= useAsync(async (req, res) => {

    try {

        const Password = await generatePassword(9);
        const userId = await genID(1);

        if (Password) {
            req.body.password = await bcrypt.hash(Password, 13)
        }

        if (!req.body.email  || !req.body.password ) return res.json(utils.JParser('please check the fields', false, []));

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
                email:email,
                name :'',
                body: `Congratulastion an account has been created for you as ${user.role} in sator kindly use your login with your email and the following password - ${Password}`,
                subject :"Account creation"
            }

            await user.save().then(data => {

                data.password = "********************************"

                EmailNote(body.email,body.name,body.body,body.subject)

                return res.json(utils.JParser('Congratulation Account created successfully', !!data, data));

            })
        }
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

