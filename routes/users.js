var express = require("express");
var router = express.Router();
var usersService = require("../Services/users");
const verifyToken = require("../Middleware/verifyToken");
/* TSL Backend API */

/* POST Admin login */
router.post("/getTslAdminLogin", (req, res) => {
  usersService.tslAdminLogin(req.body, (data) => {
    //io.emit('onlineUsers', data);
    res.send(data);
  });
});

/* POST Admin Register */
router.post("/tslAdminRegister", (req, res) => {
  usersService.tslAdminRegister(req.body, (data) => {
    //io.emit('onlineUsers', data);
    res.send(data);
  });
});

/* User List */

router.get("/userList", verifyToken, function (req, res) {
  usersService.tslUserList(req.query, (data) => {
    res.send(data);
  });
});

/* User List By ID */

router.get("/tslUserListById", verifyToken, function (req, res) {
  usersService.tslUserListById(req.query, (data) => {
    res.send(data);
  });
});

/* Edit User List at Account page */

router.post("/tslEditUser", verifyToken, function (req, res) {
  usersService.tslEditUser(req.body, (data) => {
    res.send(data);
  });
});

/* POST to delete user from Account list. */
router.post("/tslDeleteUser", verifyToken, function (req, res) {
  usersService.tslDeleteUser(req.body, (data) => {
    res.send(data);
  });
});

/* POST to insert user data with account Id. */
router.post("/tslAddUsers", verifyToken, function (req, res) {
  usersService.tslAddUsers(req.body, (data) => {
    res.send(data);
  });
});

/* POST to insert payment details with account Id. */
router.post("/tslAddPaymentDetails", verifyToken, function (req, res) {
  usersService.tslAddPaymentDetails(req.body, (data) => {
    res.send(data);
  });
});

/* POST to insert payment details with account Id. */

router.get("/tslGetPaymentDetails", function (req, res) {
  usersService.tslGetPaymentDetails(req.query, (data) => {
    res.send(data);
  });
});

router.get("/tslGetClientInformation", verifyToken, function (req, res) {
  usersService.tslGetClientInformation(req.query, (data) => {
    res.send(data);
  });
});

// get Events List

router.get("/tslEventsList", verifyToken, function (req, res) {
  usersService.tslEventsList(req.query, (data) => {
    res.send(data);
  });
});

// Add Event Info
router.post("/tslAddEvent", verifyToken, function (req, res) {
  usersService.tslAddEvent(req.body, (data) => {
    res.send(data);
  });
});

router.get("/tslGetEventById", verifyToken, function (req, res) {
  usersService.tslGetEventById(req.query, (data) => {
    res.send(data);
  });
});

/* Edit User List at Account page */

router.post("/tslUpdateEventInfo", verifyToken, function (req, res) {
  usersService.tslUpdateEventInfo(req.body, (data) => {
    res.send(data);
  });
});

/* Update EventsPage Design */

router.post("/tslUpdateEventPageDesign", verifyToken, function (req, res) {
  usersService.tslUpdateEventPageDesign(req.body, (data) => {
    res.send(data);
  });
});

/* Get EventsPage Design */

router.get("/tslGetPageDesign", verifyToken, function (req, res) {
  usersService.tslGetPageDesign(req.query, (data) => {
    res.send(data);
  });
});

/* Insert Reg Types In Page Design */

router.post("/tslInsertRegTypesPageDesign", verifyToken, function (req, res) {
  usersService.tslInsertRegTypesPageDesign(req.body, (data) => {
    res.send(data);
  });
});

/* Get Reg Types at Page Design */

router.get("/tslGetRegTypesPageDesign", verifyToken, function (req, res) {
  usersService.tslGetRegTypesPageDesign(req.query, (data) => {
    res.send(data);
  });
});

/* Update RegTypes Design */

router.post("/tslUpdateRegTypesPageDesign", verifyToken, function (req, res) {
  usersService.tslUpdateRegTypesPageDesign(req.body, (data) => {
    res.send(data);
  });
});

