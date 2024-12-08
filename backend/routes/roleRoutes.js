const express=require('express');
const Role =require('../models/Role');
const Counter =require('../models/Counter');
const router = express.Router();


/***************/
// Rol oluşturma endpointi
router.post('/create',async(req,res)=>{
    const {name}=req.body;

try{
    //roleId değerini artırmak için counter koleksiyonunu güncelle
    const counter = await Counter.findOneAndUpdate(
        {name:'roleId'}, //Sayaç adı
        {$inc:{value:1}}, //Değeri 1 artır
        {new:true, upsert:true} //Yoksa oluştur ve yeni değeri döndür
    );

    //Yeni rol oluştur
    const newRole=new Role({
        roleId:counter.value, //Artırılmış ID değeri
        name,
        //Rol adı (admin, customer vb.)
    });

    //Rolü veritabanına kaydet
    const savedRole=await newRole.save();

    res.status(201).json({message:'Rol başarıyla oluşturuldu!', role:savedRole});
}
catch(error){
res.status(500).json({message:'Rol oluşturulmadı!',error:error.message});
}

})

/***************/
// Rol silme endpointi

router.delete('/delete/:roleId',async(req,res)=>{
 
    const roleId=Number(req.params.roleId);
    try{
const deletedRole=await Role.findOneAndDelete({roleId:roleId});


if(!deletedRole){
    return res.status(404).json({message:'Rol bulunamadı'});
}


res.status(200).json({
    message:'Rol  başarıyla silindi',
    role:deletedRole
});
    } catch{
        console.error('Silme hatası:',error.message);
        res.status(500).json({message:'Sunucu hatası',error:error.message})
    }
});


/***************/
// Rol güncelleme endpointi

router.put('/update/:roleId', async(req,res)=>{
    const roleId=Number(req.params.roleId); // Parametreden roleId al
    const {name}=req.body; // Gönderilen name verisi (sadece name kontrol edilecek)
    try{
       
    // 1. Mevcut rolü veritabanından çek
        const currentRole=await Role.findOneAndUpdate( {roleId:roleId});

    if(!currentRole){
        return res.status(404).json({message:'Rol bulunamadı'});
    }

    // 2. Gönderilen name ile mevcut name aynı mı kontrol et
    if(currentRole.name==name){
return res.status(200).json({
    message:'Role name aynı, güncelleme yapılmadı',
    role:currentRole
});
    }

    // 3. Değişiklik varsa güncelleme yap

    const updatedRole=await Role.findOneAndUpdate(
        {roleId:roleId}, // Güncellenecek rolü bul
        {name,name},     // Yeni name verisi
        {new:true}       // Güncellenmiş veriyi döndür
    );

    res.status(200).json({
        message:'Role name başarıyla güncelendi',
        role:updatedRole
    })
    }catch(error){
console.error('Güncelleme hatası:',error.message);
res.status(500).json({message:'Sunucu hatası',error:error.message});
    }

})

module.exports=router;