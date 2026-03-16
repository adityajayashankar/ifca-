const { createCustomError } = require("../../middleware/errorHandling")

// req.body={users:[email,name,phone,address,pincode]}
exports.validateUser=(user)=>{
    
        if(!user) return false

        if(user.name && user.email && user.phone && user.address && user.pincode){
            return true
        }
        return false

    
}