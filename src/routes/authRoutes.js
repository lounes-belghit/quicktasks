import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../db.js'
const router = express.Router()
router.post('/register',(req,res)=>{
    const {username,email,password} = req.body
    const hashedPassword = bcrypt.hashSync(password,8)
  try {
    const instrtUser =db.prepare(`INSERT INTO users (name,email,password) VALUES (?,?,?)`)
    const result = instrtUser.run(username,email,hashedPassword)
    //add a defult task for the user after registration
    db.prepare(`INSERT INTO tasks (title,user_id) VALUES (?,?)`).run('Default Task',result.lastInsertRowid)
    const chek_task = db.prepare(`SELECT * FROM tasks WHERE user_id = ?`).all(result.lastInsertRowid)
    console.log("Registered user's tasks:", chek_task)
    //make a jwt token for the user after registration
    const token = jwt.sign({id:result.lastInsertRowid},process.env.JWT_SECRET,{expiresIn:'24h'})
    res.status(201).json({token})

  } catch (err) {
    console.log(err.message)
    res.sendStatus(503)

  }
    //we can not send 2 status at same time 
    //res.sendStatus(201)
})
router.post('/login',(req,res)=>{
    const {email,password} = req.body
    try {
    const checkUser = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email)
    if(!checkUser){
        return res.sendStatus(404)
    }
    const isPasswordValid = bcrypt.compareSync(password,checkUser.password)
    if(!isPasswordValid){
        return res.sendStatus(401)
    }
    const token = jwt.sign({id:checkUser.id},process.env.JWT_SECRET,{expiresIn:'24h'})
    res.status(200).json({token})}catch (err) {
    console.log(err.message)
    res.sendStatus(503)
}
    // Here you would typically check the credentials against the database
    // For now, we'll just send a success response
})




//export the router to be used in the main server file
export default router
