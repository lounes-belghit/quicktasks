//basecly the midelweare is using functions to be in the midel betwin requiest and response
import jwt from 'jsonwebtoken'
//this function will check if the user is authenticated or not
//here we can use  a function in state of arrow function to be able to use the next function in the chain 
const authMiddelware = (req,res,next)=>{
    //get the token from the header
    const token = req.headers.authorization?.split(' ')[0]
    if(!token){
        return res.sendStatus(401)
    }
    try {
        const decoded = jwt.verify(token,process.env.JWT_SECRET)
        req.user_id = decoded.id
        //call the next function to continue the request and pass it to the next function in the chain
        next()
    } catch (err) {
        console.log(err.message)
        res.sendStatus(403)
    }

}
export default authMiddelware