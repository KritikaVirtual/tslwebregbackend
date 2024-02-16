const Joi = require('@hapi/joi');

// login validation
const loginValidation = data => {
    const schema = Joi.object({        
        eventId:Joi.number().required(),    
        pass: Joi.string().required(),    
        username: Joi.string().email().required()
    }).with('username', 'pass');    
    
    return schema.validate(data);
}

// forgot password validation
const forgetPasswordValidation = data => {
    const schema = Joi.object({        
        eventId:Joi.number().required(),    
        email: Joi.string().email().required()
    });    
    
    return schema.validate(data);
}

// forgot pass link validation
const forgotPassLinkValidation = data => {
    const schema = Joi.object({        
        eventId:Joi.number().required(),    
        token:Joi.string().alphanum().required(),    
        email: Joi.string().email().required()
    });    
    
    return schema.validate(data);
}

// reset password validation
const resetPasswordValidation = data => {
    const schema = Joi.object({        
        eventId: Joi.number().required(),            
        newPass: Joi.string().min(8).required().strict(),    
        confirmPass: Joi.string().valid(Joi.ref('newPass')).required().strict(),
        email: Joi.string().email().required()
    }).with('newPass', 'confirmPass');;    
    
    return schema.validate(data);
}

// validate mandatory fields while getting user details
const userDataValidation = data => {
    const schema = Joi.object({        
        eventId:Joi.number().required(),    
        username:Joi.string().email().required(),
        role:Joi.number().required(),
        isDetails:Joi.number().allow(null),
    });    
    
    return schema.validate(data);
}

// validate mandatory fields while getting user details
const sponsorsLogoValidation = data => {
    const schema = Joi.object({        
        eventId:Joi.number().required(),        
        type:Joi.number().required()
    });    
    
    return schema.validate(data);
}

// validate exhibitor list params
const getExhibitorListValidation = data => {
    const schema = Joi.object({            
        eventId: Joi.number().required(),        
        offset: Joi.number().allow('').allow(null),
        limit: Joi.number().allow('').allow(null),
        searchByKeyword: Joi.string().allow('').allow(null),
        searchByCategory: Joi.number().allow('').allow(null),
        sponserEnableFlag: Joi.boolean().allow('').allow(null)           
    });    
    
    return schema.validate(data);
}

// validate session and event id
const sessionAndEventIdValidation = data => {
    const schema = Joi.object({            
        eventId: Joi.number().required(),            
        sessionId: Joi.number().required()    
    }); 
    return schema.validate(data);
}

// validate session schedule data
const scheduleValidation = data => {
    const schema = Joi.object({            
        eventId: Joi.number().required(),            
        memberId: Joi.number().required(),
        sessionId: Joi.number().allow('').allow(null),
        role: Joi.number().required(),               
        sName: Joi.string().required(),
        startDate: Joi.string().required(),
        startTime: Joi.string().required(),
        endTime: Joi.string().allow('').allow(null),
        notes: Joi.string().allow('').allow(null),
        isSession: Joi.number().required(),
        startFormat: Joi.string().allow('').allow(null),
        endFormat: Joi.string().allow('').allow(null),
    }); 
    return schema.validate(data);
}

// validate delete schedule data
const deleteScheduleValidation = data => {
    const schema = Joi.object({            
        eventId: Joi.number().required(),            
        memberId: Joi.number().required(),
        scheduleId: Joi.number().required()
    }); 
    return schema.validate(data);
}

// validate session survey fields
const sessionSurveyValidation = data => {
    const schema = Joi.object({            
        eventId: Joi.number().required(),            
        sessionId: Joi.number().required(),
        regId: Joi.number().required(),
        role: Joi.number().required()        
    }); 
    return schema.validate(data);
}

// validate scan data
const scanDataValidation = data => {
    const schema = Joi.object({            
        eventId: Joi.number().required(),            
        sessionId: Joi.number().required(),
        regId: Joi.number().required(),
        accountId: Joi.number().allow('').allow(null),
        duration: Joi.string().required(),
        role: Joi.number().required(),
        serialNumber: Joi.string().required()    
    }); 
    return schema.validate(data);
}