/* Insert Registration Categories In Page Design */

router.post(
  "/tslInsertRegCategoriesPageDesign",
  verifyToken,
  function (req, res) {
    usersService.tslInsertRegCategoriesPageDesign(req.body, (data) => {
      res.send(data);
    });
  }
);

/* Get Reg Categories at Page Design */

router.get("/tslGetRegCategoriesPageDesign", function (req, res) {
  usersService.tslGetRegCategoriesPageDesign(req.query, (data) => {
    res.send(data);
  });
});

/* Update RegCategories Design */

router.post(
  "/tslUpdateRegCategoriesPageDesign",
  verifyToken,
  function (req, res) {
    usersService.tslUpdateRegCategoriesPageDesign(req.body, (data) => {
      res.send(data);
    });
  }
);

/* Get Reg Categories at Page Design */

router.get("/tslGetRegSCodePageDesign", verifyToken, function (req, res) {
  usersService.tslGetRegSCodePageDesign(req.query, (data) => {
    res.send(data);
  });
});

/* Get Reg Types By Id at Page Design */

router.get("/tslGetRegTypesByIdPageDesign", verifyToken, function (req, res) {
  usersService.tslGetRegTypesByIdPageDesign(req.query, (data) => {
    res.send(data);
  });
});

/* Get Reg Categories By Id at Page Design */

router.get(
  "/tslGetRegCategoriesByIdPageDesign",
  verifyToken,
  function (req, res) {
    usersService.tslGetRegCategoriesByIdPageDesign(req.query, (data) => {
      res.send(data);
    });
  }
);

/* Insert Registrants Information */

router.post(
  "/tslInsertRegistrantInformation",
  verifyToken,
  function (req, res) {
    usersService.tslInsertRegistrantInformation(req.body, (data) => {
      res.send(data);
    });
  }
);

/* Get Reg Categories By Id at Page Design */

router.get(
  "/tslGetRegCategoriesByIdPageDesign",
  verifyToken,
  function (req, res) {
    usersService.tslGetRegCategoriesByIdPageDesign(req.query, (data) => {
      res.send(data);
    });
  }
);

/* Get Questions Config SName */

router.get("/tslGetQuestionsConfigSName", function (req, res) {
  usersService.tslGetQuestionsConfigSName(req.query, (data) => {
    res.send(data);
  });
});

/* Get Questions Field SName */

router.get("/tslGetQuestionsFieldName", verifyToken, function (req, res) {
  usersService.tslGetQuestionsFieldName(req.query, (data) => {
    res.send(data);
  });
});

/* Update Registrant Information at Fields,Disc,Sessions Page */

router.post("/tslUpdateRegInfoFieldsPage", verifyToken, function (req, res) {
  usersService.tslUpdateRegInfoFieldsPage(req.body, (data) => {
    res.send(data);
  });
});

/* Get Guests and Additional Registrants Fields */

router.get("/tslGetguestsRegistrantsFields", verifyToken, function (req, res) {
  usersService.tslGetguestsRegistrantsFields(req.query, (data) => {
    res.send(data);
  });
});

/* Get Custom Questions */

router.get("/tslGetCustomQuestions", verifyToken, function (req, res) {
  usersService.tslGetCustomQuestions(req.query, (data) => {
    res.send(data);
  });
});

/* Update Guest Registrats Fields at Fields,Disc,Sessions Page */

router.post(
  "/tslUpdateGuestRegistrantsFields",
  verifyToken,
  function (req, res) {
    usersService.tslUpdateGuestRegistrantsFields(req.body, (data) => {
      res.send(data);
    });
  }
);

/* Get Registrant Field Setup */

router.get("/tslGetRegistrantInformation", verifyToken, function (req, res) {
  usersService.tslGetRegistrantInformation(req.query, (data) => {
    res.send(data);
  });
});

