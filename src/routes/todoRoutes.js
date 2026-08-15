import express from 'express'
import db from '../db.js'
//create the needeed router
const router = express.Router()
//end points for the todo list
router.get('/',(req,res)=>{
    const userId = parseInt(req.user_id)
    try {
        
        const tasks = db.prepare(`SELECT * FROM tasks WHERE user_id = ?`).all(userId)
        res.status(200).json({tasks})
    } catch (err) {
        console.log(err.message)
        res.sendStatus(503)
    }
})
router.post('/',(req,res)=>{
    const { title } = req.body
    const userId = parseInt(req.user_id) 
    try {
        const result = db.prepare(`INSERT INTO tasks (title, user_id) VALUES (?, ?)`).run(title, userId)
        res.status(201).json({ id: result.lastInsertRowid, title, user_id: userId })
    } catch (err) {
        console.log(err.message)
        res.sendStatus(503)
    }
})
router.put('/:id',(req,res)=>{
    const { id } = req.params
    const {status} = req.body
    const userId = parseInt(req.user_id)
    try {
        const result = db.prepare(`UPDATE tasks SET status = ? WHERE id = ? AND user_id = ?`).run(status, id, userId)
        if (result.changes === 0) {
            return res.sendStatus(404)
        }
        res.sendStatus(200)
    } catch (err) {
        console.log(err.message)
        res.sendStatus(503)
    }
})
router.delete('/:id',(req,res)=>{
    const { id } = req.params
    const userId = parseInt(req.user_id)
    try {
        const result = db.prepare(`DELETE FROM tasks WHERE id = ? AND user_id = ?`).run(id, userId)
        if (result.changes === 0) {
            return res.sendStatus(404)
        }
        res.sendStatus(200)
    } catch (err) {
        console.log(err.message)
        res.sendStatus(503)
    }
})
//export the router to be used in the main server file
export default router