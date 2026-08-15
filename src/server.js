//needed imports 
import express from 'express'
import path,{dirname} from 'path'
import {fileURLToPath} from 'url'
//import the needed routs 
import authRoutes from './routes/authRoutes.js'
import todoRoutes from './routes/todoRoutes.js'
//import the needed middelware
import authMiddelware from './middelware/authMiddelware.js'
//init the app and the port that we need 
const app = express()
const PORT =process.env.PORT || 7000
// find the path we are in 
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
//navigate to the root path first :
app.use(express.static(path.join(__dirname,'../public')))
app.use(express.json())
// main endpoint for the project  
app.get('/',(req,res)=>{
        res.sendFile(path.join(__dirname,'public','index.html'))
})
//routes for the auth and the user
app.use('/auth',authRoutes)
//routes for the todo list
app.use('/todos',authMiddelware,todoRoutes)
//start the server  

app.listen(PORT,()=>{console.log(`the server is up and runing on port ${PORT}`,`\n http://localhost:${PORT}`)})