/* Update Guest Registrants Fields Setup at Fields,Disc,Sessions Page */

router.post("/tslUpdateRegistrantFieldSetup", verifyToken, function (req, res) {
  usersService.tslUpdateRegistrantFieldSetup(req.body, (data) => {
    res.send(data);
  });
});

/* Get Custom Questions By ID */

router.get("/tslGetCustomQuestionsById", verifyToken, function (req, res) {
  usersService.tslGetCustomQuestionsById(req.query, (data) => {
    res.send(data);
  });
});

/* Insert Custom Questions at Fields,Disc,Sessions Page */

router.post("/tslInsertCustomQuestions", verifyToken, function (req, res) {
  usersService.tslInsertCustomQuestions(req.body, (data) => {
    res.send(data);
  });
});

/* Update Custom Questions at Fields,Disc,Sessions Page */

router.post("/tslupdateCustomQuestions", verifyToken, function (req, res) {
  usersService.tslupdateCustomQuestions(req.body, (data) => {
    res.send(data);
  });
});

/* Get Discount Codes at Fields Page */

router.get("/tslGetDiscountCodes", verifyToken, function (req, res) {
  usersService.tslGetDiscountCodes(req.query, (data) => {
    res.send(data);
  });
});

/* Get Discount Codes By ID at Fields Page */

router.get("/tslGetDiscountCodesById", verifyToken, function (req, res) {
  usersService.tslGetDiscountCodesById(req.query, (data) => {
    res.send(data);
  });
});

/* Insert Discount Codes at Fields,Disc,Sessions Page */

router.post("/tslInsertDiscountCodes", verifyToken, function (req, res) {
  usersService.tslInsertDiscountCodes(req.body, (data) => {
    res.send(data);
  });
});

/* Update Discount Codes at Fields,Disc,Sessions Page */

router.post("/tslUpdateDiscountCodes", verifyToken, function (req, res) {
  usersService.tslUpdateDiscountCodes(req.body, (data) => {
    res.send(data);
  });
});

/* Insert Sessions at Fields,Disc,Sessions Page */

router.post("/tslInsertSessions", verifyToken, function (req, res) {
  usersService.tslInsertSessions(req.body, (data) => {
    res.send(data);
  });
});

/* Update Sessions at Fields,Disc,Sessions Page */

router.post("/tslUpdateSessions", verifyToken, function (req, res) {
  usersService.tslUpdateSessions(req.body, (data) => {
    res.send(data);
  });
});

/* Get Discount Codes at Fields Page */

router.get("/tslGetSessions", verifyToken, function (req, res) {
  usersService.tslGetSessions(req.query, (data) => {
    res.send(data);
  });
});

/* Get Discount Codes By ID at Fields Page */

router.get("/tslGetSessionsById", verifyToken, function (req, res) {
  usersService.tslGetSessionsById(req.query, (data) => {
    res.send(data);
  });
});

/* Get Extra Config at Fields Page */

router.get(
  "/tslGetExtraConfigurationForSessions",
  verifyToken,
  function (req, res) {
    usersService.tslGetExtraConfigurationForSessions(req.query, (data) => {
      res.send(data);
    });
  }
);

/* Insert Extra Config For Sessions at Fields,Disc,Sessions Page */

router.post(
  "/tslAddExtraConfigurationForSessions",
  verifyToken,
  function (req, res) {
    usersService.tslAddExtraConfigurationForSessions(req.body, (data) => {
      res.send(data);
    });
  }
);

/* Get Extra Config By ID at Fields Page */

router.get("/tslGetExtraConfigById", verifyToken, function (req, res) {
  usersService.tslGetExtraConfigById(req.query, (data) => {
    res.send(data);
  });
});

/* Update Extra Config For Sessions at Fields,Disc,Sessions Page */

router.post(
  "/tslUpdateExtraConfigurationForSessions",
  verifyToken,
  function (req, res) {
    usersService.tslUpdateExtraConfigurationForSessions(req.body, (data) => {
      res.send(data);
    });
  }
);

