let async = require("async");
let util = require("../Utilities/util"),
  usersDAO = require("../DAO/usersDAO"),
  sendGrid = require("../Utilities/sendgrid");
// const uuidV4 = require('uuid/v4');
// let path = require("path");
const md5 = require("md5");
const jwt = require("jsonwebtoken");
const config = require("../Utilities/config").config;
var multer = require("multer");


const {
  tslAdminLoginValidation,
  tslAdminRegisterValidation,
  tslClientLoginValidation,
  tslAddUsersValidation,
  tslAddPaymentDetailsValidation,
  saveClientInformationValidation,
  tslAddEventValidation,
  tslInsertRegTypesPageDesignValidation,
  tslUpdateRegTypesPageDesignValidation,
  tslInsertRegCategoriesPageDesignValidation,
  tslAccountIdEventIdValidation,
  tslUpdateRegCategoriesPageDesignValidation,
  tslGetRegTypesByIdValidation,
  tslGetRegCategoriesByIdValidation,
  tslLAccountIdLEventIdValidation,
  tslGetQuestionsFieldNameValidation,
  tslUpdateRegInfoFieldsPageValidation,
  tslGetguestsRegistrantsFieldsValidation,
  tslUpdateGuestRegistrantsFieldsValidation,
  tslGetCustomQuestionsByIdValidation,
  tslGetDiscountCodesByIdValidation,
  tslExhibitorInfoValidation,
  tslAccountIdEventIdRegIDValidation,
  tslAccountIdEventIdCategoryIdValidation,
  tslAccountIdValidation
} = require("../Validation/user");

const randtoken = require("rand-token");
const encode = require("nodejs-base64-encode");

// TSL Admin Backend
// Admin login
let tslAdminLogin = function (data, callback) {
  async.auto(
    {
      checkLogin: (cb) => {
        const { error } = tslAdminLoginValidation(data);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        let dataToSet = {
          username: data.username,
          password: md5(util.mysql_real_escape_string(data.password)),
        };
        usersDAO.tslAdminLogin(dataToSet, (err, dbData) => {
          // if (err) {
          //     console.log(err);
          //     cb(null, { "errorCode": util.statusCode.ONE, "errorMessage": util.statusMessage.SERVER_BUSY })
          //     return;
          // }
          if (dbData.length) {
            //console.log(dbData);return;
            const adminToken = jwt.sign(
              {
                adminId: dbData[0].IAdminID,
                unique_id: dbData[0].IRoleID,
                email: data.username,
              },
              config.JWT_SECRET_TOKEN,
              { expiresIn: "3h" }
            );
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.LOGGED_IN,
              adminToken: adminToken,
              id: dbData[0].id,
              roles: dbData[0].roles,
              accountId: dbData[0].account_id,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.INVALID_CREDENTIALS,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.checkLogin);
    }
  );
};

// Admin Register
let tslAdminRegister = (data, callback) => {
  var data = data.postData;
  async.auto(
    {
      checkAdminExist: (cb) => {
        const { error } = tslAdminRegisterValidation(data);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
            result: {},
          });
          return;
        }

        // code start for checking session exist in survey list or not
        usersDAO.checkAdminExist(data, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.FIVE,
              errorMessage: util.statusMessage.SERVER_BUSY,
              result: {},
            });
            return;
          }
          if (dbData.length > 0) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.USER_EXIST,
              result: {},
            });
            return;
          } else {
            cb(null, { errorCode: util.statusCode.ZERO });
          }
        });
      },
      insertTslAdmin: [
        "checkAdminExist",
        (result, cb) => {
          if ("checkAdminExist" in result) {
            if (result.checkAdminExist.errorCode == 2) {
              cb(null, {
                errorCode: util.statusCode.TWO,
                errorMessage: result.checkAdminExist.errorMessage,
                result: {},
              });
              return;
            }
            if (result.checkAdminExist.errorCode == 1) {
              cb(null, {
                errorCode: util.statusCode.ONE,
                errorMessage: util.statusMessage.USER_EXIST,
                result: {},
              });
              return;
            }
            if (result.checkAdminExist.errorCode == 5) {
              cb(null, {
                errorCode: util.statusCode.ONE,
                errorMessage: util.statusMessage.SERVER_BUSY,
                result: {},
              });
              return;
            }
          }

          let saveData = {
            sUserName: data.username,
            sUserPassword: md5(util.mysql_real_escape_string(data.password)),
            sFirstName: data.firstname,
            sLastName: data.lastname,
            // sPhone: data.phone,
            lRoleID: 1,
            sStatus: 1,
            dtCreatedOn: util.getCurrentDatetime(),
            dtUpdatedOn: util.getCurrentDatetime(),
          };

          usersDAO.insertTslAdmin(saveData, (err, dbData) => {
            if (err) {
              cb(null, {
                errorCode: util.statusCode.ONE,
                errorMessage: util.statusMessage.SERVER_BUSY,
                result: {},
              });
              return;
            }
            if (dbData.insertId) {
              saveData["IAdminID"] = dbData.insertId;
              cb(null, {
                errorCode: util.statusCode.ZERO,
                errorMessage: util.statusMessage.SUCCESS,
                result: 1,
              });
            } else {
              cb(null, {
                errorCode: util.statusCode.ONE,
                errorMessage: util.statusMessage.SOMETHING_WENT_WRONG,
                result: 0,
              });
            }
          });
        },
      ],
    },
    (err, response) => {
      callback(response.insertTslAdmin);
    }
  );
};

// get user details based on role
let tslUserList = function (data, callback) {
  async.auto(
    {
      getUserData: (cb) => {
        let total_records = 0;
        usersDAO.getUserTotalCount(data, (err1, dbData1) => {
          if (err1) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData1) {
            total_records = dbData1[0].user_count;
          }
          usersDAO.getUserList(data, (err, dbData) => {
            if (err) {
              cb(null, {
                errorCode: util.statusCode.ONE,
                errorMessage: util.statusMessage.SERVER_BUSY,
              });
              return;
            }
            if (dbData.length) {
              cb(null, {
                errorCode: util.statusCode.ZERO,
                errorMessage: util.statusMessage.USER_DETAIL_FOUND,
                total_records: total_records,
                data: dbData,
              });
            } else {
              cb(null, {
                errorCode: util.statusCode.ONE,
                errorMessage: util.statusMessage.NO_RECORD_FOUND,
              });
            }
          });
        });
      },
    },
    (err, response) => {
      callback(response.getUserData);
    }
  );
};

/* TSL Client Backend */

