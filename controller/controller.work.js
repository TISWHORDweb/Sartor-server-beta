const express = require('express')
const dotenv = require("dotenv")
dotenv.config()
const { useAsync, utils, errorHandle, } = require('../core');
const ModelPerson = require('../models/model.person');
const ModelWork = require('../models/model.work');



exports.editWork = useAsync(async (req, res) => {

    try {
        
        const id = req.body.id;
        const body = req.body
        await ModelWork.updateOne({ _id: id }, body).then(async () => {
            const work = await ModelWork.find({ _id: id });
            return res.json(utils.JParser('Work Update Successfully', !!work, work));
        })

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.work = useAsync(async (req, res) => {

    try{

        const work = await ModelWork.create(req.body)
        return res.json(utils.JParser('Work created successfully', !!work, work));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }

})

exports.singleWork= useAsync(async (req, res) => {

    try {
        const work = await ModelWork.findOne({ _id: req.params.id });
        return res.json(utils.JParser('Work fetch successfully', !!work, work));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.allWork = useAsync(async (req, res) => {

    try {
        const work = await ModelWork.find();
        return res.json(utils.JParser('Work fetch successfully', !!work, work));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.userWork= useAsync(async (req, res) => {

    try {
        const work = await ModelWork.find({ personId: req.params.id });
        return res.json(utils.JParser('User Work fetch successfully', !!work, work));
    } catch (e) {
        throw new errorHandle(e.message, 400)
    }
})

exports.deleteWork= useAsync(async (req, res) => {
    try {
        if (!req.body.id) return res.status(402).json({ msg: 'provide the id ' })

        await ModelWork.deleteOne({ _id: req.body.id })
        return res.json(utils.JParser('Work deleted successfully', true, []));

    } catch (e) {
        throw new errorHandle(e.message, 400)
    }

});