/* Update Main Contact Fields at Page Design Group Reg */

router.post("/tslUpdateMainContactFields", verifyToken, function (req, res) {
  usersService.tslUpdateMainContactFields(req.body, (data) => {
    res.send(data);
  });
});

/* Get Main Contact Fields at Page Design Group Reg */

router.get("/tslGetMainContactFields", verifyToken, function (req, res) {
  usersService.tslGetMainContactFields(req.query, (data) => {
    res.send(data);
  });
});

/* Get Registrant FIelds at Group Reg Page  */

router.get("/tslGetRegistrantFields", verifyToken, function (req, res) {
  usersService.tslGetRegistrantFields(req.query, (data) => {
    res.send(data);
  });
});

/* Get Main Contact Fields at Page Design Group Reg */

router.get("/tslGetMainContactFields", verifyToken, function (req, res) {
  usersService.tslGetMainContactFields(req.query, (data) => {
    res.send(data);
  });
});

/* Update Guest Registrants Fields Setup at Fields,Disc,Sessions Page */

router.post("/tslUpdateRegistrantFields", verifyToken, function (req, res) {
  usersService.tslUpdateRegistrantFields(req.body, (data) => {
    res.send(data);
  });
});

/* Get Page Design Group Reg */

router.get("/tslGetPageDesignGrpReg", function (req, res) {
  usersService.tslGetPageDesignGrpReg(req.query, (data) => {
    res.send(data);
  });
});

/* Update Guest Registrants Fields Setup at Fields,Disc,Sessions Page */

router.post("/tslUpdatePageDesignGrpReg", verifyToken, function (req, res) {
  usersService.tslUpdatePageDesignGrpReg(req.body, (data) => {
    res.send(data);
  });
});

/* Get Page Page Design Exhibitor */

router.get("/tslGetPageDesignExhibitor", verifyToken, function (req, res) {
  usersService.tslGetPageDesignExhibitor(req.query, (data) => {
    res.send(data);
  });
});

/* Update Page Design Exhibitor */

router.post("/tslUpdatePageDesignExhibitor", verifyToken, function (req, res) {
  usersService.tslUpdatePageDesignExhibitor(req.body, (data) => {
    res.send(data);
  });
});

/* Get Exhibitor List */

router.get("/tslGetExhibitorList", verifyToken, function (req, res) {
  usersService.tslGetExhibitorList(req.query, (data) => {
    res.send(data);
  });
});

/* Insert Extra Config For Sessions at Fields,Disc,Sessions Page */

router.post("/tslAddExhibitorsInfo", verifyToken, function (req, res) {
  usersService.tslAddExhibitorsInfo(req, res, (data) => {
    res.send(data);
  });
});

/* Update Exhibitor Info */

router.post("/tslUpdateExhibitorInfo", verifyToken, function (req, res) {
  usersService.tslUpdateExhibitorInfo(req, res, (data) => {
    res.send(data);
  });
});

// get Exhibitor List By ID

router.get("/tslGetExhibitorListById", verifyToken, function (req, res) {
  usersService.tslGetExhibitorListById(req.query, (data) => {
    res.send(data);
  });
});

/* Insert Import Exhibitors Data */
 
router.post("/tslAddExhibitorsImport", verifyToken, function (req, res) {
  usersService.tslAddExhibitorsImport(req.body, (data) => {
    res.send(data);
  });
});

/* Insert Exhibitors Booth Members */

router.post("/tslAddExhibitorsBoothMembers", verifyToken, function (req, res) {
  usersService.tslAddExhibitorsBoothMembers(req.body, (data) => {
    res.send(data);
  });
});

/* Update Exhibitors Booth Members */

router.post(
  "/tslUpdateExhibitorsBoothMembers",
  verifyToken,
  function (req, res) {
    usersService.tslUpdateExhibitorsBoothMembers(req.body, (data) => {
      res.send(data);
    });
  }
);