// Client login
let tslClientLogin = function (data, callback) {
  async.auto(
    {
      checkLogin: (cb) => {
        const { error } = tslClientLoginValidation(data);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        let dataToSet = {
          username: data.username,
          password: data.password,
        };
        usersDAO.tslClientLogin(dataToSet, (err, dbData) => {
          if (dbData.length) {
            //console.log(dbData);return;
            const token = jwt.sign(
              {
                userID: dbData[0].lAccountID,
                unique_id: dbData[0].lLoginID,
                email: data.username,
              },
              config.JWT_SECRET_TOKEN,
              { expiresIn: "3h" }
            );
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.LOGGED_IN,
              userId: dbData[0].lAccountID,
              token: token,
              id: dbData[0].id,
              roles: dbData[0].roles,
              accountId: dbData[0].account_id,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.INVALID_CREDENTIALS,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.checkLogin);
    }
  );
};

// get users by user_id

let tslUserListById = function (data, callback) {
  let total_records = "";
  async.auto(
    {
      getUserData: (cb) => {
        usersDAO.getUserTotalCountById(data, (err1, dbData1) => {
          if (err1) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData1) {
            total_records = dbData1[0].user_count;
          }

          usersDAO.getUserListById(data, (err, dbData) => {
            if (err) {
              cb(null, {
                errorCode: util.statusCode.ONE,
                errorMessage: util.statusMessage.SERVER_BUSY,
              });
              return;
            }
            if (dbData.length) {
              cb(null, {
                errorCode: util.statusCode.ZERO,
                errorMessage: util.statusMessage.USER_DETAIL_FOUND,
                total_records: total_records,
                data: dbData,
              });
            } else {
              cb(null, {
                errorCode: util.statusCode.ONE,
                errorMessage: util.statusMessage.NO_RECORD_FOUND,
              });
            }
          });
        });
      },
    },
    (err, response) => {
      callback(response.getUserData);
    }
  );
};

// Edit User At Account Page

let tslEditUser = function (data, callback) {
  async.auto(
    {
      editUserData: (cb) => {
        usersDAO.tslEditUser(data, (err, dbData) => {
          // console.log('response',dbData);
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.affectedRows) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.UPDATED_SUCC,
              result: data,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.UPDATED_ERROR,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.editUserData);
    }
  );
};

// delete User from Account list
let tslDeleteUser = function (data, callback) {
  async.auto(
    {
      tslDeleteUser: (cb) => {
        usersDAO.tslDeleteUser(data, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.affectedRows == 1) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.DELETED_SUCC,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.DELETED_ERROR,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslDeleteUser);
    }
  );
};

// add User data
let tslAddUsers = (data, callback) => {
  async.auto(
    {
      tslAddUsers: (cb) => {
        const { error } = tslAddUsersValidation(data);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        let dataToSet = {
          sUserName: data.sUserName,
          sFirstName: data.sFirstName,
          sLastName: data.sLastName,
          sUserPassword: data.sUserPassword,
          // sPhone: data.sPhone,
          lRoleID: data.lRoleID,
          sStatus: data.sStatus,
          lAccountID: data.userId,
          dtCreatedOn: util.getCurrentDatetime(),
          dtUpdatedOn: util.getCurrentDatetime(),
        };
        //console.log(sessEndTime);return;
        usersDAO.tslAddUsers(dataToSet, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.insertId || dbData.affectedRows == 1) {
            dataToSet.lLoginID = dbData.insertId;
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.ADDED_SUCC,
              result: dataToSet,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SOMETHING_WENT_WRONG,
              result: {},
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslAddUsers);
    }
  );
};

// add User data
let tslAddPaymentDetails = (data, callback) => {
  async.auto(
    {
      tslAddPaymentDetails: (cb) => {
        const { error } = tslAddPaymentDetailsValidation(data);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }

        let dataToSet = {
          lAccountID: data.lAccountID,
          paymentID: data.paymentID,
          paymentDetails: JSON.stringify(data.paymentDetails),
        };
        //console.log(sessEndTime);return;
        usersDAO.tslAddPaymentDetails(dataToSet, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.insertId || dbData.affectedRows > 0) {
            dataToSet.lLoginID = dbData.insertId;
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.ADDED_SUCC,
              result: dataToSet,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SOMETHING_WENT_WRONG,
              result: {},
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslAddPaymentDetails);
    }
  );
};

// Get Payment Details At Account Section

let tslGetPaymentDetails = function (data, callback) {
  async.auto(
    {
      tslGetPaymentDetails: (cb) => {
        usersDAO.tslGetPaymentDetails(data, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.length) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.PAYMENT_DETAIL_FOUND,
              data: dbData,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslGetPaymentDetails);
    }
  );
};

let tslEventsList = function (data, callback) {
  async.auto(
    {
      tslEventsList: (cb) => {
        let total_records = 0;
        usersDAO.tslEventsListCount(data, (err1, dbData1) => {
          if (err1) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData1) {
            total_records = dbData1[0].event_count;
          }
          usersDAO.tslEventsList(data, (err, dbData) => {
            if (err) {
              cb(null, {
                errorCode: util.statusCode.ONE,
                errorMessage: util.statusMessage.SERVER_BUSY,
              });
              return;
            }
            if (dbData.length) {
              cb(null, {
                errorCode: util.statusCode.ZERO,
                errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
                total_records: total_records,
                data: dbData,
              });
            } else {
              cb(null, {
                errorCode: util.statusCode.ONE,
                errorMessage: util.statusMessage.NO_RECORD_FOUND,
              });
            }
          });
        });
      },
    },
    (err, response) => {
      callback(response.tslEventsList);
    }
  );
};

let tslAddEvent = (data, callback) => {
  async.auto(
    {
      tslAddEvent: (cb) => {
        const { error } = tslAddEventValidation(data);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }

        const eventData = {
          lAccountID: data.lAccountID,
          sName: data.sName,
          sLocation: data.sLocation,
          dtStart: data.dtStart,
          dtEnd: data.dtEnd,
          sStatus: data.sStatus,
          sEventContactName: data.sEventContactName,
          sEventContactEmail: data.sEventContactEmail,
          dtCloseSite: data.dtCloseSite,
          lBadgeReportID: data.lBadgeReportID,
          bUniqueEmailsForAddReg: data.bUniqueEmailsForAddReg,
          nAllowToPayByCheck: data.nAllowToPayByCheck,
          dtCreatedOn: util.getCurrentDatetime(),
        };
        const accessCodeData = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
          sAccessCode: data.sAccessCode,
        };
        const fieldsDataArray = data.fieldsDataArray
        const guestAddRegFieldData = data.guestAddRegFieldData
        const dataToSet = { eventData, accessCodeData, fieldsDataArray, guestAddRegFieldData };
        usersDAO.tslAddEvent(dataToSet, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.insertId || dbData.affectedRows == 1) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.ADDED_SUCC,
              result: dbData,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SOMETHING_WENT_WRONG,
              result: {},
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslAddEvent);
    }
  );
};

let tslUpdateEventInfo = function (data, callback) {
  async.auto(
    {
      updateEventInfo: (cb) => {
        usersDAO.tslUpdateEventInfo(data, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.affectedRows > 0) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.UPDATED_SUCC,
              result: dbData,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.UPDATED_ERROR,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.updateEventInfo);
    }
  );
};

let tslUpdateEventPageDesign = function (data, callback) {
  async.auto(
    {
      updateEventPageDesign: (cb) => {
        usersDAO.tslUpdateEventPageDesign(data, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.affectedRows > 0) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.UPDATED_SUCC,
              result: dbData,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.UPDATED_ERROR,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.updateEventPageDesign);
    }
  );
};

// add Client data
let saveClientInformation = (data, callback) => {
  async.auto(
    {
      saveClientInformation: (cb) => {
        const { error } = saveClientInformationValidation(data);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        usersDAO.saveClientInformationWithCompany(data, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.insertId || dbData.affectedRows == 1) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.ADDED_SUCC,
              result: true,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SOMETHING_WENT_WRONG,
              result: {},
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.saveClientInformation);
    }
  );
};

let tslGetClientInformation = function (data, callback) {
  async.auto(
    {
      tslGetClientInformation: (cb) => {
        usersDAO.tslGetClientInformation(data, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.length) {
            dbData[0]["lAccountID"] = dbData[0].lAccountID;
            dbData[0]["userId"] = dbData[0].lAccountID;
            dbData[0]["lLoginID"] = dbData[0].lLoginID;
            dbData[0]["sUserName"] = dbData[0].sUserName;
            dbData[0]["sUserPassword"] = dbData[0].sUserPassword;
            dbData[0]["sUserRepeatPassword"] = dbData[0].sUserPassword;
            dbData[0]["sFirstName"] = dbData[0].sFirstName;
            dbData[0]["sLastName"] = dbData[0].sLastName;
            dbData[0]["sPhone"] = dbData[0].sPhone;
            dbData[0]["lRoleID"] = dbData[0].lRoleID;
            dbData[0]["sStatus"] = dbData[0].sStatus;
            dbData[0]["sBillCompany"] = dbData[0].sBillCompany;

            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.USER_DETAIL_FOUND,
              data: dbData[0],
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslGetClientInformation);
    }
  );
};

let tslGetEventById = function (data, callback) {
  async.auto(
    {
      tslGetEventById: (cb) => {
        usersDAO.getEventById(data, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.length) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.EVENT_DETAIL_FOUND,
              data: dbData[0],
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslGetEventById);
    }
  );
};

let tslGetPageDesign = function (data, callback) {
  async.auto(
    {
      tslGetPageDesign: (cb) => {
        const { error } = tslAccountIdEventIdValidation(data);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        usersDAO.tslGetPageDesign(data, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.length) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
              data: dbData[0],
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslGetPageDesign);
    }
  );
};

let tslInsertRegTypesPageDesign = (data, callback) => {
  async.auto(
    {
      tslInsertRegTypesPageDesign: (cb) => {
        let dataToSet = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
          sCode: data.sCode,
          sName: data.sName,
          dEarlyAmt: data.dEarlyAmt ? data.dEarlyAmt : "",
          dPricePerAddRegEarly: data.dPricePerAddRegEarly ? data.dPricePerAddRegEarly : "",
          dPricePerGuestEarly: data.dPricePerGuestEarly ? data.dPricePerGuestEarly : "",
          lNumberOfEarlyReg1: data.lNumberOfEarlyReg1
            ? data.lNumberOfEarlyReg1
            : "",
          dEarlyAmt2: data.dEarlyAmt2 ? data.dEarlyAmt2 : "",
          lNumberOfEarlyReg2: data.lNumberOfEarlyReg2
            ? data.lNumberOfEarlyReg2
            : "",
          dEarlyAmt3: data.dEarlyAmt3 ? data.dEarlyAmt3 : "",
          lNumberOfEarlyReg3: data.lNumberOfEarlyReg3
            ? data.lNumberOfEarlyReg3
            : "",
          dEarlyAmt4: data.dEarlyAmt4 ? data.dEarlyAmt4 : "",
          lNumberOfEarlyReg4: data.lNumberOfEarlyReg4
            ? data.lNumberOfEarlyReg4
            : "",
          dtEarlyDate: data.dtEarlyDate ? data.dtEarlyDate : "",
          dStandardAmt: data.dStandardAmt ? data.dStandardAmt : "",
          dPricePerAddRegStd: data.dPricePerAddRegStd ? data.dPricePerAddRegStd : "",
          dPricePerGuestStd: data.dPricePerGuestStd ? data.dPricePerGuestStd : "",
          lNumberOfStandardReg1: data.lNumberOfStandardReg1
            ? data.lNumberOfStandardReg1
            : "",
          dStandardAmt2: data.dStandardAmt2 ? data.dStandardAmt2 : "",
          lNumberOfStandardReg2: data.lNumberOfStandardReg2
            ? data.lNumberOfStandardReg2
            : "",
          dStandardAmt3: data.dStandardAmt3 ? data.dStandardAmt3 : "",
          lNumberOfStandardReg3: data.lNumberOfStandardReg3
            ? data.lNumberOfStandardReg3
            : "",
          dStandardAmt4: data.dStandardAmt4 ? data.dStandardAmt4 : "",
          lNumberOfStandardReg4: data.lNumberOfStandardReg4
            ? data.lNumberOfStandardReg4
            : "",
          dtStandardDate: data.dtStandardDate ? data.dtStandardDate : "",
          dOnsiteAmt: data.dOnsiteAmt ? data.dOnsiteAmt : "",
          dPricePerAddReg: data.dPricePerAddReg ? data.dPricePerAddReg : "",
          dPricePerGuest: data.dPricePerGuest ? data.dPricePerGuest : "",
          

          lNumberOfOnsiteReg1: data.lNumberOfOnsiteReg1
            ? data.lNumberOfOnsiteReg1
            : "",
          dOnsiteAmt2: data.dOnsiteAmt2 ? data.dOnsiteAmt2 : "",
          lNumberOfOnsiteReg2: data.lNumberOfOnsiteReg2
            ? data.lNumberOfOnsiteReg2
            : "",
          dOnsiteAmt3: data.dOnsiteAmt3 ? data.dOnsiteAmt3 : "",
          lNumberOfOnsiteReg3: data.lNumberOfOnsiteReg3
            ? data.lNumberOfOnsiteReg3
            : "",
          dOnsiteAmt4: data.dOnsiteAmt4 ? data.dOnsiteAmt4 : "",
          lNumberOfOnsiteReg4: data.lNumberOfOnsiteReg4
            ? data.lNumberOfOnsiteReg4
            : "",

          // dPricePerAddRegEarly: data.dPricePerAddRegEarly?data.dPricePerAddRegEarly:'',
          // dPricePerGuestEarly: data.dPricePerGuestEarly?data.dPricePerGuestEarly:'',
          // dPricePerAddRegStd: data.dPricePerAddRegStd?data.dPricePerAddRegStd:'',
          // dPricePerGuestStd: data.dPricePerGuestStd?data.dPricePerGuestStd:'',
          // dPricePerAddReg: data.dPricePerAddReg?data.dPricePerAddReg:'',
          // dPricePerGuest: data.dPricePerGuest?data.dPricePerGuest:'',
          // bNeedMembership: data.bNeedMembership?data.bNeedMembership:'',
          // nAddRegMax: data.nAddRegMax?data.nAddRegMax:'',
          // nGuestsMax: data.nGuestsMax?data.nGuestsMax:'',
          nStatus: data.nStatus ? data.nStatus : "",
        };
        const { error } = tslInsertRegTypesPageDesignValidation(dataToSet);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }

        // check sCode exits or not
        var sCodeCount = 0;
        usersDAO.tslCheckRegTypesScodeExists(dataToSet, (err, dbData) => {
          if (dbData) {
            sCodeCount = dbData[0].sCodeCount;
          }
          if (sCodeCount < 1) {
            dataToSet["sPrintText"] = data.sPrintText ? data.sPrintText : "";
            dataToSet["dtCreatedOn"] = util.getCurrentDatetime();
            dataToSet["dtUpdatedOn"] = util.getCurrentDatetime();
            usersDAO.tslInsertRegTypesPageDesign(dataToSet, (err2, dbData2) => {
              if (err2) {
                cb(null, {
                  errorCode: util.statusCode.ONE,
                  errorMessage: util.statusMessage.SERVER_BUSY,
                });
                return;
              }
              if (dbData2.insertId || dbData2.affectedRows == 1) {
                dataToSet["lRegTypeID"] = dbData2.insertId;
                cb(null, {
                  errorCode: util.statusCode.ZERO,
                  errorMessage: util.statusMessage.ADDED_SUCC,
                  result: dataToSet,
                });
              } else {
                cb(null, {
                  errorCode: util.statusCode.ONE,
                  errorMessage: util.statusMessage.SOMETHING_WENT_WRONG,
                  result: {},
                });
              }
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.TWO,
              errorMessage: util.statusMessage.CODE_EXISTS,
            });
            return;
          }
        });
        // end checking sCode
      },
    },
    (err, response) => {
      callback(response.tslInsertRegTypesPageDesign);
    }
  );
};

// Get RegTypes Page Design
let tslGetRegTypesPageDesign = function (data, callback) {
  async.auto(
    {
      tslGetRegTypesPageDesign: (cb) => {
        const { error } = tslAccountIdEventIdValidation(data);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        let total_records = 0;
        usersDAO.tslCountGetRegTypesPageDesign(data, (err1, dbData1) => {
          if (err1) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData1) {
            total_records = dbData1[0].total_records;
          }

          usersDAO.tslGetRegTypesPageDesign(data, (err, dbData) => {
            if (err) {
              cb(null, {
                errorCode: util.statusCode.ONE,
                errorMessage: util.statusMessage.SERVER_BUSY,
              });
              return;
            }
            if (dbData.length) {
              cb(null, {
                errorCode: util.statusCode.ZERO,
                errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
                total_records: total_records,
                data: dbData,
              });
            } else {
              cb(null, {
                errorCode: util.statusCode.ONE,
                errorMessage: util.statusMessage.NO_RECORD_FOUND,
              });
            }
          });
        });
      },
    },
    (err, response) => {
      callback(response.tslGetRegTypesPageDesign);
    }
  );
};

let tslUpdateRegTypesPageDesign = function (data, callback) {
  async.auto(
    {
      tslUpdateRegTypesPageDesign: (cb) => {
        let dataToValidate = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
        };
        const { error } = tslLAccountIdLEventIdValidation(dataToValidate);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        var sCodeCount = 0;
        usersDAO.tslCheckRegTypesScodeExists(data, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          sCodeCount = dbData[0].sCodeCount;
          if (sCodeCount < 1) {
            usersDAO.tslUpdateRegTypesPageDesign(data, (err, dbData) => {
              if (err) {
                cb(null, {
                  errorCode: util.statusCode.ONE,
                  errorMessage: util.statusMessage.SERVER_BUSY,
                });
                return;
              }
              if (dbData.affectedRows > 0) {
                cb(null, {
                  errorCode: util.statusCode.ZERO,
                  errorMessage: util.statusMessage.UPDATED_SUCC,
                  result: data,
                });
              } else {
                cb(null, {
                  errorCode: util.statusCode.ONE,
                  errorMessage: util.statusMessage.UPDATED_ERROR,
                });
              }
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.CODE_EXISTS,
            });
            return;
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslUpdateRegTypesPageDesign);
    }
  );
};

// Insert Registrations Config in Page Design

let tslInsertRegCategoriesPageDesign = (data, callback) => {
  async.auto(
    {
      tslInsertRegCategoriesPageDesign: (cb) => {
        let dataToSet = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
          sCode: data.sCode,
          sName: data.sName,
          sApplyToRegTypes: data.sApplyToRegTypes ? data.sApplyToRegTypes : "",
          sApplyToTemplates: data.sApplyToTemplates
            ? data.sApplyToTemplates
            : "",
          nStatus: data.nStatus ? data.nStatus : 0,
        };

        const { error } = tslInsertRegCategoriesPageDesignValidation(dataToSet);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        // check sCode exits or not
        var sCodeCount = 0;
        usersDAO.tslCheckRegCategoriesScodeExists(dataToSet, (err, dbData) => {
          sCodeCount = dbData[0].sCodeCount;
          if (sCodeCount < 1) {
            dataToSet["dtCreatedOn"] = util.getCurrentDatetime();
            dataToSet["dtUpdatedOn"] = util.getCurrentDatetime();
            usersDAO.tslInsertRegCategoriesPageDesign(
              dataToSet,
              (err2, dbData2) => {
                if (err2) {
                  cb(null, {
                    errorCode: util.statusCode.ONE,
                    errorMessage: util.statusMessage.SERVER_BUSY,
                  });
                  return;
                }
                if (dbData2.insertId || dbData2.affectedRows == 1) {
                  dataToSet["lRegTypeID"] = dbData2.insertId;
                  cb(null, {
                    errorCode: util.statusCode.ZERO,
                    errorMessage: util.statusMessage.ADDED_SUCC,
                    result: dataToSet,
                  });
                } else {
                  cb(null, {
                    errorCode: util.statusCode.ONE,
                    errorMessage: util.statusMessage.SOMETHING_WENT_WRONG,
                    result: {},
                  });
                }
              }
            );
          } else {
            cb(null, {
              errorCode: util.statusCode.TWO,
              errorMessage: util.statusMessage.CODE_EXISTS,
            });
            return;
          }
        });
        // end checking sCode
      },
    },
    (err, response) => {
      callback(response.tslInsertRegCategoriesPageDesign);
    }
  );
};

// Get Reg Categories Page Design

