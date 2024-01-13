const mongoose = require('mongoose')

const productCategorySchema=new mongoose.Schema({
    category:{
        type:String,
    },
    adminID:{type:String},
    creationDateTime:{type:Number, default:()=>Date.now()},	
    updated_at:{type:Number, default:()=>Date.now()}	
})


const ModelProductCategory=mongoose.model("model-product-category", productCategorySchema)

module.exports=ModelProductCategory