// validate scan data
const tslAddUsersValidation = data => {
    const schema = Joi.object({            
        userId: Joi.number().required(),            
        sUserName: Joi.string().required(),
        sFirstName: Joi.string().required(),
        sLastName: Joi.string().allow('').allow(null),
        sUserPassword: Joi.string().required(),
        // sReEnterPassword: Joi.string().required(),
        // sPhone: Joi.number().required(),
        lRoleID: Joi.number().required(),
        sStatus: Joi.string().required(),
    }); 
    return schema.validate(data);
}

// validate booth visitors
const boothVisitorValidation = data => {
    const schema = Joi.object({            
        eventId: Joi.number().required(),            
        exhibitorId: Joi.number().required(),
        visitorId: Joi.number().required(),
        role: Joi.number().required(),
        isLead: Joi.number().required()
    }); 
    return schema.validate(data);
}

// validate get booth visitors
const getBoothVisitorValidation = data => {
    const schema = Joi.object({            
        eventId: Joi.number().required(),            
        exhibitorId: Joi.number().required(),        
        isLead: Joi.number().required(),
        visibility: Joi.number().required()
    }); 
    return schema.validate(data);
}

// follow up visitors validation
const followUpVisitorValidation = data => {
    const schema = Joi.object({            
        eventId: Joi.number().required(),            
        exhibitorId: Joi.number().required(),
        visitorId: Joi.number().required(),
        role: Joi.number().required(),
        followUp: Joi.string().required()
    }); 
    return schema.validate(data);
}

// golden ticket visitors validation
const goldenTicketVisitorValidation = data => {
    const schema = Joi.object({            
        eventId: Joi.number().required(),            
        ticketValue: Joi.number().required(),
        visitorId: Joi.number().required(),
        linkPage: Joi.string().valid('networking','exhibitBooth','sessionRoom').required(),
        sessionId: Joi.number().allow('').allow(null).allow(0),
        exhibitorId: Joi.number().allow('').allow(null).allow(0)
    }); 
    return schema.validate(data);
}

// user profile validation
const userProfileValidation = data => {
    const schema = Joi.object({            
        eventId: Joi.number().required(),            
        userId: Joi.number().allow(),
        firstName: Joi.string().allow(''),
        lastName: Joi.string().allow(''),
        title: Joi.string().allow(''),
        phone: Joi.string().allow(''),
        image: Joi.string().allow(''),
        type: Joi.number().required(),
        company: Joi.string().allow(''), 
        city: Joi.string().allow(''),
        state: Joi.string().allow(''),
        country: Joi.string().allow(''),
        username: Joi.string().allow(''),
    }); 
    return schema.validate(data);
}

// validate event survey fields
const eventSurveyValidation = data => {
    const schema = Joi.object({            
        eventId: Joi.number().required(),            
        userId: Joi.number().required(),
        regId: Joi.number().required()
    }); 
    return schema.validate(data);
} 

// validate track session fields
const trackSessionsValidation = data => {
    const schema = Joi.object({            
        eventId: Joi.number().required(),            
        trackId: Joi.number().required()
    }); 
    return schema.validate(data);
}

// validate user fields for session
const sessionUserValidation = data => {
    const schema = Joi.object({            
        eventId: Joi.number().required(),            
        sessionId: Joi.number().required(),
        userId: Joi.number().required(),
        userName: Joi.string().required(),
        company: Joi.string().allow('')
    }); 
    return schema.validate(data);
}

// validate user fields for session when deleting
const deleteSessionUserValidation = data => {
    const schema = Joi.object({            
        eventId: Joi.number().required(),            
        userId: Joi.number().required(),
        sessionId: Joi.number().allow('').allow(null).allow(0)        
    }); 
    return schema.validate(data);
}

// validate user session survey fields
const userSessionSurveyValidation = data => {
    const schema = Joi.object({            
        eventId: Joi.number().required(),            
        sessionId: Joi.number().required(),
        visitorId: Joi.number().required(),
        role: Joi.number().required(),
        vote: Joi.number().required(),        
        comment: Joi.string().allow(''),
        listId: Joi.number().allow('').allow(null).allow(0)
    }); 
    return schema.validate(data);
}

