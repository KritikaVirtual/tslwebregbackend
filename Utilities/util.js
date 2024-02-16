'use strict';

let config = require("./config").config,
    //mustache = require('mustache'),
    bodyParser = require('body-parser');
var querystring = require('querystring');
//var crypto = require('crypto'),
  //algorithm = 'aes-256-ctr',
  //password = 'd6F3Efeq';
//const nodemailer = require('nodemailer');
var path = require('path');
//var Thumbnail = require('thumbnail');
//let templates = require('./templates');
var dateTime = require('node-datetime');
const moment = require('moment');
const { min } = require("moment");

// Define Error Codes
let statusCode = {
    ZERO: 0,
    ONE: 1,
    TWO: 2,
    THREE: 3,
    FOUR: 4,
    FIVE: 5,
    SIX: 6,
    SEVEEN: 7,
    EIGHT: 8,
    NINE: 9,
    TEN: 10,
    FOUR_ZERO_FOUR: 404,
    FIVE_ZERO_ZERO: 500
};

// Define Error Messages
let statusMessage = {
    PARAMS_MISSING: 'Mandatory Fields Missing',
    SERVER_BUSY: 'Our Servers are busy. Please try again later.',
    EXHIBITOR_ALREADY_REGISTERED: 'Exhibitor is already registered.',
    BOOTH_ALREADY_REGISTERED: 'Booth already setup for exhibitor.',
    CONTACT_ALREADY_REGISTERED: 'Contact already registered.',
    FOLLOW_UP_REGISTERED: 'Follow up already taken.',
    OLD_PASSWORD_MISMATCH: 'Old password mismatch.',
    CUSTOMERID_NOT_REGISTERED: 'Your Customer Id is not Registered.',
    LOGGED_IN: 'You have sucessfully Logged in',
    ENTER_VALID_CUSTOMERID_PASS: 'Please enter your valid customerID and password.',
    OTP_EXPIRED: 'OTP has already expried, please click on Re-send OTP.',
    NO_RECORD_FOUND: 'No record found.',    
    FORGOT_PASSWORD_CHANGED: 'Your Password has been changed successfully.',
    FORGOT_PASSWORD_LINK: 'Your Forgot Password link sent to your registered email id.',
    FORGOT_PASSWORD_LINK_EXP: 'Your Forgot Password link already expried. Please reset again.',
    OTP_ALREADY_USED: 'OTP already used. Please proceed to login.',
    VALID_PARAMETERS: 'Please enter valid parameter.',
    USER_CREATED: 'Congratulaltions!!Your Registration has been completed Successfully.',
    NEW_USER: 'This a new user for activation.',
    INVALID_DATA_HEADER: 'Invalid data in header.', //2
    PRODUCT_NOT_FOUND: 'Product not found', //404
    PRODUCT_LIST: 'Product List', //404
    USER_LIST: 'User List',	
    INTERNAL_SERVER_ERROR: 'Internal server error.', //500
    SOMETHING_WENT_WRONG: 'Something went wrong.',
    RECORD_FOUND_SUCCESSFULLY: 'Record found successfully.',    
    NOT_REGISTER_EMAIL: 'Email is not register with us',
    UPDATED_SUCC: 'Updated successfully',
    ADDED_SUCC: 'Added successfully',
    DELETED_SUCC: 'Deleted successfully',
    DELETED_ERROR : 'Details Not Deleted',
    UPDATED_ERROR: 'Details Not Updated',
    FAILED_ERROR: 'Failed',
    FEEDBACK_SAVED: 'Feed back saved Successfully',
    FEEDBACK_NOTSAVED: 'Feed back not saved error !',
    LIST_FOUND: 'List get successfully',
    INVALID_TOKEN: 'Invalid Token',
    ACCESS_DENIED:'Access Denied',
    INVALID_CREDENTIALS:'Invalid Credentials',
    INVALID_USER:'Invalid User',
    EVENT_EXPIRE:'Event Expire',
    SUCCESS:'Success',
    USER_DETAIL_FOUND:'User details found',
    BOOTH_STAFF_ALREADY_REGISTERED :"Contact already registered as main contact or booth staff member",
    MAIN_CONTACT_UPDATE_DENIED :"Main contact cannot be edited or deleted",
    HOST_ALREADY_REGISTERED :"Host already registerd for the session",
    INVALID_SOURCE: "Invalid source",
    CONTACT_ALREADY_REGISTERED_IMISID: 'Contact already registered with ImisId.',
    CONTACT_ALREADY_REGISTERED_EMAIL: 'Contact already registered with email address.',
    SURVEY_EXIST: 'Survey exist for user.',
    USER_EXIST: 'User already exist.',
    PAYMENT_DETAIL_FOUND: 'Payment Details found.',
    EVENT_DETAIL_FOUND:'Event details found',
    CODE_EXISTS:'This Code is already exists on same event ',
    
};

