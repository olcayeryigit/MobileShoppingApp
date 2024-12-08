const mongoose=require('mongoose');

// Kullanıcı rolü şeması
const roleSchema=new mongoose.Schema({
    roleId:{type:Number,required:true,unique:true}, // Custom role ID
    name:{type:String,required:true}, // Rolün adı (admin, customer, vb.)
},
{timestamps:true})

module.exports=mongoose.model('Role',roleSchema);