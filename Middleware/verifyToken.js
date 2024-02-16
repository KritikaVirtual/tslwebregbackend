const jwt = require('jsonwebtoken');
let util = require("../Utilities/util"),
    config = require('../Utilities/config').config;

module.exports = function(req,res,next){
    // const token = req.header('adminToken');
    var bearerToken = '';
    const authorization = req.header('Authorization');
    if(typeof authorization!=='undefined'){
        const bearer = authorization.split(" ");
        bearerToken = bearer[1];
    }
    if(!bearerToken) return res.status(401).send({'errorCode':util.statusCode.FOUR,'errorMessage':util.statusMessage.ACCESS_DENIED});
    try{
        const verified = jwt.verify(bearerToken,config.JWT_SECRET_TOKEN);
        next();
    }catch(err){
        res.status(400).send({'errorCode':util.statusCode.FOUR,'errorMessage':'Invalid Token'});
    }
}