let tslGetRegCategoriesPageDesign = function (data, callback) {
  async.auto(
    {
      tslGetRegCategoriesPageDesign: (cb) => {
        const { error } = tslAccountIdEventIdValidation(data);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        let total_records = 0;
        usersDAO.tslCountGetRegCategoriesPageDesign(data, (err1, dbData1) => {
          if (err1) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData1) {
            total_records = dbData1[0].total_records;
          }
          usersDAO.tslGetRegCategoriesPageDesign(data, (err, dbData) => {
            if (err) {
              cb(null, {
                errorCode: util.statusCode.ONE,
                errorMessage: util.statusMessage.SERVER_BUSY,
              });
              return;
            }
            if (dbData.length) {
              cb(null, {
                errorCode: util.statusCode.ZERO,
                errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
                total_records: total_records,
                data: dbData,
              });
            } else {
              cb(null, {
                errorCode: util.statusCode.ONE,
                errorMessage: util.statusMessage.NO_RECORD_FOUND,
              });
            }
          });
        });
      },
    },
    (err, response) => {
      callback(response.tslGetRegCategoriesPageDesign);
    }
  );
};

// Update Reg Categories Page Design

let tslUpdateRegCategoriesPageDesign = function (data, callback) {
  async.auto(
    {
      tslUpdateRegCategoriesPageDesign: (cb) => {
        const { error } = tslUpdateRegCategoriesPageDesignValidation(data);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        var sCodeCount = 0;
        usersDAO.tslCheckRegCategoriesScodeExists(data, (err, dbData) => {
          sCodeCount = dbData[0].sCodeCount;
          if (sCodeCount < 1) {
            usersDAO.tslUpdateRegCategoriesPageDesign(data, (err, dbData) => {
              if (err) {
                cb(null, {
                  errorCode: util.statusCode.ONE,
                  errorMessage: util.statusMessage.SERVER_BUSY,
                });
                return;
              }
              if (dbData.affectedRows > 0) {
                cb(null, {
                  errorCode: util.statusCode.ZERO,
                  errorMessage: util.statusMessage.UPDATED_SUCC,
                  result: data,
                });
              } else {
                cb(null, {
                  errorCode: util.statusCode.ONE,
                  errorMessage: util.statusMessage.UPDATED_ERROR,
                });
              }
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.CODE_EXISTS,
            });
            return;
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslUpdateRegCategoriesPageDesign);
    }
  );
};

// Get sCode of Reg Types with event ID and account ID

let tslGetRegSCodePageDesign = function (data, callback) {
  async.auto(
    {
      tslGetRegSCodePageDesign: (cb) => {
        const { error } = tslAccountIdEventIdValidation(data);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        usersDAO.tslGetRegSCodePageDesign(data, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.length) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
              data: dbData,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslGetRegSCodePageDesign);
    }
  );
};

// Get RegTypes Page Design By Id
let tslGetRegTypesByIdPageDesign = function (data, callback) {
  async.auto(
    {
      tslGetRegTypesByIdPageDesign: (cb) => {
        const { error } = tslGetRegTypesByIdValidation(data);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        usersDAO.tslGetRegTypesByIdPageDesign(data, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.length) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
              data: dbData[0],
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslGetRegTypesByIdPageDesign);
    }
  );
};

// Get RegTypes Page Design By Id
let tslGetRegCategoriesByIdPageDesign = function (data, callback) {
  async.auto(
    {
      tslGetRegCategoriesByIdPageDesign: (cb) => {
        const { error } = tslGetRegCategoriesByIdValidation(data);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        usersDAO.tslGetRegCategoriesByIdPageDesign(data, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.length) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
              data: dbData[0],
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslGetRegCategoriesByIdPageDesign);
    }
  );
};

// add Registrant Information
let tslInsertRegistrantInformation = (data, callback) => {
  async.auto(
    {
      tslInsertRegistrantInformation: (cb) => {
        let dataToValidate = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
        };
        const { error } = tslLAccountIdLEventIdValidation(dataToValidate);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        let dataToSet = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
          sCode: data.sCode ? data.sCode : "",
          sName: data.sName ? data.sName : "",
          bVisible: data.bVisible ? data.bVisible : "",
          bRequired: data.bRequired ? data.bRequired : "",
          nOrder: data.nOrder ? data.nOrder : "",
          dtCreatedOn: util.getCurrentDatetime(),
          dtUpdatedOn: util.getCurrentDatetime(),
        };

        usersDAO.tslInsertRegistrantInformationWithCompany(
          dataToSet,
          (err, dbData) => {
            if (err) {
              cb(null, {
                errorCode: util.statusCode.ONE,
                errorMessage: util.statusMessage.SERVER_BUSY,
              });
              return;
            }
            if (dbData.insertId || dbData.affectedRows == 1) {
              cb(null, {
                errorCode: util.statusCode.ZERO,
                errorMessage: util.statusMessage.ADDED_SUCC,
                result: dataToSet,
              });
            } else {
              cb(null, {
                errorCode: util.statusCode.ONE,
                errorMessage: util.statusMessage.SOMETHING_WENT_WRONG,
                result: {},
              });
            }
          }
        );
      },
    },
    (err, response) => {
      callback(response.tslInsertRegistrantInformation);
    }
  );
};

// Get RegTypes Page Design By Id
let tslGetRegistrantInformation = function (data, callback) {
  async.auto(
    {
      tslGetRegistrantInformation: (cb) => {
        let dataToSet = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
        };
        const { error } = tslLAccountIdLEventIdValidation(dataToSet);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        usersDAO.tslGetRegistrantInformation(dataToSet, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.length) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
              data: dbData,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslGetRegistrantInformation);
    }
  );
};

// Get RegTypes Page Design By Id
let tslGetQuestionsConfigSName = function (data, callback) {
  async.auto(
    {
      tslGetQuestionsConfigSName: (cb) => {
        let dataToSet = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
          lRegTypeID: data.lRegTypeID,
        };
       
        usersDAO.tslGetQuestionsConfigSName(dataToSet, (err, dbData) => {
          // console.log('err',err)
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.length) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
              data: dbData,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslGetQuestionsConfigSName);
    }
  );
};

// Get RegTypes Page Design By Id
let tslGetQuestionsFieldName = function (data, callback) {
  async.auto(
    {
      tslGetQuestionsFieldName: (cb) => {
        let dataToSet = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
          sCode: data.sCode,
        };
        const { error } = tslGetQuestionsFieldNameValidation(dataToSet);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        usersDAO.tslGetQuestionsFieldName(dataToSet, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.length) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
              data: dbData,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslGetQuestionsFieldName);
    }
  );
};

// Update Registrant Information at Fields Design

let tslUpdateRegInfoFieldsPage = function (data, callback) {
  async.auto(
    {
      tslUpdateRegInfoFieldsPage: (cb) => {
        let dataToSet = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
          fieldValue: data.fieldValue,
        };
        const { error } = tslUpdateRegInfoFieldsPageValidation(dataToSet);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        usersDAO.tslUpdateRegInfoFieldsPage(dataToSet, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData > 0) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.UPDATED_SUCC,
              result: dataToSet,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.UPDATED_ERROR,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslUpdateRegInfoFieldsPage);
    }
  );
};

// Get RegTypes Page Design By Id
let tslGetguestsRegistrantsFields = function (data, callback) {
  async.auto(
    {
      tslGetguestsRegistrantsFields: (cb) => {
        let dataToSet = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
          fieldValue: data.guestsFieldName,
        };
        const { error } = tslGetguestsRegistrantsFieldsValidation(dataToSet);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        usersDAO.tslGetguestsRegistrantsFields(dataToSet, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.length) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
              data: dbData,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslGetguestsRegistrantsFields);
    }
  );
};

// Get Custom Questions at Fields Page
let tslGetCustomQuestions = function (data, callback) {
  async.auto(
    {
      tslGetCustomQuestions: (cb) => {
        let dataToSet = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
        };
        const { error } = tslLAccountIdLEventIdValidation(dataToSet);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        usersDAO.tslGetCustomQuestions(dataToSet, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.length) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
              data: dbData,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslGetCustomQuestions);
    }
  );
};

// Update Guest Registrant Fields at Fields Design Page

let tslUpdateGuestRegistrantsFields = function (data, callback) {
  async.auto(
    {
      tslUpdateGuestRegistrantsFields: (cb) => {
        let dataToSet = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
          guestData: data.guestData,
        };
        const { error } = tslUpdateGuestRegistrantsFieldsValidation(dataToSet);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        usersDAO.tslUpdateGuestRegistrantsFields(dataToSet, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData > 0) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.UPDATED_SUCC,
              result: dataToSet,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.UPDATED_ERROR,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslUpdateGuestRegistrantsFields);
    }
  );
};

// Update Registrant Information at Fields Design

let tslUpdateRegistrantFieldSetup = function (data, callback) {
  async.auto(
    {
      tslUpdateRegistrantFieldSetup: (cb) => {
        let dataToSet = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
          fieldValue: data.regFieldData,
        };
        const { error } = tslGetguestsRegistrantsFieldsValidation(dataToSet);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        usersDAO.tslUpdateRegistrantFieldSetup(dataToSet, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData > 0) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.UPDATED_SUCC,
              result: dataToSet,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.UPDATED_ERROR,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslUpdateRegistrantFieldSetup);
    }
  );
};

// Get Custom Questions By Id at Fields Page
let tslGetCustomQuestionsById = function (data, callback) {
  async.auto(
    {
      tslGetCustomQuestionsById: (cb) => {
        let dataToSet = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
          lQuestionID: data.lQuestionID,
        };
        const { error } = tslGetCustomQuestionsByIdValidation(dataToSet);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        usersDAO.tslGetCustomQuestionsById(dataToSet, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.length) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
              data: dbData[0],
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslGetCustomQuestionsById);
    }
  );
};

// add Registrant Information
let tslInsertCustomQuestions = (data, callback) => {
  async.auto(
    {
      tslInsertCustomQuestions: (cb) => {
        let dataToValidate = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
        };
        const { error } = tslLAccountIdLEventIdValidation(dataToValidate);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }

        let dataToSet = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
          sCode: data.customQuestionsData.sCode,
          sName: data.customQuestionsData.sName,
          nType: data.customQuestionsData.nType
            ? data.customQuestionsData.nType
            : "",
          sAnswers: data.customQuestionsData.sAnswers
            ? data.customQuestionsData.sAnswers
            : "",
          bRequired: data.customQuestionsData.bRequired
            ? data.customQuestionsData.bRequired
            : "",
          sApplyToRegTypes: data.customQuestionsData.sApplyToRegTypes
            ? data.customQuestionsData.sApplyToRegTypes
            : "",
          nOrder: data.customQuestionsData.nOrder
            ? data.customQuestionsData.nOrder
            : "",
          nStatus: data.customQuestionsData.nStatus
            ? data.customQuestionsData.nStatus
            : "",
          dtCreatedOn: util.getCurrentDatetime(),
          dtUpdatedOn: util.getCurrentDatetime(),
        };

        // check sCode exits or not
        var sCodeCount = 0;
        usersDAO.tslCheckCustomQuestionsScodeExists(
          dataToSet,
          (err, dbData) => {
            sCodeCount = dbData[0].sCodeCount;
            if (sCodeCount < 1) {
              usersDAO.tslInsertCustomQuestions(dataToSet, (err, dbData2) => {
                if (err) {
                  cb(null, {
                    errorCode: util.statusCode.ONE,
                    errorMessage: util.statusMessage.SERVER_BUSY,
                  });
                  return;
                }
                if (dbData2.insertId || dbData2.affectedRows == 1) {
                  cb(null, {
                    errorCode: util.statusCode.ZERO,
                    errorMessage: util.statusMessage.ADDED_SUCC,
                    result: dataToSet,
                  });
                } else {
                  cb(null, {
                    errorCode: util.statusCode.ONE,
                    errorMessage: util.statusMessage.SOMETHING_WENT_WRONG,
                    result: {},
                  });
                }
              });
            } else {
              cb(null, {
                errorCode: util.statusCode.TWO,
                errorMessage: util.statusMessage.CODE_EXISTS,
              });
              return;
            }
          }
        );
      },
    },
    (err, response) => {
      callback(response.tslInsertCustomQuestions);
    }
  );
};

// Update Registrant Information at Fields Design

let tslupdateCustomQuestions = function (data, callback) {
  async.auto(
    {
      tslupdateCustomQuestions: (cb) => {
        let dataToValidate = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
        };
        const { error } =
          tslGetguestsRegistrantsFieldsValidation(dataToValidate);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        let dataToSet = { 
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
          lQuestionID: data.customQuestionsData.lQuestionID,
          sCode: data.customQuestionsData.sCode,
          sName: data.customQuestionsData.sName,
          nType: data.customQuestionsData.nType
            ? data.customQuestionsData.nType
            : "",
          // sAnswers : data.customQuestionsData.sAnswers? data.customQuestionsData.sAnswers:'',
          bRequired: data.customQuestionsData.bRequired
            ? data.customQuestionsData.bRequired
            : "",
          sApplyToRegTypes: data.customQuestionsData.sApplyToRegTypes
            ? data.customQuestionsData.sApplyToRegTypes
            : "",
          nOrder: data.customQuestionsData.nOrder
            ? data.customQuestionsData.nOrder
            : "",
          nStatus: data.customQuestionsData.nStatus
            ? data.customQuestionsData.nStatus
            : "",
        };
        // check sCode exits or not
        var sCodeCount = 0;
        usersDAO.tslCheckCustomQuestionsScodeExists(
          dataToSet,
          (err, dbData) => {
            sCodeCount = dbData[0].sCodeCount;
            if (sCodeCount < 1) {
              usersDAO.tslupdateCustomQuestions(dataToSet, (err, dbData2) => {
                if (err) {
                  cb(null, {
                    errorCode: util.statusCode.ONE,
                    errorMessage: util.statusMessage.SERVER_BUSY,
                  });
                  return;
                }
                if (dbData2.affectedRows > 0) {
                  cb(null, {
                    errorCode: util.statusCode.ZERO,
                    errorMessage: util.statusMessage.UPDATED_SUCC,
                    result: dataToSet,
                  });
                } else {
                  cb(null, {
                    errorCode: util.statusCode.ONE,
                    errorMessage: util.statusMessage.UPDATED_ERROR,
                  });
                }
              });
            } else {
              cb(null, {
                errorCode: util.statusCode.TWO,
                errorMessage: util.statusMessage.CODE_EXISTS,
              });
              return;
            }
          }
        );
      },
    },
    (err, response) => {
      callback(response.tslupdateCustomQuestions);
    }
  );
};