// fna2022 login validation
const fna2022LoginValidation = data => {
    const schema = Joi.object({        
        eventId:Joi.number().required(),    
        username: Joi.string().email().required()
    });    
    
    return schema.validate(data);
}

const tobi2022LoginValidation = data => {
    const schema = Joi.object({        
        eventId:Joi.number().required(),    
        username: Joi.string().email().required()
    });    
    
    return schema.validate(data);
}

const mdapaLoginValidation = data => {
    const schema = Joi.object({        
        eventId:Joi.number().required(),    
        username: Joi.string().email().required()
    });    
    
    return schema.validate(data);
}

// validate session polling survey fields
const sessionPollingQuestionValidation = data => {
    const schema = Joi.object({            
        eventId: Joi.number().required(),            
        sessionId: Joi.number().required(),
        //regId: Joi.number().required(),
        accountId: Joi.number().required(),
        //role: Joi.number().required()        
    }); 
    return schema.validate(data);
}

const getPollingSessionAnsConfigValidation = data => {
    const schema = Joi.object({        
        eventId:Joi.number().required(),    
        accountId: Joi.number().required(),
        questionArray : Joi.string().allow('').allow(null),
    });    
    
    return schema.validate(data);
}

const savePollingAnswersValidation = data => {
    const schema = Joi.object({
        lAccountID:Joi.number().allow('').allow(null),
        lEventID:Joi.number().allow('').allow(null),
        lSessionID:Joi.number().allow('').allow(null),
        userId:Joi.number().allow('').allow(null),
        totalSurveyQuestion:Joi.number().allow('').allow(null),
        totalSurveyAnswers:Joi.number().allow('').allow(null),
        data:Joi.string().allow('').allow(null)
    });    
    
    return schema.validate(data);
}

// validate session survey fields
const getSurveySubmittedAnswersValidation = data => {
    console.log('validation',data)
    const schema = Joi.object({            
        eventId: Joi.number().required(),            
        sessionId: Joi.number().required(),
        accountId: Joi.number().required(),
        userId: Joi.number().required(),
    }); 
    return schema.validate(data);
}

// Admin Login validation
const tslAdminLoginValidation = data => {
    const schema = Joi.object({        
        password: Joi.string().required(),    
        username: Joi.string().email().required()
    }).with('username', 'password');    
    
    return schema.validate(data);
}

const tslAdminRegisterValidation = data => {
    console.log('dfsdfsdfsdfsdtrgfedws',data);
    const schema = Joi.object({            
        username: Joi.string().required(),            
        password: Joi.string().required(),
        firstname: Joi.string().required(),
        lastname: Joi.string().required(),
        // phone: Joi.number().required(),
    }); 
    return schema.validate(data);
}

// Payment Details validation
const tslAddPaymentDetailsValidation = data => {
    const schema = Joi.object({            
        lAccountID: Joi.number().required(),            
        paymentID: Joi.required(),
        paymentDetails: Joi.required()
    }); 
    
    return schema.validate(data);
}

// Client Details validation
const saveClientInformationValidation = data => {
    const schema = Joi.object({                   
        sUserName: Joi.string().required(),
        sFirstName: Joi.string().required(),
        sLastName: Joi.string().allow('').allow(null),
        sUserPassword: Joi.string().required(),
        sUserRepeatPassword: Joi.string().allow('').allow(null),
        sBillCompany: Joi.string().allow('').allow(null)
    }); 
    
    return schema.validate(data);
}


// Client Login validation
const tslClientLoginValidation = data => {
    const schema = Joi.object({        
        password: Joi.string().required(),    
        username: Joi.string().email().required()
    }).with('username', 'password');    
    
    return schema.validate(data);
}