// get Exhibitor Booth Members

router.get("/tslGetExhibitorBoothMembers", verifyToken, function (req, res) {
  usersService.tslGetExhibitorBoothMembers(req.query, (data) => {
    res.send(data);
  });
});

// get Exhibitor Booth Members By Id

router.get(
  "/tslGetExhibitorBoothMembersByID",
  verifyToken,
  function (req, res) {
    usersService.tslGetExhibitorBoothMembersByID(req.query, (data) => {
      res.send(data);
    });
  }
);

// get Exhibitor Booth Members

router.get("/tslGetEmailSetup", verifyToken, function (req, res) {
  usersService.tslGetEmailSetup(req.query, (data) => {
    res.send(data);
  });
});

/* Update Email Setup Tabs */

router.post("/tslUpdateEmailSetup", verifyToken, function (req, res) {
  usersService.tslUpdateEmailSetup(req.body, (data) => {
    res.send(data);
  });
});

// get Registrants List

router.get("/tslGetRegistrantsList", verifyToken, function (req, res) {
  usersService.tslGetRegistrantsList(req.query, (data) => {
    res.send(data);
  });
});

// get Additional Registrants List

router.get("/tslGetAdditionalRegistrantList", verifyToken, function (req, res) {
  usersService.tslGetAdditionalRegistrantList(req.query, (data) => {
    res.send(data);
  });
});

/* Add Registrant */

router.post("/tslAddRegistrants", verifyToken, function (req, res) {
  usersService.tslAddRegistrants(req.body, (data) => {
    res.send(data);
  });
});

// get Questions for Registrant List

router.get("/tslGetQuestionsRegistrantsList", function (req, res) {
  usersService.tslGetQuestionsRegistrantsList(req.query, (data) => {
    res.send(data);
  });
});

// get Guests Additional Registrants

router.get(
  "/tslGetGuestAdditionalRegistrants",
  verifyToken,
  function (req, res) {
    usersService.tslGetGuestAdditionalRegistrants(req.query, (data) => {
      res.send(data);
    });
  }
);

/* Add Guest and Additional Information */

router.post(
  "/tslAddGuestAdditionalInformation",
  verifyToken,
  function (req, res) {
    usersService.tslAddGuestAdditionalInformation(req.body, (data) => {
      res.send(data);
    });
  }
);

/* Update Guest and Additional Information */

router.post(
  "/tslUpdateGuestsAdditionalInformation",
  verifyToken,
  function (req, res) {
    usersService.tslUpdateGuestsAdditionalInformation(req.body, (data) => {
      res.send(data);
    });
  }
);

// get Exhibitor Booth Members By Id

router.get(
  "/tslGetGuestAddditionalInformationById",
  verifyToken,
  function (req, res) {
    usersService.tslGetGuestAddditionalInformationById(req.query, (data) => {
      res.send(data);
    });
  }
);

// Get Answers Registrant

router.get("/tslGetAnswersRegistrant", verifyToken, function (req, res) {
  usersService.tslGetAnswersRegistrant(req.query, (data) => {
    res.send(data);
  });
});

// Get Registrant Sessions

router.get("/tslGetRegistrantSessions", verifyToken, function (req, res) {
  usersService.tslGetRegistrantSessions(req.query, (data) => {
    res.send(data);
  });
});

/* Add Registrant Sessions */

router.post("/tslAddRegistrantSessions", verifyToken, function (req, res) {
  usersService.tslAddRegistrantSessions(req.body, (data) => {
    res.send(data);
  });
});

// Get Sessions Config

router.get("/tslGetSessionsConfig", verifyToken, function (req, res) {
  usersService.tslGetSessionsConfig(req.query, (data) => {
    res.send(data);
  });
});

// get Sessions Config By Id

router.get(
  "/tslGetSessionsConfigById",
  verifyToken,
  function (req, res) {
    usersService.tslGetSessionsConfigById(req.query, (data) => {
      res.send(data); 
    });
  }
);
 