// Get Disocunt Codes at Fields Page
let tslGetDiscountCodes = function (data, callback) {
  async.auto(
    {
      tslGetDiscountCodes: (cb) => {
        let dataToSet = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
        };
        const { error } = tslLAccountIdLEventIdValidation(dataToSet);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        usersDAO.tslGetDiscountCodes(dataToSet, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.length) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
              data: dbData,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslGetDiscountCodes);
    }
  );
};

// Get Disocunt Codes BY ID at Fields Page
let tslGetDiscountCodesById = function (data, callback) {
  async.auto(
    {
      tslGetDiscountCodesById: (cb) => {
        let dataToSet = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
          lDiscountID: data.lDiscountID,
        };
        const { error } = tslGetDiscountCodesByIdValidation(dataToSet);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        usersDAO.tslGetDiscountCodesById(dataToSet, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.length) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
              data: dbData[0],
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslGetDiscountCodesById);
    }
  );
};

// add Registrant Information
let tslInsertDiscountCodes = (data, callback) => {
  async.auto(
    {
      tslInsertDiscountCodes: (cb) => {
        let dataToValidate = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
        };
        const { error } = tslLAccountIdLEventIdValidation(dataToValidate);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        let dataToSet = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
          sCode: data.discountCodesData.sCode
            ? data.discountCodesData.sCode
            : "",
          sName: data.discountCodesData.sName
            ? data.discountCodesData.sName
            : "",
          nExtraFieldRequired: data.discountCodesData.nExtraFieldRequired
            ? data.discountCodesData.nExtraFieldRequired
            : "",
          dAmount: data.discountCodesData.dAmount
            ? data.discountCodesData.dAmount
            : "",
          sApplyToRegTypes: data.discountCodesData.sApplyToRegTypes
            ? data.discountCodesData.sApplyToRegTypes
            : "",
          nStatus: data.discountCodesData.nStatus
            ? data.discountCodesData.nStatus
            : "",
          dtCreatedOn: util.getCurrentDatetime(),
          dtUpdatedOn: util.getCurrentDatetime(),
        };

        // check sCode exits or not
        var sCodeCount = 0;
        usersDAO.tslCheckDiscountCodesScodeExists(dataToSet, (err, dbData) => {
          if (dbData) {
            sCodeCount = dbData[0].sCodeCount;
          }

          if (sCodeCount < 1) {
            usersDAO.tslInsertDiscountCodes(dataToSet, (err, dbData) => {
              if (err) {
                cb(null, {
                  errorCode: util.statusCode.ONE,
                  errorMessage: util.statusMessage.SERVER_BUSY,
                });
                return;
              }
              if (dbData.insertId || dbData.affectedRows == 1) {
                cb(null, {
                  errorCode: util.statusCode.ZERO,
                  errorMessage: util.statusMessage.ADDED_SUCC,
                  result: dataToSet,
                });
              } else {
                cb(null, {
                  errorCode: util.statusCode.ONE,
                  errorMessage: util.statusMessage.SOMETHING_WENT_WRONG,
                  result: {},
                });
              }
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.TWO,
              errorMessage: util.statusMessage.CODE_EXISTS,
            });
            return;
          }
        });
        // end sCOde exists or not
      },
    },
    (err, response) => {
      callback(response.tslInsertDiscountCodes);
    }
  );
};

// Update Registrant Information at Fields Design

let tslUpdateDiscountCodes = function (data, callback) {
  async.auto(
    {
      tslUpdateDiscountCodes: (cb) => {
        let dataToValidate = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
        };
        const { error } = tslAccountIdEventIdValidation(dataToValidate);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }

        let dataToSet = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
          lDiscountID: data.discountCodesData.lDiscountID,
          sCode: data.discountCodesData.sCode,
          sName: data.discountCodesData.sName,
          nExtraFieldRequired: data.discountCodesData.nExtraFieldRequired
            ? data.discountCodesData.nExtraFieldRequired
            : "",
          dAmount: data.discountCodesData.dAmount
            ? data.discountCodesData.dAmount
            : "",
          sApplyToRegTypes: data.discountCodesData.sApplyToRegTypes
            ? data.discountCodesData.sApplyToRegTypes
            : "",
          nStatus: data.discountCodesData.nStatus
            ? data.discountCodesData.nStatus
            : "",
        };

        // check sCode exits or not
        var sCodeCount = 0;
        usersDAO.tslCheckDiscountCodesScodeExists(dataToSet, (err, dbData) => {
          if (dbData) {
            sCodeCount = dbData[0].sCodeCount;
          }

          if (sCodeCount < 1) {
            usersDAO.tslUpdateDiscountCodes(dataToSet, (err, dbData) => {
              if (err) {
                cb(null, {
                  errorCode: util.statusCode.ONE,
                  errorMessage: util.statusMessage.SERVER_BUSY,
                });
                return;
              }
              if (dbData.affectedRows > 0) {
                cb(null, {
                  errorCode: util.statusCode.ZERO,
                  errorMessage: util.statusMessage.UPDATED_SUCC,
                  result: dataToSet,
                });
              } else {
                cb(null, {
                  errorCode: util.statusCode.ONE,
                  errorMessage: util.statusMessage.UPDATED_ERROR,
                });
              }
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.TWO,
              errorMessage: util.statusMessage.CODE_EXISTS,
            });
            return;
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslUpdateDiscountCodes);
    }
  );
};

// add Session Information
let tslInsertSessions = (data, callback) => {
  async.auto(
    {
      tslInsertSessions: (cb) => {
        let dataToValidate = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
        };
        const { error } = tslLAccountIdLEventIdValidation(dataToValidate);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        let dataToSet = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
          sCode: data.sessionCodesData.sCode ? data.sessionCodesData.sCode : "",
          sName: data.sessionCodesData.sName ? data.sessionCodesData.sName : "",
          nMaxQty: data.sessionCodesData.nMaxQty
            ? data.sessionCodesData.nMaxQty
            : "",
          dPrice1: data.sessionCodesData.dPrice1
            ? data.sessionCodesData.dPrice1
            : "",
          dtPrice1: data.sessionCodesData.dtPrice1
            ? data.sessionCodesData.dtPrice1
            : "",
          dPrice2: data.sessionCodesData.dPrice2
            ? data.sessionCodesData.dPrice2
            : "",
          dtPrice2: data.sessionCodesData.dtPrice2
            ? data.sessionCodesData.dtPrice2
            : "",
          dPrice3: data.sessionCodesData.dPrice3
            ? data.sessionCodesData.dPrice3
            : "",
          dtPrice3: data.sessionCodesData.dtPrice3
            ? data.sessionCodesData.dtPrice3
            : "",
          bPrintTicket: data.sessionCodesData.bPrintTicket
            ? data.sessionCodesData.bPrintTicket
            : "",
          sPrintTicketText: data.sessionCodesData.sPrintTicketText
            ? data.sessionCodesData.sPrintTicketText
            : "",
          sApplyToRegTypes: data.sessionCodesData.sApplyToRegTypes
            ? data.sessionCodesData.sApplyToRegTypes
            : "",
          sAutoTicketForRegTypes: data.sessionCodesData.sAutoTicketForRegTypes
            ? data.sessionCodesData.sAutoTicketForRegTypes
            : "",
          nStatus: data.sessionCodesData.nStatus
            ? data.sessionCodesData.nStatus
            : "",
          dtCreatedOn: util.getCurrentDatetime(),
          dtUpdatedOn: util.getCurrentDatetime(),
        };

        // check sCode exits or not
        var sCodeCount = 0;
        usersDAO.tslCheckSessionScodeExists(dataToSet, (err, dbData) => {
          if (dbData) {
            sCodeCount = dbData[0].sCodeCount;
          }

          if (sCodeCount < 1) {
            usersDAO.tslInsertSessions(dataToSet, (err, dbData) => {
              if (err) {
                cb(null, {
                  errorCode: util.statusCode.ONE,
                  errorMessage: util.statusMessage.SERVER_BUSY,
                });
                return;
              }
              if (dbData.insertId || dbData.affectedRows == 1) {
                cb(null, {
                  errorCode: util.statusCode.ZERO,
                  errorMessage: util.statusMessage.ADDED_SUCC,
                  result: dataToSet,
                });
              } else {
                cb(null, {
                  errorCode: util.statusCode.ONE,
                  errorMessage: util.statusMessage.SOMETHING_WENT_WRONG,
                  result: {},
                });
              }
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.TWO,
              errorMessage: util.statusMessage.CODE_EXISTS,
            });
            return;
          }
        });
        // end sCode Exists or not
      },
    },
    (err, response) => {
      callback(response.tslInsertSessions);
    }
  );
};

// Update Registrant Information at Fields Design

let tslUpdateSessions = function (data, callback) {
  async.auto(
    {
      tslUpdateSessions: (cb) => {
        let dataToValidate = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
        };
        const { error } = tslAccountIdEventIdValidation(dataToValidate);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }

        let dataToSet = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
          lSessionID: data.sessionCodesData.lSessionID,
          sCode: data.sessionCodesData.sCode ? data.sessionCodesData.sCode : "",
          sName: data.sessionCodesData.sName ? data.sessionCodesData.sName : "",
          nMaxQty: data.sessionCodesData.nMaxQty
            ? data.sessionCodesData.nMaxQty
            : "",
          dPrice1: data.sessionCodesData.dPrice1
            ? data.sessionCodesData.dPrice1
            : "",
          dtPrice1: data.sessionCodesData.dtPrice1
            ? data.sessionCodesData.dtPrice1
            : "",
          dPrice2: data.sessionCodesData.dPrice2
            ? data.sessionCodesData.dPrice2
            : "",
          dtPrice2: data.sessionCodesData.dtPrice2
            ? data.sessionCodesData.dtPrice2
            : "",
          dPrice3: data.sessionCodesData.dPrice3
            ? data.sessionCodesData.dPrice3
            : "",
          dtPrice3: data.sessionCodesData.dtPrice3
            ? data.sessionCodesData.dtPrice3
            : "",
          bPrintTicket: data.sessionCodesData.bPrintTicket
            ? data.sessionCodesData.bPrintTicket
            : "",
          sPrintTicketText: data.sessionCodesData.sPrintTicketText
            ? data.sessionCodesData.sPrintTicketText
            : "",
          sApplyToRegTypes: data.sessionCodesData.sApplyToRegTypes
            ? data.sessionCodesData.sApplyToRegTypes
            : "",
          sAutoTicketForRegTypes: data.sessionCodesData.sAutoTicketForRegTypes
            ? data.sessionCodesData.sAutoTicketForRegTypes
            : "",
          nStatus: data.sessionCodesData.nStatus
            ? data.sessionCodesData.nStatus
            : "",
          dtUpdatedOn: util.getCurrentDatetime(),
        };

        // check sCode exits or not
        var sCodeCount = 0;
        usersDAO.tslCheckSessionScodeExists(dataToSet, (err, dbData) => {
          if (dbData) {
            sCodeCount = dbData[0].sCodeCount;
          }

          if (sCodeCount < 1) {
            usersDAO.tslUpdateSessions(dataToSet, (err, dbData) => {
              if (err) {
                cb(null, {
                  errorCode: util.statusCode.ONE,
                  errorMessage: util.statusMessage.SERVER_BUSY,
                });
                return;
              }
              if (dbData.affectedRows > 0) {
                cb(null, {
                  errorCode: util.statusCode.ZERO,
                  errorMessage: util.statusMessage.UPDATED_SUCC,
                  result: dataToSet,
                });
              } else {
                cb(null, {
                  errorCode: util.statusCode.ONE,
                  errorMessage: util.statusMessage.UPDATED_ERROR,
                });
              }
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.TWO,
              errorMessage: util.statusMessage.CODE_EXISTS,
            });
            return;
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslUpdateSessions);
    }
  );
};

// Get Sessions at Fields Page
let tslGetSessions = function (data, callback) {
  async.auto(
    {
      tslGetSessions: (cb) => {
        let dataToSet = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
        };
        const { error } = tslLAccountIdLEventIdValidation(dataToSet);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        usersDAO.tslGetSessions(dataToSet, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.length) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
              data: dbData,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslGetSessions);
    }
  );
};

// Get Disocunt Codes BY ID at Fields Page
let tslGetSessionsById = function (data, callback) {
  async.auto(
    {
      tslGetSessionsById: (cb) => {
        let dataToValidate = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
        };
        const { error } = tslAccountIdEventIdValidation(dataToValidate);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        let dataToSet = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
          lSessionID: data.lSessionID,
        };
        usersDAO.tslGetSessionsById(dataToSet, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.length) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
              data: dbData[0],
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslGetSessionsById);
    }
  ); 
};

// Get Extra configuration for sessions at Fields Page
let tslGetExtraConfigurationForSessions = function (data, callback) {
  async.auto(
    {
      tslGetExtraConfigurationForSessions: (cb) => {
        let dataToValidate = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
        };
        const { error } = tslAccountIdEventIdValidation(dataToValidate);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        let dataToSet = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
        };
        usersDAO.tslGetExtraConfigurationForSessions(
          dataToSet,
          (err, dbData) => {
            if (err) {
              cb(null, {
                errorCode: util.statusCode.ONE,
                errorMessage: util.statusMessage.SERVER_BUSY,
              });
              return;
            }
            if (dbData.length) {
              cb(null, {
                errorCode: util.statusCode.ZERO,
                errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
                data: dbData,
              });
            } else {
              cb(null, {
                errorCode: util.statusCode.ONE,
                errorMessage: util.statusMessage.NO_RECORD_FOUND,
              });
            }
          }
        );
      },
    },
    (err, response) => {
      callback(response.tslGetExtraConfigurationForSessions);
    }
  );
};

