const app=require('./app')
const {port}={port:4000}

app.listen(port,()=>{
    console.log(`server is listenning at ${port}`)
})