/* Update Sessions COnfig */

router.post("/tslUpdateSessionsConfig", verifyToken, function (req, res) {
  usersService.tslUpdateSessionsConfig(req.body, (data) => {
    res.send(data);
  });
});

// Get Payments at Reg Info

router.get("/tslGetRegPayments", verifyToken, function (req, res) {
  usersService.tslGetRegPayments(req.query, (data) => {
    res.send(data);
  });
});


/* Add Registrant Payments */

router.post("/tslAddRegPayments", verifyToken, function (req, res) {
  usersService.tslAddRegPayments(req.body, (data) => {
    res.send(data);
  });
});

/* Update Registrant Payments */

router.post("/tslUpdateRegPayments", verifyToken, function (req, res) {
  usersService.tslUpdateRegPayments(req.body, (data) => {
    res.send(data);
  });
});
 
// get Reg payments By Id

router.get(
  "/tslGetRegPaymentsByID",
  verifyToken,
  function (req, res) {
    usersService.tslGetRegPaymentsByID(req.query, (data) => {
      res.send(data); 
    });
  }
);

// get Reg Amount for summary and totals tab

router.get(
  "/tslGetRegAmount",
  verifyToken,
  function (req, res) {
    usersService.tslGetRegAmount(req.query, (data) => {
      res.send(data); 
    });
  }
);

/* Update Registrant Amount */

router.post("/tslUpdateRegAmount", verifyToken, function (req, res) {
  usersService.tslUpdateRegAmount(req.body, (data) => {
    res.send(data);
  });
});

/* Create Stripe Intent */

router.post("/tslCreateStripeIntent", verifyToken, function (req, res) {
  usersService.tslCreateStripeIntent(req.body, (data) => {
    res.send(data);
  });
});

// get Registrants data by Reg ID

router.get(
  "/tslGetRegistrants",
  verifyToken,
  function (req, res) {
    usersService.tslGetRegistrants(req.query, (data) => {
      res.send(data); 
    });
  }
);

/* Update Registrant Amount */

router.post("/tslUpdateRegistrants", verifyToken, function (req, res) {
  usersService.tslUpdateRegistrants(req.body, (data) => {
    res.send(data);
  });
});

/* Get Reg Type Amount at Reg Info Page */

router.get(
  "/tslGetRegTypeAmount",
  verifyToken,
  function (req, res) {
    usersService.tslGetRegTypeAmount(req.query, (data) => {
      res.send(data);
    });
  }
);

/* Get Session Price at Reg Info Page */

router.get(
  "/tslGetSessionPrice",
  verifyToken,
  function (req, res) {
    usersService.tslGetSessionPrice(req.query, (data) => {
      res.send(data);
    });
  }
);

/* POST to delete Registrants. */
router.post("/tslDeleteRegistrants", verifyToken, function (req, res) {
  usersService.tslDeleteRegistrants(req.body, (data) => {
    res.send(data);
  });
});

/* Insert Import Registrants Data */

router.post("/tslAddRegistrantsImport", verifyToken, function (req, res) {
  usersService.tslAddRegistrantsImport(req.body, (data) => {
    res.send(data);
  });
});


/* Get Event Header and Footer */

router.get(
  "/tslGetEventHeaderAndFooter",
  
  function (req, res) {
    usersService.tslGetEventHeaderAndFooter(req.query, (data) => {
      res.send(data);
    });
  }
);

/* Get Reg Types at Template 1 */

router.get("/tslGetRegTypesTemplate1",  function (req, res) {
  usersService.tslGetRegTypesTemplate1(req.query, (data) => {
    res.send(data);
  });
});

/* Get Additional Fields Visible at Template 1 */

router.get("/tslGetAdditionalFieldsVisible",  function (req, res) {
  usersService.tslGetAdditionalFieldsVisible(req.query, (data) => {
    res.send(data);
  });
});