// add Session Information
let tslAddExtraConfigurationForSessions = (data, callback) => {
  async.auto(
    {
      tslAddExtraConfigurationForSessions: (cb) => {
        let dataToValidate = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
        };
        const { error } = tslLAccountIdLEventIdValidation(dataToValidate);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        let dataToSet = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
          sCode: data.extraConfigurationData.sCode
            ? data.extraConfigurationData.sCode
            : "",
          nType: data.extraConfigurationData.nType
            ? data.extraConfigurationData.nType
            : "",
          nPosition: data.extraConfigurationData.nPosition
            ? data.extraConfigurationData.nPosition
            : "",
          lBeforeAfterItemID: data.extraConfigurationData.lBeforeAfterItemID
            ? data.extraConfigurationData.lBeforeAfterItemID
            : "",
          mLabel: data.extraConfigurationData.mLabel
            ? data.extraConfigurationData.mLabel
            : "",
          nSize: data.extraConfigurationData.nSize
            ? data.extraConfigurationData.nSize
            : "",
          nRequired: data.extraConfigurationData.nRequired
            ? data.extraConfigurationData.nRequired
            : "",
          nStatus: data.extraConfigurationData.nStatus
            ? data.extraConfigurationData.nStatus
            : "",
          sApplyToRegTypes: data.extraConfigurationData.sApplyToRegTypes
            ? data.extraConfigurationData.sApplyToRegTypes
            : "",
          dtCreatedOn: util.getCurrentDatetime(),
          dtUpdatedOn: util.getCurrentDatetime(),
        };

        // check sCode exits or not
        var sCodeCount = 0;
        usersDAO.tslCheckExtraConfigurationScodeExists(
          dataToSet,
          (err, dbData) => {
            if (dbData) {
              sCodeCount = dbData[0].sCodeCount;
            }

            if (sCodeCount < 1) {
              usersDAO.tslAddExtraConfigurationForSessions(
                dataToSet,
                (err, dbData) => {
                  if (err) {
                    cb(null, {
                      errorCode: util.statusCode.ONE,
                      errorMessage: util.statusMessage.SERVER_BUSY,
                    });
                    return;
                  }
                  if (dbData.insertId || dbData.affectedRows == 1) {
                    cb(null, {
                      errorCode: util.statusCode.ZERO,
                      errorMessage: util.statusMessage.ADDED_SUCC,
                      result: dataToSet,
                    });
                  } else {
                    cb(null, {
                      errorCode: util.statusCode.ONE,
                      errorMessage: util.statusMessage.SOMETHING_WENT_WRONG,
                      result: {},
                    });
                  }
                }
              );
            } else {
              cb(null, {
                errorCode: util.statusCode.TWO,
                errorMessage: util.statusMessage.CODE_EXISTS,
              });
              return;
            }
          }
        );
      },
    },
    (err, response) => {
      callback(response.tslAddExtraConfigurationForSessions);
    }
  );
};

// Get Disocunt Codes BY ID at Fields Page
let tslGetExtraConfigById = function (data, callback) {
  async.auto(
    {
      tslGetExtraConfigById: (cb) => {
        let dataToValidate = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
        };
        const { error } = tslAccountIdEventIdValidation(dataToValidate);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        let dataToSet = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
          lItemID: data.lItemID,
        };
        usersDAO.tslGetExtraConfigById(dataToSet, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.length) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
              data: dbData[0],
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslGetExtraConfigById);
    }
  );
};

// Update Registrant Information at Fields Design

let tslUpdateExtraConfigurationForSessions = function (data, callback) {
  async.auto(
    {
      tslUpdateExtraConfigurationForSessions: (cb) => {
        let dataToValidate = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
        };
        const { error } = tslAccountIdEventIdValidation(dataToValidate);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }

        let dataToSet = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
          lItemID: data.extraConfigurationData.lItemID
            ? data.extraConfigurationData.lItemID
            : "",
          sCode: data.extraConfigurationData.sCode
            ? data.extraConfigurationData.sCode
            : "",
          nType: data.extraConfigurationData.nType
            ? data.extraConfigurationData.nType
            : "",
          nPosition: data.extraConfigurationData.nPosition
            ? data.extraConfigurationData.nPosition
            : "",
          lBeforeAfterItemID: data.extraConfigurationData.lBeforeAfterItemID
            ? data.extraConfigurationData.lBeforeAfterItemID
            : "",
          mLabel: data.extraConfigurationData.mLabel
            ? data.extraConfigurationData.mLabel
            : "",
          nSize: data.extraConfigurationData.nSize
            ? data.extraConfigurationData.nSize
            : "",
          nRequired: data.extraConfigurationData.nRequired
            ? data.extraConfigurationData.nRequired
            : "",
          nStatus: data.extraConfigurationData.nStatus
            ? data.extraConfigurationData.nStatus
            : "",
          sApplyToRegTypes: data.extraConfigurationData.sApplyToRegTypes
            ? data.extraConfigurationData.sApplyToRegTypes
            : "",
          dtUpdatedOn: util.getCurrentDatetime(),
        };

        // check sCode exits or not
        var sCodeCount = 0;
        usersDAO.tslCheckExtraConfigurationScodeExists(
          dataToSet,
          (err, dbData) => {
            if (dbData) {
              sCodeCount = dbData[0].sCodeCount;
            }

            if (sCodeCount < 1) {
              usersDAO.tslUpdateExtraConfigurationForSessions(
                dataToSet,
                (err, dbData) => {
                  if (err) {
                    cb(null, {
                      errorCode: util.statusCode.ONE,
                      errorMessage: util.statusMessage.SERVER_BUSY,
                    });
                    return;
                  }
                  if (dbData.affectedRows > 0) {
                    cb(null, {
                      errorCode: util.statusCode.ZERO,
                      errorMessage: util.statusMessage.UPDATED_SUCC,
                      result: dataToSet,
                    });
                  } else {
                    cb(null, {
                      errorCode: util.statusCode.ONE,
                      errorMessage: util.statusMessage.UPDATED_ERROR,
                    });
                  }
                }
              );
            } else {
              cb(null, {
                errorCode: util.statusCode.TWO,
                errorMessage: util.statusMessage.CODE_EXISTS,
              });
              return;
            }
          }
        );
      },
    },
    (err, response) => {
      callback(response.tslUpdateExtraConfigurationForSessions);
    }
  );
};

// Update Registrant Information at Fields Design

let tslUpdateMainContactFields = function (data, callback) {
  async.auto(
    {
      tslUpdateMainContactFields: (cb) => {
        let dataToSet = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
          fieldValue: data.mainFieldContactData,
        };
        const { error } = tslGetguestsRegistrantsFieldsValidation(dataToSet);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        usersDAO.tslUpdateMainContactFields(dataToSet, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData > 0) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.UPDATED_SUCC,
              result: dataToSet,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.UPDATED_ERROR,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslUpdateMainContactFields);
    }
  );
};

// Get Main contact Fields Page Design Group Reg
let tslGetMainContactFields = function (data, callback) {
  async.auto(
    {
      tslGetMainContactFields: (cb) => {
        let dataToSet = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
          sCode: data.sCode,
        };
        const { error } = tslGetQuestionsFieldNameValidation(dataToSet);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        usersDAO.tslGetMainContactFields(dataToSet, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.length) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
              data: dbData,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslGetMainContactFields);
    }
  );
};

// Get Main contact Fields Page Design Group Reg
let tslGetRegistrantFields = function (data, callback) {
  async.auto(
    {
      tslGetRegistrantFields: (cb) => {
        let dataToSet = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
        };
        const { error } = tslAccountIdEventIdValidation(dataToSet);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        usersDAO.tslGetRegistrantFields(dataToSet, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.length) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
              data: dbData,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslGetRegistrantFields);
    }
  );
};

// Update Registrant Information at Fields Design

let tslUpdateRegistrantFields = function (data, callback) {
  async.auto(
    {
      tslUpdateRegistrantFields: (cb) => {
        let dataToSet = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
          fieldValue: data.regFieldData,
        };
        const { error } = tslGetguestsRegistrantsFieldsValidation(dataToSet);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        usersDAO.tslUpdateRegistrantFields(dataToSet, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData > 0) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.UPDATED_SUCC,
              result: dataToSet,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.UPDATED_ERROR,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslUpdateRegistrantFields);
    }
  );
};

let tslGetPageDesignGrpReg = function (data, callback) {
  async.auto(
    {
      tslGetPageDesignGrpReg: (cb) => {
        const { error } = tslAccountIdEventIdValidation(data);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        usersDAO.tslGetPageDesignGrpReg(data, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.length) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
              data: dbData[0],
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
      },
    },
    (err, response) => {
      
      callback(response.tslGetPageDesignGrpReg);
    }
  );
};

let tslUpdatePageDesignGrpReg = function (data, callback) {
  async.auto(
    {
      tslUpdatePageDesignGrpReg: (cb) => {
        let dataToSet = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
        };
        const { error } = tslAccountIdEventIdValidation(dataToSet);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        usersDAO.tslUpdatePageDesignGrpReg(data, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.affectedRows > 0) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.UPDATED_SUCC,
              result: data,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.UPDATED_ERROR,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslUpdatePageDesignGrpReg);
    }
  );
};

let tslGetPageDesignExhibitor = function (data, callback) {
  async.auto(
    {
      tslGetPageDesignExhibitor: (cb) => {
        const { error } = tslAccountIdEventIdValidation(data);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        usersDAO.tslGetPageDesignExhibitor(data, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.length) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
              data: dbData[0],
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslGetPageDesignExhibitor);
    }
  );
};

let tslUpdatePageDesignExhibitor = function (data, callback) {
  async.auto(
    {
      tslUpdatePageDesignExhibitor: (cb) => {
        let dataToSet = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
        };
        const { error } = tslAccountIdEventIdValidation(dataToSet);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        usersDAO.tslUpdatePageDesignExhibitor(data, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.affectedRows > 0) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.UPDATED_SUCC,
              result: data,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.UPDATED_ERROR,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslUpdatePageDesignExhibitor);
    }
  );
};

let tslGetExhibitorList = function (data, callback) {
  async.auto(
    {
      tslGetExhibitorList: (cb) => {
        const { error } = tslAccountIdEventIdValidation(data);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;       
        }
        let total_records = 0;
        usersDAO.tslGetExhibitorListCount(data, (err1, dbData1) => {
          if (err1) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData1) {
            total_records = dbData1[0].total_records;
          }

          usersDAO.tslGetExhibitorList(data, (err, dbData) => {
            if (err) {
              cb(null, {
                errorCode: util.statusCode.ONE,
                errorMessage: util.statusMessage.SERVER_BUSY,
              });
              return;
            }
            if (dbData.length) {
              cb(null, {
                errorCode: util.statusCode.ZERO,
                errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
                total_records: total_records,
                data: dbData,
              });
            } else {
              cb(null, {
                errorCode: util.statusCode.ONE,
                errorMessage: util.statusMessage.NO_RECORD_FOUND,
              });
            }
          });
        });
      },
    },
    (err, response) => {
      callback(response.tslGetExhibitorList);
    }
  );
};

// add Session Information
let tslAddExhibitorsInfo = (req, res, callback) => {
  let data = req.body;
  let imageFiles = req.files ? req.files : "";

  async.auto(
    {
      tslAddExhibitorsInfo: (cb) => {
        let dataToValidate = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
        };
        const { error } = tslLAccountIdLEventIdValidation(dataToValidate);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        let dataToSet = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
          nStatus: data.nStatus ? data.nStatus : "",
          nFreeStaffs: data.nFreeStaffs ? data.nFreeStaffs : "",
          dPricePerExtraStaff: data.dPricePerExtraStaff
            ? data.dPricePerExtraStaff
            : "",
          sPrefix: data.sPrefix ? data.sPrefix : "",
          sFirstName: data.sFirstName ? data.sFirstName : "",
          sMiddleName: data.sMiddleName ? data.sMiddleName : "",
          sLastName: data.sLastName ? data.sLastName : "",
          sSuffix: data.sSuffix ? data.sSuffix : "",
          sCredentials: data.sCredentials ? data.sCredentials : "",
          sTitle: data.sTitle ? data.sTitle : "",
          sCompany: data.sCompany ? data.sCompany : "",
          sAddress1: data.sAddress1 ? data.sAddress1 : "",
          sAddress2: data.sAddress2 ? data.sAddress2 : "",
          sAddress3: data.sAddress3 ? data.sAddress3 : "",
          sCity: data.sCity ? data.sCity : "",
          sState: data.sState ? data.sState : "",
          sZip: data.sZip ? data.sZip : "",
          sCountry: data.sCountry ? data.sCountry : "",
          sPhone: data.sPhone ? data.sPhone : "",
          sCell: data.sCell ? data.sCell : "",
          sFax: data.sFax ? data.sFax : "",
          sEmail: data.sEmail ? data.sEmail : "",
          sBooth: data.sBooth ? data.sBooth : "",
          sBoothSize: data.sBoothSize ? data.sBoothSize : "",
          sDocument: data.sDocument ? data.sDocument : "",
          sWebSite: data.sWebSite ? data.sWebSite : "",
          mAbout: data.mAbout ? data.mAbout : "",
          mNotes: data.mNotes ? data.mNotes : "",
          sPicture:
            imageFiles && imageFiles.sPicture ? imageFiles.sPicture.name : "",
          sProfilePic:
            imageFiles && imageFiles.sProfilePic
              ? imageFiles.sProfilePic.name
              : "",
          nMaxStaff: data.nMaxStaff ? data.nMaxStaff : "",
          nMaxBoothStaff: data.nMaxBoothStaff ? data.nMaxBoothStaff : "",
          nSortOrder: data.nSortOrder ? data.nSortOrder : "",
          nExhType: data.nExhType ? data.nExhType : "",
          nExhValueType: data.nExhValueType ? data.nExhValueType : "",
          nExhTemplate: data.nExhTemplate ? data.nExhTemplate : "",
          nShowInBoothStaffList: data.nShowInBoothStaffList
            ? data.nShowInBoothStaffList
            : "",
          nEnableGoldenTkt: data.nEnableGoldenTkt ? data.nEnableGoldenTkt : "",
          nSponsorType: data.nSponsorType ? data.nSponsorType : "",
          sCategories: data.sCategories ? data.sCategories : "",
          sVideoLinks: data.sVideoLinks ? data.sVideoLinks : "",
          dtCreatedOn: util.getCurrentDatetime(),
          dtUpdatedOn: util.getCurrentDatetime(),
        };

        usersDAO.tslAddExhibitorsInfo(dataToSet, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.insertId || dbData.affectedRows == 1) {
            if (imageFiles) {
              if (imageFiles.sPicture) {
                const sampleFile = imageFiles.sPicture;
                const filePath =
                  "./public/images/exhibitors/" + sampleFile.name;
                sampleFile.mv(filePath, (err) => {
                  if (err)
                    cb(null, {
                      errorCode: util.statusCode.ONE,
                      errorMessage: util.statusMessage.SOMETHING_WENT_WRONG,
                      result: {},
                    });
                });
              }
              if (imageFiles.sProfilePic) {
                const sampleFile = imageFiles.sProfilePic;
                const filePath =
                  "./public/images/exhibitors/" + sampleFile.name;
                sampleFile.mv(filePath, (err) => {
                  if (err)
                    cb(null, {
                      errorCode: util.statusCode.ONE,
                      errorMessage: util.statusMessage.SOMETHING_WENT_WRONG,
                      result: {},
                    });
                });
              }
            }

            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.ADDED_SUCC,
              result: dataToSet,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SOMETHING_WENT_WRONG,
              result: {},
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslAddExhibitorsInfo);
    }
  );
};