// Add Event validation
const tslAddEventValidation = data => {
    const schema = Joi.object({            
        lAccountID: Joi.number().required(),            
        sName: Joi.required(),
        sLocation: Joi.required(),
        dtStart: Joi.required(),
        dtEnd: Joi.required(),
        sStatus: Joi.required(),
        sEventContactName: Joi.required(),
        sEventContactEmail: Joi.required(),
        dtCloseSite: Joi.required(),
        lBadgeReportID: Joi.required(),
        bUniqueEmailsForAddReg: Joi.required(),
        nAllowToPayByCheck: Joi.required(),
        sAccessCode: Joi.required(),
        fieldsDataArray: Joi.required(),
        guestAddRegFieldData: Joi.required()
    }); 
    
    return schema.validate(data);
}


// Insert Reg Types In Page Design Validation
const tslInsertRegTypesPageDesignValidation = data => {
    const schema = Joi.object({            
        lAccountID: Joi.number().required(),  
        lEventID: Joi.number().required(),
        sCode : Joi.required(),
        sName : Joi.string().required(),
        dEarlyAmt : Joi.optional(),
        dPricePerAddRegEarly : Joi.optional(),
        dPricePerGuestEarly : Joi.optional(),
        lNumberOfEarlyReg1 : Joi.optional(),
        dEarlyAmt2 : Joi.optional(),
        lNumberOfEarlyReg2 : Joi.optional(),
        dEarlyAmt3 : Joi.optional(),
        lNumberOfEarlyReg3 : Joi.optional(),
        dEarlyAmt4 : Joi.optional(),
        lNumberOfEarlyReg4 : Joi.optional(),
        dtEarlyDate : Joi.optional(),
        dStandardAmt : Joi.optional(),
        lNumberOfStandardReg1 : Joi.optional(),
        dStandardAmt2 : Joi.optional(),
        lNumberOfStandardReg2 : Joi.optional(),
        dStandardAmt3 : Joi.optional(),
        lNumberOfStandardReg3 : Joi.optional(),
        dStandardAmt4 : Joi.optional(),
        lNumberOfStandardReg4 : Joi.optional(),
        dtStandardDate : Joi.optional(),
        dOnsiteAmt : Joi.optional(),
        lNumberOfOnsiteReg1 : Joi.optional(),
        dOnsiteAmt2 : Joi.optional(),
        lNumberOfOnsiteReg2 : Joi.optional(),
        dOnsiteAmt3 : Joi.optional(),
        lNumberOfOnsiteReg3 : Joi.optional(),
        dOnsiteAmt4 : Joi.optional(),
        lNumberOfOnsiteReg4 : Joi.optional(),
        sPrintText : Joi.optional(),

        // dPricePerAddRegEarly : Joi.number().required(),
        // dPricePerGuestEarly : Joi.number().required(),
        dPricePerAddRegStd : Joi.optional(),
        dPricePerGuestStd : Joi.optional(),
        dPricePerAddReg : Joi.optional().required(),
        dPricePerGuest : Joi.optional().required(),
        // bNeedMembership : Joi.required(),
        // nAddRegMax : Joi.number().required(),
        // nGuestsMax : Joi.number().required(),
        nStatus : Joi.optional()

    }); 
    
    return schema.validate(data);
}

// Update Reg Types In Page Design Validation
const tslUpdateRegTypesPageDesignValidation = data => {
    const schema = Joi.object({            
        lRegTypeID: Joi.number().required(),  
        lAccountID: Joi.number().required(),  
        lEventID: Joi.number().required(),
        sCode : Joi.required(),
        sName : Joi.string().required(),
        dEarlyAmt : Joi.number().required(),
        dPricePerGuestEarly : Joi.number().required(),
        dPricePerAddRegEarly : Joi.number().required(),
        lNumberOfEarlyReg1 : Joi.number().required(),
        dEarlyAmt2 : Joi.number().required(),
        lNumberOfEarlyReg2 : Joi.number().required(),
        dEarlyAmt3 : Joi.number().required(),
        lNumberOfEarlyReg3 : Joi.number().required(),
        dEarlyAmt4 : Joi.number().required(),
        lNumberOfEarlyReg4 : Joi.number().required(),
        dtEarlyDate : Joi.required(),
        dStandardAmt : Joi.number().required(),
        lNumberOfStandardReg1 : Joi.number().required(),
        dStandardAmt2 : Joi.number().required(),
        lNumberOfStandardReg2 : Joi.number().required(),
        dStandardAmt3 : Joi.number().required(),
        lNumberOfStandardReg3 : Joi.number().required(),
        dStandardAmt4 : Joi.number().required(),
        lNumberOfStandardReg4 : Joi.number().required(),
        dtStandardDate : Joi.required(),
        dOnsiteAmt : Joi.number().required(),
        lNumberOfOnsiteReg1 : Joi.number().required(),
        dOnsiteAmt2 : Joi.number().required(),
        lNumberOfOnsiteReg2 : Joi.number().required(),
        dOnsiteAmt3 : Joi.number().required(),
        lNumberOfOnsiteReg3 : Joi.number().required(),
        dOnsiteAmt4 : Joi.number().required(),
        lNumberOfOnsiteReg4 : Joi.number().required(),
        sPrintText : Joi.optional(),
        nStatus : Joi.required(),

    }); 
    
    return schema.validate(data);
}