/* Insert Fields Data Default for Registrant Information at Fields Page */

router.post("/tslAddFieldsDataDefault",  function (req, res) {
  usersService.tslAddFieldsDataDefault(req.body, (data) => {
    res.send(data);
  });
});

/* Get Sessions Tickets at Template 1 */

router.get("/tslGetSessionsTicketsDataTemplate1",  function (req, res) {
  usersService.tslGetSessionsTicketsDataTemplate1(req.query, (data) => {
    res.send(data);
  });
});

/* Insert Template1 Data into Registrants Table */

router.post("/tslInsertTemplate1RegistrantsData",  function (req, res) {
  usersService.tslInsertTemplate1RegistrantsData(req.body, (data) => {
    res.send(data);
  });
});

/* Get Sessions Tickets at Template 21 */

router.get("/tslGetSessionsTicketsDataTemplate21",  function (req, res) {
  usersService.tslGetSessionsTicketsDataTemplate21(req.query, (data) => {
    res.send(data);
  });
});

/* Send Email */

router.post(
  "/tslSendEmail",
  
  function (req, res) {
    usersService.tslSendEmail(req.body, (data) => {
      res.send(data);
    });
  }
);

/* Get Registrant Fields at Template 21 */

router.get("/tslRegistrantFieldsVisible",  function (req, res) {
  usersService.tslRegistrantFieldsVisible(req.query, (data) => {
    res.send(data);
  });
});


/* Insert Template21 Data into Registrants Table */

router.post("/tslInsertTemplate21RegistrantsData",  function (req, res) {
  usersService.tslInsertTemplate21RegistrantsData(req.body, (data) => {
    res.send(data);
  });
});

/* Get Reg Info Data of Template 21 */

router.get("/tslGetRegistrantsInformationTemplate21",  function (req, res) {
  usersService.tslGetRegistrantsInformationTemplate21(req.query, (data) => {
    res.send(data);
  });
});

/* Get Reg Sessions Data of Template 21 */

router.get("/tslGetRegistrantSessionsTemplate21",  function (req, res) {
  usersService.tslGetRegistrantSessionsTemplate21(req.query, (data) => {
    res.send(data);
  });
});

/* Get Registrant Info By ID of Template 21 */

router.get("/tslGetRegistrantsByIDTemplate21",  function (req, res) {
  usersService.tslGetRegistrantsByIDTemplate21(req.query, (data) => {
    res.send(data);
  });
});

/* Get Sum of Registrant Info at Template 21 Info */

router.get("/tslGetSUMRegistrantsInformationTemplate21",  function (req, res) {
  usersService.tslGetSUMRegistrantsInformationTemplate21(req.query, (data) => {
    res.send(data);
  });
});


/* Add Registrant */

router.post("/tslInsertGroupRegistrants", (req, res) => {
  usersService.tslInsertGroupRegistrants(req.body, (data) => {
    res.send(data);
  });
});

/* Get Members list  */

router.get("/tslGetMembersList",  function (req, res) {

  usersService.tslGetMembersList(req.query, (data) => {
     res.send(data);
  });
});

/* Client API */

/* POST Client login */
router.post("/tslClientLogin", (req, res) => {
  usersService.tslClientLogin(req.body, (data) => {
    //io.emit('onlineUsers', data);
    res.send(data);
  });
});

/* POST save Client information */
router.post("/saveClientInformation", (req, res) => {
  usersService.saveClientInformation(req.body, (data) => {
    //io.emit('onlineUsers', data);
    res.send(data);
  });
});

/* Add Registrant */

router.post("/tslAddMembers", verifyToken, function (req, res) {
  usersService.tslAddMembers(req.body, (data) => {
    res.send(data);
  });
});

router.post("/tslUpdateMember", verifyToken, function (req, res) {
  usersService.tslUpdateMemberInfo(req.body, (data) => {
    res.send(data);
  });
});


module.exports = router;
