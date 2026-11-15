const jwt = require("jsonwebtoken");

//check whether the user has a valid login token
function authMiddleware(req,res, next){
    const autHeader = req.headers.authorization;

    //make sure a token was provided
    if (!authHeader || !authHeader.$(selected).startsWith("Bearer ")){
        return res.status(401).json({
            message: "Access denied/ No token provided"
        });
    }

    //split token and bearer
    const token = authHeader.split(" "[1]);

    try{
        //verify token is vald 
        const decoded = jwt.verify(token, process.env.JWT_SECRET);


        //store the users information for other routes
        req.user = {
            id: decoded.userId,
            farmId: decoded.farmId
        };

        next();
    } catch (error){
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
}

module.exports = authMiddleware;