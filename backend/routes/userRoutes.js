const express=require('express');
const User=require('../models/User');
const Role=require('../models/Role');
const Counter =require('../models/Counter');
const router=express.Router();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');


/****/
// Nodemailer taşıyıcısını ayarlama
const transporter = nodemailer.createTransport({
    service: 'gmail', // Gmail kullanıyorsanız
    auth: {
      user: '-',  // Gönderici e-posta adresi
      pass: '-',   // Gönderici e-posta şifresi veya uygulama şifresi
    },
  });




/***************/
//KUllanıcı oluşturma endpointi
router.post('/register',async(req,res)=>{
const {firstName,lastName,email,password}=req.body;


try{
    //Artan ID yi almak için counter koleksiyonunu güncelle

const counter=await Counter.findOneAndUpdate(
    {name:'userId'},
    {$inc:{value:1}},
    {new:true, upsert:true}
);

//Kullanıcı rolünü almak için Role koleksiyonunu sorgula
let role;
if(email==='admin@example.com'){
    role=await Role.findOne({name:'admin'});
}else{
    role=await Role.findOne({name:'customer'});
}

//Eğer rol bulunmazsa, bir hata döndür
if(!role){
    return res.status(404).json({message:'Rol bulunamadı'});
}

//Yeni kullanıcı oluştur
const newUser=new User({
    userId:counter.value, //Yeni artan ID yi kullanıcıya ata
    firstName,
    lastName,
    email,
    password,
    roleId:role.roleId //Role ID yi kullanıcıya ata
});

//Kullanıcıyı veritabanına ata
const savedUser=await newUser.save();


/*******************************************/   
/**AKTİVASYON LİNKİNİ GÖNDERME İŞLEMLERİ **/
//uygulama şifresini boşluklar olmadan ekle
    // Aktivasyon token'ı oluştur
    const token = jwt.sign(
        { userId: savedUser._id, email: savedUser.email },
        'your-secret-key', // Burada güçlü bir secret key kullanmalısınız
        { expiresIn: '1h' } // 1 saat geçerli olacak
      );
  
      // Aktivasyon linki oluştur
      const activationLink = `http://localhost:5000/activate/${token}`;
  
      // Kullanıcıya e-posta gönder
      const mailOptions = {
        from: '-', 
        to: savedUser.email,
        subject: 'Hesap Aktivasyonu',
        html: `
          <h2>Merhaba ${savedUser.firstName}!</h2>
          <p>Hesabınızı aktifleştirmek için aşağıdaki linke tıklayın:</p>
          <a href="${activationLink}">Hesabınızı Aktifleştirin</a>
          <p>Bu link 1 saat geçerlidir.</p>
        `,
      };
  
      await transporter.sendMail(mailOptions);
  /****/
/*********************************************/
      res.status(200).json({
        message: 'Kullanıcı başarıyla oluşturuldu! Aktivasyon linki gönderildi.',
        user: savedUser,
      });


}catch(error){
    res.status(500).json({message:'Kullanıcı oluşturulamadı!',error:error.message});
}
})


/***************/
//KUllanıcı silme endpointi
router.delete('/delete/:userId',async(req,res)=>{
    const userId=Number(req.params.userId);

    try{
        const deletedUser=await User.findOneAndDelete({userId:userId});

        if(!deletedUser){
            return res.status(404).json({message:'Kullanıcı bulunamadı'});
        }

        res.status(200).json({message:'Kullanıcı başarıyla silindi',user:deletedUser
        })
    }  catch(error){
            console.error('Silme hatası',error.message);
            res.status(500).json({message:'Sunucu hatası',error:error.message})
        }
});


/***************/
//Kullanıcı girişi endpointi
router.post('/login',async(req,res)=>{
const {email,password}=req.body;

try{
    // 1. Kullanıcıyı MongoDB'den bul
    const user= await User.findOne({email});

    if(!user){
        return res.status(401).json({message:'Kullanıcı bulunamadı'})
    }

    // 2. Şifre kontrolü
    if(user.password!==password){
    return res.status(401).json({message:'Hatalı şifre'})
    }

    // 3. Giriş başarılı
   res.status(200).json({message:'Giriş başarılı',user:{email:user.email}});

}catch(error){
    console.error('Giriş hatası:',error.message);
    res.status(500).json({message:'Sunucu hatası'})
}
})

/********KULLANICI GÜNCELLEME*******/
/***************/
//Kullanıcı email güncelleme endpointi