// Update Registrant Information at Fields Design

let tslUpdateExhibitorInfo = function (req, res, callback) {
  let data = req.body;
  let imageFiles = req.files ? req.files : "";
  async.auto(
    {
      tslUpdateExhibitorInfo: (cb) => {
        let dataToSet = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
          lExhibitorID: data.lExhibitorID,
        };
        const { error } = tslExhibitorInfoValidation(dataToSet);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }

        let dataToUpdate = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
          lExhibitorID: data.lExhibitorID,
          nStatus: data.nStatus ? data.nStatus : "",
          nFreeStaffs: data.nFreeStaffs ? data.nFreeStaffs : "",
          dPricePerExtraStaff: data.dPricePerExtraStaff
            ? data.dPricePerExtraStaff
            : "",
          sPrefix: data.sPrefix ? data.sPrefix : "",
          sFirstName: data.sFirstName ? data.sFirstName : "",
          sMiddleName: data.sMiddleName ? data.sMiddleName : "",
          sLastName: data.sLastName ? data.sLastName : "",
          sSuffix: data.sSuffix ? data.sSuffix : "",
          sCredentials: data.sCredentials ? data.sCredentials : "",
          sTitle: data.sTitle ? data.sTitle : "",
          sCompany: data.sCompany ? data.sCompany : "",
          sAddress1: data.sAddress1 ? data.sAddress1 : "",
          sAddress2: data.sAddress2 ? data.sAddress2 : "",
          sAddress3: data.sAddress3 ? data.sAddress3 : "",
          sCity: data.sCity ? data.sCity : "",
          sState: data.sState ? data.sState : "",
          sZip: data.sZip ? data.sZip : "",
          sCountry: data.sCountry ? data.sCountry : "",
          sPhone: data.sPhone ? data.sPhone : "",
          sCell: data.sCell ? data.sCell : "",
          sFax: data.sFax ? data.sFax : "",
          sEmail: data.sEmail ? data.sEmail : "",
          sBooth: data.sBooth ? data.sBooth : "",
          sBoothSize: data.sBoothSize ? data.sBoothSize : "",
          sDocument: data.sDocument ? data.sDocument : "",
          sWebSite: data.sWebSite ? data.sWebSite : "",
          mAbout: data.mAbout ? data.mAbout : "",
          mNotes: data.mNotes ? data.mNotes : "",
          nMaxStaff: data.nMaxStaff ? data.nMaxStaff : "",
          nMaxBoothStaff: data.nMaxBoothStaff ? data.nMaxBoothStaff : "",
          nSortOrder: data.nSortOrder ? data.nSortOrder : "",
          nExhType: data.nExhType ? data.nExhType : "",
          nExhValueType: data.nExhValueType ? data.nExhValueType : "",
          nExhTemplate: data.nExhTemplate ? data.nExhTemplate : "",
          nShowInBoothStaffList: data.nShowInBoothStaffList
            ? data.nShowInBoothStaffList
            : "",
          nEnableGoldenTkt: data.nEnableGoldenTkt ? data.nEnableGoldenTkt : "",
          nSponsorType: data.nSponsorType ? data.nSponsorType : "",
          sCategories: data.sCategories ? data.sCategories : "",
          sVideoLinks: data.sVideoLinks ? data.sVideoLinks : "",
          dtUpdatedOn: util.getCurrentDatetime(),
        };

        if (imageFiles && imageFiles.sPicture) {
          dataToUpdate.sPicture = imageFiles.sPicture.name;
        }
        if (imageFiles && imageFiles.sProfilePic) {
          dataToUpdate.sProfilePic = imageFiles.sProfilePic.name;
        }

        usersDAO.tslUpdateExhibitorInfo(dataToUpdate, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }

          if (dbData.affectedRows > 0) {
            if (imageFiles) {
              if (imageFiles.sPicture) {
                const sampleFile = imageFiles.sPicture;
                const filePath =
                  "./public/images/exhibitors/" + sampleFile.name;
                sampleFile.mv(filePath, (err) => {
                  if (err)
                    cb(null, {
                      errorCode: util.statusCode.ONE,
                      errorMessage: util.statusMessage.SOMETHING_WENT_WRONG,
                      result: {},
                    });
                });
              }
              if (imageFiles.sProfilePic) {
                const sampleFile2 = imageFiles.sProfilePic;
                const filePath2 =
                  "./public/images/exhibitors/" + sampleFile2.name;
                sampleFile2.mv(filePath2, (err) => {
                  if (err)
                    cb(null, {
                      errorCode: util.statusCode.ONE,
                      errorMessage: util.statusMessage.SOMETHING_WENT_WRONG,
                      result: {},
                    });
                });
              }
            }
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.UPDATED_SUCC,
              result: dataToSet,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.UPDATED_ERROR,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslUpdateExhibitorInfo);
    }
  );
};

let tslGetExhibitorListById = function (data, callback) {
  async.auto(
    {
      tslGetExhibitorListById: (cb) => {
        usersDAO.tslGetExhibitorListById(data, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.length) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.EVENT_DETAIL_FOUND,
              data: dbData[0],
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslGetExhibitorListById);
    }
  );
};

 // add Session Information
let tslAddExhibitorsImport = (data, callback) => {
  // console.log('data',data)
  async.auto(
    {
      tslAddExhibitorsImport: (cb) => {
        let dataToValidate = {
          lAccountID: data.postImportData.lAccountID,
          lEventID: data.postImportData.lEventID,
        };
        const { error } = tslLAccountIdLEventIdValidation(dataToValidate);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        let dataToSet = {
          lAccountID: data.postImportData.lAccountID,
          lEventID: data.postImportData.lEventID,
          valuesArray: data.postImportData.valueArray
            ? data.postImportData.valueArray
            : [],
          columnArray: data.postImportData.columnArray
            ? data.postImportData.columnArray
            : [],
          dtCreatedOn: util.getCurrentDatetime(),
          dtUpdatedOn: util.getCurrentDatetime(),
        };

        usersDAO.tslAddExhibitorsImport(dataToSet, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.ADDED_SUCC,
              result: dataToSet,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SOMETHING_WENT_WRONG,
              result: {},
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslAddExhibitorsImport);
    }
  );
};

// add Exhibitor Information
let tslAddExhibitorsBoothMembers = (data, callback) => {
  async.auto(
    {
      tslAddExhibitorsBoothMembers: (cb) => {
        let dataToValidate = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
        };
        const { error } = tslLAccountIdLEventIdValidation(dataToValidate);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        let dataToSet = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
          lExhibitorID: data.lExhibitorID,
          sFirstName: data.sFirstName ? data.sFirstName : "",
          sLastName: data.sLastName ? data.sLastName : "",
          sTitle: data.sTitle ? data.sTitle : "",
          nStatus: data.nStatus ? data.nStatus : "",
          sPhone: data.sPhone ? data.sPhone : "",
          sEmail: data.sEmail ? data.sEmail : "",
          dtCreatedOn: util.getCurrentDatetime(),
          dtUpdatedOn: util.getCurrentDatetime(),
        };

        usersDAO.tslAddExhibitorsBoothMembers(dataToSet, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.ADDED_SUCC,
              result: dataToSet,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SOMETHING_WENT_WRONG,
              result: {},
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslAddExhibitorsBoothMembers);
    }
  );
};

// add Exhibitor Information
let tslUpdateExhibitorsBoothMembers = (data, callback) => {
  async.auto(
    {
      tslUpdateExhibitorsBoothMembers: (cb) => {
        let dataToValidate = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
        };
        const { error } = tslLAccountIdLEventIdValidation(dataToValidate);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        let dataToSet = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
          lExhibitorID: data.lExhibitorID,
          lMemberID: data.lMemberID,
          sFirstName: data.sFirstName ? data.sFirstName : "",
          sLastName: data.sLastName ? data.sLastName : "",
          sTitle: data.sTitle ? data.sTitle : "",
          nStatus: data.nStatus ? data.nStatus : "",
          sPhone: data.sPhone ? data.sPhone : "",
          sEmail: data.sEmail ? data.sEmail : "",
          dtCreatedOn: util.getCurrentDatetime(),
          dtUpdatedOn: util.getCurrentDatetime(),
        };

        usersDAO.tslUpdateExhibitorsBoothMembers(dataToSet, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.ADDED_SUCC,
              result: dataToSet,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SOMETHING_WENT_WRONG,
              result: {},
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslUpdateExhibitorsBoothMembers);
    }
  );
};

let tslGetExhibitorBoothMembers = function (data, callback) {
  async.auto(
    {
      tslGetExhibitorBoothMembers: (cb) => {
        let total_records = 0;
        usersDAO.tslGetExhibitorBoothMembersCount(data, (err1, dbData1) => {
          if (err1) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData1) {
            total_records = dbData1[0].total_records;
          }

          usersDAO.tslGetExhibitorBoothMembers(data, (err, dbData) => {
            if (err) {
              cb(null, {
                errorCode: util.statusCode.ONE,
                errorMessage: util.statusMessage.SERVER_BUSY,
              });
              return;
            }
            if (dbData.length) {
              cb(null, {
                errorCode: util.statusCode.ZERO,
                total_records: total_records,
                errorMessage: util.statusMessage.EVENT_DETAIL_FOUND,
                data: dbData,
              });
            } else {
              cb(null, {
                errorCode: util.statusCode.ONE,
                errorMessage: util.statusMessage.NO_RECORD_FOUND,
              });
            }
          });
        });
      },
    },
    (err, response) => {
      callback(response.tslGetExhibitorBoothMembers);
    }
  );
};

let tslGetExhibitorBoothMembersByID = function (data, callback) {
  async.auto(
    {
      tslGetExhibitorBoothMembersByID: (cb) => {
        usersDAO.tslGetExhibitorBoothMembersByID(data, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.length) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.EVENT_DETAIL_FOUND,
              data: dbData[0],
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslGetExhibitorBoothMembersByID);
    }
  );
};

let tslGetEmailSetup = function (data, callback) {
  async.auto(
    {
      tslGetEmailSetup: (cb) => {
        const { error } = tslAccountIdEventIdValidation(data);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }

        usersDAO.tslGetEmailSetup(data, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.length) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
              data: dbData[0],
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslGetEmailSetup);
    }
  );
};

// Update Registrant Information at Fields Design

let tslUpdateEmailSetup = function (data, callback) {
  async.auto(
    {
      tslUpdateEmailSetup: (cb) => {
        let dataToValidate = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
        };
        const { error } = tslAccountIdEventIdValidation(dataToValidate);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        let dataToSet = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
          mConfirmationPageText: data.mConfirmationPageText,
          mConfirmationEmailText: data.mConfirmationEmailText,
          mConfirmationEmailTextGrp: data.mConfirmationEmailTextGrp,
          mCancellationPageText: data.mCancellationPageText
            ? data.mCancellationPageText
            : "",
          mCancellationEmailText: data.mCancellationEmailText
            ? data.mCancellationEmailText
            : "",
          mInviteEmailText: data.mInviteEmailText ? data.mInviteEmailText : "",
          mConfirmationPageTextExh: data.mConfirmationPageTextExh
            ? data.mConfirmationPageTextExh
            : "",
          mConfirmationEmailTextExh: data.mConfirmationEmailTextExh
            ? data.mConfirmationEmailTextExh
            : "",
          mCancellationPageTextExh: data.mCancellationPageTextExh
            ? data.mCancellationPageTextExh
            : "",
          mCancellationEmailTextExh: data.mCancellationEmailTextExh
            ? data.mCancellationEmailTextExh
            : "",
        };
        usersDAO.tslUpdateEmailSetup(dataToSet, (err, dbData2) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData2.affectedRows > 0) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.UPDATED_SUCC,
              result: dataToSet,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.UPDATED_ERROR,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslUpdateEmailSetup);
    }
  );
};