let getMysqlDate = (rawDate) => {
    let date = new Date(rawDate);
    return date.getUTCFullYear() + '-' +
        ('00' + (date.getUTCMonth() + 1)).slice(-2) + '-' +
        ('00' + date.getUTCDate()).slice(-2);
}


/*
This method is used to crete thumbnail of a image of product.
*/
let productThumbnailImage = function(data, cb){
    console.log(data.file.destination);
     var filepath =  path.join(__dirname,"../"+ data.file.destination);
     var thumbfolder = path.join(__dirname,"../public/productimage/thumb");
    var thumbnail = new Thumbnail(filepath, thumbfolder);
    var filename = data.file.filename;
    thumbnail.ensureThumbnail(filename, 190, 190, function (err, filename) {
    // "filename" is the name of the thumb in '/path/to/thumbnails'
});
    return { filename: filename };
}
/*
This method is used to crete thumbnail of a image user.
*/
let userThumbnailImage = function(data, cb){
     var filepath =  path.join(__dirname,"../"+ data.file.destination);
     var thumbfolder = path.join(__dirname,"../public/userprofileimage/thumb");
    var thumbnail = new Thumbnail(filepath, thumbfolder);
    var filename = data.file.filename;
    thumbnail.ensureThumbnail(filename, 190, 190, function (err, filename) {
    // "filename" is the name of the thumb in '/path/to/thumbnails'
});
    return { filename: filename };
}


/*
This method is used to decrypt the pwd at time of login.
*/

let decrypt = function decrypt(text) {
  var decipher = crypto.createDecipher(algorithm, password)
  var dec = decipher.update(text, 'hex', 'utf8')
  dec += decipher.final('utf8');
  return dec;
}
let encrypt = function encrypt(text) {
  var cipher = crypto.createCipher(algorithm, password)
  var crypted = cipher.update(text, 'utf8', 'hex')
  crypted += cipher.final('hex');
  return crypted;
}

// this is a comman function for sending mail to email 
let sendMailComman = function sendMailComman(data){
    //console.log(data.email);
    // create reusable transporter object using the default SMTP transport
    var mailOptions = {
        from: templates.mailTemplate.from,
        to: data.email,
        subject: templates.mailTemplate.subject,
        text: mustache.render(templates.mailTemplate.text, data)
    };
    try {
        var transport = nodemailer.createTransport(config.EMAIL_CONFIG);
        var mailResult = transport.sendMail(mailOptions);
        //return true;
    } catch (error) {
        return  error;
    }
   
    

}

let getCurrentDatetime = function getCurrentDatetime(cb){
    var dt = dateTime.create();
    var formatted = dt.format('Y-m-d H:M:S');
    return formatted;
}

let getFileExtFromUrl =  (linkurl) => {
    var url = linkurl;
    var mainfile = url.split('/').pop().split('?')[0];
    var filetype = mainfile.split('.');
    if(filetype[1]){
        return filetype[1];
    }else{
        return '';
    }    
}

let getTimeDiff = (time,currentTime) =>{
    var diff = moment.duration(moment(currentTime).diff(moment(time)));
    var minutes = parseInt(diff.asMinutes());
    return minutes;
}

let mysql_real_escape_string = (str) =>{
    if (typeof str != 'string')
        return str;

    return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
        switch (char) {
            case "\0":
                return "\\0";
            case "\x08":
                return "\\b";
            case "\x09":
                return "\\t";
            case "\x1a":
                return "\\z";
            case "\n":
                return "\\n";
            case "\r":
                return "\\r";
            case "\"":
            case "'":
            case "\\":
            case "%":
                return "\\"+char; // prepends a backslash to backslash, percent,
                                  // and double/single quotes
        }
    });
}

let timeConvertor = (time) => {
    
    var PM = time.match('PM') ? true : false
    
    time = time.split(':')
    //console.log(time);return;
    var min = time[1]
    
    if (PM) {
        var hour = 12 + parseInt(time[0],10)
        if(parseInt(time[0],10) == 12){
            hour = parseInt(time[0],10)
        }        
        var sec = time[2].replace('PM', '')
    } else {
        var hour = time[0]
        if(time[0] == 12){
            hour = 12 + parseInt(time[0],10)
        }
        var sec = time[2].replace('AM', '')       
    }
    
    return hour + ':' + min;    
}

function dateCompare(d1){
    let d2 = new Date().toISOString().slice(0, 10);
    //console.log(d2);return;
    const date1 = new Date(d1);
    const date2 = new Date(d2);

    if(date1 > date2){
        return 1;
    } else if(date1 < date2){
        return 2;
    } else{
        return 0;
    }
}

function isNumber(n) { return /^-?[\d.]+(?:e-?\d+)?$/.test(n); } 


module.exports = {
    statusCode,statusMessage,getMysqlDate,decrypt,encrypt,productThumbnailImage,userThumbnailImage,config,sendMailComman,
    getCurrentDatetime,getFileExtFromUrl,getTimeDiff,mysql_real_escape_string,timeConvertor,dateCompare,isNumber
}