// Insert Reg Categories In Page Design Validation
const tslInsertRegCategoriesPageDesignValidation = data => {
    const schema = Joi.object({            
        lAccountID: Joi.number().required(),  
        lEventID: Joi.number().required(),
        sCode : Joi.required(),
        sName : Joi.string().required(),
        sApplyToRegTypes : Joi.optional(),
        sApplyToTemplates : Joi.optional(),
        nStatus : Joi.optional()

    }); 
    
    return schema.validate(data);
}


// Get Reg Categories In Page Design Validation
const tslAccountIdEventIdValidation = data => {
    const schema = Joi.object({            
        lAccountID: Joi.number().required(),  
        lEventID: Joi.number().required(),
        offset : Joi.optional(),
        search : Joi.optional(),
        searchType : Joi.optional(),
    }); 
    
    return schema.validate(data);
}

// Get Reg Categories In Page Design Validation
const tslLAccountIdLEventIdValidation = data => {
    const schema = Joi.object({            
        lAccountID: Joi.number().required(),  
        lEventID: Joi.number().required()
    }); 
    
    return schema.validate(data);
}

// Update Reg Categories In Page Design Validation

const tslUpdateRegCategoriesPageDesignValidation = data => {
    const schema = Joi.object({            
        lAccountID: Joi.number().required(),  
        lEventID: Joi.number().required(),
        lCategoryID : Joi.number().required(),
        sCode : Joi.required(),
        sName : Joi.string().required(),
        sApplyToRegTypes : Joi.optional(),
        sApplyToTemplates : Joi.optional(),
        nStatus : Joi.optional()

    }); 
    
    return schema.validate(data);
}

// Get Reg Types In Page Design Validation
const tslGetRegTypesByIdValidation = data => {
    const schema = Joi.object({            
        lAccountID: Joi.number().required(),  
        lEventID: Joi.number().required(),
        lRegTypeID : Joi.number().required(),
    }); 
    return schema.validate(data);
}
// Get Reg Categories In Page Design Validation
const tslGetRegCategoriesByIdValidation = data => {
    const schema = Joi.object({            
        lAccountID: Joi.number().required(),  
        lEventID: Joi.number().required(),
        lCategoryID : Joi.number().required(),
    }); 
    
    return schema.validate(data);
}


// Get Reg Categories In Page Design Validation
const tslGetQuestionsFieldNameValidation = data => {
    const schema = Joi.object({            
        lAccountID: Joi.number().required(),  
        lEventID: Joi.number().required(),
        sCode : Joi.required(),
    }); 
    
    return schema.validate(data);
}

// Update Reg Info In Fields, Q&A, Disc, Sessions Validation
const tslUpdateRegInfoFieldsPageValidation = data => {
    const schema = Joi.object({            
        lAccountID: Joi.number().required(),  
        lEventID: Joi.number().required(),
        fieldValue : Joi.optional()
    }); 
    
    return schema.validate(data);
}

// Update Reg Info In Fields, Q&A, Disc, Sessions Validation
const tslGetguestsRegistrantsFieldsValidation = data => {
    const schema = Joi.object({             
        lAccountID: Joi.number().required(),  
        lEventID: Joi.number().required(),
        fieldValue : Joi.optional()
    }); 
    
    return schema.validate(data);
}