let tslGetRegistrantsList = function (data, callback) {
  async.auto(
    {
      tslGetRegistrantsList: (cb) => {
        const { error } = tslAccountIdEventIdValidation(data);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }

        let total_records = 0;
        usersDAO.tslGetCountRegistrantsList(data, (err1, dbData1) => {
          if (err1) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData1) {
            total_records = dbData1[0].registrants_count;
          }

          usersDAO.tslGetRegistrantsList(data, (err, dbData) => {
            if (err) {
              cb(null, {
                errorCode: util.statusCode.ONE,
                errorMessage: util.statusMessage.SERVER_BUSY,
              });
              return;
            }
            if (dbData.length) {
              cb(null, {
                errorCode: util.statusCode.ZERO,
                errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
                total_records: total_records,
                data: dbData,
              });
            } else {
              cb(null, {
                errorCode: util.statusCode.ONE,
                errorMessage: util.statusMessage.NO_RECORD_FOUND,
              });
            }
          });
        });
      },
    },
    (err, response) => {
      callback(response.tslGetRegistrantsList);
    }
  );
};

let tslGetAdditionalRegistrantList = function (data, callback) {
  async.auto(
    {
      tslGetAdditionalRegistrantList: (cb) => {
        const { error } = tslAccountIdEventIdValidation(data);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }

        let total_records = 0;
        usersDAO.tslGetCountRegistrantsList(data, (err1, dbData1) => {
          if (err1) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData1) {
            total_records = dbData1[0].registrants_count;
          }

          usersDAO.tslGetAdditionalRegistrantList(data, (err, dbData) => {
            if (err) {
              cb(null, {
                errorCode: util.statusCode.ONE,
                errorMessage: util.statusMessage.SERVER_BUSY,
              });
              return;
            }
            if (dbData.length) {
              cb(null, {
                errorCode: util.statusCode.ZERO,
                errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
                total_records: total_records,
                data: dbData,
              });
            } else {
              cb(null, {
                errorCode: util.statusCode.ONE,
                errorMessage: util.statusMessage.NO_RECORD_FOUND,
              });
            }
          });
        });
      },
    },
    (err, response) => {
      callback(response.tslGetAdditionalRegistrantList);
    }
  );
};

let tslAddRegistrants = (data, callback) => {
  async.auto(
    {
      tslAddRegistrants: (cb) => {
        let dataToValidate = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
        };
        const { error } = tslAccountIdEventIdValidation(dataToValidate);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }

        usersDAO.tslAddRegistrants(data, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.insertId || dbData.affectedRows == 1) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.ADDED_SUCC,
              result: dbData,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SOMETHING_WENT_WRONG,
              result: {},
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslAddRegistrants);
    }
  );
};

let tslGetQuestionsRegistrantsList = function (data, callback) {
  async.auto(
    {
      tslGetQuestionsRegistrantsList: (cb) => {
        const { error } = tslAccountIdEventIdValidation(data);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }

        usersDAO.tslGetQuestionsRegistrantsList(data, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.length) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
              data: dbData,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslGetQuestionsRegistrantsList);
    }
  );
};

let tslGetGuestAdditionalRegistrants = function (data, callback) {
  async.auto(
    {
      tslGetGuestAdditionalRegistrants: (cb) => {
        const { error } = tslAccountIdEventIdRegIDValidation(data);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }

        // let total_records = 0;
        // usersDAO.tslGetCountRegistrantsList(data, (err1, dbData1) => {
        //   if (err1) {
        //     cb(null, {
        //       errorCode: util.statusCode.ONE,
        //       errorMessage: util.statusMessage.SERVER_BUSY,
        //     });
        //     return;
        //   }
        //   if (dbData1) {
        //     total_records = dbData1[0].registrants_count;
        //   }

        usersDAO.tslGetGuestAdditionalRegistrants(data, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.length) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
              // total_records: total_records,
              data: dbData,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
        // });
      },
    },
    (err, response) => {
      callback(response.tslGetGuestAdditionalRegistrants);
    }
  );
};

let tslAddGuestAdditionalInformation = (data, callback) => {
  async.auto(
    {
      tslAddGuestAdditionalInformation: (cb) => {
        let dataToValidate = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
        };
        const { error } = tslAccountIdEventIdValidation(dataToValidate);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }

        usersDAO.tslAddGuestAdditionalInformation(data, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.insertId || dbData.affectedRows == 1) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.ADDED_SUCC,
              result: dbData,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SOMETHING_WENT_WRONG,
              result: {},
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslAddGuestAdditionalInformation);
    }
  );
};

// Update Guest and Additional Information at Reg Info Page

let tslUpdateGuestsAdditionalInformation = function (data, callback) {
  async.auto(
    {
      tslUpdateGuestsAdditionalInformation: (cb) => {
        let dataToValidate = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
        };
        const { error } = tslAccountIdEventIdValidation(dataToValidate);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        usersDAO.tslUpdateGuestsAdditionalInformation(data, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.affectedRows > 0) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.UPDATED_SUCC,
              result: data,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.UPDATED_ERROR,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslUpdateGuestsAdditionalInformation);
    }
  );
};

let tslGetGuestAddditionalInformationById = function (data, callback) {
  async.auto(
    {
      tslGetGuestAddditionalInformationById: (cb) => {
        usersDAO.tslGetGuestAddditionalInformationById(data, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.length) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
              data: dbData[0],
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslGetGuestAddditionalInformationById);
    }
  );
};

let tslGetAnswersRegistrant = function (data, callback) {
  async.auto(
    {
      tslGetAnswersRegistrant: (cb) => {
        const { error } = tslAccountIdEventIdRegIDValidation(data);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }

        usersDAO.tslGetAnswersRegistrant(data, (err, dbData) => {
          // console.log('dbData',dbData)
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
              data: dbData,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
        // });
      },
    },
    (err, response) => {
      callback(response.tslGetAnswersRegistrant);
    }
  );
};

let tslGetRegistrantSessions = function (data, callback) {
  // console.log('data',data)
  async.auto(
    {
      tslGetRegistrantSessions: (cb) => {
        const { error } = tslAccountIdEventIdRegIDValidation(data);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }

        usersDAO.tslGetRegistrantSessions(data, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.length) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
              data: dbData,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
        // });
      },
    },
    (err, response) => {
      callback(response.tslGetRegistrantSessions);
    }
  );
};

let tslAddRegistrantSessions = (data, callback) => {
  async.auto(
    {
      tslAddRegistrantSessions: (cb) => {
        let dataToValidate = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
        };
        const { error } = tslAccountIdEventIdValidation(dataToValidate);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }

        usersDAO.tslAddRegistrantSessions(data, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.insertId || dbData.affectedRows == 1) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.ADDED_SUCC,
              result: dbData,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SOMETHING_WENT_WRONG,
              result: {},
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslAddRegistrantSessions);
    }
  );
};

let tslGetSessionsConfig = function (data, callback) {
  async.auto(
    {
      tslGetSessionsConfig: (cb) => {
        const { error } = tslAccountIdEventIdValidation(data);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }

        usersDAO.tslGetSessionsConfig(data, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.length) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
              data: dbData,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
        // });
      },
    },
    (err, response) => {
      callback(response.tslGetSessionsConfig);
    }
  );
};

let tslGetSessionsConfigById = function (data, callback) {
  async.auto(
    {
      tslGetSessionsConfigById: (cb) => {
        usersDAO.tslGetSessionsConfigById(data, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.length) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
              data: dbData[0],
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslGetSessionsConfigById);
    }
  );
};

// Update Sessions Config at Reg Info Page

let tslUpdateSessionsConfig = function (data, callback) {
  async.auto(
    {
      tslUpdateSessionsConfig: (cb) => {
        let dataToValidate = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
        };
        const { error } = tslAccountIdEventIdValidation(dataToValidate);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        usersDAO.tslUpdateSessionsConfig(data, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.affectedRows > 0) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.UPDATED_SUCC,
              result: data,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.UPDATED_ERROR,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslUpdateSessionsConfig);
    }
  );
};

// Get Reg Payments at Reg Info
let tslGetRegPayments = function (data, callback) {
  async.auto(
    {
      tslGetRegPayments: (cb) => {
        let dataToSet = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
          lRegID: data.lRegID,
        };
        const { error } = tslAccountIdEventIdRegIDValidation(dataToSet);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        usersDAO.tslGetRegPayments(dataToSet, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.length) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
              data: dbData,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslGetRegPayments);
    }
  );
};

let tslAddRegPayments = (data, callback) => {
  async.auto(
    {
      tslAddRegPayments: (cb) => {
        let dataToValidate = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
          lRegID: data.lRegID,
        };
        const { error } = tslAccountIdEventIdRegIDValidation(dataToValidate);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }

        usersDAO.tslAddRegPayments(data, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.insertId || dbData.affectedRows == 1) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.ADDED_SUCC,
              result: dbData,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SOMETHING_WENT_WRONG,
              result: {},
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslAddRegPayments);
    }
  );
};

let tslUpdateRegPayments = (data, callback) => {
  async.auto(
    {
      tslUpdateRegPayments: (cb) => {
        let dataToValidate = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
          lRegID: data.lRegID,
        };
        const { error } = tslAccountIdEventIdRegIDValidation(dataToValidate);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }

        usersDAO.tslUpdateRegPayments(data, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.insertId || dbData.affectedRows == 1) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.ADDED_SUCC,
              result: dbData,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SOMETHING_WENT_WRONG,
              result: {},
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslUpdateRegPayments);
    }
  );
};

let tslGetRegPaymentsByID = function (data, callback) {
  async.auto(
    {
      tslGetRegPaymentsByID: (cb) => {
        usersDAO.tslGetRegPaymentsByID(data, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.length) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
              data: dbData[0],
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslGetRegPaymentsByID);
    }
  );
};

let tslGetRegAmount = function (data, callback) {
  async.auto(
    {
      tslGetRegAmount: (cb) => {
        usersDAO.tslGetRegAmount(data, (err, dbData) => {
          
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          
          if (dbData) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
              data: dbData,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslGetRegAmount);
    }
  );
};

let tslUpdateRegAmount = (data, callback) => {
  async.auto(
    {
      tslUpdateRegAmount: (cb) => {
        let dataToValidate = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
          lRegID: data.lRegID,
        };
        const { error } = tslAccountIdEventIdRegIDValidation(dataToValidate);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }

        usersDAO.tslUpdateRegAmount(data, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.insertId || dbData.affectedRows == 1) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.ADDED_SUCC,
              result: dbData,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SOMETHING_WENT_WRONG,
              result: {},
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslUpdateRegAmount);
    }
  );
};

let tslCreateStripeIntent =  (data, callback) => {
  async.auto(
    {
      tslCreateStripeIntent: (cb) => {
        let dataToValidate = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
          lRegID: data.lRegID,
        };
        const { error } = tslAccountIdEventIdRegIDValidation(dataToValidate);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }

        usersDAO.tslCreateStripeIntent(data, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData && dbData.client_secret) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.ADDED_SUCC,
              result: dbData.client_secret,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SOMETHING_WENT_WRONG,
              result: {},
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslCreateStripeIntent);
    }
  );
};

let tslGetRegistrants = function (data, callback) {
  async.auto(
    {
      tslGetRegistrants: (cb) => {
        usersDAO.tslGetRegistrants(data, (err, dbData) => {
          
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          
          if (dbData) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
              data: dbData[0],
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslGetRegistrants);
    }
  );
};

// Update Registrant Information at Fields Design

let tslUpdateRegistrants = function (data, callback) {
  async.auto(
    {
      tslUpdateRegistrants: (cb) => {
        let dataToValidate = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
          lRegID: data.lRegID,
        };
        const { error } = tslAccountIdEventIdRegIDValidation(dataToValidate);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }

        usersDAO.tslUpdateRegistrants(data, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.insertId || dbData.affectedRows == 1) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.ADDED_SUCC,
              result: dbData,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SOMETHING_WENT_WRONG,
              result: {},
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslUpdateRegistrants);
    }
  );
};

