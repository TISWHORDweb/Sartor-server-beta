const express = require('express')
const dotenv = require("dotenv")
dotenv.config()
const { useAsync, utils, errorHandle, } = require('../core');
const ModelPerson = require('../models/model.person');
const ModelHobby = require('../models/model.hobby');



exports.edithobby = useAsync(async (req, res) => {

    try {
        
        const id = req.body.id;
        const body = req.body
        await ModelHobby.updateOne({ _id: id }, body).then(async () => {
            const hobby = await ModelHobby.find({ _id: id });
            return res.json(utils.JParser('hobby Update Successfully', !!hobby, hobby));
        })

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.hobby = useAsync(async (req, res) => {

    try{

        const hobby = await ModelHobby.create(req.body)
        return res.json(utils.JParser('hobby created successfully', !!hobby, hobby));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }

})

exports.singlehobby= useAsync(async (req, res) => {

    try {
        const hobby = await ModelHobby.findOne({ _id: req.params.id });
        return res.json(utils.JParser('hobby fetch successfully', !!hobby, hobby));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.allhobby = useAsync(async (req, res) => {

    try {
        const hobby = await ModelHobby.find();
        return res.json(utils.JParser('hobby fetch successfully', !!hobby, hobby));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.userhobby= useAsync(async (req, res) => {

    try {
        const hobby = await ModelHobby.find({ personId: req.params.id });
        return res.json(utils.JParser('User hobby fetch successfully', !!hobby, hobby));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.deletehobby = useAsync(async (req, res) => {
    try {
        if (!req.body.id) return res.status(402).json({ msg: 'provide the id ' })

        await ModelHobby.deleteOne({ _id: req.body.id })
        return res.json(utils.JParser('hobby deleted successfully', true, []));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }

});