// Update Guest Registrants Fields In Fields, Q&A, Disc, Sessions Validation
const tslUpdateGuestRegistrantsFieldsValidation = data => {
    const schema = Joi.object({            
        lAccountID: Joi.number().required(),  
        lEventID: Joi.number().required(),
        guestData : Joi.optional()
    }); 
    
    return schema.validate(data);
} 

// Get Custom Questions By ID 
const tslGetCustomQuestionsByIdValidation = data => {
    const schema = Joi.object({            
        lAccountID: Joi.number().required(),  
        lEventID: Joi.number().required(),
        lQuestionID : Joi.number().required()
    }); 
    
    return schema.validate(data);
} 
 
// Get Custom Questions By ID 
const tslGetDiscountCodesByIdValidation = data => {
    const schema = Joi.object({            
        lAccountID: Joi.number().required(),  
        lEventID: Joi.number().required(),
        lDiscountID : Joi.number().required()
    }); 
    
    return schema.validate(data);
} 

// Get Reg Categories In Page Design Validation
const tslExhibitorInfoValidation = data => {
    const schema = Joi.object({            
        lAccountID: Joi.number().required(),  
        lEventID: Joi.number().required(),
        lExhibitorID: Joi.number().required()
    }); 
    
    return schema.validate(data);
}

// Get Reg Categories In Page Design Validation
const tslAccountIdEventIdRegIDValidation = data => {
    const schema = Joi.object({            
        lAccountID: Joi.number().required(),  
        lEventID: Joi.number().required(),
        lRegID: Joi.number().optional(),
        offset : Joi.optional(),
        search : Joi.optional(),
        searchType : Joi.optional(),
    }); 
    
    return schema.validate(data);
}

// Get Reg Categories In Page Design Validation
const tslAccountIdEventIdCategoryIdValidation = data => {
    const schema = Joi.object({            
        lAccountID: Joi.number().required(),  
        lEventID: Joi.number().required(),
        lCategoryID: Joi.number().required(),
        offset : Joi.optional(),
        search : Joi.optional(),
        searchType : Joi.optional(),
    }); 
    
    return schema.validate(data);
}

module.exports = {
    loginValidation,forgetPasswordValidation,forgotPassLinkValidation,resetPasswordValidation,userDataValidation,sponsorsLogoValidation,
    getExhibitorListValidation,sessionAndEventIdValidation,scheduleValidation,deleteScheduleValidation,sessionSurveyValidation,scanDataValidation,
    boothVisitorValidation,getBoothVisitorValidation,followUpVisitorValidation,goldenTicketVisitorValidation,userProfileValidation,eventSurveyValidation,
    trackSessionsValidation,sessionUserValidation,deleteSessionUserValidation,userSessionSurveyValidation,fna2022LoginValidation,tobi2022LoginValidation,
    mdapaLoginValidation,sessionPollingQuestionValidation,getPollingSessionAnsConfigValidation,savePollingAnswersValidation,getSurveySubmittedAnswersValidation,tslAdminLoginValidation,
    tslAdminRegisterValidation,tslClientLoginValidation,tslAddUsersValidation,tslAddPaymentDetailsValidation,saveClientInformationValidation,
    tslAddEventValidation,tslInsertRegTypesPageDesignValidation,tslUpdateRegTypesPageDesignValidation,
    tslInsertRegCategoriesPageDesignValidation,tslAccountIdEventIdValidation,tslUpdateRegCategoriesPageDesignValidation,tslGetRegTypesByIdValidation,
    tslGetRegCategoriesByIdValidation,tslLAccountIdLEventIdValidation,tslGetQuestionsFieldNameValidation,tslUpdateRegInfoFieldsPageValidation,
    tslGetguestsRegistrantsFieldsValidation,tslUpdateGuestRegistrantsFieldsValidation,tslGetCustomQuestionsByIdValidation,tslGetDiscountCodesByIdValidation,
    tslExhibitorInfoValidation,tslAccountIdEventIdRegIDValidation,tslAccountIdEventIdCategoryIdValidation
}