let tslGetRegTypeAmount = function (data, callback) {
  async.auto(
    {
      tslGetRegTypeAmount: (cb) => {
        usersDAO.tslGetRegTypeAmount(data, (err, dbData) => {
          
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          
          if (dbData) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
              data: dbData[0],
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslGetRegTypeAmount);
    }
  );
};

let tslGetSessionPrice = function (data, callback) {
  async.auto(
    {
      tslGetSessionPrice: (cb) => {
        usersDAO.tslGetSessionPrice(data, (err, dbData) => {
          
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          
          if (dbData) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
              data: dbData[0],
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslGetSessionPrice);
    }
  );
};


// delete User from Account list
let tslDeleteRegistrants = function (data, callback) {
  async.auto(
    {
      tslDeleteRegistrants: (cb) => {
        usersDAO.tslDeleteRegistrants(data, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.affectedRows > 1) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.DELETED_SUCC,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.DELETED_ERROR,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslDeleteRegistrants);
    }
  );
};

// add Session Information
let tslAddRegistrantsImport = (data, callback) => {
  // console.log('data',data)
  async.auto(
    {
      tslAddRegistrantsImport: (cb) => {
        let dataToValidate = {
          lAccountID: data.postImportData.lAccountID,
          lEventID: data.postImportData.lEventID,
        };
        const { error } = tslLAccountIdLEventIdValidation(dataToValidate);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        let dataToSet = {
          lAccountID: data.postImportData.lAccountID,
          lEventID: data.postImportData.lEventID,
          valuesArray: data.postImportData.valueArray
            ? data.postImportData.valueArray
            : [],
          columnArray: data.postImportData.columnArray
            ? data.postImportData.columnArray
            : [],
          dtCreatedOn: util.getCurrentDatetime(),
          dtUpdatedOn: util.getCurrentDatetime(),
        };

        usersDAO.tslAddRegistrantsImport(dataToSet, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.ADDED_SUCC,
              result: dataToSet,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SOMETHING_WENT_WRONG,
              result: {},
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslAddRegistrantsImport);
    }
  );
};

let tslGetEventHeaderAndFooter = function (data, callback) {
  async.auto(
    {
      tslGetEventHeaderAndFooter: (cb) => {
        const { error } = tslAccountIdEventIdValidation(data);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        usersDAO.tslGetEventHeaderAndFooter(data, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.length) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
              data: dbData[0],
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
      },
    },
    (err, response) => {
      
      callback(response.tslGetEventHeaderAndFooter);
    }
  );
};

// Get RegTypes Page Design
let tslGetRegTypesTemplate1 = function (data, callback) {
  async.auto(
    {
      tslGetRegTypesTemplate1: (cb) => {
        const { error } = tslAccountIdEventIdCategoryIdValidation(data);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }
        let total_records = 0;
        usersDAO.tslCountGetRegTypesPageDesign(data, (err1, dbData1) => {
          if (err1) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData1) {
            total_records = dbData1[0].total_records;
          }

          usersDAO.tslGetRegTypesTemplate1(data, (err, dbData) => {
            if (err) {
              cb(null, {
                errorCode: util.statusCode.ONE,
                errorMessage: util.statusMessage.SERVER_BUSY,
              });
              return;
            }
            if (dbData.length) {
              cb(null, {
                errorCode: util.statusCode.ZERO,
                errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
                total_records: total_records,
                data: dbData,
              });
            } else {
              cb(null, {
                errorCode: util.statusCode.ONE,
                errorMessage: util.statusMessage.NO_RECORD_FOUND,
              });
            }
          });
        });
      },
    },
    (err, response) => {
      callback(response.tslGetRegTypesTemplate1);
    }
  );
};

// Get Additional Fields Visible
let tslGetAdditionalFieldsVisible = function (data, callback) {
  async.auto(
    {
      tslGetAdditionalFieldsVisible: (cb) => {
        let dataToSet = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID
        };
       
        usersDAO.tslGetAdditionalFieldsVisible(dataToSet, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.length) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
              data: dbData,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslGetAdditionalFieldsVisible);
    }
  );
};

// add Session Information
let tslAddFieldsDataDefault = (data, callback) => {
  // console.log('data',data)
  async.auto(
    {
      tslAddFieldsDataDefault: (cb) => {
        let dataToValidate = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
        };
        const { error } = tslLAccountIdLEventIdValidation(dataToValidate);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }

        usersDAO.tslAddFieldsDataDefault(data, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.ADDED_SUCC,
              result: dataToSet,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SOMETHING_WENT_WRONG,
              result: {},
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslAddFieldsDataDefault);
    }
  );
};

let tslGetSessionsTicketsDataTemplate1 = function (data, callback) {
  async.auto(
    {
      tslGetSessionsTicketsDataTemplate1: (cb) => {
        let dataToSet = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
          lRegTypeID: data.lRegTypeID
        };
       
        usersDAO.tslGetSessionsTicketsDataTemplate1(dataToSet, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.length) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
              data: dbData,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslGetSessionsTicketsDataTemplate1);
    }
  );
};

let tslInsertTemplate1RegistrantsData = (data, callback) => {
  async.auto(
    {
      tslInsertTemplate1RegistrantsData: (cb) => {
        let dataToValidate = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID
        };
        const { error } = tslAccountIdEventIdValidation(dataToValidate);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }

        usersDAO.tslInsertTemplate1RegistrantsData(data, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.insertId || dbData.affectedRows == 1) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.ADDED_SUCC,
              result: dbData,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SOMETHING_WENT_WRONG,
              result: {},
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslInsertTemplate1RegistrantsData);
    }
  );
};

let tslSendEmail = (data, callback) => {
  async.auto(
    {
      tslSendEmail: (cb) => {
        let dataToValidate = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID
        };
        const { error } = tslAccountIdEventIdValidation(dataToValidate);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }

        usersDAO.tslSendEmail(data, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.insertId || dbData.affectedRows == 1) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.ADDED_SUCC,
              result: dbData,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SOMETHING_WENT_WRONG,
              result: {},
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslSendEmail);
    }
  );
};


// Get Registrant Fields Visible
let tslRegistrantFieldsVisible = function (data, callback) {
  async.auto(
    {
      tslRegistrantFieldsVisible: (cb) => {
        let dataToSet = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID
        };
       
        usersDAO.tslRegistrantFieldsVisible(dataToSet, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.length) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
              data: dbData,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslRegistrantFieldsVisible);
    }
  );
};

let tslGetSessionsTicketsDataTemplate21 = function (data, callback) {
  async.auto(
    {
      tslGetSessionsTicketsDataTemplate21: (cb) => {
        let dataToSet = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
          lRegTypeID: data.lRegTypeID
        };
       
        usersDAO.tslGetSessionsTicketsDataTemplate21(dataToSet, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.length) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
              data: dbData,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslGetSessionsTicketsDataTemplate21);
    }
  );
};


let tslInsertTemplate21RegistrantsData = (data, callback) => {
  async.auto(
    {
      tslInsertTemplate21RegistrantsData: (cb) => {
        let dataToValidate = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID
        };
        const { error } = tslAccountIdEventIdValidation(dataToValidate);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }

        usersDAO.tslInsertTemplate21RegistrantsData(data, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.insertId || dbData.affectedRows == 1) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.ADDED_SUCC,
              result: dbData,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SOMETHING_WENT_WRONG,
              result: {},
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslInsertTemplate21RegistrantsData);
    }
  );
};

let tslGetRegistrantsInformationTemplate21 = function (data, callback) {
  async.auto(
    {
      tslGetRegistrantsInformationTemplate21: (cb) => {
        let dataToSet = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
          lRegID: data.lRegID
        };
       
        usersDAO.tslGetRegistrantsInformationTemplate21(dataToSet, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.length) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
              data: dbData,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslGetRegistrantsInformationTemplate21);
    }
  );
};

let tslGetRegistrantSessionsTemplate21 = function (data, callback) {
  async.auto(
    {
      tslGetRegistrantSessionsTemplate21: (cb) => {
        let dataToSet = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
          lRegID: data.lRegID
        };
       
        usersDAO.tslGetRegistrantSessionsTemplate21(dataToSet, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.length) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
              data: dbData,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslGetRegistrantSessionsTemplate21);
    }
  );
};


let tslGetRegistrantsByIDTemplate21 = function (data, callback) {
  async.auto(
    {
      tslGetRegistrantsByIDTemplate21: (cb) => {
        let dataToSet = {
          lAccountID: data.lAccountID,
          lEventID: data.lEventID,
          lRegID: data.lRegID
        };
       
        usersDAO.tslGetRegistrantsByIDTemplate21(dataToSet, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.length) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
              data: dbData[0],
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslGetRegistrantsByIDTemplate21);
    }
  );
};

let tslGetSUMRegistrantsInformationTemplate21 = function (data, callback) {
  async.auto(
    {
      tslGetSUMRegistrantsInformationTemplate21: (cb) => {
        usersDAO.tslGetSUMRegistrantsInformationTemplate21(data, (err, dbData) => {
          
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          
          if (dbData) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
              data: dbData,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslGetSUMRegistrantsInformationTemplate21);
    }
  );
};

let tslGetMembersList = function (data, callback) {
  async.auto(
    {
      tslGetMembersList: (cb) => {
        usersDAO.tslGetMembersList(data, (err, dbData) => {
          
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          
          if (dbData) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.RECORD_FOUND_SUCCESSFULLY,
              data: dbData,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.NO_RECORD_FOUND,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslGetMembersList);
    }
  );
};



let tslAddMembers = (data, callback) => {
  async.auto(
    { 
      tslAddMembers: (cb) => {
        let dataToValidate = {
          lAccountID: data.lAccountID
        };
        const { error } = tslAccountIdValidation(dataToValidate);
        if (error) {
          cb(null, {
            errorCode: util.statusCode.TWO,
            errorMessage: error.details[0].message,
          });
          return;
        }

        usersDAO.tslAddMembers(data, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.insertId || dbData.affectedRows == 1) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.ADDED_SUCC,
              result: dbData,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SOMETHING_WENT_WRONG,
              result: {},
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.tslAddMembers);
    }
  );
};



let tslUpdateMemberInfo = function (data, callback) {
  async.auto(
    {
      updateMemberInfo: (cb) => {
        usersDAO.tslupdateMemberDetails(data, (err, dbData) => {
          if (err) {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.SERVER_BUSY,
            });
            return;
          }
          if (dbData.affectedRows > 0) {
            cb(null, {
              errorCode: util.statusCode.ZERO,
              errorMessage: util.statusMessage.UPDATED_SUCC,
              result: dbData,
            });
          } else {
            cb(null, {
              errorCode: util.statusCode.ONE,
              errorMessage: util.statusMessage.UPDATED_ERROR,
            });
          }
        });
      },
    },
    (err, response) => {
      callback(response.updateMemberInfo);
    }
  );
};



module.exports = {
  tslAdminLogin,
  tslAdminRegister,
  tslUserList,
  tslClientLogin,
  tslUserListById,
  tslEditUser,
  tslDeleteUser,
  tslAddUsers,
  tslAddPaymentDetails,
  tslGetPaymentDetails,
  saveClientInformation,
  tslGetClientInformation,
  tslEventsList,
  tslAddEvent,
  tslGetEventById,
  tslUpdateEventInfo,
  tslUpdateEventPageDesign,
  tslGetPageDesign,
  tslInsertRegTypesPageDesign,
  tslGetRegTypesPageDesign,
  tslUpdateRegTypesPageDesign,
  tslInsertRegCategoriesPageDesign,
  tslGetRegCategoriesPageDesign,
  tslUpdateRegCategoriesPageDesign,
  tslGetRegSCodePageDesign,
  tslGetRegTypesByIdPageDesign,
  tslGetRegCategoriesByIdPageDesign,
  tslInsertRegistrantInformation,
  tslGetRegistrantInformation,
  tslGetQuestionsConfigSName,
  tslGetQuestionsFieldName,
  tslUpdateRegInfoFieldsPage,
  tslGetguestsRegistrantsFields,
  tslGetCustomQuestions,
  tslUpdateGuestRegistrantsFields,
  tslUpdateRegistrantFieldSetup,
  tslGetCustomQuestionsById,
  tslInsertCustomQuestions,
  tslupdateCustomQuestions,
  tslGetDiscountCodes,
  tslGetDiscountCodesById,
  tslInsertDiscountCodes,
  tslUpdateDiscountCodes,
  tslInsertSessions,
  tslUpdateSessions,
  tslGetSessions,
  tslGetSessionsById,
  tslGetExtraConfigurationForSessions,
  tslAddExtraConfigurationForSessions,
  tslGetExtraConfigById,
  tslUpdateExtraConfigurationForSessions,
  tslUpdateMainContactFields,
  tslGetMainContactFields,
  tslGetRegistrantFields,
  tslUpdateRegistrantFields,
  tslGetPageDesignGrpReg,
  tslUpdatePageDesignGrpReg,
  tslGetPageDesignExhibitor,
  tslUpdatePageDesignExhibitor,
  tslGetExhibitorList,
  tslAddExhibitorsInfo,
  tslUpdateExhibitorInfo,
  tslGetExhibitorListById,
  tslAddExhibitorsImport,
  tslAddExhibitorsBoothMembers,
  tslGetExhibitorBoothMembers,
  tslUpdateExhibitorsBoothMembers,
  tslGetExhibitorBoothMembersByID,
  tslGetEmailSetup,
  tslUpdateEmailSetup,
  tslGetRegistrantsList,
  tslAddRegistrants,
  tslGetQuestionsRegistrantsList,
  tslGetGuestAdditionalRegistrants,
  tslAddGuestAdditionalInformation,
  tslUpdateGuestsAdditionalInformation,
  tslGetGuestAddditionalInformationById,
  tslGetAnswersRegistrant,
  tslGetRegistrantSessions,
  tslAddRegistrantSessions,
  tslGetSessionsConfig,
  tslGetSessionsConfigById,
  tslUpdateSessionsConfig,
  tslGetRegPayments,
  tslAddRegPayments,
  tslUpdateRegPayments,
  tslGetRegPaymentsByID,
  tslGetRegAmount,
  tslUpdateRegAmount,
  tslCreateStripeIntent,
  tslGetRegistrants,
  tslUpdateRegistrants,
  tslGetRegTypeAmount,
  tslGetSessionPrice,
  tslDeleteRegistrants,
  tslAddRegistrantsImport,
  tslGetEventHeaderAndFooter,
  tslGetRegTypesTemplate1,
  tslGetAdditionalFieldsVisible,
  tslAddFieldsDataDefault,
  tslGetSessionsTicketsDataTemplate1,
  tslInsertTemplate1RegistrantsData,
  tslGetAdditionalRegistrantList,
  tslSendEmail,
  tslRegistrantFieldsVisible,
  tslGetSessionsTicketsDataTemplate21,
  tslInsertTemplate21RegistrantsData,
  tslGetRegistrantsInformationTemplate21,
  tslGetRegistrantSessionsTemplate21,
  tslGetRegistrantsByIDTemplate21,
  tslGetSUMRegistrantsInformationTemplate21,
  tslGetMembersList,
  tslAddMembers,
  tslUpdateMemberInfo
};
