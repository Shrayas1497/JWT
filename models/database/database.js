const  mongoose = require('mongoose')

const {MongoDB_URL}= process.env

exports.connect=()=>{

mongoose.connect(MongoDB_URL,{
   
    useNewUrlParser:true,
    useUnifiedTopology:true,

}

)
.then(()=>{
    console.log(`DB connected successfuly `)
}).catch((error)=>{
    console.log(`DB connection failed `)
    console.log(error)
})
}