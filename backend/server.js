const express=require('express');
const mongoose=require('mongoose');
const bodyParser=require('body-parser');
const userRoutes=require('./routes/userRoutes'); // User router'ını dahil ediyoruz
const roleRoutes=require('./routes/roleRoutes'); // Role router'ını dahil ediyoruz

const app = express();

// Body parser middleware
app.use(bodyParser.json());

// MongoDB bağlantısı
mongoose.connect('mongodb://localhost:27017/mobileshoppingapp')
.then(()=>console.log('MongoDB bağlantısı başarılı'))
.catch((err)=>console.error('MongoDB bağlantı hatası:',err));


// Router'ları API'ye dahil etme
app.use('/api/users',userRoutes); //Kullanıcı işlemleri
app.use('/api/roles',roleRoutes); //Rol işlemleri


// Sunucuyu başlatma
const PORT=process.env.PORT || 5000;
app.listen(PORT,()=>{console.log(`Sunucu çalışıyor: http://localhost:${PORT}`);
});