router.put('/update-email/:userId',async(req,res)=>{

const userId=Number(req.params.userId);
const {email}=req.body;

try{
    // 1. Yeni email kontrolü
    if(!email){
        return res.status(400).json({message:'Yeni email gerekli'});
    }
    // 2. Kullanıcının mevcut email'ini kontrol et
    const currentUser=await User.findOne({userId});
    if(!currentUser){
return res.status(404).json({message:'Kullanıcı bulunamadı'});
    }

    // 3. Girilen email mevcut email ile aynı mı kontrol et

    if(currentUser.email===email){
        return res.status(400).json({message:'Girilen email mevcut email ile aynı, değişiklik yapılmadı',user:currentUser})
    }

        // 4. Email'i güncelle
const updatedUser=await User.findOneAndUpdate(
    {userId},
    {email},
    {new:true}
)
res.status(200).json({message:'Email başarıyla güncellendi',user:updatedUser})

}catch(error){
    console.error('Email güncelleme hatası:',error.message)
    res.status(500).json({message:'Sunucu hatası', error:error.message})
}
});


/***************/
//Kullanıcı firstName güncelleme endpointi
router.put('/update-firstname/:userId',async(req,res)=>{
    const userId=Number(req.params.userId);
    const {firstName}=req.body;

    try{
    // 1. Yeni firstName kontrolü

if(!firstName){
    return res.status(400).json({message:'Yeni isim gerekli'})
}
    // 2. Kullanıcının mevcut email'ini kontrol et
const currentUser=await User.findOne({userId});
if(!currentUser){
return res.status(404).json({message:'Kullanıcı bulunamadı'});
}

if(currentUser.firstName===firstName){
    return res.status(400).json({message:'Girilen isim mevcut isim ile aynı, değişiklik yapılmadı'});
}
        // 4. İsim'i güncelle
const updatedUser=await User.findOneAndUpdate(
    {userId},
    {firstName},
    {new:true}
)
res.status(200).json({message:'isim başarıyla güncellendi',user:updatedUser})
    }catch(error){
        console.error('İsim güncelleme hatası:',error.message)
        res.status(500).json({message:'Sunucu hatası',error:error.message})
    }

})



/***************/
//Kullanıcı lastName güncelleme endpointi
router.put('/update-lastname/:userId',async(req,res)=>{
    const userId=Number(req.params.userId);
    const {lastName}=req.body;

    try{
            // 1. Yeni lastName kontrolü
            if(!lastName){
                return res.status(400).json({message:'Yeni soyisim gerekli'})
            }
            
                // 2. Kullanıcının mevcut soyismi'ini kontrol et
const currentUser=await User.findOne({userId});
if(!currentUser){
    return res.status(404).json({message:'Kullanıcı bulunamadı'})
}
if(currentUser.lastName===lastName){
    return res.status(400).json({message:'Girilen soyisim mevcut soyisim ile aynı, değişiklik yapılmadı'});
}

        // 4. İsim'i güncelle
const updatedUser=await User.findOneAndUpdate(
    {userId},
    {lastName},
    {new:true}
);
res.status(200).json({message:'Soyisim başarıyla güncellendi',user:updatedUser});
    }catch(error){
        console.error('Soyisim güncelleme hatası:',error.message)
        res.status(500).json({message:'Sunucu hatası',error:error.message})
    }
})

module.exports=router;

/**
 * // Kullanıcı güncelleme endpointi
router.put('/update/:userId', async (req, res) => {
  const { userId } = req.params;
  const updateData = req.body;

  try {
    const updatedUser = await User.findOneAndUpdate(
      { userId: userId },
      updateData,
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    res.status(200).json({
      message: "Kullanıcı başarıyla güncellendi",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Güncelleme hatası:", error.message);
    res.status(500).json({ message: "Sunucu hatası", error: error.message });
  }
});
 */

/**



 * /***************/
//KUllanıcı oluşturma endpointi
/*
router.post('/register',async(req,res)=>{
    const {firstName,lastName,email,phone,password}=req.body;
    
    
    try{
        //Artan ID yi almak için counter koleksiyonunu güncelle
    
    const counter=await Counter.findOneAndUpdate(
        {name:'userId'},
        {$inc:{value:1}},
        {new:true, upsert:true}
    );
    
    //Kullanıcı rolünü almak için Role koleksiyonunu sorgula
    let role;
    if(email==='admin@example.com'){
        role=await Role.findOne({name:'admin'});
    }else{
        role=await Role.findOne({name:'customer'});
    }
    
    //Eğer rol bulunmazsa, bir hata döndür
    if(!role){
        return res.status(404).json({message:'Rol bulunamadı'});
    }
    
    //Yeni kullanıcı oluştur
    const newUser=new User({
        userId:counter.value, //Yeni artan ID yi kullanıcıya ata
        firstName,
        lastName,
        email,
        phone:null,
        password,
        roleId:role.roleId //Role ID yi kullanıcıya ata
    });
    
    //Kullanıcıyı veritabanına ata
    const savedUser=await newUser.save();
    res.status(200).json({message:'Kullanıcı başarıyla oluşturuldu!',user:savedUser});
    
    }catch(error){
        res.status(500).json({message:'Kullanıcı oluşturulamadı!',error:error.message});
    }
    })
    
 */