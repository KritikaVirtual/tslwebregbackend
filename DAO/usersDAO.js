"use strict";

let dbConfig = require("../Utilities/dbConfig"),
  util = require("../Utilities/util");
const  util2 = require("util");
const user = require("../Validation/user");
let async = require("async");
const md5 = require("md5");
let nodemailer = require("nodemailer");

//check user login
let login = (dataToSet, callback) => {
  var sql = `select lCodeID as unique_id,sFullName,sEmail, lRegMemExhID as id,lType as roles,lAccountID as account_id from  RegAccessCodes where sAccessCode = '${dataToSet.pass}' and 
    sEmail = '${dataToSet.username}' and lEventID = ${dataToSet.eventId}`;
  //dbConfig.getDB().query(sql, callback);
  dbConfig.getDB().query(sql, function (err, results) {
    //  console.log(results);return;
    if (results.length > 0) {
      var sql1 = `Update RegAccessCodes SET nIsLogin = 1,dtLoginTime = '${util.getCurrentDatetime()}' where lCodeID = ${
        results[0].unique_id
      }`;
      //console.log(sql1);return;
      dbConfig.getDB().query(sql1);
      callback("", results);
    } else {
      callback("error", []);
    }
  });
};

// check user exist
let checkUserExist = (dataToSet, callback) => {
  var sql = `select lCodeID as unique_id,sFullName as name,sEmail as email from RegAccessCodes where sEmail = '${dataToSet.email}' and lEventID = ${dataToSet.eventId}`;
  dbConfig.getDB().query(sql, callback);
};

// insert data for forgot password
let insertDataForForgotPass = (dataToSet, callback) => {
  dbConfig
    .getDB()
    .query("insert into ForgotPassword set ? ", dataToSet, callback);
};

// get link generated time
let getLinkGenerationTime = (dataToSet, callback) => {
  var sql = `select dtCreatedOn as time from ForgotPassword where sEmail = '${dataToSet.email}' and lEventID = ${dataToSet.eventId} and 
    sToken = '${dataToSet.token}'`;
  dbConfig.getDB().query(sql, callback);
};

// get user details based on role
let getUserDataRoleBased = (dataToSet, callback) => {
  let role = dataToSet.role;
  if (role == -1 && dataToSet.isDetails != 1) {
    var sql = `(select lExhibitorID as exhibitorId,0 as linkId,CONCAT(sFirstName, " ", sLastName) AS name,sCompany as company,sProfilePic as profilePic,sFirstName as first_name,sLastName as last_name,
        sEmail as email,sCity as city,sState as state,sCountry as country,sTitle as designation,sPhone as phone from Exhibitors where sEmail = '${dataToSet.username}' and lEventID = ${dataToSet.eventId} and nStatus = 0) UNION 
        (SELECT eb.lMemberID as exhibitorId,eb.lExhibitorID as linkId,CONCAT(eb.sFirstName, " ", eb.sLastName) AS name,e.sCompany as company,eb.sPicture as profilePic,eb.sFirstName as first_name,eb.sLastName as last_name,
        eb.sEmail as email,'' as city,'' as state,'' as country,eb.sTitle as designation,eb.sPhone as phone FROM Exhibitors as e JOIN ExhibitorBoothMembers as eb ON e.lExhibitorID = eb.lExhibitorID WHERE 
        eb.lEventID = ${dataToSet.eventId} AND eb.sEmail = '${dataToSet.username}' AND eb.nStatus = 0)`;
  } else if (dataToSet.isDetails == 1 && dataToSet.eventId == 837) {
    var sql = `select r.lRegID as userId,CONCAT(r.sFirstName, " ", r.sLastName) AS name, r.sCredentials as credentials, r.sCompany as company,TRIM(BOTH "''" FROM r.sPicture) as profilePic,r.sFirstName as first_name,r.sLastName as last_name,
          r.sEmail as email,r.sCity as city,r.sState as state,r.sCountry as country,r.sTitle as designation,r.sPhone as phone,r.lRegType as reg_type from Registrants as r LEFT JOIN RegistrantsGroups as rg ON rg.lEventID = r.lEventID
         and rg.lRegID = r.lRegID where r.sEmail = '${dataToSet.username}' and r.lEventID = ${dataToSet.eventId}`;
  } else if (role == -6 && dataToSet.isDetails != 1) {
    var sql = `select lSpeakerID as speakerId,CONCAT(sFirstName, " ", sLastName) AS name,sCompany as company,sPicture as profilePic,sFirstName as first_name,sLastName as last_name,
        sEmail as email,sCity as city,sState as state,sCountry as country,sTitle as designation,nIsPresenter as isPresenter from Speakers where sEmail = '${dataToSet.username}' and lEventID = ${dataToSet.eventId} and nStatus = 0`;
  } else if (role == -7) {
    var sql = `SELECT eb.lMemberID as userId,eb.lExhibitorID as exhibitorId,CONCAT(eb.sFirstName, " ", eb.sLastName) AS name,e.sCompany as company,eb.sPicture as profilePic,eb.sFirstName as first_name,eb.sLastName as last_name,
        eb.sEmail as email,'' as city,'' as state,'' as country,eb.sTitle as designation FROM Exhibitors as e JOIN ExhibitorBoothMembers as eb ON e.lExhibitorID = eb.lExhibitorID WHERE 
        eb.lEventID = ${dataToSet.eventId} AND eb.sEmail = '${dataToSet.username}'`;
  } else {
    //this query when we show all registarnts list in frontend
    var sql = `select r.lRegID as userId,CONCAT(r.sFirstName, " ", r.sLastName) AS name, r.sCredentials as credentials, r.sCompany as company,TRIM(BOTH "''" FROM r.sPicture) as profilePic,r.sFirstName as first_name,r.sLastName as last_name,
          r.sEmail as email,r.sCity as city,r.sState as state,r.sCountry as country,r.sTitle as designation,r.sPhone as phone,r.lRegType as reg_type from Registrants as r LEFT JOIN RegistrantsGroups as rg ON rg.lEventID = r.lEventID
         and rg.lRegID = r.lRegID where r.sEmail = '${dataToSet.username}' and r.lEventID = ${dataToSet.eventId} order by r.lRegType`;
  }
  dbConfig.getDB().query(sql, callback);
};

// get sponsors logos based on the type passed
let getSponsorsLogoList = (dataToSet, callback) => {
  var sql = `select sFileName as logo,lExhibitorID as exhibitor_id,sLogoType as logo_type,nSortOrder as order_by,
    nLogoLevel as logo_level,sSponserLink as sponsor_link,lSessionID as session_id from SponsersLogo where 
    lEventID = ${dataToSet.eventId} and FIND_IN_SET(${dataToSet.type}, sPageType) and nStatus = 0 order by nSortOrder ASC`;
  //console.log(sql);return;
  dbConfig.getDB().query(sql, callback);
};

// get event messages
let getEventMessages = (dataToSet, callback) => {
  var sql = `select lMessageID as msg_id,sTitle as title,sDesc as description,DATE_FORMAT(sDateTimeToPost, '%m/%d/%Y') as post_time from VCMessages where lEventID = ${
    dataToSet.eventId
  } and nStatus = 0 and sDateTimeToPost <= '${util.getCurrentDatetime()}' order by sDateTimeToPost desc`;
  //console.log(util.getCurrentDatetime());return;
  dbConfig.getDB().query(sql, callback);
};

// get help desk data
let getHelpDeskData = (dataToSet, callback) => {
  var sql = `select lHelpdeskID as help_desk_id,sTitle as title,sDesc as description from VCHelpdesk where lEventID = ${dataToSet.eventId} and nStatus = 0 order by nSortOrder ASC`;
  //console.log(sql);return;
  dbConfig.getDB().query(sql, callback);
};

// get leaderboard data
let getLeaderboardData = (dataToSet, callback) => {
  var sql = `select lGoldenTicketID as golden_ticket_id,headerText as header from VCGoldenTickets where lEventID = ${dataToSet.eventId} `;
  //console.log(sql);return;
  dbConfig.getDB().query(sql, callback);
};

// get all exhibitors data
let getAllExhibitors = (dataToSet, callback) => {
  let searchByKeyword = dataToSet.searchByKeyword,
    searchByCategory = dataToSet.searchByCategory,
    sponserEnableFlag = dataToSet.sponserEnableFlag;
  let searchString = "";

  if (searchByCategory) {
    searchString = ` and FIND_IN_SET(${searchByCategory}, sCategories)`;
  }

  if (searchByKeyword) {
    searchString += ` and sCompany LIKE '%${searchByKeyword}%'`;
  }
  if (sponserEnableFlag) {
    var sql = `select lExhibitorID as exhibitor_id,sCompany as company,sPicture as logo,nSponsorType as sponsors_type from Exhibitors where 
            lEventID = ${dataToSet.eventId} ${searchString} and nSponsorType!=0 order by nSortOrder ASC limit ${dataToSet.offset},${dataToSet.limit}`;
  } else {
    var sql = `select lExhibitorID as exhibitor_id,sCompany as company,sPicture as logo,nSponsorType as sponsors_type from Exhibitors where 
            lEventID = ${dataToSet.eventId} ${searchString} and nExhType=1 and nStatus = 0 order by nSortOrder ASC limit ${dataToSet.offset},${dataToSet.limit}`;
  }
  //console.log(sql);return;
  dbConfig.getDB().query(sql, callback);
};

// get next and precious exhibitor ids
let getNextPrevExhibitorData = (dataToSet, callback) => {
  var sql = `SELECT
            lExhibitorID as exhibitorId
        FROM
            Exhibitors
        WHERE
            (   
        lExhibitorID = IFNULL(
            (
            SELECT
                MIN(lExhibitorID)
            FROM
                Exhibitors
            WHERE
                lExhibitorID > ${dataToSet.exhibitorId} AND lEventID = ${dataToSet.eventId} and nStatus = 0
        ),
        0
        ) OR lExhibitorID = IFNULL(
            (
            SELECT
                MAX(lExhibitorID)
            FROM
                Exhibitors
            WHERE
                lExhibitorID < ${dataToSet.exhibitorId} AND lEventID = ${dataToSet.eventId} and nStatus = 0
        ),
        0
        )
    )`;
  //console.log(sql);return;
  dbConfig.getDB().query(sql, callback);
};

// get session live video data
let getSessionLiveVideoData = (dataToSet, callback) => {
  var sql = `select lv.sSessionId as session_id,stl.sVideoUrl as live_url,stl.sName as session_name,stl.tLiveVideoText as video_text from VCLiveVideos as lv
     join SessionsTrackingList as stl ON lv.sSessionId = stl.lSessionID where lv.lEventID = ${dataToSet.eventId} `;
  //console.log(sql);return;
  dbConfig.getDB().query(sql, callback);
};

// get live event list data
let getLiveEventsList = (dataToSet, callback) => {
  var sql = `select le.lSessionID as session_id,stl.sName as session_name,DATE_FORMAT(dtDate, '%m/%d/%Y') as start_date,DATE_FORMAT(stl.tmStart, '%h:%i %p') as start_time
     from VCLiveEvents as le join SessionsTrackingList as stl ON le.lSessionID = stl.lSessionID where le.lEventID = ${dataToSet.eventId} and le.nStatus = 0 order by dtDate,tmStart ASC`;
  //console.log(sql);return;
  dbConfig.getDB().query(sql, callback);
};

// get technical session data
let getTechnicalSessionList = (dataToSet, callback) => {
  //console.log(dataToSet);return;
  let searchByTrack = dataToSet.searchByTrack,
    searchByName = dataToSet.searchByName,
    sortByDate = dataToSet.sortByDate || "ASC",
    sessionType = dataToSet.sessionType,
    sortByRoom = dataToSet.sortByRoom || "ASC",
    searchByDate = dataToSet.searchByDate;
  let searchString = "";

  if (searchByTrack) {
    searchString += ` and sTrack LIKE '%${searchByTrack}%'`;
  }

  if (searchByName) {
    searchString += ` and (sName LIKE '%${searchByName}%' OR sSpeaker LIKE '%${searchByName}%')`;
  }

  if (searchByDate) {
    searchString += ` and dtDate BETWEEN '${searchByDate} 00:00:00' AND '${searchByDate} 23:59:59'`;
  }
  var sql2 = `select lSpeakerID from Speakers where lEventID = ${dataToSet.eventId} and nStatus = 1`;

  dbConfig.getDB().query(sql2, function (err, results3) {
    var speakerids = [];
    var resultsArray = [];
    if (results3.length) {
      results3.forEach((item) => {
        resultsArray.push(item.lSpeakerID);
      });
    } else {
      // console.log("no data")
    }
    if (resultsArray.length) {
      speakerids = `AND sSpeakerIDs NOT IN (${resultsArray})`;
    }

    if (dataToSet.eventId == 854) {
      // var sql=`select lSessionID as session_id,sName as session_name,sSpeaker as speaker_name,DATE_FORMAT(dtDate, '%m/%d/%Y') as start_date,
      // DATE_FORMAT(tmStart, '%h:%i %p') as start_time,DATE_FORMAT(tmEnd, '%h:%i %p') as end_time,sTrack as track,sRoom as room,lTrackID as track_id,nStatus as sStatus,sSpeakerIDs as speaker_ids,sVideoUrl as video_url,sVideoTitle as video_title,
      // (SELECT Count(*) FROM SessionsPollingAnswers WHERE SessionsPollingAnswers.lRegID = ${dataToSet.userId} AND SessionsPollingAnswers.lEventID = ${dataToSet.eventId} AND SessionsPollingAnswers.lSessionID = SessionsTrackingList.lSessionID AND SessionsPollingAnswers.lAccountID = ${dataToSet.accountId}  ) as TotalAnswers,
      // (SELECT Count(*) FROM SessionsPollingQuestionsConfig WHERE SessionsPollingQuestionsConfig.lEventID = ${dataToSet.eventId} AND SessionsPollingQuestionsConfig.lAccountID = ${dataToSet.accountId} AND SessionsPollingQuestionsConfig.nStatus = 0 AND SessionsPollingQuestionsConfig.sName NOT LIKE '%if no%' ) as TotalQuestion
      // from SessionsTrackingList where ((lEventID = ${dataToSet.eventId} and nIsPoster = 0
      // and nSessionType = ${sessionType} ${searchString} ${speakerids}) OR (sSpeakerIDs="" AND lEventID = ${dataToSet.eventId} ${searchString})) AND nDisplayInTSLVirtual = 1 order by dtDate ASC,tmStart ASC,sRoom ASC`;

      var sql = `select lSessionID as session_id,sName as session_name,sSpeaker as speaker_name,DATE_FORMAT(dtDate, '%m/%d/%Y') as start_date,
                DATE_FORMAT(tmStart, '%h:%i %p') as start_time,DATE_FORMAT(tmEnd, '%h:%i %p') as end_time,sTrack as track,sRoom as room,lTrackID as track_id,nStatus as sStatus,sSpeakerIDs as speaker_ids,sVideoUrl as video_url,sVideoTitle as video_title,
                (SELECT Count(*) FROM SessionsPollingAnswers WHERE SessionsPollingAnswers.lRegID = ${dataToSet.userId} AND SessionsPollingAnswers.lEventID = ${dataToSet.eventId} AND SessionsPollingAnswers.lSessionID = SessionsTrackingList.lSessionID AND SessionsPollingAnswers.lAccountID = ${dataToSet.accountId} AND SessionsPollingAnswers.lQuestionID = 0 AND SessionsPollingAnswers.lAnswerID = 0 ) as isSaved from SessionsTrackingList where ((lEventID = ${dataToSet.eventId} and nIsPoster = 0
                and nSessionType = ${sessionType} ${searchString} ${speakerids}) OR (sSpeakerIDs="" AND lEventID = ${dataToSet.eventId} ${searchString})) AND nDisplayInTSLVirtual = 1 order by dtDate ASC,tmStart ASC,sRoom ASC`;

      //console.log(sql)
    } else {
      var sql = `select lSessionID as session_id,sName as session_name,sSpeaker as speaker_name,DATE_FORMAT(dtDate, '%m/%d/%Y') as start_date,
                DATE_FORMAT(tmStart, '%h:%i %p') as start_time,DATE_FORMAT(tmEnd, '%h:%i %p') as end_time,sTrack as track,sRoom as room,lTrackID as track_id,nStatus as sStatus,sSpeakerIDs as speaker_ids,sVideoUrl as video_url,sVideoTitle as video_title from SessionsTrackingList where ((lEventID = ${dataToSet.eventId} and nIsPoster = 0
                and nSessionType = ${sessionType} ${searchString} ${speakerids}) OR (sSpeakerIDs="" AND lEventID = ${dataToSet.eventId} ${searchString})) AND nDisplayInTSLVirtual = 1 order by dtDate ASC,tmStart ASC,sRoom ASC`;
    }

    dbConfig.getDB().query(sql, function (err, results) {
      if (err) {
        callback("error", []);
      }
      if (results.length) {
        callback("", results);
      } else {
        callback("error", []);
      }
    });
  });
};

// get attendee booth data
let getAttendeeBoothData = (dataToSet, callback) => {
  var sql = `select eb.lBoothID as boothId, eb.sBackgroudColor as bgColor,eb.sWallColor as wallColor,eb.sCompanyVideoLink as companyVideoLink,
    eb.sProductDemoLink as productDemoLink,eb.sCompanyBanner as banner,eb.sCompanyBio as bio,eb.sMedia3 as media3,eb.nMediaType1 as media1Type,
    eb.nMediaType2 as media2Type,eb.nMediaType3 as media3Type,eb.sCompanyBannerText as bannerText,e.sCompany as company,e.sAddress1 as address1,e.sCity as city,sFirstName as first_name,sLastName as last_name,
    e.sState as state,e.sCountry as country,e.sWebSite as website,e.nExhValueType as exhibitor_type,sEmail as email,e.sVideoLinks as team_link from  ExhibitorBoothSetup as eb RIGHT JOIN Exhibitors as e ON eb.lMemberID = e.lExhibitorID
    where e.lExhibitorID = ${dataToSet.exhibitorId} and e.lEventID = ${dataToSet.eventId}`;
  dbConfig.getDB().query(sql, callback);
};

// get session description data
let getSessionDescription = (dataToSet, callback) => {
  var sql = `select lSessionID as session_id,mDescription as description,sName as title from SessionsTrackingList where lEventID = ${dataToSet.eventId} and  lSessionID = ${dataToSet.sessionId}`;
  //console.log(sql);return;
  dbConfig.getDB().query(sql, callback);
};

// get session speaker data
let getSpeakerData = (dataToSet, callback) => {
  var sql = `select ss.lSpeakerID as speaker_id,CONCAT(s.sFirstName, " ", s.sLastName) AS name,s.sTitle as title,s.mAbout as about,s.sPicture as profile_pic,s.sCredentials as credentials
     from SpeakersSessions as ss join Speakers as s ON ss.lSpeakerID = s.lSpeakerID where ss.lEventID = ${dataToSet.eventId} and ss.lSessionID = ${dataToSet.sessionId} and 
     s.nStatus = 0`;
  //console.log(sql);return;
  dbConfig.getDB().query(sql, callback);
};

// get session documents
let getSessionDocuments = (dataToSet, callback) => {
  var sql = `select lDocID as doc_id,sName as name,sFileName as file,nType as type from Documents where lEventID = ${dataToSet.eventId} and  sApplyTo IN (${dataToSet.sessionId}) and nStatus = 0`;
  //console.log(sql);return;
  dbConfig.getDB().query(sql, callback);
};

// get distinct session track list
let getSessionTrackList = (dataToSet, callback) => {
  var sql = `select sTrackName as track,lTrackID as trackId from SessionTracks where lEventID = ${dataToSet.eventId} and nIsTrack = 1`;
  //console.log(sql);return;
  dbConfig.getDB().query(sql, callback);
};

// get session video
let getSessionVideo = (dataToSet, callback) => {
  var sql = `select stl.lSessionID as session_id,stl.sVideoUrl as video_url,stl.sName as session_name,stl.nMinAttendance as min_attendence,stl.tLiveVideoText as video_text,stl.sBanner as banner,
     stl.sBannerLink as banner_link,stl.dCredit1 as session_credit,stl.sVideoButtonText,stl.sOther1 from SessionsTrackingList as stl where stl.lEventID = ${dataToSet.eventId} and stl.lSessionID = ${dataToSet.sessionId}`;
  //console.log(sql);return;
  dbConfig.getDB().query(sql, callback);
};

// save event to schedule
let saveEventToSchedule = (dataToSet, callback) => {
  dbConfig
    .getDB()
    .query("insert into SessionSchedule set ? ", dataToSet, callback);
};

// get session schedule list
let getSessionScheduleList = (dataToSet, callback) => {
  let searchByDate = dataToSet.searchByDate;
  //let listType = dataToSet.listType || 0;
  let searchString = "";
  let statusString = " and ss.nStatus = 0";

  if (searchByDate) {
    searchString = ` and DATE_FORMAT(ss.dtDate, '%m/%d/%Y') = '${searchByDate}'`;
  }
  // if(!listType){
  //     statusString = ` and ss.nStatus = 0`;
  // }
  var sql = `select ss.lScheduleID as schdeule_id,ss.lSessionID as session_id,ss.lMemberID as member_id,
     ss.sName as session_name,DATE_FORMAT(ss.dtDate, '%m/%d/%Y') as start_date,DATE_FORMAT(ss.tmStart, '%h:%i %p') as start_time,
     DATE_FORMAT(ss.tmEnd, '%h:%i %p') as end_time,ss.mNotes as notes,ss.isSession as is_session,ss.nStatus as sStatus,
     st.nStatus as session_status from SessionSchedule as ss left join SessionsTrackingList st on ss.lSessionID = st.lSessionID where
     ss.lEventID = ${dataToSet.eventId} and ss.lMemberID = ${dataToSet.memberId} ${searchString} ${statusString} ORDER BY ss.dtDate ASC, ss.tmStart ASC`;
  //console.log(sql);return;
  dbConfig.getDB().query(sql, callback);
};

// delete event to schedule
let deleteSchedule = (dataToSet, callback) => {
  var sql = `UPDATE SessionSchedule SET nStatus = 1 where lMemberID = ${dataToSet.memberId} and lScheduleID = ${dataToSet.scheduleId} and lEventID = ${dataToSet.eventId}`;
  dbConfig.getDB().query(sql, callback);
};

// get session schedule unique date list
let getScheduleDateList = (dataToSet, callback) => {
  var sql = `SELECT DISTINCT DATE_FORMAT(dtDate, '%m/%d/%Y') as session_date from SessionSchedule where lEventID = ${dataToSet.eventId} and lMemberID = ${dataToSet.memberId} and nStatus = 0`;
  //console.log(sql);return;
  dbConfig.getDB().query(sql, callback);
};

// check session exist in survey list
let checkSessionExist = (dataToSet, callback) => {
  var sql = `select lAuthID as auth_id from VCSessionSurveyAuth where lSessionID = '${dataToSet.sessionId}' and lEventID = ${dataToSet.eventId} 
    and lUserID = ${dataToSet.regId} and nRole = ${dataToSet.role}`;
  dbConfig.getDB().query(sql, callback);
};

// save session into survey list
let insertSessionForSurveyInDb = (dataToSet, callback) => {
  dbConfig
    .getDB()
    .query("insert into VCSessionSurveyAuth set ? ", dataToSet, callback);
};

// save session into survey list
let saveScanData = (dataToSet, callback) => {
  // inserting data on old scan data table for generating certicatezyy

  let scanDataSet = {
    lEventID: dataToSet.eventId,
    lLeadID: dataToSet.regId,
    lAccountID: dataToSet.accountId,
    lSessionID: dataToSet.sessionId,
    lNewSessionID: dataToSet.sessionId,
    sDeviceSerialNumber: dataToSet.serialNumber,
    lScanID: 0,
    dtCreatedOn: util.getCurrentDatetime(),
    dtUpdatedOn: util.getCurrentDatetime(),
    nRole: dataToSet.role,
  };

  dbConfig
    .getDB()
    .query("insert into SessionsTrackingScans set ? ", scanDataSet);
  // end

  // 2nd section
  var sql = `select lTrackID,sDuration from VCSessionTracking where lEventID = ${dataToSet.eventId} and lSessionID = ${dataToSet.sessionId} and 
    lVisitorID = ${dataToSet.regId} and nRole = ${dataToSet.role}`;
  //console.log(sql);return;
  dbConfig.getDB().query(sql, function (err, results) {
    if (err) {
      callback("error", []);
    }

    if (results.length > 0) {
      var totalDuration =
        parseInt(dataToSet.duration) + parseInt(results[0].sDuration);
      //console.log(totalDuration);return;
      var sql = `UPDATE VCSessionTracking SET sDuration = ${totalDuration} where lTrackID = ${results[0].lTrackID}`;
      dbConfig.getDB().query(sql, callback);
    } else {
      let insertDataObj = {
        lEventID: dataToSet.eventId,
        lSessionID: dataToSet.sessionId,
        lVisitorID: dataToSet.regId,
        nRole: dataToSet.role,
        sDuration: dataToSet.duration,
        dtCreatedOn: util.getCurrentDatetime(),
      };

      dbConfig
        .getDB()
        .query("insert into VCSessionTracking set ? ", insertDataObj, callback);
    }
  });
};

// check booth visitor exist
let checkVisitorExist = (dataToSet, callback) => {
  let tableSelected = "VCBoothVisitors";

  var sql = `select lListID as list_id from ${tableSelected} where lExhibitorID = '${dataToSet.exhibitorId}' and lEventID = ${dataToSet.eventId} 
    and lVisitorID = ${dataToSet.visitorId} and nRole = ${dataToSet.role} and isLead = ${dataToSet.isLead}`;
  //console.log(sql);return;
  dbConfig.getDB().query(sql, callback);
};

// save exhibitor booth or lead visitor
let insertBoothOrLeadVisitor = (data, callback) => {
  let role = data.role,
    visitorId = data.visitorId;

  if (role == -1) {
    var sql = `(select sFirstName as firstName, sLastName as lastName,sCompany as company,sAddress1 as address,sAddress2 as address2,
        sCredentials as credentials,sTitle as title,sCity as city,sState as state,sZip as zip,sCountry as country,sPhone as phone,
        sEmail as email from Exhibitors where lExhibitorID = ${visitorId} and lEventID = ${data.eventId}) UNION (SELECT eb.sFirstName as firstName, eb.sLastName AS lastName,e.sCompany as company,
        '' as address,'' as address2,'' as credentials,eb.sTitle as title,'' as city,'' as state,'' as zip,'' as country,
        eb.sPhone as phone,eb.sEmail as email FROM Exhibitors as e JOIN ExhibitorBoothMembers as eb ON e.lExhibitorID = eb.lExhibitorID WHERE 
        eb.lMemberID = ${visitorId} and eb.lEventID = ${data.eventId}) `;
  } else if (role == -6) {
    var sql = `select sFirstName as firstName, sLastName as lastName,sCompany as company,sAddress1 as address,sAddress2 as address2,
        sCredentials as credentials,sTitle as title,sCity as city,sState as state,sZip as zip,sCountry as country,sPhone as phone,
        sEmail as email from Speakers where lSpeakerID = ${visitorId} and lEventID = ${data.eventId}`;
  } else {
    var sql = `select r.sFirstName as firstName, r.sLastName as lastName,r.sCompany as company,r.sAddress1 as address,r.sAddress2 as address2,
        r.sCredentials as credentials,r.sTitle as title,r.sCity as city,r.sState as state,r.sZip as zip,r.sCountry as country,r.sPhone as phone,
        r.sEmail as email from Registrants as r LEFT JOIN RegistrantsGroups as rg ON rg.lEventID = r.lEventID
        and rg.lRegID = r.lRegID where r.lRegID = ${visitorId} and r.lEventID = ${data.eventId}`;
  }
  //console.log(sql);return;
  dbConfig.getDB().query(sql, function (err, results) {
    //console.log(results);return;
    if (results.length > 0) {
      let dataToSet = {
        lEventID: data.eventId,
        lExhibitorID: data.exhibitorId,
        lVisitorID: data.visitorId,
        nRole: data.role,
        isLead: data.isLead,
        sFirstName: results[0].firstName,
        sLastName: results[0].lastName,
        sCompany: results[0].company,
        sAddress: results[0].address,
        sCredentials: results[0].credentials,
        sTitle: results[0].title,
        sAddress2: results[0].address2,
        sCity: results[0].city,
        sState: results[0].state,
        sZip: results[0].zip,
        sCountry: results[0].country,
        sPhone: results[0].phone,
        sEmail: results[0].email,
        dtCreatedOn: util.getCurrentDatetime(),
      };

      dbConfig
        .getDB()
        .query("insert into VCBoothVisitors set ? ", dataToSet, callback);
    } else {
      callback("error", []);
    }
  });
};

// get booth visitor list
let getBoothVisitorList = (dataToSet, callback) => {
  var selectField =
    "sFirstName as firstName, sLastName as lastName,sCompany as company";
  var visibility = dataToSet.visibility;
  var isLead = dataToSet.isLead;
  if (visibility == 1) {
    selectField = `CONCAT(sFirstName, " ", sLastName) AS name,sCompany as company,sCity as city,sState as state,sCountry as country,DATE_FORMAT(dtCreatedOn, '%m/%d/%Y %h:%i %p') as created_date`;
  } else if (visibility == 2) {
    selectField = `sFirstName as firstName, sLastName as lastName,sCompany as company,sCity as city,sState as state,sCountry as country,
        sTitle as title,DATE_FORMAT(dtCreatedOn, '%m/%d/%Y %h:%i %p') as created_date`;
  } else if (visibility == 3) {
    selectField = `sFirstName as firstName, sLastName as lastName,sCompany as company,sCity as city,sState as state,sCountry as country,
        sTitle as title,sCredentials as credentials,sAddress as address1,sAddress2 as address2,sCity as city,sState as state,
        sZip as zip,sCountry as country,sPhone as phone,sEmail as email,DATE_FORMAT(dtCreatedOn, '%m/%d/%Y %h:%i %p') as created_date`;
  }

  var sql = `select ${selectField} from VCBoothVisitors
     where lEventID = ${dataToSet.eventId} and isLead = ${isLead} and lExhibitorID = ${dataToSet.exhibitorId}`;

  dbConfig.getDB().query(sql, callback);
};

// get booth visitor count
let getBoothVisitorsCount = (dataToSet, callback) => {
  var sql = `SELECT COUNT(*) total, SUM(isLead = 1) lead_count, SUM(isLead = 0) visitor_count FROM VCBoothVisitors WHERE 
    lExhibitorID = ${dataToSet.exhibitorId} AND lEventID = ${dataToSet.eventId}`;

  dbConfig.getDB().query(sql, callback);
};

// check follow up visitor exist
let checkFollowUpVisitorExist = (dataToSet, callback) => {
  let tableSelected = "VCFollowUpVisitors";

  var sql = `select lListID as list_id from ${tableSelected} where lExhibitorID = '${dataToSet.exhibitorId}' and lEventID = ${dataToSet.eventId} 
    and lVisitorID = ${dataToSet.visitorId} and nRole = ${dataToSet.role} and sFollowUp = '${dataToSet.followUp}'`;
  //console.log(sql);return;
  dbConfig.getDB().query(sql, callback);
};

// save follow up visitor
let insertFollowUpVisitor = (data, callback) => {
  let role = data.role,
    visitorId = data.visitorId;

  if (role == -1) {
    var sql = `(select sFirstName as firstName, sLastName as lastName,sCompany as company,sAddress1 as address,sAddress2 as address2,
        sCredentials as credentials,sTitle as title,sCity as city,sState as state,sZip as zip,sCountry as country,sPhone as phone,
        sEmail as email from Exhibitors where lExhibitorID = ${visitorId}) UNION (SELECT eb.sFirstName as firstName, eb.sLastName AS lastName,e.sCompany as company,
            '' as address,'' as address2,'' as credentials,eb.sTitle as title,'' as city,'' as state,'' as zip,'' as country,
            eb.sPhone as phone,eb.sEmail as email FROM Exhibitors as e JOIN ExhibitorBoothMembers as eb ON e.lExhibitorID = eb.lExhibitorID WHERE 
            eb.lMemberID = ${visitorId}) `;
  } else if (role == -6) {
    var sql = `select sFirstName as firstName, sLastName as lastName,sCompany as company,sAddress1 as address,sAddress2 as address2,
        sCredentials as credentials,sTitle as title,sCity as city,sState as state,sZip as zip,sCountry as country,sPhone as phone,
        sEmail as email from Speakers where lSpeakerID = ${visitorId}`;
  } else {
    var sql = `select r.sFirstName as firstName, r.sLastName as lastName,r.sCompany as company,r.sAddress1 as address,r.sAddress2 as address2,
        r.sCredentials as credentials,r.sTitle as title,r.sCity as city,r.sState as state,r.sZip as zip,r.sCountry as country,r.sPhone as phone,
        r.sEmail as email from Registrants as r LEFT JOIN RegistrantsGroups as rg ON rg.lEventID = r.lEventID
        and rg.lRegID = r.lRegID where r.lRegID = ${visitorId}`;
  }
  //console.log(sql);return;
  dbConfig.getDB().query(sql, function (err, results) {
    if (results.length > 0) {
      let dataToSet = {
        lEventID: data.eventId,
        lExhibitorID: data.exhibitorId,
        lVisitorID: data.visitorId,
        nRole: data.role,
        sFollowUp: data.followUp,
        sFirstName: results[0].firstName,
        sLastName: results[0].lastName,
        sCompany: results[0].company,
        sAddress: results[0].address,
        sCredentials: results[0].credentials,
        sTitle: results[0].title,
        sAddress2: results[0].address2,
        sCity: results[0].city,
        sState: results[0].state,
        sZip: results[0].zip,
        sCountry: results[0].country,
        sPhone: results[0].phone,
        sEmail: results[0].email,
        dtCreatedOn: util.getCurrentDatetime(),
      };

      dbConfig
        .getDB()
        .query("insert into VCFollowUpVisitors set ? ", dataToSet, callback);
    } else {
      callback("error", []);
    }
  });
};

// get follow up visitor list
let getFollowupVisitorList = (dataToSet, callback) => {
  let selectField = `sFirstName as firstName, sLastName as lastName,sCompany as company,sCity as city,sState as state,sCountry as country,
    sTitle as title,sCredentials as credentials,sAddress as address1,sAddress2 as address2,sCity as city,sState as state,
    sZip as zip,sCountry as country,sPhone as phone,sEmail as email,sFollowUp as followUp`;

  var sql = `select ${selectField} from VCFollowUpVisitors
     where lEventID = ${dataToSet.eventId} and lExhibitorID = ${dataToSet.exhibitorId}`;

  dbConfig.getDB().query(sql, callback);
};

// get golden ticket info
let getGoldenTicketInfo = (dataToSet, callback) => {
  var sql = `SELECT lGoldenTicketID as ticket_id,headerText,ticketOnExhibit,ticketValueExhibit,ticketOnConference,ticketValueConference,
    ticketOnNetworking,ticketValueNetworking from VCGoldenTickets where lEventID = ${dataToSet.eventId}`;
  //console.log(sql);return;
  dbConfig.getDB().query(sql, callback);
};

// check golden ticket visitor exist
let checkGoldenTicketVisitorExist = (dataToSet, callback) => {
  let tableSelected = "VCGlodenTicketVisitors";
  let whereCond = "";
  if (dataToSet.sessionId) {
    whereCond = ` and lSessionID = ${dataToSet.sessionId}`;
  } else if (dataToSet.exhibitorId) {
    whereCond = ` and lExhibitorID = ${dataToSet.exhibitorId}`;
  }

  var sql = `select lListID as list_id from ${tableSelected} where lEventID = ${dataToSet.eventId} 
    and lVisitorID = ${dataToSet.visitorId} and sLinkPage = '${dataToSet.linkPage}' ${whereCond}`;
  //console.log(sql);return;
  dbConfig.getDB().query(sql, callback);
};

// save golden ticket visitor
let insertGoldenTicketVisitor = (data, callback) => {
  let visitorId = data.visitorId;

  var sql = `select r.sFirstName as firstName, r.sLastName as lastName,r.sCompany as company,r.sAddress1 as address,r.sAddress2 as address2,
    r.sCredentials as credentials,r.sTitle as title,r.sCity as city,r.sState as state,r.sZip as zip,r.sCountry as country,r.sPhone as phone,
    r.sEmail as email from Registrants as r LEFT JOIN RegistrantsGroups as rg ON rg.lEventID = r.lEventID
    and rg.lRegID = r.lRegID where r.lRegID = ${visitorId}`;
  //console.log(sql);return;
  dbConfig.getDB().query(sql, function (err, results) {
    if (results.length > 0) {
      let dataToSet = {
        lEventID: data.eventId,
        lVisitorID: data.visitorId,
        lSessionID: data.sessionId || 0,
        lExhibitorID: data.exhibitorId || 0,
        nRole: -10,
        nTokenValue: data.ticketValue,
        sLinkPage: data.linkPage,
        sFirstName: results[0].firstName,
        sLastName: results[0].lastName,
        sCompany: results[0].company,
        sAddress: results[0].address,
        sCredentials: results[0].credentials,
        sTitle: results[0].title,
        sAddress2: results[0].address2,
        sCity: results[0].city,
        sState: results[0].state,
        sZip: results[0].zip,
        sCountry: results[0].country,
        sPhone: results[0].phone,
        sEmail: results[0].email,
        dtCreatedOn: util.getCurrentDatetime(),
      };

      dbConfig
        .getDB()
        .query(
          "insert into VCGlodenTicketVisitors set ? ",
          dataToSet,
          callback
        );
    } else {
      callback("error", []);
    }
  });
};

// get golden ticket user list
let getGoldenTicketUserList = (dataToSet, callback) => {
  var sql = `SELECT SUM(nTokenValue) as total_points,concat(sFirstName," ",sLastName) as name,sFirstName as firstName, sLastName as lastName,sCompany as company,sCity as city,sState as state,sCountry as country,
    sTitle as title,sCredentials as credentials,sAddress as address1,sAddress2 as address2,sZip as zip,sPhone as phone,sEmail as email FROM VCGlodenTicketVisitors WHERE 
    lEventID = ${dataToSet.eventId} GROUP BY lVisitorID order by total_points DESC`;
  //console.log(sql);return;
  dbConfig.getDB().query(sql, callback);
};

// update attendee or  booth contact data
let updateUserProfile = (dataToSet, callback) => {
  let userType = dataToSet.type;
  if (userType == -7) {
    var sql = `UPDATE ExhibitorBoothMembers SET sFirstName = '${
      dataToSet.firstName
    }', sLastName = '${dataToSet.lastName}',
      sPhone = '${dataToSet.phone}', sTitle = '${
      dataToSet.title
    }', sPicture = '${
      dataToSet.image
    }',dtUpdatedOn = '${util.getCurrentDatetime()}'
      where lMemberID = ${dataToSet.userId} and lEventID = ${
      dataToSet.eventId
    }`;
    dbConfig.getDB().query(sql, callback);
  } else if (userType == -10) {
    var sql = `UPDATE Registrants SET sFirstName = '${
      dataToSet.firstName
    }', sLastName = '${dataToSet.lastName}',
      sPhone = '${dataToSet.phone}', sTitle = '${
      dataToSet.title
    }', sPicture = '${
      dataToSet.image
    }',dtUpdatedOn = '${util.getCurrentDatetime()}'
      where lRegID = ${dataToSet.userId} and lEventID = ${dataToSet.eventId}`;
    dbConfig.getDB().query(sql, function (err, results) {
      var sql2 = `UPDATE Registrants SET sPicture = '${dataToSet.image}'
        where sEmail = '${dataToSet.username}' and lRegID <> ${dataToSet.userId} and lEventID = ${dataToSet.eventId}`;
      dbConfig.getDB().query(sql2);
      callback("", results);
    });
  } else if (userType == -100) {
    var sql = `UPDATE Registrants SET sFirstName = '${
      dataToSet.firstName
    }', sLastName = '${dataToSet.lastName}',
        sPhone = '${dataToSet.phone}', sTitle = '${
      dataToSet.title
    }', sPicture = '${dataToSet.image}',
        sCompany = '${dataToSet.company}', sCity = '${
      dataToSet.city
    }', sState = '${dataToSet.state}', 
        sCountry = '${
          dataToSet.country
        }', dtUpdatedOn = '${util.getCurrentDatetime()}'
        where lRegID = ${dataToSet.userId} and lEventID = ${dataToSet.eventId}`;
    dbConfig.getDB().query(sql, function (err, results) {
      // if(results.length > 0){
      var sql2 = `UPDATE Registrants SET sPicture = '${dataToSet.image}'
                    where sEmail = '${dataToSet.username}' and lRegID <> ${dataToSet.userId} and lEventID = ${dataToSet.eventId}`;
      dbConfig.getDB().query(sql2);
      callback("", results);
    });
  } else {
    callback("error", []);
  }
};

// check scan data visitor exist
let checkScanDataForUser = (dataToSet, callback) => {
  var sql = `select stl.lID as scan_id,vcst.sDuration from SessionsTrackingScans as stl join VCSessionTracking as vcst
    on stl.lSessionID = vcst.lSessionID and stl.lEventID = vcst.lEventID and stl.lLeadID = vcst.lVisitorID
      where stl.lEventID = ${dataToSet.eventId} and stl.lSessionID = ${dataToSet.sessionId} and stl.lLeadID = '${dataToSet.regId}'`;
  //console.log(sql);return;
  dbConfig.getDB().query(sql, callback);
};

// get count of login users
let getLoginUsers = (dataToSet, callback) => {
  var sql = `SELECT COUNT(lCodeID) as total_count FROM RegAccessCodes WHERE nIsLogin = 1 AND lEventID = ${dataToSet}`;
  //console.log(sql);return;
  dbConfig.getDB().query(sql, callback);
};

// logout user
let logoutUser = (dataToSet, callback) => {
  var sql = `UPDATE RegAccessCodes SET nIsLogin = 0 where lEventID = ${dataToSet.eventId} and sEmail = '${dataToSet.email}'`;
  //console.log(sql);return;
  dbConfig.getDB().query(sql, callback);
};

// check user login entry exist
let checkLoginInfo = (dataToSet, callback) => {
  var sql = `select lLoginID as login_id from VCLoginUsers where lEventID = ${
    dataToSet.eventId
  } and sEmail = '${dataToSet.email}' and 
    DATE(dtLoginDate) = DATE('${util.getCurrentDatetime()}')`;
  //console.log(sql);return;
  dbConfig.getDB().query(sql, callback);
};

// save user login detail
let insertLoginInfo = (dataToSet, callback) => {
  let saveData = {
    lEventID: dataToSet.eventId,
    sEmail: dataToSet.email,
    dtLoginDate: util.getCurrentDatetime(),
  };
  dbConfig.getDB().query("insert into VCLoginUsers set ? ", saveData, callback);
};

// check event survey exist  for user
let checkSurveyExist = (dataToSet, callback) => {
  let tableSelected = "VCSiteSurveyAnswers";

  var sql = `select * from ${tableSelected} where lAccountID = '${dataToSet.userId}' and lEventID = ${dataToSet.eventId} 
    and lRegID = ${dataToSet.regId}`;
  //console.log(sql);return;
  dbConfig.getDB().query(sql, callback);
};

// get session track list
let getTrackList = (dataToSet, callback) => {
  var sql = `SELECT lTrackID as track_id,sTrackName as track_name FROM SessionTracks WHERE lEventID = ${dataToSet.eventId}`;
  //console.log(sql);return;
  dbConfig.getDB().query(sql, callback);
};

// get live session list based on track
let getTrackLiveSessionList = (dataToSet, callback) => {
  var sql = `SELECT DATE_FORMAT(now(),'%m/%d/%Y %h:%i %p') as server_time,DATE_FORMAT(lv.dtTimeForLive, '%m/%d/%Y %h:%i %p') as live_time,DATE_FORMAT(lv.dtEndTime, '%m/%d/%Y %h:%i %p') as end_time,stl.sName as session_name,stl.lSessionID as session_id, 
    stl.sTrack as track_name,stl.sVideoUrl as video_url,DATE_FORMAT(stl.dtDate, '%m/%d/%Y') as session_start_date,DATE_FORMAT(stl.tmStart, '%h:%i %p') as session_start_time
    FROM VCLiveVideos as lv JOIN SessionsTrackingList as stl ON lv.sSessionId = stl.lSessionID AND lv.lEventID = stl.lEventID  
    WHERE (dtTimeForLive > now() OR dtEndTime > now()) AND stl.lTrackID = ${dataToSet.trackId} AND stl.lEventID = ${dataToSet.eventId} ORDER BY live_time LIMIT 2`;
  //console.log(sql);return;
  dbConfig.getDB().query(sql, callback);
};

//check user login single signon
let singleSignonLogin = (dataToSet, callback) => {
  var sql = `select regAcc.lCodeID as unique_id,evt.sStatus as sStatus,regAcc.sFullName,sEmail, regAcc.lRegMemExhID as id,regAcc.lType as roles,regAcc.lAccountID as account_id from RegAccessCodes as regAcc left join Events evt on regAcc.lEventID=evt.lEventID where regAcc.sAccessCode = '${dataToSet.pass}' and 
    regAcc.sEmail = '${dataToSet.username}' and regAcc.lEventID = ${dataToSet.eventId}`;
  //dbConfig.getDB().query(sql, callback);
  dbConfig.getDB().query(sql, function (err, results) {
    //  console.log(results);return;
    if (results.length > 0) {
      var sql1 = `Update RegAccessCodes SET nIsLogin = 1,dtLoginTime = '${util.getCurrentDatetime()}' where lCodeID = ${
        results[0].unique_id
      }`;
      //console.log(sql1);return;
      dbConfig.getDB().query(sql1);
      callback("", results);
    } else {
      callback("error", []);
    }
  });
};

// to check user survey exist for session
let checkUserSurveyExistForSession = (dataToSet, callback) => {
  let listId = dataToSet.listId;
  let condition = "";
  if (listId) {
    condition = `and lListID <> ${listId}`;
  }
  var sql = `select lListID as list_id from VCUserSessionSurvey where lSessionID = '${dataToSet.sessionId}' and lEventID = ${dataToSet.eventId} and 
    lVisitorID = ${dataToSet.visitorId} and nRole = ${dataToSet.role} ${condition}`;
  dbConfig.getDB().query(sql, callback);
};

// save user survey for session
let insertUserSurveyForSession = (dataToSet, callback) => {
  let listId = dataToSet.listId;
  if (listId) {
    let updatedData = {
      nUpVote: dataToSet.vote,
      nComment: util.mysql_real_escape_string(dataToSet.comment),
    };
    let updateSet = Object.keys(updatedData).map((value) => {
      if (updatedData[value]) return ` ${value}  = "${updatedData[value]}"`;
    });

    let updateString = updateSet.join(",").replace(/(^[,\s]+)|([,\s]+$)/g, "");
    updateString = updateString.replace(/,+/g, ",");
    var sql = `UPDATE VCUserSessionSurvey SET ${updateString}
      where lListID = ${listId} and lVisitorID = ${dataToSet.visitorId} and lEventID = ${dataToSet.eventId}`;
    dbConfig.getDB().query(sql, callback);
  } else {
    let saveData = {
      lEventID: dataToSet.eventId,
      lSessionID: dataToSet.sessionId,
      lVisitorID: dataToSet.visitorId,
      nRole: dataToSet.role,
      nUpVote: dataToSet.vote,
      nComment: dataToSet.comment
        ? util.mysql_real_escape_string(dataToSet.comment)
        : "",
      dtCreatedOn: util.getCurrentDatetime(),
    };
    dbConfig
      .getDB()
      .query("insert into VCUserSessionSurvey set ? ", saveData, callback);
  }
};

// get session survey data
let getUserSessionSurveyData = (dataToSet, callback) => {
  var sql = `SELECT lListID as list_id,nUpVote as vote,nComment as comment FROM VCUserSessionSurvey WHERE lEventID = ${dataToSet.eventId} and 
    lSessionID = ${dataToSet.sessionId} and lVisitorID = ${dataToSet.regId} and nRole = ${dataToSet.role}`;
  //console.log(sql);return;
  dbConfig.getDB().query(sql, callback);
};

// get session unique date list
let getSessionDateList = (dataToSet, callback) => {
  var sql = `SELECT DISTINCT date_format(dtDate, '%Y-%m-%d') as dates from SessionsTrackingList WHERE 
    lEventID = ${dataToSet.eventId} order by dates`;
  //console.log(sql);return;
  dbConfig.getDB().query(sql, callback);
};

// save session in and out data into survey list
let saveInOutScanData = (dataToSet, callback) => {
  // inserting data on old scan data table for generating certicatezyy
  for (let index = 0; index < dataToSet.length; index++) {
    const element = dataToSet[index];

    let scanDataSet = {
      lEventID: element.eventId,
      lLeadID: element.regId,
      lAccountID: element.accountId,
      lSessionID: element.sessionId,
      lNewSessionID: element.sessionId,
      sDeviceSerialNumber: element.serialNumber,
      lScanID: 0,
      dtCreatedOn: element.addTime
        ? element.addTime
        : util.getCurrentDatetime(),
      dtUpdatedOn: element.addTime
        ? element.addTime
        : util.getCurrentDatetime(),
      nRole: element.role,
    };

    dbConfig
      .getDB()
      .query("insert into SessionsTrackingScans set ? ", scanDataSet);
    // end

    // 2nd section
    var sql = `select lTrackID,sDuration from VCSessionTracking where lEventID = ${element.eventId} and lSessionID = ${element.sessionId} and 
        lVisitorID = ${element.regId} and nRole = ${element.role}`;
    //console.log(sql);return;
    dbConfig.getDB().query(sql, function (err, results) {
      if (err) {
        callback("error", []);
      }

      if (results.length > 0) {
        var totalDuration =
          parseInt(element.duration) + parseInt(results[0].sDuration);
        //console.log(totalDuration);return;
        var sql = `UPDATE VCSessionTracking SET sDuration = ${element.duration} where lTrackID = ${results[0].lTrackID}`;
        dbConfig.getDB().query(sql);
      } else {
        if (index > 0) {
          let insertDataObj = {
            lEventID: element.eventId,
            lSessionID: element.sessionId,
            lVisitorID: element.regId,
            nRole: element.role,
            sDuration: element.duration,
            dtCreatedOn: util.getCurrentDatetime(),
          };

          dbConfig
            .getDB()
            .query("insert into VCSessionTracking set ? ", insertDataObj);
        }
      }
    });
  }
  callback("", { insertId: 1 });
};

// get booth visitor count
let getSpeakerNameBasedOnId = (element1) => {
  return new Promise((resolve) => {
    if (util.isNumber(element1)) {
      let sql1 = `SELECT CONCAT(sFirstName, ' ', sLastName) as speakerName FROM Speakers where lSpeakerID = ${element1}`;
      dbConfig.getDB().query(sql1, function (err, results1) {
        if (results1.length > 0) {
          resolve(["", results1[0]]);
        } else {
          resolve(["", { speakerName: "" }]);
        }
      });
    } else {
      resolve(["", { speakerName: element1 }]);
    }
  });
};

let getSessionList = (dataToSet) => {
  return new Promise((resolve) => {
    let searchByTrack = dataToSet.searchByTrack,
      searchByName = dataToSet.searchByName,
      sortByDate = dataToSet.sortByDate || "ASC",
      sessionType = dataToSet.sessionType,
      sortByRoom = dataToSet.sortByRoom || "ASC",
      searchByDate = dataToSet.searchByDate;
    let searchString = "";

    if (searchByTrack) {
      searchString += ` and sTrack LIKE '%${searchByTrack}%'`;
    }

    if (searchByName) {
      searchString += ` and (sName LIKE '%${searchByName}%' OR sSpeaker LIKE '%${searchByName}%')`;
    }

    if (searchByDate) {
      searchString += ` and dtDate BETWEEN '${searchByDate} 00:00:00' AND '${searchByDate} 23:59:59'`;
    }

    var sql = `select lSessionID as session_id,sName as session_name,sSpeaker as speaker_name,DATE_FORMAT(dtDate, '%m/%d/%Y') as start_date,
        DATE_FORMAT(tmStart, '%h:%i %p') as start_time,sTrack as track,sRoom as room,lTrackID as track_id from SessionsTrackingList where lEventID = ${dataToSet.eventId} and nDisplayInTSLVirtual = 1 and nIsPoster = 0
        and nSessionType = ${sessionType} ${searchString} order by dtDate,tmStart ${sortByDate},sRoom ${sortByRoom} limit 10`;
    dbConfig.getDB().query(sql, function (err, response) {
      resolve([err, response]);
    });
  });
};

// fna2022 user login
let fna2022Login = (dataToSet, callback) => {
  var sql = `select lRegID as unique_id,CONCAT(sFirstName, ' ', sLastName) as name,sEmail as email,lAccountID as account_id from Registrants where sEmail = '${dataToSet.username}' and lEventID = ${dataToSet.eventId}`;
  //console.log(sql);return;
  dbConfig.getDB().query(sql, callback);
};

//tobi2022 user login
let tobi2022Login = (dataToSet, callback) => {
  var sql = `select lRegID as unique_id,CONCAT(sFirstName, ' ', sLastName) as name,sEmail as email,lAccountID as account_id from Registrants where sEmail = '${dataToSet.username}' and lEventID = ${dataToSet.eventId}`;
  dbConfig.getDB().query(sql, function (err, results) {
    if (results.length > 0) {
      let resultsArray = [];
      let obj = {};
      results.forEach((item) => {
        obj.unique_id = item.unique_id;
        obj.id = item.id;
        obj.name = item.name;
        obj.email = item.email;
        obj.account_id = item.account_id;
        obj.roles = "111";
      });
      resultsArray.push(obj);
      callback("", resultsArray);
    } else {
      //Check for Exhibitor
      var sql1 = `SELECT lExhibitorID as unique_id, lExhibitorID as id, CONCAT(sFirstName, ' ', sLastName) as name, sEmail as email, lAccountID as account_id FROM Exhibitors where  
            sEmail = '${dataToSet.username}' and lEventID = ${dataToSet.eventId}`;
      dbConfig.getDB().query(sql1, function (err, results2) {
        if (results2.length > 0) {
          let resultsArray = [];
          let obj = {};
          results2.forEach((item) => {
            obj.unique_id = item.unique_id;
            obj.id = item.id;
            obj.name = item.name;
            obj.email = item.email;
            obj.account_id = item.account_id;
            obj.roles = "-1";
          });
          resultsArray.push(obj);
          callback("", resultsArray);
        } else {
          //Check for Speaker
          var sql2 = `SELECT lSpeakerID as unique_id, lSpeakerID as id, CONCAT(sFirstName, ' ', sLastName) as name, sEmail as email, lAccountID as account_id FROM Speakers where  
                    sEmail = '${dataToSet.username}' and lEventID = ${dataToSet.eventId}`;
          dbConfig.getDB().query(sql2, function (err, results3) {
            if (results3.length > 0) {
              let resultsArray = [];
              let obj = {};
              results3.forEach((item) => {
                obj.unique_id = item.unique_id;
                obj.id = item.id;
                obj.name = item.name;
                obj.email = item.email;
                obj.account_id = item.account_id;
                obj.roles = "-6";
              });
              resultsArray.push(obj);
              callback("", resultsArray);
            } else {
              callback("error", []);
            }
          });
        }
      });
    }
  });
};

//mdapaLogin user login
let mdapaLogin = (dataToSet, callback) => {
  var sql = `select lRegID as unique_id,CONCAT(sFirstName, ' ', sLastName) as name,sEmail as email,lAccountID as account_id from Registrants where sEmail = '${dataToSet.username}' and lEventID = ${dataToSet.eventId}`;
  dbConfig.getDB().query(sql, function (err, results) {
    if (results.length > 0) {
      let resultsArray = [];
      let obj = {};
      results.forEach((item) => {
        obj.unique_id = item.unique_id;
        obj.id = item.id;
        obj.name = item.name;
        obj.email = item.email;
        obj.account_id = item.account_id;
        obj.roles = "111";
      });
      resultsArray.push(obj);
      callback("", resultsArray);
    } else {
      //Check for Exhibitor
      var sql1 = `SELECT lExhibitorID as unique_id, lExhibitorID as id, CONCAT(sFirstName, ' ', sLastName) as name, sEmail as email, lAccountID as account_id FROM Exhibitors where  
            sEmail = '${dataToSet.username}' and lEventID = ${dataToSet.eventId}`;
      dbConfig.getDB().query(sql1, function (err, results2) {
        if (results2.length > 0) {
          let resultsArray = [];
          let obj = {};
          results2.forEach((item) => {
            obj.unique_id = item.unique_id;
            obj.id = item.id;
            obj.name = item.name;
            obj.email = item.email; 
            obj.account_id = item.account_id;
            obj.roles = "-1";
          });
          resultsArray.push(obj);
          callback("", resultsArray);
        } else {
          //Check for Speaker
          var sql2 = `SELECT lSpeakerID as unique_id, lSpeakerID as id, CONCAT(sFirstName, ' ', sLastName) as name, sEmail as email, lAccountID as account_id FROM Speakers where  
                    sEmail = '${dataToSet.username}' and lEventID = ${dataToSet.eventId}`;
          dbConfig.getDB().query(sql2, function (err, results3) {
            if (results3.length > 0) {
              let resultsArray = [];
              let obj = {};
              results3.forEach((item) => {
                obj.unique_id = item.unique_id;
                obj.id = item.id;
                obj.name = item.name;
                obj.email = item.email;
                obj.account_id = item.account_id;
                obj.roles = "-6";
              });
              resultsArray.push(obj);
              callback("", resultsArray);
            } else {
              callback("error", []);
            }
          });
        }
      });
    }
  });
};

// get session survey data
let getPollingSessionQuestions = (dataToSet, callback) => {
  var sql = `Select * from SessionsPollingQuestionsConfig where lAccountID = ${dataToSet.accountId} and lEventID = ${dataToSet.eventId} and nStatus = 0  and find_in_set(${dataToSet.sessionId},sApplyToSessions) order by nOrder`;
  dbConfig.getDB().query(sql, callback);
};

// get answer confit for polling questions
let getPollingSessionAnsConfig = (dataToSet, callback) => {
  var sql = `Select lQuestionID,lAnswerID, sAnswer from SessionsPollingAnswersConfig where lAccountID = ${dataToSet.accountId} and lEventID = ${dataToSet.eventId} and lQuestionID IN (${dataToSet.questionArray})`;
  //console.log(sql);return;
  dbConfig.getDB().query(sql, callback);
};

// save polling answers
let savePollingAnswers = (dataToSet, callback) => {
  //delete all records
  var sql = `Delete from SessionsPollingAnswers where lAccountID = ${dataToSet.lAccountID} and lEventID = ${dataToSet.lEventID} and lSessionID=${dataToSet.lSessionID} and lRegID = ${dataToSet.userId}`;

  dbConfig.getDB().query(sql, function (err, results) {
    var sql2 = `INSERT INTO SessionsPollingAnswers (lAccountID, lEventID,lSessionID,lQuestionID,lRegID,lAnswerID,sOther) VALUES ${dataToSet.data}`;
    //console.log(sql2)
    dbConfig.getDB().query(sql2, callback);
  });
};

// get session survey data
let getSurveySubmittedAnswers = (dataToSet, callback) => {
  var sql = `Select * from SessionsPollingAnswers where lAccountID = ${dataToSet.accountId} and lEventID = ${dataToSet.eventId} and lSessionID = ${dataToSet.sessionId} and lRegID = ${dataToSet.userId}`;
  //console.log(sql);return;
  dbConfig.getDB().query(sql, callback);
};

let tslAdminLogin = (dataToSet, callback) => {
  var sql = `select * from  Admin where sUserPassword = '${dataToSet.password}' and 
    sUserName = '${dataToSet.username}'`;
  //dbConfig.getDB().query(sql, callback);
  dbConfig.getDB().query(sql, function (err, results) {
    //  console.log(results);return;
    if (results && results.length > 0) {
      callback("", results);
    } else {
      callback("error", []);
    }
  });
};

// check TSL Admin exist
let checkAdminExist = (dataToSet, callback) => {
  var sql = `select sUserName as username from Admin where sUserName = '${dataToSet.username}'`;
  dbConfig.getDB().query(sql, callback);
};

// insert TSL Admin Registration
let insertTslAdmin = (saveData, callback) => {
  dbConfig.getDB().query("insert into Admin set ? ", saveData, callback);
};

// get total number of records of users

let getUserTotalCount = (dataToSet, callback) => {
  let searchByKeyword = dataToSet.search
    ? ` and sBillCompany LIKE '%${dataToSet.search}%'`
    : "";

  var sql = `SELECT COUNT(*) as user_count FROM (Select u.lAccountID as acc_id From Users as u
    LEFT JOIN Accounts as a on a.lAccountID = u.lAccountID where a.sBillCompany != 'DELETE' ${searchByKeyword} GROUP BY u.lAccountID) as user`;
  dbConfig.getDB().query(sql, callback);
};

// get User List

let getUserList = (dataToSet, callback) => {
  let searchByKeyword = dataToSet.search
    ? ` and sBillCompany LIKE '%${dataToSet.search}%'`
    : "";

  let limit = dataToSet.limit ? dataToSet.limit : 10;
  let offset_query = dataToSet.offset
    ? ` LIMIT ${dataToSet.offset},${limit}`
    : `LIMIT ${limit}`;

  var sql = `Select u.lAccountID, u.lLoginID, u.sFirstName, u.sLastName, u.lLastEventID, u.sLastScreen, a.sBillCompany From Users as u
     LEFT JOIN Accounts as a on a.lAccountID = u.lAccountID where a.sBillCompany != 'DELETE' ${searchByKeyword} GROUP BY u.lAccountID ${offset_query}`;
  // console.log(sql);
  dbConfig.getDB().query(sql, callback);
};

let tslClientLogin = (dataToSet, callback) => {
  var sql = `select * from  Users where sUserPassword = '${dataToSet.password}' and 
    sUserName = '${dataToSet.username}'`;
  //dbConfig.getDB().query(sql, callback);
  dbConfig.getDB().query(sql, function (err, results) {
    if (results && results.length > 0) {
      callback("", results);
    } else {
      callback("error", []);
    }
  });
};

// get total number of records of users

let getUserTotalCountById = (dataToSet, callback) => {
  let searchByKeyword = dataToSet.search
    ? ` and sUserName LIKE '%${dataToSet.search}%'`
    : "";

  var sql = `SELECT COUNT(*) as user_count FROM Users where lAccountID ='${dataToSet.userId}' ${searchByKeyword}`;
  dbConfig.getDB().query(sql, callback);
};

let getUserListById = (dataToSet, callback) => {
  let searchByKeyword = dataToSet.search
    ? ` and sUserName LIKE '%${dataToSet.search}%'`
    : "";
  let limit = dataToSet.limit ? dataToSet.limit : 10;
  let offset_query = dataToSet.offset
    ? ` LIMIT ${dataToSet.offset},${limit}`
    : `LIMIT ${limit}`;
  var sql = `SELECT lLoginID,lAccountID as userId,sUserName,sUserPassword, sFirstName, sLastName, lRoleID, sStatus, dtCreatedOn, dtUpdatedOn FROM Users where lAccountID ='${dataToSet.userId}' ${searchByKeyword} ${offset_query}`;
  // console.log(sql);
  dbConfig.getDB().query(sql, callback);
};

let tslEditUser = (dataToSet, callback) => {
  if (dataToSet.sBillCompany) {
    var sql = `UPDATE Users SET sUserName = '${
      dataToSet.sUserName
    }', sUserPassword = '${dataToSet.sUserPassword}', sFirstName = '${
      dataToSet.sFirstName
    }', sLastName = '${dataToSet.sLastName}',lRoleID = '${
      dataToSet.lRoleID
    }', sStatus = '${
      dataToSet.sStatus
    }',dtUpdatedOn = '${util.getCurrentDatetime()}' where lAccountID ='${
      dataToSet.userId
    }' LIMIT 1`;
  } else {
    var sql = `UPDATE Users SET sUserName = '${
      dataToSet.sUserName
    }', sUserPassword = '${dataToSet.sUserPassword}', sFirstName = '${
      dataToSet.sFirstName
    }', sLastName = '${dataToSet.sLastName}',lRoleID = '${
      dataToSet.lRoleID
    }', sStatus = '${
      dataToSet.sStatus
    }',dtUpdatedOn = '${util.getCurrentDatetime()}' where lLoginID ='${
      dataToSet.lLoginID
    }'`;
  }

  dbConfig.getDB().query(sql, callback);
};

// delete User from Account List
let tslDeleteUser = (dataToSet, callback) => {
  // console.log(dataToSet);
  var sql = `Delete from Users where lLoginID = ${dataToSet.userId}`;
  dbConfig.getDB().query(sql, callback);
};

// add User with Account Id

// insert data for forgot password
let tslAddUsers = (dataToSet, callback) => {
  dbConfig.getDB().query("insert into Users set ? ", dataToSet, callback);
};

// insert data for forgot password
let tslAddPaymentDetails = (dataToSet, callback) => {
  var sql = `SELECT lAccountID from AccountPaymentDetails where lAccountID ='${dataToSet.lAccountID}'`;
  dbConfig.getDB().query(sql, function (err, results) {
    let resField = JSON.parse(JSON.stringify(results));
    if (resField && resField.length > 0) {
      dbConfig
        .getDB()
        .query(`Update AccountPaymentDetails set paymentID = '${dataToSet.paymentID}', paymentDetails = '${dataToSet.paymentDetails}'
         WHERE lAccountID ='${dataToSet.lAccountID}'`,callback);
    } else {
      dbConfig
        .getDB()
        .query("insert into AccountPaymentDetails set ? ", dataToSet, callback);
    }
    
  });
};

// Get Payment Details At Account Section
let tslGetPaymentDetails = (dataToSet, callback) => {
  var sql = `select * from AccountPaymentDetails where lAccountID = '${dataToSet.lAccountID}'`;
  dbConfig.getDB().query(sql, callback);
};

let tslEventsList = (dataToSet, callback) => {
  let searchType = dataToSet.searchType ? dataToSet.searchType : "";
  let searchByKeyword = "";
  if (searchType) {
    if (dataToSet.search) {
      searchByKeyword = ` and ${searchType} LIKE '%${dataToSet.search}%'`;
    }
  }
  // searchByKeyword =  dataToSet.search ? ` and sEventContactEmail LIKE '%${dataToSet.search}%'` : '';
  let limit = dataToSet.limit ? dataToSet.limit : 10;
  let offset_query = dataToSet.offset
    ? ` LIMIT ${dataToSet.offset},${limit}`
    : `LIMIT ${limit}`;

  var sql = `Select e.lEventID, e.sName, e.sLocation, e.sStatus, e.dtCreatedOn, e.dtStart, e.dtEnd, e.sEventContactName, sEventContactEmail,dtCloseSite From Events as e`;
  sql = sql + ` where e.lAccountID = '${dataToSet.userId}' ${searchByKeyword}`;
  sql =
    sql +
    ` GROUP BY e.lEventID, e.sName, e.sLocation, e.sStatus, e.dtCreatedOn, e.dtStart, e.dtEnd ORDER BY e.lEventID DESC ${offset_query}`;
  dbConfig.getDB().query(sql, callback);
};

let tslEventsListCount = (dataToSet, callback) => {
  let searchByKeyword = dataToSet.search
    ? ` and sEventContactEmail LIKE '%${dataToSet.search}%'`
    : "";
  var sql = `Select count(e.lEventID) as event_count From Events as e`;
  sql = sql + ` where e.lAccountID = '${dataToSet.userId}' ${searchByKeyword}`;
  dbConfig.getDB().query(sql, callback);
};

let tslAddEvent = (dataToSet, callback) => {
  var resultsArray = {};
  if (dataToSet.eventData && Object.keys(dataToSet.eventData).length > 0) {
    dbConfig
      .getDB()
      .query(
        "insert into Events set ? ",
        dataToSet.eventData,
        function (err, results) {
          if (results && results.affectedRows > 0) {
            resultsArray = dataToSet.eventData;
            var lEventID = results.insertId;
            if (lEventID) {
              if (
                dataToSet.accessCodeData &&
                Object.keys(dataToSet.accessCodeData).length !== 0
              ) {
                dataToSet.accessCodeData.lEventID = lEventID;
                dbConfig
                  .getDB()
                  .query(
                    "insert into EventsAccessCode set ? ",
                    dataToSet.accessCodeData,
                    function (err, results2) {}
                  );
                resultsArray.sAccessCode = dataToSet.accessCodeData.sAccessCode;
                resultsArray.affectedRows = results.affectedRows;
                resultsArray.insertId = lEventID;
                dbConfig
                  .getDB()
                  .query(
                    `insert into RegTypes set sCode = 'AAA', sName = 'Sample', dtEarlyDate='${util.getCurrentDatetime()}',
                      dtStandardDate='${util.getCurrentDatetime()}', lAccountID = '${resultsArray.lAccountID}', lEventID = '${lEventID}'`,
                    function (err3, results3) {
                      if(results3){
                        let fieldsDataArray = dataToSet.fieldsDataArray ? dataToSet.fieldsDataArray : []
                        fieldsDataArray.map((data, index) => {
                          var sql = `INSERT INTO QuestionsConfig SET 
                  
                          lAccountID='${resultsArray.lAccountID }',lEventID='${lEventID}',
                          sCode='${data.sCode ? data.sCode : ""}',
                          sName='${
                            data.sName ? data.sName : "" 
                          }', nType= '0' , bBasicField= '1',bVisible= '1',
                          bRequired='${(data.sCode == 'sFirstName' || data.sCode == 'sLastName' || data.sCode == 'sEmail') ? 1 : 0}', 
                  
                          nStatus=0,sVisible='${results3.insertId}',sRequired='${(data.sCode == 'sFirstName' || data.sCode == 'sLastName' || data.sCode == 'sEmail') ? results3.insertId : ''}',
                          nOrder='${index}', 
                          dtCreatedOn='${util.getCurrentDatetime()}',dtUpdatedOn='${util.getCurrentDatetime()}'`

                          dbConfig.getDB().query(sql, function (err4, result4) {
                            if (err4) {
                              returnCB = 0;
                            }
                          });
                      });

                      let guestAddRegFieldData = dataToSet.guestAddRegFieldData ? dataToSet.guestAddRegFieldData : []

                      if(guestAddRegFieldData){
                        guestAddRegFieldData.map((data,index)=>{
                          dbConfig
                          .getDB()
                          .query(`INSERT INTO GuestsFieldsConfig SET 
                                  lAccountID='${resultsArray.lAccountID }',lEventID='${lEventID}',
                                  sName='${
                                    data.sName ? data.sName : "" 
                                  }', bRequired= '0' , bForBoothStaff= '0',bVisibleForBoothStaff= '0',bVisibleForAddReg= '0',
                                  dtCreatedOn='${util.getCurrentDatetime()}',dtUpdatedOn='${util.getCurrentDatetime()}'`,
                                  function(err, result){
                                    console.log('err',err)
                                  })
                                })
                      }
                      }

                      
                    }
                  );
              }
            }
            callback("", resultsArray);
          } else {
            callback("error", []);
          }
        }
      );
  } else {
    callback("error", []);
  }
};

let tslUpdateEventInfo = (dataToSet, callback) => {
  var sql = `UPDATE Events SET sName= '${dataToSet.sName}', sLocation='${
    dataToSet.sLocation
  }', sStatus='${dataToSet.sStatus}', lBadgeReportID='${
    dataToSet.lBadgeReportID
  }', bUniqueEmailsForAddReg='${dataToSet.bUniqueEmailsForAddReg}', 
  nAllowToPayByCheck='${dataToSet.nAllowToPayByCheck}',
  dtStart='${
    dataToSet.dtStart
  }', dtEnd='${dataToSet.dtEnd}', sEventContactName='${
    dataToSet.sEventContactName
  }', sEventContactEmail='${dataToSet.sEventContactEmail}',dtCloseSite='${
    dataToSet.dtCloseSite
  }',dtUpdatedOn='${util.getCurrentDatetime()}' where lEventID='${
    dataToSet.lEventID
  }' AND lAccountID='${dataToSet.lAccountID}'`;
  dbConfig.getDB().query(sql, function (err, results) {
    if (results) {
      if (dataToSet.sAccessCode) {
        dbConfig
          .getDB()
          .query(
            `UPDATE EventsAccessCode SET sAccessCode='${dataToSet.sAccessCode}' where lEventID='${dataToSet.lEventID}' AND lAccountID='${dataToSet.lAccountID}'`,
            function (err, results2) {}
          );
      }
      callback("", results);
    } else {
      callback("error", []);
    }
  });
};

let tslGetClientInformation = (dataToSet, callback) => {
  var sql = `select U.*,A.sBillCompany from Users U LEFT JOIN Accounts A ON (U.lAccountID = A.lAccountID) where A.lAccountID = '${dataToSet.userId}' LIMIT 1`;
  dbConfig.getDB().query(sql, function (err, result) {
    if (result && result.length > 0) {
      callback("", result);
    } else {
      callback("error", []);
    }
  });
};

let saveClientInformationWithCompany = (dataToSet, callback) => {
  // save account data
  let saveAccountData = [
    util.mysql_real_escape_string(dataToSet.sUserName),
    util.mysql_real_escape_string(dataToSet.sUserPassword),
    util.mysql_real_escape_string(dataToSet.sFirstName),
    util.mysql_real_escape_string(dataToSet.sLastName),
    util.mysql_real_escape_string(dataToSet.sBillCompany),
    "active",
    util.getCurrentDatetime(),
    2,
  ];
  dbConfig
    .getDB()
    .query(
      "insert into Accounts (sUserName,sUserPassword,sBillFirstName,sBillLastName,sBillCompany,sStatus,dtCreatedOn,nCertLoginType) values(?,?,?,?,?,?,?,?)",
      saveAccountData,
      function (err, results) {
        if (results && results.insertId) {
          const accountId = results.insertId;
          if (accountId) {
            // save user
            let saveData = [
              accountId,
              util.mysql_real_escape_string(dataToSet.sUserName),
              util.mysql_real_escape_string(dataToSet.sUserPassword),
              util.mysql_real_escape_string(dataToSet.sFirstName),
              util.mysql_real_escape_string(dataToSet.sLastName),
              1,
              "active",
              util.getCurrentDatetime(),
            ];
            dbConfig
              .getDB()
              .query(
                "insert into Users (lAccountID,sUserName,sUserPassword,sFirstName,sLastName,lRoleID,sStatus,dtCreatedOn) values(?,?,?,?,?,?,?,?) ",
                saveData,
                function (err2, result2) {
                  if (result2.insertId) {
                    callback("", result2);
                  } else {
                    callback(err2, []);
                  }
                }
              );
          } else {
            callback(err, []);
          }
        }
      }
    );
};

let getEventById = (dataToSet, callback) => {
  var sql = `Select e.lEventID, e.sName, e.sLocation, e.sStatus, e.lBadgeReportID, bUniqueEmailsForAddReg, nAllowToPayByCheck, e.dtCreatedOn, e.dtStart, e.dtEnd,
     e.sEventContactName, e.sEventContactEmail,e.dtCloseSite,eac.sAccessCode From Events e LEFT JOIN EventsAccessCode eac ON (e.lEventID=eac.lEventID AND e.lAccountID=eac.lAccountID)`;
  sql =
    sql +
    ` where e.lAccountID = '${dataToSet.userId}' and e.lEventID = '${dataToSet.eventId}' `;
  dbConfig.getDB().query(sql, callback);
};

let tslUpdateEventPageDesign = (dataToSet, callback) => {
  var sql = `UPDATE Events SET mPageHeader='${
    dataToSet.mPageHeader
  }', mPageFooter='${dataToSet.mPageFooter}', sStep1Title='${
    dataToSet.sStep1Title
  }', sStep1Desc='${dataToSet.sStep1Desc}',
    sStep1Text='${dataToSet.sStep1Text}',sStep2Title='${
    dataToSet.sStep2Title
  }',sStep2Desc='${dataToSet.sStep2Desc}',sStep2Text='${
    dataToSet.sStep2Text
  }',sStep3Title='${dataToSet.sStep3Title}',
    sStep3Desc='${dataToSet.sStep3Desc}',sStep3Text='${
    dataToSet.sStep3Text
  }',sStep4Title='${dataToSet.sStep4Title}',sStep4Desc='${
    dataToSet.sStep4Desc
  }',sStep4Text='${dataToSet.sStep4Text}',
    sStep5Title='${dataToSet.sStep5Title}',sStep5Desc='${
    dataToSet.sStep5Desc
  }',sStep5Text='${dataToSet.sStep5Text}',sStep6Title='${
    dataToSet.sStep6Title
  }',sStep6Desc='${dataToSet.sStep6Desc}',
    sStep6Text='${dataToSet.sStep6Text}',sStep7Title='${
    dataToSet.sStep7Title
  }',sStep7Desc='${dataToSet.sStep7Desc}',sStep7Text='${
    dataToSet.sStep7Text
  }',sStep1TextBottom='${dataToSet.sStep1TextBottom}',
    sStep2TextBottom='${dataToSet.sStep2TextBottom}',sStep3TextBottom='${
    dataToSet.sStep3TextBottom
  }',sStep4TextBottom='${dataToSet.sStep4TextBottom}',sStep5TextBottom='${
    dataToSet.sStep5TextBottom
  }',
    sStep6TextBottom='${dataToSet.sStep6TextBottom}',sStep7TextBottom='${
    dataToSet.sStep7TextBottom
  }',mEventCloseText='${dataToSet.mEventCloseText}',
    mPaymentTerms='${
      dataToSet.mPaymentTerms
    }',dtUpdatedOn='${util.getCurrentDatetime()}'`;
  sql =
    sql +
    ` WHERE lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}'`;

  dbConfig.getDB().query(sql, callback);
};

let tslGetPageDesign = (dataToSet, callback) => {
  var sql = `Select lAccountID,lEventID, mPageHeader, mPageFooter, sStep1Title, sStep1Desc,sStep1Text,sStep2Title,sStep2Desc,sStep2Text,sStep3Title,
    sStep3Desc,sStep3Text,sStep4Title,sStep4Desc,sStep4Text,sStep5Title,sStep5Desc,sStep5Text,sStep6Title,sStep6Desc,
    sStep6Text,sStep7Title,sStep7Desc,sStep7Text,sStep1TextBottom,sStep2TextBottom,sStep3TextBottom,sStep4TextBottom,sStep5TextBottom,
    sStep6TextBottom,sStep7TextBottom,mEventCloseText,mPaymentTerms from Events 
    WHERE lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}'`;
  dbConfig.getDB().query(sql, callback);
};

let tslInsertRegTypesPageDesign = (dataToSet, callback) => {
  // console.log("insert into RegTypes set ? ", dataToSet)
  dbConfig.getDB().query("insert into RegTypes set ? ", dataToSet, callback);
};

let tslGetRegTypesPageDesign = (dataToSet, callback) => {
  let searchType = dataToSet.searchType ? dataToSet.searchType : "";
  let searchByKeyword = "";
  if (searchType) {
    if (dataToSet.search) {
      searchByKeyword = ` and ${searchType} LIKE '%${dataToSet.search}%'`;
    }
  }
  // searchByKeyword =  dataToSet.search ? ` and sEventContactEmail LIKE '%${dataToSet.search}%'` : '';
  let limit = dataToSet.limit ? dataToSet.limit : 10;
  let offset_query = dataToSet.offset
    ? ` LIMIT ${dataToSet.offset},${limit}`
    : `LIMIT ${limit}`;

  var sql = `SELECT * FROM RegTypes
    WHERE lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}' ${searchByKeyword} ORDER BY lRegTypeID DESC ${offset_query}`;
  dbConfig.getDB().query(sql, callback);
};

let tslCountGetRegTypesPageDesign = (dataToSet, callback) => {
  let searchType = dataToSet.searchType ? dataToSet.searchType : "";
  let searchByKeyword = "";
  if (searchType) {
    if (dataToSet.search) {
      searchByKeyword = ` and ${searchType} LIKE '%${dataToSet.search}%'`;
    }
  }

  var sql = `SELECT COUNT(*) as total_records FROM RegTypes
    WHERE lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}' ${searchByKeyword}`;
  dbConfig.getDB().query(sql, callback);
};

let tslCheckRegTypesScodeExists = (dataToSet, callback) => {
  let lRegTypeID = dataToSet.lRegTypeID
    ? `AND lRegTypeID!=` + dataToSet.lRegTypeID
    : "";
  var sql = `SELECT Count(*) as sCodeCount FROM RegTypes
    WHERE sCode='${dataToSet.sCode}' AND lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}' ${lRegTypeID}`;
  dbConfig.getDB().query(sql, callback);
};

let tslUpdateRegTypesPageDesign = (dataToSet, callback) => {
  var sql = `UPDATE RegTypes SET sCode='${dataToSet.sCode}', sName='${
    dataToSet.sName
  }', dEarlyAmt='${dataToSet.dEarlyAmt}',
  dPricePerAddRegEarly='${dataToSet.dPricePerAddRegEarly}',
  dPricePerGuestEarly='${dataToSet.dPricePerGuestEarly}',
  lNumberOfEarlyReg1='${
    dataToSet.lNumberOfEarlyReg1
  }',
    dEarlyAmt2='${dataToSet.dEarlyAmt2}',lNumberOfEarlyReg2='${
    dataToSet.lNumberOfEarlyReg2
  }',dEarlyAmt3='${dataToSet.dEarlyAmt3}',lNumberOfEarlyReg3='${
    dataToSet.lNumberOfEarlyReg3
  }',dEarlyAmt4='${dataToSet.dEarlyAmt4}',
    lNumberOfEarlyReg4='${dataToSet.lNumberOfEarlyReg4}',dtEarlyDate='${
    dataToSet.dtEarlyDate
  }',dStandardAmt='${dataToSet.dStandardAmt}',lNumberOfStandardReg1='${
    dataToSet.lNumberOfStandardReg1
  }'
  ,dPricePerAddRegStd='${dataToSet.dPricePerAddRegStd}',dPricePerGuestStd='${
    dataToSet.dPricePerGuestStd
  }'
  ,dPricePerAddReg='${dataToSet.dPricePerAddReg}',dPricePerGuest='${
    dataToSet.dPricePerGuest
  }'
  ,dStandardAmt2='${dataToSet.dStandardAmt2}',
    lNumberOfStandardReg2='${dataToSet.lNumberOfStandardReg2}',dStandardAmt3='${
    dataToSet.dStandardAmt3
  }',lNumberOfStandardReg3='${
    dataToSet.lNumberOfStandardReg3
  }',dStandardAmt4='${dataToSet.dStandardAmt4}',
    lNumberOfStandardReg4='${
      dataToSet.lNumberOfStandardReg4
    }',dtStandardDate='${dataToSet.dtStandardDate}',dOnsiteAmt='${
    dataToSet.dOnsiteAmt
  }',lNumberOfOnsiteReg1='${dataToSet.lNumberOfOnsiteReg1}',dOnsiteAmt2='${
    dataToSet.dOnsiteAmt2
  }',
    lNumberOfOnsiteReg2='${dataToSet.lNumberOfOnsiteReg2}',dOnsiteAmt3='${
    dataToSet.dOnsiteAmt3
  }',lNumberOfOnsiteReg3='${dataToSet.lNumberOfOnsiteReg3}',dOnsiteAmt4='${
    dataToSet.dOnsiteAmt4
  }',
    lNumberOfOnsiteReg4='${dataToSet.lNumberOfOnsiteReg4}',sPrintText='${
    dataToSet.sPrintText
  }',nStatus='${
    dataToSet.nStatus
  }', dtUpdatedOn='${util.getCurrentDatetime()}'`;
  sql =
    sql +
    ` WHERE lRegTypeID='${dataToSet.lRegTypeID}' AND lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}'`;

  dbConfig.getDB().query(sql, callback);
};

let tslCheckRegCategoriesScodeExists = (dataToSet, callback) => {
  let lCategoryID = dataToSet.lCategoryID
    ? `AND lCategoryID!=` + dataToSet.lCategoryID
    : "";
  var sql = `SELECT Count(*) as sCodeCount FROM CategoriesConfig
    WHERE sCode='${dataToSet.sCode}' AND lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}' ${lCategoryID}`;

  dbConfig.getDB().query(sql, callback);
};

let tslInsertRegCategoriesPageDesign = (dataToSet, callback) => {
  dbConfig
    .getDB()
    .query("insert into CategoriesConfig set ? ", dataToSet, callback);
};

let tslGetRegCategoriesPageDesign = (dataToSet, callback) => {
  let searchType = dataToSet.searchType ? dataToSet.searchType : "";
  let searchByKeyword = "";
  if (searchType) {
    if (dataToSet.search) {
      searchByKeyword = ` and cc.${searchType} LIKE '%${dataToSet.search}%'`;
    }
  }

  let limit = dataToSet.limit ? dataToSet.limit : 10;
  let offset_query = dataToSet.offset
    ? ` LIMIT ${dataToSet.offset},${limit}`
    : `LIMIT ${limit}`;

  var sql = `SELECT cc.*,GROUP_CONCAT(DISTINCT rt.sCode) sApplyToRegTypes FROM CategoriesConfig cc LEFT JOIN RegTypes rt ON FIND_IN_SET(rt.lRegTypeID,cc.sApplyToRegTypes)
    WHERE cc.lAccountID='${dataToSet.lAccountID}' AND cc.lEventID = '${dataToSet.lEventID}' ${searchByKeyword} GROUP BY cc.lCategoryID ORDER BY cc.lCategoryID DESC ${offset_query}`;

  // var sql = `SELECT cc.*,GROUP_CONCAT(DISTINCT rt.sCode) sApplyToRegTypes FROM CategoriesConfig cc LEFT JOIN RegTypes rt ON FIND_IN_SET(rt.lRegTypeID,cc.sApplyToRegTypes)
  // WHERE cc.lAccountID='${dataToSet.lAccountID}' AND cc.lEventID = '${dataToSet.lEventID}' ${searchByKeyword} GROUP BY cc.sApplyToRegTypes ORDER BY cc.lCategoryID DESC ${offset_query}`
  dbConfig.getDB().query(sql, callback);
};

let tslCountGetRegCategoriesPageDesign = (dataToSet, callback) => {
  let searchType = dataToSet.searchType ? dataToSet.searchType : "";
  let searchByKeyword = "";
  if (searchType) {
    if (dataToSet.search) {
      searchByKeyword = ` and ${searchType} LIKE '%${dataToSet.search}%'`;
    }
  }

  var sql = `SELECT COUNT(*) as total_records FROM CategoriesConfig
    WHERE lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}' ${searchByKeyword}`;
  dbConfig.getDB().query(sql, callback);
};

let tslUpdateRegCategoriesPageDesign = (dataToSet, callback) => {
  var sql = `UPDATE CategoriesConfig SET sCode='${dataToSet.sCode}', sName='${
    dataToSet.sName
  }', nStatus='${dataToSet.nStatus}', sApplyToRegTypes='${
    dataToSet.sApplyToRegTypes
  }',
    sApplyToTemplates='${
      dataToSet.sApplyToTemplates
    }',dtUpdatedOn='${util.getCurrentDatetime()}'`;
  sql =
    sql +
    ` WHERE lCategoryID='${dataToSet.lCategoryID}' AND lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}'`;
  dbConfig.getDB().query(sql, callback);
};

let tslGetRegSCodePageDesign = (dataToSet, callback) => {
  var sql = `SELECT  lRegTypeID as value, sCode as label FROM RegTypes
    WHERE lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}' AND nStatus <> 1`;
  dbConfig.getDB().query(sql, callback);
};

let tslGetRegTypesByIdPageDesign = (dataToSet, callback) => {
  var sql = `SELECT * FROM RegTypes
    WHERE lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}' AND lRegTypeID = '${dataToSet.lRegTypeID}'`;
  dbConfig.getDB().query(sql, callback);
};

let tslGetRegCategoriesByIdPageDesign = (dataToSet, callback) => {
  var sql = `SELECT lAccountID, lEventID, lCategoryID, sCode, sName, sApplyToRegTypes, sApplyToTemplates, nStatus FROM CategoriesConfig
    WHERE lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}' AND lCategoryID = '${dataToSet.lCategoryID}'`;
  dbConfig.getDB().query(sql, callback);
};

let tslInsertRegistrantInformationWithCompany = (dataToSet, callback) => {
  // console.log("insert into RegTypes set ? ", dataToSet)
  dbConfig
    .getDB()
    .query("insert into QuestionsConfig set ? ", dataToSet, callback);
};

let tslGetRegistrantInformation = (dataToSet, callback) => {
  var sql = `Select sName, sCode, bVisible,bRequired,nOrder FROM RegistrantFieldConfig
    WHERE lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}'`;
  dbConfig.getDB().query(sql, callback);
};

let tslGetQuestionsConfigSName = (dataToSet, callback) => {
  var sql = `Select sName, sCode, sVisible, sRequired FROM QuestionsConfig
    WHERE lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}' AND FIND_IN_SET(${dataToSet.lRegTypeID},sVisible) AND sCode !='sMemberID' AND sCode !='sPrefix' GROUP BY sCode ORDER BY nOrder ASC`;
  
    dbConfig.getDB().query(sql, callback);
};

let tslGetQuestionsFieldName = (dataToSet, callback) => {
  var sql = `Select * FROM QuestionsConfig
    WHERE lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}' AND sCode IN (${dataToSet.sCode}) order BY nOrder ASC`;
  dbConfig.getDB().query(sql, callback);
};

let tslUpdateRegInfoFieldsPage = (dataToSet, callback) => {
  const fieldValue = dataToSet.fieldValue;
  if (fieldValue) {
    // console.log(fieldValue)
    Object.keys(fieldValue).forEach(function (key) {
      let sVisible = fieldValue[key].sVisible ? fieldValue[key].sVisible : "";
      let sRequired = fieldValue[key].sRequired
        ? fieldValue[key].sRequired
        : "";

      var sql = `UPDATE QuestionsConfig SET sVisible= '${sVisible}', sRequired= '${sRequired}', dtUpdatedOn='${util.getCurrentDatetime()}'`;
      sql =
        sql +
        ` WHERE sCode='${key}' AND  lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}'`;

      dbConfig.getDB().query(sql, function (err, result) {
        if (result.affectedRows > 0) {
          var inserData = 1;
        }
      });
    });
    callback("", 1);
  } else {
    callback(err, 0);
  }
};

let tslGetguestsRegistrantsFields = (dataToSet, callback) => {
  var sql = `Select * FROM GuestsFieldsConfig
    WHERE lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}' AND sName IN (${dataToSet.fieldValue})`;
  dbConfig.getDB().query(sql, callback);
};

// let tslGetCustomQuestions = (dataToSet,callback) => {
//     var sql = `Select lQuestionID, lAccountID, lEventID, sCode, sName, nType, bRequired, sApplyToRegTypes, nOrder, nStatus,nExtraConfigType,nExtraConfigPosition,
//     mExtraConfigLabel,nExtraConfigSize from QuestionsConfig  where lAccountID='${dataToSet.lAccountID}' AND
//     lEventID = '${dataToSet.lEventID}' AND bBasicField = 0 AND nStatus <> 1`

//     dbConfig.getDB().query(sql, callback);
// }

let tslGetCustomQuestions = (dataToSet, callback) => {
  var sql = `Select GROUP_CONCAT(DISTINCT ac.sAnswer) sAnswer,qc.lQuestionID,qc.lAccountID,qc.lEventID,qc.sCode,qc.sName,qc.nType,qc.bRequired,qc.nOrder,qc.nStatus,qc.nExtraConfigType,qc.nExtraConfigPosition,qc.
    mExtraConfigLabel,qc.nExtraConfigSize,rt.sCode sApplyToRegTypes from QuestionsConfig qc LEFT JOIN RegTypes rt ON FIND_IN_SET(rt.lRegTypeID,qc.sApplyToRegTypes) LEFT JOIN AnswersConfig ac ON(qc.lQuestionID=ac.lQuestionID) where qc.lAccountID='${dataToSet.lAccountID}' AND 
    qc.lEventID = '${dataToSet.lEventID}' AND qc.bBasicField = 0 AND qc.nStatus <> 1 GROUP BY qc.lQuestionID`;
  dbConfig.getDB().query(sql, callback);
};

let tslUpdateGuestRegistrantsFields = (dataToSet, callback) => {
  const guestData = dataToSet.guestData;
  if (guestData) {
    Object.keys(guestData).forEach(function (key, value) {
      var sql = `UPDATE GuestsFieldsConfig SET bRequired= '${
        guestData[key].bRequired
      }', bVisibleForBoothStaff= '${
        guestData[key].bVisibleForBoothStaff
      }', bVisibleForAddReg= '${
        guestData[key].bVisibleForAddReg
      }', bForBoothStaff= '${
        guestData[key].bForBoothStaff
      }', dtUpdatedOn='${util.getCurrentDatetime()}'`;
      sql =
        sql +
        ` WHERE sName='${key}' AND  lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}'`;

      dbConfig.getDB().query(sql, function (err, result) {
        if (result.affectedRows > 0) {
          var inserData = 1;
        }
      });
    });
    callback("", 1);
  } else {
    callback(err, 0);
  }
};

let tslUpdateRegistrantFieldSetup = (dataToSet, callback) => {
  const regFieldData = dataToSet.fieldValue;
  if (regFieldData) {
    Object.keys(regFieldData).forEach(function (key, value) {
      var sql = `UPDATE RegistrantFieldConfig SET bRequired= '${
        regFieldData[key].bRequired
      }', bVisible= '${
        regFieldData[key].bVisible
      }', dtUpdatedOn='${util.getCurrentDatetime()}'`;
      sql =
        sql +
        ` WHERE sName='${key}' AND  lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}'`;

      dbConfig.getDB().query(sql, function (err, result) {
        if (result.affectedRows > 0) {
          var inserData = 1;
        }
      });
    });
    callback("", 1);
  } else {
    callback(err, 0);
  }
};

let tslGetCustomQuestionsById = (dataToSet, callback) => {
  var sql = `Select lQuestionID, lAccountID, lEventID, sCode, sName, nType, bRequired, sApplyToRegTypes, nOrder, nStatus,nExtraConfigType,nExtraConfigPosition,
    mExtraConfigLabel,nExtraConfigSize from QuestionsConfig where lAccountID='${dataToSet.lAccountID}' AND 
    lEventID = '${dataToSet.lEventID}' AND lQuestionID= '${dataToSet.lQuestionID}' AND bBasicField = 0 AND nStatus <> 1`;

  dbConfig.getDB().query(sql, callback);
};

let tslInsertCustomQuestions = (dataToSet, callback) => { 
  // save account data
  let saveQuestionsConfig = [
    util.mysql_real_escape_string(dataToSet.lAccountID),
    util.mysql_real_escape_string(dataToSet.lEventID),
    util.mysql_real_escape_string(dataToSet.sCode),
    util.mysql_real_escape_string(dataToSet.sName),
    util.mysql_real_escape_string(dataToSet.nType),
    util.mysql_real_escape_string(dataToSet.bRequired),
    util.mysql_real_escape_string(dataToSet.sApplyToRegTypes),
    util.mysql_real_escape_string(dataToSet.nOrder),
    util.mysql_real_escape_string(dataToSet.nStatus),
    "0",
    util.getCurrentDatetime(),
    util.getCurrentDatetime(),
  ];
    
  dbConfig
    .getDB()
    .query(
      "insert into QuestionsConfig (lAccountID,lEventID,sCode,sName,nType,bRequired,sApplyToRegTypes,nOrder,nStatus,bBasicField,dtCreatedOn,dtUpdatedOn) values(?,?,?,?,?,?,?,?,?,?,?,?)",
      saveQuestionsConfig,
      function (err, results) {
        if (results && results.insertId) {
          const questionId = results.insertId;
          if (questionId) {
            // save answers
            if (dataToSet.sAnswers) {
              dataToSet.sAnswers.map((data, index) => {
                let saveAnswersConfig = [
                  dataToSet.lAccountID,
                  dataToSet.lEventID,
                  questionId,
                  util.mysql_real_escape_string(data),
                  util.getCurrentDatetime(),
                  util.getCurrentDatetime(),
                ];
                dbConfig
                  .getDB()
                  .query(
                    "insert into AnswersConfig (lAccountID,lEventID,lQuestionID,sAnswer,dtCreatedOn,dtUpdatedOn) values(?,?,?,?,?,?) ",
                    saveAnswersConfig,
                    function (err2, result2) {}
                  );
              });
            } else if(!dataToSet.sAnswers && dataToSet.nType == 0){
              let saveAnswersConfig = [
                dataToSet.lAccountID,
                dataToSet.lEventID,
                questionId,
                '',
                util.getCurrentDatetime(),
                util.getCurrentDatetime(),
              ];
              dbConfig
                  .getDB()
                  .query(
                    "insert into AnswersConfig (lAccountID,lEventID,lQuestionID,sAnswer,dtCreatedOn,dtUpdatedOn) values(?,?,?,?,?,?) ",
                    saveAnswersConfig,
                    function (err2, result2) {}
              );
             }
            callback("", results);
            // else {
            //   callback(err, []);
            // }
          } else {
            callback(err, []);
          }
        }
      }
    );
};

let tslupdateCustomQuestions = (dataToSet, callback) => {
  var sql = `UPDATE QuestionsConfig SET sCode='${dataToSet.sCode}', sName='${
    dataToSet.sName
  }', nType='${dataToSet.nType}', bRequired='${dataToSet.bRequired}',
    sApplyToRegTypes='${dataToSet.sApplyToRegTypes}',nOrder='${
    dataToSet.nOrder
  }',nStatus='${dataToSet.nStatus}',dtUpdatedOn='${util.getCurrentDatetime()}'`;
  sql =
    sql +
    ` WHERE lQuestionID='${dataToSet.lQuestionID}' AND lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}'`;

  dbConfig.getDB().query(sql, callback);
};

let tslGetDiscountCodes = (dataToSet, callback) => {
  var sql = `SELECT  GROUP_CONCAT(DISTINCT rt.sCode) sApplyToRegTypes, dc.lDiscountID, dc.lAccountID, dc.lEventID, dc.sCode, dc.sName, dc.nExtraFieldRequired, dc.dAmount, dc.nStatus, dc.dtCreatedOn, dc.dtUpdatedOn FROM DiscountsConfig dc LEFT JOIN RegTypes rt ON FIND_IN_SET(rt.lRegTypeID,dc.sApplyToRegTypes) where dc.lAccountID='${dataToSet.lAccountID}' AND 
    dc.lEventID = '${dataToSet.lEventID}' AND dc.nStatus <> 1 GROUP BY dc.lDiscountID`;
  dbConfig.getDB().query(sql, callback);
};

let tslGetDiscountCodesById = (dataToSet, callback) => {
  var sql = `Select * from DiscountsConfig where lAccountID='${dataToSet.lAccountID}' AND 
    lEventID = '${dataToSet.lEventID}' AND lDiscountID= '${dataToSet.lDiscountID}' AND nStatus <> 1`;

  dbConfig.getDB().query(sql, callback);
};

let tslInsertDiscountCodes = (dataToSet, callback) => {
  dbConfig
    .getDB()
    .query("insert into DiscountsConfig set ? ", dataToSet, callback);
};

let tslUpdateDiscountCodes = (dataToSet, callback) => {
  var sql = `UPDATE DiscountsConfig SET sCode='${dataToSet.sCode}', sName='${
    dataToSet.sName
  }', nExtraFieldRequired='${dataToSet.nExtraFieldRequired}', dAmount='${
    dataToSet.dAmount
  }',
    sApplyToRegTypes='${dataToSet.sApplyToRegTypes}',nStatus='${
    dataToSet.nStatus
  }',dtUpdatedOn='${util.getCurrentDatetime()}'`;
  sql =
    sql +
    ` WHERE lDiscountID='${dataToSet.lDiscountID}' AND lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}'`;
    

  dbConfig.getDB().query(sql, callback);
};

// insert data for forgot password
let tslInsertSessions = (dataToSet, callback) => {
  dbConfig
    .getDB()
    .query("insert into SessionsConfig set ? ", dataToSet, callback);
};

let tslUpdateSessions = (dataToSet, callback) => {
  var sql = `UPDATE SessionsConfig SET sCode='${dataToSet.sCode}', sName='${
    dataToSet.sName
  }', nMaxQty='${dataToSet.nMaxQty}', dPrice1='${dataToSet.dPrice1}',
    dtPrice1='${dataToSet.dtPrice1}',dPrice2='${dataToSet.dPrice2}',dtPrice2='${
    dataToSet.dtPrice2
  }',dPrice3='${dataToSet.dPrice3}',
    dtPrice3='${dataToSet.dtPrice3}',bPrintTicket='${
    dataToSet.bPrintTicket
  }',sPrintTicketText='${dataToSet.sPrintTicketText}',sApplyToRegTypes='${
    dataToSet.sApplyToRegTypes
  }',
    sAutoTicketForRegTypes='${dataToSet.sAutoTicketForRegTypes}',nStatus='${
    dataToSet.nStatus
  }',dtUpdatedOn='${util.getCurrentDatetime()}'`;
  sql =
    sql +
    ` WHERE lSessionID='${dataToSet.lSessionID}' AND lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}'`;

  dbConfig.getDB().query(sql, callback);
};

let tslGetSessions = (dataToSet, callback) => {
  var sql = `SELECT  sc.*,GROUP_CONCAT(DISTINCT rt.sCode) sApplyToRegTypes, GROUP_CONCAT(DISTINCT rt.sCode) sAutoTicketForRegTypes  FROM SessionsConfig sc LEFT JOIN RegTypes rt ON FIND_IN_SET(rt.lRegTypeID,sc.sApplyToRegTypes) where sc.lAccountID='${dataToSet.lAccountID}' AND 
    sc.lEventID = '${dataToSet.lEventID}' AND sc.nStatus <> 1 GROUP BY sc.lSessionID`;
  dbConfig.getDB().query(sql, callback);
};

let tslGetSessionsById = (dataToSet, callback) => {
  var sql = `Select * from SessionsConfig where lAccountID='${dataToSet.lAccountID}' AND 
    lEventID = '${dataToSet.lEventID}' AND lSessionID= '${dataToSet.lSessionID}' AND nStatus <> 1`;
  dbConfig.getDB().query(sql, callback);
};

let tslGetExtraConfigurationForSessions = (dataToSet, callback) => {
  var sql = `Select GROUP_CONCAT(DISTINCT rt.sCode) sApplyToRegTypes, ec.lItemID, ec.sCode, ec.nType, ec.nApplyToType, ec.nPosition,ec.nRequired, sc.sCode as lBeforeAfterItemID, ec.mLabel, ec.nSize, ec.nStatus
    FROM ExtraConfig ec LEFT JOIN RegTypes rt ON FIND_IN_SET(rt.lRegTypeID,ec.sApplyToRegTypes)
    LEFT JOIN SessionsConfig sc ON (ec.lBeforeAfterItemID=sc.lSessionID)
    Where ec.lAccountID='${dataToSet.lAccountID}' AND ec.lEventID = '${dataToSet.lEventID}' AND ec.nStatus <> 1 GROUP BY ec.lItemID`;
  dbConfig.getDB().query(sql, callback);
};

// insert data for forgot password
let tslAddExtraConfigurationForSessions = (dataToSet, callback) => {
  dbConfig.getDB().query("insert into ExtraConfig set ? ", dataToSet, callback);
};

let tslGetExtraConfigById = (dataToSet, callback) => {
  var sql = `Select * from ExtraConfig where lAccountID='${dataToSet.lAccountID}' AND 
    lEventID = '${dataToSet.lEventID}' AND lItemID= '${dataToSet.lItemID}' AND nStatus <> 1`;
  dbConfig.getDB().query(sql, callback);
};

let tslUpdateExtraConfigurationForSessions = (dataToSet, callback) => {
  var sql = `UPDATE ExtraConfig SET sCode='${dataToSet.sCode}', nType='${
    dataToSet.nType
  }', nPosition='${dataToSet.nPosition}', lBeforeAfterItemID='${
    dataToSet.lBeforeAfterItemID
  }',
    mLabel='${dataToSet.mLabel}',nSize='${dataToSet.nSize}',nRequired='${
    dataToSet.nRequired
  }',nStatus='${dataToSet.nStatus}',
    sApplyToRegTypes='${
      dataToSet.sApplyToRegTypes
    }', dtUpdatedOn='${util.getCurrentDatetime()}'`;
  sql =
    sql +
    ` WHERE lItemID='${dataToSet.lItemID}' AND lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}'`;

  dbConfig.getDB().query(sql, callback);
};

let tslUpdateMainContactFields = (dataToSet, callback) => {
  const mainContactFields = dataToSet.fieldValue;
  if (mainContactFields) {
    Object.keys(mainContactFields).forEach(function (key, value) {
      var sql = `UPDATE QuestionsConfig SET bVisibleGrpReg= '${
        mainContactFields[key].bVisibleGrpReg
      }', bReadOnlyGrpReg= '${mainContactFields[key].bReadOnlyGrpReg}', 
            bRequiredGrpReg= '${
              mainContactFields[key].bRequiredGrpReg
            }', dtUpdatedOn='${util.getCurrentDatetime()}'`;
      sql =
        sql +
        ` WHERE sName='${key}' AND  lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}'`;

      dbConfig.getDB().query(sql, function (err, result) {
        if (result.affectedRows > 0) {
          var inserData = 1;
        }
      });
    });
    callback("", 1);
  } else {
    callback(err, 0);
  }
};

let tslGetMainContactFields = (dataToSet, callback) => {
  var sql = `Select * FROM QuestionsConfig
    WHERE lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}' AND sCode IN (${dataToSet.sCode})
    ORDER BY nOrder ASC`;
  dbConfig.getDB().query(sql, callback);
};

let tslGetRegistrantFields = (dataToSet, callback) => {
  var sql = `Select * FROM GrpRegFieldsConfig
    WHERE lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}' AND sName IN ('sPhone','sTitle')`;
  dbConfig.getDB().query(sql, callback);
};

let tslUpdateRegistrantFields = (dataToSet, callback) => {
  const regFieldData = dataToSet.fieldValue;
  if (regFieldData) {
    Object.keys(regFieldData).forEach(function (key, value) {
      var sql = `UPDATE GrpRegFieldsConfig SET bRequired= '${
        regFieldData[key].bRequired
      }', bVisible= '${
        regFieldData[key].bVisible
      }', dtUpdatedOn='${util.getCurrentDatetime()}'`;
      sql =
        sql +
        ` WHERE sName='${key}' AND  lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}'`;

      dbConfig.getDB().query(sql, function (err, result) {
        if (result.affectedRows > 0) {
          var inserData = 1;
        }
      });
    });
    callback("", 1);
  } else {
    callback(err, 0);
  }
};

let tslGetPageDesignGrpReg = (dataToSet, callback) => {
  var sql = `Select * from Events
    WHERE lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}'`;
  dbConfig.getDB().query(sql, callback);
};

let tslUpdatePageDesignGrpReg = (dataToSet, callback) => {
  const mPageHeader = dataToSet.mPageHeader ? dataToSet.mPageHeader : "";
  const mPageFooter = dataToSet.mPageFooter ? dataToSet.mPageFooter : "";
  const stepsTitleDesc = dataToSet.stepsTitleDesc
    ? dataToSet.stepsTitleDesc
    : "";
  var sql = `UPDATE Events SET mPageHeaderGroup= '${mPageHeader}', mPageFooterGroup= '${mPageFooter}', sStep1TitleGroup= '${
    stepsTitleDesc.sStep1TitleGroup
  }',
    sStep1DescGroup= '${stepsTitleDesc.sStep1DescGroup}',sStep1TextGroup= '${
    stepsTitleDesc.sStep1TextGroup
  }',sStep1TextBottomGroup= '${stepsTitleDesc.sStep1TextBottomGroup}',
    sStep2TitleGroup= '${stepsTitleDesc.sStep2TitleGroup}',sStep2DescGroup= '${
    stepsTitleDesc.sStep2DescGroup
  }',sStep2TextGroup= '${stepsTitleDesc.sStep2TextGroup}',
    sStep3TextGroup= '${
      stepsTitleDesc.sStep3TextGroup
    }',sStep3TextBottomGroup= '${
    stepsTitleDesc.sStep3TextBottomGroup
  }',sStep4TitleGroup= '${stepsTitleDesc.sStep4TitleGroup}',
    sStep4DescGroup= '${stepsTitleDesc.sStep4DescGroup}',sStep4TextGroup= '${
    stepsTitleDesc.sStep4TextGroup
  }',sStep4TextBottomGroup= '${stepsTitleDesc.sStep4TextBottomGroup}',
    sStep5TitleGroup= '${stepsTitleDesc.sStep5TitleGroup}',sStep5DescGroup= '${
    stepsTitleDesc.sStep5DescGroup
  }',sStep5TextGroup= '${stepsTitleDesc.sStep5TextGroup}',
    sStep6TextGroup= '${
      stepsTitleDesc.sStep6TextGroup
    }',sStep6TextBottomGroup= '${stepsTitleDesc.sStep6TextBottomGroup}',
    sStep7TitleGroup= '${stepsTitleDesc.sStep7TitleGroup}',sStep7DescGroup= '${
    stepsTitleDesc.sStep7DescGroup
  }',sStep7TextGroup= '${stepsTitleDesc.sStep7TextGroup}',
    sStep7TextBottomGroup= '${
      stepsTitleDesc.sStep7TextBottomGroup
    }', dtUpdatedOn='${util.getCurrentDatetime()}'`;
  sql =
    sql +
    ` WHERE lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}'`;

  dbConfig.getDB().query(sql, callback);
};

let tslGetPageDesignExhibitor = (dataToSet, callback) => {
  var sql = `Select * from Events
    WHERE lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}'`;
  dbConfig.getDB().query(sql, callback);
};

let tslUpdatePageDesignExhibitor = (dataToSet, callback) => {
  const mPageHeaderExh = dataToSet.mPageHeaderExh
    ? dataToSet.mPageHeaderExh
    : "";
  const mPageFooterExh = dataToSet.mPageFooterExh
    ? dataToSet.mPageFooterExh
    : "";
  const stepsTitleDesc = dataToSet.stepsTitleDesc
    ? dataToSet.stepsTitleDesc
    : "";
  var sql = `UPDATE Events SET mPageHeaderExh= '${mPageHeaderExh}', mPageFooterExh= '${mPageFooterExh}', sStep1TitleExh= '${
    stepsTitleDesc.sStep1TitleExh
  }',
    sStep1DescExh= '${stepsTitleDesc.sStep1DescExh}',sStep1TextExh= '${
    stepsTitleDesc.sStep1TextExh
  }',sStep2TitleExh= '${stepsTitleDesc.sStep2TitleExh}',
    sStep2DescExh= '${stepsTitleDesc.sStep2DescExh}',sStep2TextExh= '${
    stepsTitleDesc.sStep2TextExh
  }',sStep3TitleExh= '${stepsTitleDesc.sStep3TitleExh}',
    sStep3DescExh= '${stepsTitleDesc.sStep3DescExh}',sStep3TextExh= '${
    stepsTitleDesc.sStep3TextExh
  }',sStep4TitleExh= '${stepsTitleDesc.sStep4TitleExh}',
    sStep4DescExh= '${stepsTitleDesc.sStep4DescExh}',sStep4TextExh= '${
    stepsTitleDesc.sStep4TextExh
  }',sStep5TitleExh= '${stepsTitleDesc.sStep5TitleExh}',
    sStep5DescExh= '${stepsTitleDesc.sStep5DescExh}',sStep5TextExh= '${
    stepsTitleDesc.sStep5TextExh
  }',sStep6TitleExh= '${stepsTitleDesc.sStep6TitleExh}',
    sStep6DescExh= '${stepsTitleDesc.sStep6DescExh}',sStep6TextExh= '${
    stepsTitleDesc.sStep6TextExh
  }',
    sStep7TitleExh= '${stepsTitleDesc.sStep7TitleExh}',sStep7DescExh= '${
    stepsTitleDesc.sStep7DescExh
  }',sStep7TextExh= '${stepsTitleDesc.sStep7TextExh}', 
   dtUpdatedOn='${util.getCurrentDatetime()}'`;
  sql =
    sql +
    ` WHERE lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}'`;

  dbConfig.getDB().query(sql, callback);
};

let tslGetExhibitorList = (dataToSet, callback) => {
  let searchType = dataToSet.searchType ? dataToSet.searchType : "";
  let searchByKeyword = "";
  if (searchType) {
    if (dataToSet.search) {
      searchByKeyword = ` and ${searchType} LIKE '%${dataToSet.search}%'`;
    }
  }

  let limit = dataToSet.limit ? dataToSet.limit : 10;
  let offset_query = dataToSet.offset
    ? ` LIMIT ${dataToSet.offset},${limit}`
    : `LIMIT ${limit}`;

  var sql = `Select * FROM Exhibitors
    WHERE lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}' ${searchByKeyword} ORDER BY lExhibitorID DESC ${offset_query}`;
  // console.log("sql", sql);
  dbConfig.getDB().query(sql, callback);
};

let tslGetExhibitorListCount = (dataToSet, callback) => {
  let searchType = dataToSet.searchType ? dataToSet.searchType : "";
  let searchByKeyword = "";
  if (searchType) {
    if (dataToSet.search) {
      searchByKeyword = ` and ${searchType} LIKE '%${dataToSet.search}%'`;
    }
  }

  var sql = `SELECT COUNT(*) as total_records FROM Exhibitors
    WHERE lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}' ${searchByKeyword}`;
  dbConfig.getDB().query(sql, callback);
};

let tslAddExhibitorsInfo = (dataToSet, callback) => {
  dbConfig.getDB().query("insert into Exhibitors set ? ", dataToSet, callback);
};

let tslUpdateExhibitorInfo = (dataToSet, callback) => {
  var sql = `Update Exhibitors SET
				nStatus = '${dataToSet.nStatus}',
				nFreeStaffs = '${dataToSet.nFreeStaffs}',
				dPricePerExtraStaff = '${dataToSet.dPricePerExtraStaff}',				
				sPrefix = '${dataToSet.sPrefix}',
				sFirstName = '${dataToSet.sFirstName}',
				sMiddleName = '${dataToSet.sMiddleName}',
				sLastName = '${dataToSet.sLastName}',
				sSuffix = '${dataToSet.sSuffix}',
				sCredentials = '${dataToSet.sCredentials}',
				sTitle= '${dataToSet.sTitle}',
				sCompany = '${dataToSet.sCompany}',
				sAddress1 = '${dataToSet.sAddress1}',
				sAddress2 = '${dataToSet.sAddress2}',
				sAddress3 = '${dataToSet.sAddress3}',
				sCity = '${dataToSet.sCity}',
				sState = '${dataToSet.sState}',
				sZip = '${dataToSet.sZip}',
				sCountry = '${dataToSet.sCountry}',
				sPhone = '${dataToSet.sPhone}',
				sCell = '${dataToSet.sCell}',
				sFax = '${dataToSet.sFax}',
				sEmail = '${dataToSet.sEmail}',					
				sBooth = '${dataToSet.sBooth}',
				sBoothSize = '${dataToSet.sBoothSize}',
				sDocument = '${dataToSet.sDocument}',
				sWebSite = '${dataToSet.sWebSite}',
				mAbout = '${dataToSet.mAbout}',
				mNotes = '${dataToSet.mNotes}', 
				nMaxStaff = '${dataToSet.nMaxStaff}',
				nMaxBoothStaff = '${dataToSet.nMaxBoothStaff}',
				nSortOrder = '${dataToSet.nSortOrder}',
				nExhType = '${dataToSet.nExhType}',
				nExhValueType = '${dataToSet.nExhValueType}',
				nExhTemplate = '${dataToSet.nExhTemplate}',
				nShowInBoothStaffList = '${dataToSet.nShowInBoothStaffList}',
				nEnableGoldenTkt = '${dataToSet.nEnableGoldenTkt}',
				nSponsorType = '${dataToSet.nSponsorType}',	
				sVideoLinks = '${dataToSet.sVideoLinks}',	
				dtUpdatedOn = '${dataToSet.dtUpdatedOn}'`;
  if (dataToSet.sPicture) {
    sql = sql + `,sPicture = '${dataToSet.sPicture}'`;
  }
  if (dataToSet.sProfilePic) {
    sql = sql + `,sProfilePic = '${dataToSet.sProfilePic}'`;
  }

  sql =
    sql +
    ` WHERE lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}' AND lExhibitorID = '${dataToSet.lExhibitorID}'`;

  dbConfig.getDB().query(sql, callback);
};

let tslGetExhibitorListById = (dataToSet, callback) => {
  var sql = `Select * FROM Exhibitors where lAccountID = '${dataToSet.lAccountID}' and lEventID = '${dataToSet.lEventID}' and lExhibitorID = '${dataToSet.lExhibitorID}'`;
  dbConfig.getDB().query(sql, callback);
};

let tslAddExhibitorsImport = (dataToSet, callback) => {
  var returnCB = 1;
  let columnArray = dataToSet.columnArray ? dataToSet.columnArray : [];
  let valuesArray = dataToSet.valuesArray ? dataToSet.valuesArray : [];
  let saveData = {};

  if (valuesArray && columnArray) {
    valuesArray.map((data, index) => {
      saveData = {};
      columnArray.map((data2, index2) => {
        if (data2) {
          if (data[index2]) {
            saveData[data2] = data[index2];
          }
        }
      });

      if (saveData) {
        var sql = `INSERT INTO Exhibitors SET

        nFreeStaffs='${
          saveData.nFreeStaffs ? saveData.nFreeStaffs : ""
        }',dPricePerExtraStaff='${
          saveData.dPricePerExtraStaff ? saveData.dPricePerExtraStaff : ""
        }',sPrefix='${saveData.sPrefix ? saveData.sPrefix : ""}',

        sFirstName='${
          saveData.sFirstName ? saveData.sFirstName : ""
        }', sMiddleName='${
          saveData.sMiddleName ? saveData.sMiddleName : ""
        }', sLastName='${
          saveData.sLastName ? saveData.sLastName : ""
        }',sSuffix='${saveData.sSuffix ? saveData.sSuffix : ""}',
        sCredentials='${saveData.sCredentials ? saveData.sCredentials : ""}', 

        sTitle='${saveData.sTitle ? saveData.sTitle : ""}',sCompany='${
          saveData.sCompany ? saveData.sCompany : ""
        }',sAddress1='${saveData.sAddress1 ? saveData.sAddress1 : ""}',
        sAddress2='${saveData.sAddress2 ? saveData.sAddress2 : ""}', 
        
        sAddress3='${saveData.sAddress3 ? saveData.sAddress3 : ""}',sCity='${
          saveData.sCity ? saveData.sCity : ""
        }',sState='${saveData.sState ? saveData.sState : ""}',
        sZip='${saveData.sZip ? saveData.sZip : ""}',

        sCountry='${saveData.sCountry ? saveData.sCountry : ""}',sPhone='${
          saveData.sPhone ? saveData.sPhone : ""
        }',sCell='${saveData.sCell ? saveData.sCell : ""}',
        sFax='${saveData.sFax ? saveData.sFax : ""}',

        sEmail='${saveData.sEmail ? saveData.sEmail : ""}',sBooth='${
          saveData.sBooth ? saveData.sBooth : ""
        }',sBoothSize='${saveData.sBoothSize ? saveData.sBoothSize : ""}',
        sDocument='${saveData.sDocument ? saveData.sDocument : ""}',

        sWebSite='${saveData.sWebSite ? saveData.sWebSite : ""}',mAbout='${
          saveData.mAbout ? saveData.mAbout : ""
        }',mNotes='${saveData.mNotes ? saveData.mNotes : ""}',
        nMaxStaff='${saveData.nMaxStaff ? saveData.nMaxStaff : ""}',

        nExhType='${
          saveData.nExhType ? saveData.nExhType : ""
        }',nSponsorType='${saveData.nSponsorType ? saveData.nSponsorType : ""}',
        
        lAccountID=${dataToSet.lAccountID},lEventID=${dataToSet.lEventID}`;

        dbConfig.getDB().query(sql, function (err2, result2) {
          if (err2) {
            returnCB = 0;
          }
        });
      }
    });
  } else {
    returnCB = 0;
  }

  if (returnCB) {
    callback("", 1);
  } else {
    callback("error", []);
  }
};

let tslAddExhibitorsBoothMembers = (dataToSet, callback) => {
  dbConfig
    .getDB()
    .query("insert into ExhibitorBoothMembers set ? ", dataToSet, callback);
};

let tslUpdateExhibitorsBoothMembers = (dataToSet, callback) => {
  var sql = `Update ExhibitorBoothMembers SET
				sFirstName = '${dataToSet.sFirstName}',
				sLastName = '${dataToSet.sLastName}',
				sTitle = '${dataToSet.sTitle}',				
				sPhone = '${dataToSet.sPhone}',
				sEmail = '${dataToSet.sEmail}',
				nStatus = '${dataToSet.nStatus}',
				dtUpdatedOn = '${dataToSet.dtUpdatedOn}'`;
  if (dataToSet.sPicture) {
    sql = sql + `,sPicture = '${dataToSet.sPicture}'`;
  }
  sql =
    sql +
    ` WHERE lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}' AND lExhibitorID = '${dataToSet.lExhibitorID}' AND lMemberID = '${dataToSet.lMemberID}'`;

  dbConfig.getDB().query(sql, callback);
};

let tslGetExhibitorBoothMembers = (dataToSet, callback) => {
  let searchType = dataToSet.searchType ? dataToSet.searchType : "";
  let searchByKeyword = "";
  if (searchType) {
    if (dataToSet.search) {
      searchByKeyword = ` and ${searchType} LIKE '%${dataToSet.search}%'`;
    }
  }

  var sql = `Select * FROM ExhibitorBoothMembers where lAccountID = '${dataToSet.lAccountID}' and lEventID = '${dataToSet.lEventID}' and lExhibitorID = '${dataToSet.lExhibitorID}'  ${searchByKeyword}`;
  dbConfig.getDB().query(sql, callback);
};

let tslGetExhibitorBoothMembersCount = (dataToSet, callback) => {
  let searchType = dataToSet.searchType ? dataToSet.searchType : "";
  let searchByKeyword = "";
  if (searchType) {
    if (dataToSet.search) {
      searchByKeyword = ` and ${searchType} LIKE '%${dataToSet.search}%'`;
    }
  }

  var sql = `SELECT COUNT(*) as total_records FROM ExhibitorBoothMembers where lAccountID = '${dataToSet.lAccountID}' and lEventID = '${dataToSet.lEventID}' and lExhibitorID = '${dataToSet.lExhibitorID}' ${searchByKeyword}`;
  dbConfig.getDB().query(sql, callback);
};

let tslGetExhibitorBoothMembersByID = (dataToSet, callback) => {
  var sql = `Select * FROM ExhibitorBoothMembers where lAccountID = '${dataToSet.lAccountID}' and lEventID = '${dataToSet.lEventID}' and lExhibitorID = '${dataToSet.lExhibitorID}' AND lMemberID = '${dataToSet.lMemberID}'`;
  dbConfig.getDB().query(sql, callback);
};

let tslGetEmailSetup = (dataToSet, callback) => {
  var sql = `Select * FROM Events where lAccountID = '${dataToSet.lAccountID}' and lEventID = '${dataToSet.lEventID}'`;
  dbConfig.getDB().query(sql, callback);
};

let tslCheckCustomQuestionsScodeExists = (dataToSet, callback) => {
  let lQuestionID = dataToSet.lQuestionID
    ? `AND lQuestionID!=` + dataToSet.lQuestionID
    : "";
  var sql = `SELECT Count(*) as sCodeCount FROM QuestionsConfig
    WHERE sCode='${dataToSet.sCode}' AND lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}' ${lQuestionID}`;

  dbConfig.getDB().query(sql, callback);
};

let tslCheckDiscountCodesScodeExists = (dataToSet, callback) => {
  let lDiscountID = dataToSet.lDiscountID
    ? `AND lDiscountID!=` + dataToSet.lDiscountID
    : "";
  var sql = `SELECT Count(*) as sCodeCount FROM DiscountsConfig
    WHERE sCode='${dataToSet.sCode}' AND lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}' ${lDiscountID}`;
  dbConfig.getDB().query(sql, callback);
};

let tslCheckSessionScodeExists = (dataToSet, callback) => {
  let lSessionID = dataToSet.lSessionID
    ? `AND lSessionID!=` + dataToSet.lSessionID
    : "";
  var sql = `SELECT Count(*) as sCodeCount FROM SessionsConfig
    WHERE sCode='${dataToSet.sCode}' AND lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}' ${lSessionID}`;

  dbConfig.getDB().query(sql, callback);
};

let tslCheckExtraConfigurationScodeExists = (dataToSet, callback) => {
  let lItemID = dataToSet.lItemID ? `AND lItemID!=` + dataToSet.lItemID : "";
  var sql = `SELECT Count(*) as sCodeCount FROM ExtraConfig
    WHERE sCode='${dataToSet.sCode}' AND lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}' ${lItemID}`;
  dbConfig.getDB().query(sql, callback);
};

let tslUpdateEmailSetup = (dataToSet, callback) => {
  var sql = `UPDATE Events SET mConfirmationPageText='${
    dataToSet.mConfirmationPageText
  }', mConfirmationEmailText='${
    dataToSet.mConfirmationEmailText
  }', mConfirmationEmailTextGrp='${
    dataToSet.mConfirmationEmailTextGrp
  }', mCancellationPageText='${dataToSet.mCancellationPageText}',
    mCancellationEmailText='${
      dataToSet.mCancellationEmailText
    }',mInviteEmailText='${
    dataToSet.mInviteEmailText
  }',mConfirmationPageTextExh='${
    dataToSet.mConfirmationPageTextExh
  }',mConfirmationEmailTextExh='${
    dataToSet.mConfirmationEmailTextExh
  }',mCancellationPageTextExh='${dataToSet.mCancellationPageTextExh}',
    mCancellationEmailTextExh='${dataToSet.mCancellationEmailTextExh}',
    dtUpdatedOn='${util.getCurrentDatetime()}'`;
  sql =
    sql +
    ` WHERE lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}'`;

  dbConfig.getDB().query(sql, callback);
};

let tslGetRegistrantsList = (dataToSet, callback) => {
  let searchType = dataToSet.searchType ? dataToSet.searchType : "";
  let searchByKeyword = "";
  if (searchType) {
    if (dataToSet.search) {
      searchByKeyword = ` and ${searchType} LIKE '%${dataToSet.search}%'`;
    }
  }

  let limit = dataToSet.limit ? dataToSet.limit : 10;
  let offset_query = dataToSet.offset
    ? ` LIMIT ${dataToSet.offset},${limit}`
    : `LIMIT ${limit}`;

  var sql = `SELECT rt.sCode,Registrants.lRegID, 0 as lGuestID, Registrants.lAccountID, Registrants.lEventID, Registrants.sFirstName,
   Registrants.sLastName, Registrants.sCompany, Registrants.sEmail,rb.dTotal as Total1, rb.dBalance as Balance1, rb.dPaid as TotalPaid,
    if((Select count(lRegID)  From RegistrantsGroups Where RegistrantsGroups.lAccountID = Registrants.lAccountID and
     RegistrantsGroups.lEventID = Registrants.lEventID and  RegistrantsGroups.lRegID = Registrants.lRegID)<>0,-10,0)
      as lRegisteredAs, Registrants.lRegType, Registrants.dtCreatedOn, Registrants.nStatus
      FROM Registrants LEFT Join RegistrantsBalance as rb ON rb.lAccountID = Registrants.lAccountID and rb.lEventID = Registrants.lEventID
      and rb.lRegID = Registrants.lRegID LEFT JOIN RegTypes rt ON (Registrants.lRegType = rt.lRegTypeID)
      WHERE Registrants.lAccountID='${dataToSet.lAccountID}' AND Registrants.lEventID = '${dataToSet.lEventID}'
      ${searchByKeyword} ORDER BY Registrants.sLastName ASC ${offset_query}`;
      // ORDER BY Registrants.sLastName ASC

      dbConfig.getDB().query(sql, callback);
};

let tslGetAdditionalRegistrantList = (dataToSet, callback) => {
  let searchType = dataToSet.searchType ? dataToSet.searchType : "";
  let searchByKeyword = "";
  if (searchType) {
    if (dataToSet.search) {
      searchByKeyword = ` and ${searchType} LIKE '%${dataToSet.search}%'`;
    }
  }

  let limit = dataToSet.limit ? dataToSet.limit : 10;
  let offset_query = dataToSet.offset
    ? ` LIMIT ${dataToSet.offset},${limit}`
    : `LIMIT ${limit}`;

  var sql = `SELECT reg.lRegID, rg.lGuestID, rg.lAccountID, rg.lEventID, rg.sFirstName, rg.sLastName, reg.sCompany, rg.sEmail, 0 as Total1,
  0 as TotalPaid, 0 as Balance1, if(rg.nType = 0, -2, if(rg.nType = 1,-3, -4)) as lRegisteredAs, if(rg.nType = 0,-2, reg.lRegType) as lRegType,
  rg.dtCreatedOn, rg.nStatus FROM RegGuests as rg INNER JOIN Registrants as reg ON reg.lAccountID = rg.lAccountID and reg.lEventID = rg.lEventID
  and reg.lRegID = rg.lRegID WHERE reg.lAccountID='${dataToSet.lAccountID}' AND reg.lEventID = '${dataToSet.lEventID}' ${searchByKeyword}
  ORDER BY rg.sLastName ASC ${offset_query}`;
  dbConfig.getDB().query(sql, callback);
};


let tslGetCountRegistrantsList = (dataToSet, callback) => {
  let searchType = dataToSet.searchType ? dataToSet.searchType : "";
  let searchByKeyword = "";
  if (searchType) {
    if (dataToSet.search) {
      searchByKeyword = ` and ${searchType} LIKE '%${dataToSet.search}%'`;
    }
  }

  var sql = `SELECT COUNT(*) as registrants_count, Registrants.lRegID, 0 as lGuestID, Registrants.lAccountID, Registrants.lEventID, Registrants.sFirstName,
   Registrants.sLastName, Registrants.sCompany, Registrants.sEmail,rb.dTotal as Total1, rb.dNewBalance as Balance1, rb.dPaid as TotalPaid,
    if((Select count(lRegID)  From RegistrantsGroups Where RegistrantsGroups.lAccountID = Registrants.lAccountID and
     RegistrantsGroups.lEventID = Registrants.lEventID and  RegistrantsGroups.lRegID = Registrants.lRegID)<>0,-10,0)
      as lRegisteredAs, Registrants.lRegType, Registrants.dtCreatedOn, Registrants.nStatus
      FROM Registrants LEFT Join RegistrantsBalance as rb ON rb.lAccountID = Registrants.lAccountID and rb.lEventID = Registrants.lEventID
      and rb.lRegID = Registrants.lRegID  WHERE Registrants.lAccountID = '${dataToSet.lAccountID}' and Registrants.lEventID = '${dataToSet.lEventID}' ${searchByKeyword}`;
  // console.log(sql)
  dbConfig.getDB().query(sql, callback);
};

let tslAddRegistrants = (dataToSet, callback) => {
  var sql = `INSERT INTO Registrants SET lAccountID='${
    dataToSet.lAccountID ? dataToSet.lAccountID : ""
  }', lEventID='${dataToSet.lEventID ? dataToSet.lEventID : ""}',
  sMemberID='${dataToSet.sMemberID ? dataToSet.sMemberID : ""}', sPrefix='${
    dataToSet.sPrefix ? dataToSet.sPrefix : ""
  }', sFirstName='${dataToSet.sFirstName ? dataToSet.sFirstName : ""}',
  sMiddleName='${
    dataToSet.sMiddleName ? dataToSet.sMiddleName : ""
  }', sLastName='${dataToSet.sLastName ? dataToSet.sLastName : ""}', sSuffix='${
    dataToSet.sSuffix ? dataToSet.sSuffix : ""
  }',
  sCredentials='${
    dataToSet.sCredentials ? dataToSet.sCredentials : ""
  }', sTitle='${dataToSet.sTitle ? dataToSet.sTitle : ""}', sCompany='${
    dataToSet.sCompany ? dataToSet.sCompany : ""
  }',
  sAddress1='${dataToSet.sAddress1 ? dataToSet.sAddress1 : ""}', sAddress2='${
    dataToSet.sAddress2 ? dataToSet.sAddress2 : ""
  }', sAddress3='${dataToSet.sAddress3 ? dataToSet.sAddress3 : ""}',
  sCity='${dataToSet.sCity ? dataToSet.sCity : ""}', sState='${
    dataToSet.sState ? dataToSet.sState : ""
  }', sZip='${dataToSet.sZip ? dataToSet.sZip : ""}',
  sCountry='${dataToSet.sCountry ? dataToSet.sCountry : ""}', sPhone='${
    dataToSet.sPhone ? dataToSet.sPhone : ""
  }', sCell='${dataToSet.sCell ? dataToSet.sCell : ""}',
  sFax='${dataToSet.sFax ? dataToSet.sFax : ""}', sEmail='${
    dataToSet.sEmail ? dataToSet.sEmail : ""
  }', sOtherInfo1='${dataToSet.sOtherInfo1 ? dataToSet.sOtherInfo1 : ""}',
  sOtherInfo2='${
    dataToSet.sOtherInfo2 ? dataToSet.sOtherInfo2 : ""
  }', sOtherInfo3='${
    dataToSet.sOtherInfo3 ? dataToSet.sOtherInfo3 : ""
  }', sOtherInfo4='${dataToSet.sOtherInfo4 ? dataToSet.sOtherInfo4 : ""}',
  nStatus='${dataToSet.nStatus ? dataToSet.nStatus : ""}', lRegType='${
    dataToSet.lRegType ? dataToSet.lRegType : ""
  }', dRegAmount='${
    dataToSet.dRegAmount ? dataToSet.dRegAmount : ""
  }', address_type='${dataToSet.address_type ? dataToSet.address_type : ""}',
  mNotes='${
    dataToSet.mNotes ? dataToSet.mNotes : ""
  }', dtCreatedOn='${util.getCurrentDatetime()}'`;

  // dbConfig.getDB().query(sql, callback);
  dbConfig.getDB().query(sql, function (err, results) {
    if (results.affectedRows > 0) {
      if (dataToSet.fieldsText) {
        Object.keys(dataToSet.fieldsText).map(function (key) {
          var sql1 = `INSERT INTO RegAnswers SET lAccountID='${dataToSet.lAccountID}', lEventID='${dataToSet.lEventID}',
          lRegID='${results.insertId}', lQuestionID='${key}',sOther='${dataToSet.fieldsText[key]}'`;
          dbConfig.getDB().query(sql1);
        });
      }
      if (dataToSet.fieldsChecked) {
        Object.keys(dataToSet.fieldsChecked).map(function (key) {
          var sql2 = `INSERT INTO RegAnswers SET lAccountID='${dataToSet.lAccountID}', lEventID='${dataToSet.lEventID}',
          lRegID='${results.insertId}', lQuestionID='${key}',lAnswerID='${dataToSet.fieldsChecked[key]}'`;
          dbConfig.getDB().query(sql2);
        });
      }
      callback("", results);
    } else {
      callback("error", []);
    }
  });
};


let tslGetRegistrants = (dataToSet, callback) => {
  var sql = `Select * FROM Registrants where lAccountID = '${dataToSet.lAccountID}' and lEventID = '${dataToSet.lEventID}' and  lRegID = '${dataToSet.lRegID}'`;
  dbConfig.getDB().query(sql, callback);
};


let tslGetQuestionsRegistrantsList = (dataToSet, callback) => {
  var resultsArray = [];
  var sql = `Select qc.lQuestionID, qc.sName, qc.nType, ac.lAnswerID, ac.sAnswer, qc.bRequired FROM QuestionsConfig qc RIGHT JOIN AnswersConfig ac ON (qc.lQuestionID=ac.lQuestionID)  WHERE qc.lAccountID='${dataToSet.lAccountID}' AND qc.lEventID = '${dataToSet.lEventID}' AND qc.bBasicField = 0 AND qc.nStatus = 0 order by qc.nOrder`;

  // console.log('sql',sql)
  // dbConfig.getDB().query(sql, function (err, results) {
  //   if (results.length) {
  //     // console.log('results',results)
  //     // // results.forEach((item,key) => {
  //     // //   console.log('item',item)
  //     // //   console.log('key',key)
  //     // //   var sql2 = `SELECT * FROM AnswersConfig WHERE lAccountID = '${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}' AND lQuestionID = '${item.lQuestionID}'`
  //     // //   dbConfig.getDB().query(sql2, function (err2, results2) {
  //     // //     // resultsArray.push(results2)
  //     // //     console.log('item.lQuestionID',item.lQuestionID);
  //     // //   //   if(results2.length){
  //     // //   //     // resultsArray.push({item,results});
  //     // //       // item[key] = results2
  //     // //       resultsArray[item.lQuestionID] = results2
  //     // //       console.log('resultsArray',resultsArray)
  //     // //   //   }
  //     // //   });
  //     // //   // resultsArray = item;
  //     // //   // resultsArray.push(item)
  //     // // });
  //     // // console.log('resultsArray',resultsArray)
  //   }
  // });
  dbConfig.getDB().query(sql, callback);
};

let tslGetGuestAdditionalRegistrants = (dataToSet, callback) => {
  let searchType = dataToSet.searchType ? dataToSet.searchType : "";
  let searchByKeyword = "";
  if (searchType) {
    if (dataToSet.search) {
      searchByKeyword = ` and ${searchType} LIKE '%${dataToSet.search}%'`;
    }
  }
  // searchByKeyword =  dataToSet.search ? ` and sEventContactEmail LIKE '%${dataToSet.search}%'` : '';
  let limit = dataToSet.limit ? dataToSet.limit : 10;
  let offset_query = dataToSet.offset
    ? ` LIMIT ${dataToSet.offset},${limit}`
    : `LIMIT ${limit}`;

  var sql = `Select * FROM RegGuests where lAccountID='${dataToSet.lAccountID}' AND 
    lEventID = '${dataToSet.lEventID}' AND lRegID = '${dataToSet.lRegID}' ${searchByKeyword} ${offset_query}`;

  dbConfig.getDB().query(sql, callback);
};

let tslAddGuestAdditionalInformation = (dataToSet, callback) => {
  var sql = `INSERT INTO RegGuests SET lAccountID='${
    dataToSet.lAccountID ? dataToSet.lAccountID : ""
  }', lEventID='${dataToSet.lEventID ? dataToSet.lEventID : ""}', lRegID='${
    dataToSet.lRegID ? dataToSet.lRegID : ""
  }',
  sFirstName='${
    dataToSet.sFirstName ? dataToSet.sFirstName : ""
  }', sLastName='${dataToSet.sLastName ? dataToSet.sLastName : ""}', sTitle='${
    dataToSet.sTitle ? dataToSet.sTitle : ""
  }',
  sPhone='${dataToSet.sPhone ? dataToSet.sPhone : ""}', sEmail='${
    dataToSet.sEmail ? dataToSet.sEmail : ""
  }', nType='${dataToSet.nType ? dataToSet.nType : ""}',
  dAmount='${dataToSet.dAmount ? dataToSet.dAmount : ""}', nStatus='${
    dataToSet.nStatus ? dataToSet.nStatus : ""
  }', dtCreatedOn='${util.getCurrentDatetime()}'`;

  dbConfig.getDB().query(sql, callback);
};

let tslUpdateGuestsAdditionalInformation = (dataToSet, callback) => {
  var sql = `UPDATE RegGuests SET sFirstName='${
    dataToSet.sFirstName ? dataToSet.sFirstName : ""
  }', sLastName='${dataToSet.sLastName ? dataToSet.sLastName : ""}', sTitle='${
    dataToSet.sTitle ? dataToSet.sTitle : ""
  }',
  sPhone='${dataToSet.sPhone ? dataToSet.sPhone : ""}', sEmail='${
    dataToSet.sEmail ? dataToSet.sEmail : ""
  }', nType='${dataToSet.nType ? dataToSet.nType : ""}',
  dAmount='${dataToSet.dAmount ? dataToSet.dAmount : ""}', nStatus='${
    dataToSet.nStatus ? dataToSet.nStatus : ""
  }', dtUpdatedOn='${util.getCurrentDatetime()}'`;
  sql =
    sql +
    ` WHERE lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}' AND lRegID = '${dataToSet.lRegID}' AND lGuestID = '${dataToSet.lGuestID}' `;

  // dbConfig.getDB().query(sql, callback);

  dbConfig.getDB().query(sql, function (err, results) {
    
    var sql2 = `DELETE FROM RegAnswers WHERE lRegID = '${dataToSet.lGuestID}'`;

    dbConfig.getDB().query(sql2, function(err2,results2){
      // if (results2) {
        if (dataToSet.fieldsText) {
          Object.keys(dataToSet.fieldsText).map(function (key) {
            var sql3 = `INSERT INTO RegAnswers SET lAccountID='${dataToSet.lAccountID}', lEventID='${dataToSet.lEventID}',
            lRegID='${dataToSet.lGuestID}', lQuestionID='${key}',sOther='${dataToSet.fieldsText[key]}'`;
            dbConfig.getDB().query(sql3);
          });
        }
        if (dataToSet.fieldsChecked) {
          Object.keys(dataToSet.fieldsChecked).map(function (key) {
            var sql4 = `INSERT INTO RegAnswers SET lAccountID='${dataToSet.lAccountID}', lEventID='${dataToSet.lEventID}',
            lRegID='${dataToSet.lGuestID}', lQuestionID='${key}',lAnswerID='${dataToSet.fieldsChecked[key]}'`;
            dbConfig.getDB().query(sql4);
          });
        }
        callback("", results);
      // } else {
      //   callback("error", []);
      // }
    });

    
  });
};

let tslGetGuestAddditionalInformationById = (dataToSet, callback) => {
  var sql = `Select * FROM RegGuests where lAccountID='${dataToSet.lAccountID}' AND 
    lEventID = '${dataToSet.lEventID}' AND lRegID = '${dataToSet.lRegID}' AND lGuestID = '${dataToSet.lGuestID}'`;

  dbConfig.getDB().query(sql, callback);
};

let tslGetAnswersRegistrant = (dataToSet, callback) => {
  var sql = `Select lQuestionID, lAnswerID, sOther FROM RegAnswers where lAccountID='${dataToSet.lAccountID}' AND 
    lEventID = '${dataToSet.lEventID}' AND lRegID = '${dataToSet.lRegID}'`;


    var resultsArray = {}
    dbConfig.getDB().query(sql, function(err,results){
      if(results){
        results.map((data,index)=>{
          if(data.lAnswerID){
            resultsArray[data.lQuestionID] = data.lAnswerID
          }
          if(data.sOther!==''){
            resultsArray[data.lQuestionID] = data.sOther
          }
         
          
        })
      }
      callback("",resultsArray)
    });
    
    
    
  // dbConfig.getDB().query(sql, callback);
};

let tslGetRegistrantSessions = (dataToSet, callback) => {
  let searchType = dataToSet.searchType ? dataToSet.searchType : "";
  let searchByKeyword = "";
  if (searchType) {
    if (dataToSet.search) {
      searchByKeyword = ` and rs.${searchType} LIKE '%${dataToSet.search}%'`;
    }
  }

  var sql = `Select rs.*, sc.sCode, sc.sName FROM RegSessions rs LEFT JOIN SessionsConfig sc ON(rs.lSessionID = sc.lSessionID) where rs.lAccountID='${dataToSet.lAccountID}' AND 
  rs.lEventID = '${dataToSet.lEventID}' AND rs.lRegID = '${dataToSet.lRegID}' ${searchByKeyword}`;

  // console.log('sql',sql)

  dbConfig.getDB().query(sql, callback);
};

let tslAddRegistrantSessions = (dataToSet, callback) => {
  var sql = `INSERT INTO RegSessions SET lAccountID='${
    dataToSet.lAccountID ? dataToSet.lAccountID : ""
  }', lEventID='${dataToSet.lEventID ? dataToSet.lEventID : ""}', lRegID='${
    dataToSet.lRegID ? dataToSet.lRegID : ""
  }',
  lSessionID='${
    dataToSet.lSessionID ? dataToSet.lSessionID : ""
  }', sAdditionalText='${
    dataToSet.sAdditionalText ? dataToSet.sAdditionalText : ""
  }', lQty='${dataToSet.lQty ? dataToSet.lQty : ""}',
  dTotal='${dataToSet.dTotal ? dataToSet.dTotal : ""}', nStatus='${
    dataToSet.nStatus ? dataToSet.nStatus : ""
  }', dtCreatedOn='${util.getCurrentDatetime()}'`;

  dbConfig.getDB().query(sql, callback);
};

let tslGetSessionsConfig = (dataToSet, callback) => {
  var sql = `SELECT * FROM SessionsConfig where lAccountID='${dataToSet.lAccountID}' AND 
    lEventID = '${dataToSet.lEventID}'`;

  dbConfig.getDB().query(sql, callback);
};

let tslGetSessionsConfigById = (dataToSet, callback) => {
  var sql = `Select * FROM RegSessions where lAccountID = '${dataToSet.lAccountID}' and lEventID = '${dataToSet.lEventID}' and lRegID = '${dataToSet.lRegID}' and lID ='${dataToSet.lRegSessionID}'`;
  dbConfig.getDB().query(sql, callback);
};

let tslUpdateSessionsConfig = (dataToSet, callback) => {
  var sql = `UPDATE RegSessions SET lSessionID='${
    dataToSet.lSessionID
  }', sAdditionalText='${dataToSet.sAdditionalText}', lQty='${
    dataToSet.lQty
  }', nStatus='${dataToSet.nStatus}',
    dTotal='${dataToSet.dTotal}',
    dtUpdatedOn='${util.getCurrentDatetime()}'`;
  sql =
    sql +
    ` WHERE lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}' AND lRegID = '${dataToSet.lRegID}' AND lID = '${dataToSet.lRegSessionID}'`;
  dbConfig.getDB().query(sql, callback);
};

let tslGetRegPayments = (dataToSet, callback) => {
  var sql = `SELECT * FROM RegPayments where lAccountID='${dataToSet.lAccountID}' AND 
    lEventID = '${dataToSet.lEventID}' AND lRegID = '${dataToSet.lRegID}'`;

  dbConfig.getDB().query(sql, callback);
};

let tslAddRegPayments = (dataToSet, callback) => {
  var sql = `INSERT INTO RegPayments SET lAccountID='${
    dataToSet.lAccountID ? dataToSet.lAccountID : ""
  }', lEventID='${dataToSet.lEventID ? dataToSet.lEventID : ""}', lRegID='${
    dataToSet.lRegID ? dataToSet.lRegID : ""
  }',
  dtDate='${
    dataToSet.dtDate ? dataToSet.dtDate : ""
  }', nType='${dataToSet.nType ? dataToSet.nType : 0}',
  sPayor='${dataToSet.sPayor ? dataToSet.sPayor : ""}',
  sCompany='${dataToSet.sCompany ? dataToSet.sCompany : ""}',
  sNumber='${dataToSet.sNumber ? dataToSet.sNumber : ""}',
  sExpDate='${dataToSet.sExpDate ? dataToSet.sExpDate : ""}',
  dAmount='${dataToSet.dAmount ? dataToSet.dAmount : ""}',
  sTransactionID='${dataToSet.sTransactionID ? dataToSet.sTransactionID : ""}',
  sInvoice='${dataToSet.sInvoice ? dataToSet.sInvoice : ""}',
  sStatus='${
    dataToSet.sStatus ? dataToSet.sStatus : 'Pending'
  }', dtCreatedOn='${util.getCurrentDatetime()}'`;

  dbConfig.getDB().query(sql, function(err,results){
    if(results.affectedRows > 0){
      var sql2 = `Select sum(dAmount) as dTotalPaid from RegPayments where lAccountID='${dataToSet.lAccountID}' AND 
      lEventID = '${dataToSet.lEventID}' AND lRegID = '${dataToSet.lRegID}' AND sStatus = 'Approved' AND dAmount > 0`;

      dbConfig.getDB().query(sql2, function(err2,result2){
        if(result2 && result2[0]!==undefined){
          var sql3 =  `UPDATE RegistrantsBalance SET dPaid='${result2[0].dTotalPaid}' where lAccountID='${dataToSet.lAccountID}' AND 
          lEventID = '${dataToSet.lEventID}' AND lRegID = '${dataToSet.lRegID}'`
          dbConfig.getDB().query(sql3, function(err3,results3){
            if(results3.affectedRows > 0){
              callback("",results3)
            }
          });

        }
      });

    }
  });
};

let tslUpdateRegPayments = (dataToSet, callback) => {
  var sql = `UPDATE RegPayments SET dtDate='${
    dataToSet.dtDate ? dataToSet.dtDate : ""
  }', nType='${dataToSet.nType ? dataToSet.nType : 0}',
  sPayor='${dataToSet.sPayor ? dataToSet.sPayor : ""}',
  sCompany='${dataToSet.sCompany ? dataToSet.sCompany : ""}',
  sNumber='${dataToSet.sNumber ? dataToSet.sNumber : ""}',
  sExpDate='${dataToSet.sExpDate ? dataToSet.sExpDate : ""}',
  dAmount='${dataToSet.dAmount ? dataToSet.dAmount : ""}',
  sTransactionID='${dataToSet.sTransactionID ? dataToSet.sTransactionID : ""}',
  sInvoice='${dataToSet.sInvoice ? dataToSet.sInvoice : ""}',
  sStatus='${
    dataToSet.sStatus ? dataToSet.sStatus : 'Pending'
  }', dtUpdatedOn='${util.getCurrentDatetime()}'`;
  sql =
    sql +
    ` WHERE lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}' AND lRegID = '${dataToSet.lRegID}' AND lPaymentID = '${dataToSet.lPaymentID}'`;

  dbConfig.getDB().query(sql, function(err,results){
    if(results.affectedRows > 0){
      var sql2 = `Select sum(dAmount) as dTotalPaid from RegPayments where lAccountID='${dataToSet.lAccountID}' AND 
      lEventID = '${dataToSet.lEventID}' AND lRegID = '${dataToSet.lRegID}' AND sStatus = 'Approved' AND dAmount > 0`;

      dbConfig.getDB().query(sql2, function(err2,result2){
        if(result2 && result2[0]!==undefined){
          var sql3 =  `UPDATE RegistrantsBalance SET dPaid='${result2[0].dTotalPaid}' where lAccountID='${dataToSet.lAccountID}' AND 
          lEventID = '${dataToSet.lEventID}' AND lRegID = '${dataToSet.lRegID}'`
          dbConfig.getDB().query(sql3, function(err3,results3){
            if(results3.affectedRows > 0){
              callback("",results3)
            }
          });

        }
      });

    }
  });
};

let tslGetRegPaymentsByID = (dataToSet, callback) => {
  var sql = `SELECT * FROM RegPayments where lAccountID='${dataToSet.lAccountID}' AND 
    lEventID = '${dataToSet.lEventID}' AND lRegID = '${dataToSet.lRegID}' AND lPaymentID = '${dataToSet.lPaymentID}'`;

  dbConfig.getDB().query(sql, callback);
};

let tslGetRegAmount = (dataToSet, callback) => {
  var data = {}
  var sql = `SELECT dRegAmount, dTaxesAmt, dSpecialDiscountAmt, dServiceFeeAmt, dCancellationFee FROM Registrants where lAccountID='${dataToSet.lAccountID}' AND 
    lEventID = '${dataToSet.lEventID}' AND lRegID = '${dataToSet.lRegID}'`;
    
    dbConfig.getDB().query(sql, function(err,result){
      if(result && result[0]!==undefined){
        data.dRegAmount = result[0].dRegAmount
        data.dSpecialDiscountAmt = result[0].dSpecialDiscountAmt
        data.dServiceFeeAmt = result[0].dServiceFeeAmt
        data.dCancellationFee = result[0].dCancellationFee
        data.dTaxesAmt = result[0].dTaxesAmt

        var sql2 = `Select sum(dAmount) as dGuestsAmount from RegGuests where lAccountID='${dataToSet.lAccountID}' AND 
        lEventID = '${dataToSet.lEventID}' AND lRegID = '${dataToSet.lRegID}' AND nType = 0 AND nStatus = 0`;

        dbConfig.getDB().query(sql2, function(err2,result2){
          if(result2 && result2[0]!==undefined){
            data.dGuestsAmount = result2[0].dGuestsAmount
          }
            var sql3 = `Select sum(dAmount) as dAddRegAmount from RegGuests where lAccountID='${dataToSet.lAccountID}' AND 
              lEventID = '${dataToSet.lEventID}' AND lRegID = '${dataToSet.lRegID}' AND nType = 1 AND nStatus = 0`;
            
              dbConfig.getDB().query(sql3, function(err3,result3){
                if(result3 && result3[0]!==undefined){
                  data.dAddRegAmount = result3[0].dAddRegAmount
                }

                  var sql4 = `SELECT  sum(dTotal) as dSessionsAmount FROM RegSessions where lAccountID='${dataToSet.lAccountID}' AND 
                    lEventID = '${dataToSet.lEventID}' AND lRegID = '${dataToSet.lRegID}'`;
                    dbConfig.getDB().query(sql4, function(err4,result4){
                      if(result4 && result4[0]!==undefined){
                        data.dSessionsAmount = result4[0].dSessionsAmount
                      }

                        var sql5 = `Select dAmount as dDiscountAmount from DiscountsConfig where lAccountID='${dataToSet.lAccountID}' AND 
                          lEventID = '${dataToSet.lEventID}'`;

                          dbConfig.getDB().query(sql5, function(err5,result5){
                            if(result5 && result5[0]!==undefined){
                              data.dDiscountAmount = result5[0].dDiscountAmount
                            }

                              var sql6 = `Select sum(dAmount) as dTotalRefund from RegPayments where lAccountID='${dataToSet.lAccountID}' AND 
                                lEventID = '${dataToSet.lEventID}' AND lRegID = '${dataToSet.lRegID}' AND sStatus = 'Approved' AND dAmount < 0`;

                                dbConfig.getDB().query(sql6, function(err6,result6){
                                  if(result6 && result6[0]!==undefined){
                                    data.dTotalRefund = result6[0].dTotalRefund
                                  }
                                    
                                    var sql7 = `Select sum(dAmount) as dTotalPaid from RegPayments where lAccountID='${dataToSet.lAccountID}' AND 
                                      lEventID = '${dataToSet.lEventID}' AND lRegID = '${dataToSet.lRegID}' AND sStatus = 'Approved' AND dAmount > 0`;

                                      dbConfig.getDB().query(sql7, function(err7,result7){
                                        if(result7 && result7[0]!==undefined){
                                          data.dTotalPaid = result7[0].dTotalPaid
                                        }
                                        
                                        callback("",data)
                                      })
                                      
                                  }
                                  
                                  
                                )
                            }
                          )

                      }
                    )
            

                }
              )


          }
        )
        
      }
      
    });
    
};

let tslGetRegGuestsAmount = (dataToSet, callback) => {
  var sql = `Select sum(dAmount) as dGuestsAmount from RegGuests where lAccountID='${dataToSet.lAccountID}' AND 
    lEventID = '${dataToSet.lEventID}' AND lRegID = '${dataToSet.lRegID}' AND nType = 0 AND nStatus = 0`;

  
  dbConfig.getDB().query(sql, callback);
};

let tslUpdateRegAmount = (dataToSet, callback) => {
  var sql = `UPDATE Registrants SET 
  dRegAmount='${dataToSet.dRegAmount ? dataToSet.dRegAmount : 0}',
  dSpecialDiscountAmt='${dataToSet.dSpecialDiscountAmt ? dataToSet.dSpecialDiscountAmt : ""}',
  dCancellationFee='${dataToSet.dCancellationFee ? dataToSet.dCancellationFee : ""}'`;
  sql =
    sql +
    ` WHERE lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}' AND lRegID = '${dataToSet.lRegID}'`;

  dbConfig.getDB().query(sql, callback);
};

let tslCreateStripeIntent = async (dataToSet, callback) => {

  const stripe = require('stripe')('sk_test_51NKfOdSBfRPg33ag7A042ZYsx27RP38TzkQn5gnb7dwqxpZubOwbPnxqB6dHxF6LF6MDZlrg4awVYgCiaaQxzB8Q00CZ08vxSB');

  const paymentIntent = await stripe.paymentIntents.create({
    amount: 1,
    currency: 'usd',
    // payment_method_types: ['card'],
    automatic_payment_methods: {enabled: true}, 
  });

  if(paymentIntent && paymentIntent.client_secret!==undefined){
    callback("", paymentIntent);
  }else {
    callback("error", []);
  }
}

let tslUpdateRegistrants = (dataToSet, callback) => {
  var sql = `UPDATE Registrants SET
  sMemberID='${dataToSet.sMemberID ? dataToSet.sMemberID : ""}', sPrefix='${
    dataToSet.sPrefix ? dataToSet.sPrefix : ""
  }', sFirstName='${dataToSet.sFirstName ? dataToSet.sFirstName : ""}',
  sMiddleName='${
    dataToSet.sMiddleName ? dataToSet.sMiddleName : ""
  }', sLastName='${dataToSet.sLastName ? dataToSet.sLastName : ""}', sSuffix='${
    dataToSet.sSuffix ? dataToSet.sSuffix : ""
  }',
  sCredentials='${
    dataToSet.sCredentials ? dataToSet.sCredentials : ""
  }', sTitle='${dataToSet.sTitle ? dataToSet.sTitle : ""}', sCompany='${
    dataToSet.sCompany ? dataToSet.sCompany : ""
  }',
  sAddress1='${dataToSet.sAddress1 ? dataToSet.sAddress1 : ""}', sAddress2='${
    dataToSet.sAddress2 ? dataToSet.sAddress2 : ""
  }', sAddress3='${dataToSet.sAddress3 ? dataToSet.sAddress3 : ""}',
  sCity='${dataToSet.sCity ? dataToSet.sCity : ""}', sState='${
    dataToSet.sState ? dataToSet.sState : ""
  }', sZip='${dataToSet.sZip ? dataToSet.sZip : ""}',
  sCountry='${dataToSet.sCountry ? dataToSet.sCountry : ""}', sPhone='${
    dataToSet.sPhone ? dataToSet.sPhone : ""
  }', sCell='${dataToSet.sCell ? dataToSet.sCell : ""}',
  sFax='${dataToSet.sFax ? dataToSet.sFax : ""}', sEmail='${
    dataToSet.sEmail ? dataToSet.sEmail : ""
  }', sOtherInfo1='${dataToSet.sOtherInfo1 ? dataToSet.sOtherInfo1 : ""}',
  sOtherInfo2='${
    dataToSet.sOtherInfo2 ? dataToSet.sOtherInfo2 : ""
  }', sOtherInfo3='${
    dataToSet.sOtherInfo3 ? dataToSet.sOtherInfo3 : ""
  }', sOtherInfo4='${dataToSet.sOtherInfo4 ? dataToSet.sOtherInfo4 : ""}',
  nStatus='${dataToSet.nStatus ? dataToSet.nStatus : ""}', lRegType='${
    dataToSet.lRegType ? dataToSet.lRegType : ""
  }', dRegAmount='${
    dataToSet.dRegAmount ? dataToSet.dRegAmount : ""
  }', address_type='${dataToSet.address_type ? dataToSet.address_type : ""}',
  mNotes='${
    dataToSet.mNotes ? dataToSet.mNotes : ""
  }', dtUpdatedOn='${util.getCurrentDatetime()}'
  WHERE lAccountID='${dataToSet.lAccountID}' && lEventID='${dataToSet.lEventID}'
  && lRegID='${dataToSet.lRegID}'`;

  // dbConfig.getDB().query(sql, callback);
  dbConfig.getDB().query(sql, function (err, results) {
    
    var sql2 = `DELETE FROM RegAnswers WHERE lRegID = '${dataToSet.lRegID}'`;

    dbConfig.getDB().query(sql2, function(err2,results2){
      // if (results2) {
        if (dataToSet.fieldsText) {
          Object.keys(dataToSet.fieldsText).map(function (key) {
            var sql3 = `INSERT INTO RegAnswers SET lAccountID='${dataToSet.lAccountID}', lEventID='${dataToSet.lEventID}',
            lRegID='${dataToSet.lRegID}', lQuestionID='${key}',sOther='${dataToSet.fieldsText[key]}'`;
            dbConfig.getDB().query(sql3);
          });
        }
        if (dataToSet.fieldsChecked) {
          Object.keys(dataToSet.fieldsChecked).map(function (key) {
            var sql4 = `INSERT INTO RegAnswers SET lAccountID='${dataToSet.lAccountID}', lEventID='${dataToSet.lEventID}',
            lRegID='${dataToSet.lRegID}', lQuestionID='${key}',lAnswerID='${dataToSet.fieldsChecked[key]}'`;
            dbConfig.getDB().query(sql4);
          });
        }
        callback("", results);
      // } else {
      //   callback("error", []);
      // }
    });

    
  });
};

let tslGetRegTypeAmount = (dataToSet, callback) => {
  var sql = `SELECT  lRegTypeID, dEarlyAmt, dPricePerAddRegEarly, dPricePerGuestEarly, dtEarlyDate, dStandardAmt, dPricePerAddRegStd, dPricePerGuestStd, dtStandardDate, dOnsiteAmt, dPricePerAddReg, dPricePerGuest FROM RegTypes
    WHERE lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}' AND lRegTypeID = '${dataToSet.lRegType}'`;
  dbConfig.getDB().query(sql, callback);
};

let tslGetSessionPrice = (dataToSet, callback) => {
  var sql = `Select lSessionID, dPrice1, dtPrice1, dPrice2, dtPrice2, dPrice3 from SessionsConfig Where lAccountID ='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}' AND lSessionID = '${dataToSet.lSessionID}'`;
  dbConfig.getDB().query(sql, callback);
};

// delete Registrants
let tslDeleteRegistrants = (dataToSet, callback) => {
  // console.log(dataToSet);
  var sql = `DELETE Registrants FROM Registrants LEFT JOIN Events ON(Registrants.lEventID = Events.lEventID) WHERE Registrants.lAccountID = '${dataToSet.lAccountID}' AND Registrants.lEventID = '${dataToSet.lEventID}' AND Events.sStatus = 'Test'`;
  dbConfig.getDB().query(sql, callback);
};

let tslAddRegistrantsImport = (dataToSet, callback) => {
  var returnCB = 1;
  var columnArray = dataToSet.columnArray ? dataToSet.columnArray : [];
  var valuesArray = dataToSet.valuesArray ? dataToSet.valuesArray : [];
  let saveData = {};

  if (valuesArray && columnArray) {
    const questionData = columnArray.filter(item => item.includes(":"));
    columnArray = columnArray.filter(item => !item.includes(":"));
    
    valuesArray.map((data, index) => {
      saveData = {};
      columnArray.map((data2, index2) => {
        if (data2) {
          if (data[index2]) {
            saveData[data2] = data[index2];
          }
        }
      });

      if (saveData) {
        const regSql = saveData.lRegID ? `lRegID=${saveData.lRegID},` : '';
        var sql = `INSERT INTO Registrants SET
        
        ${regSql}
        sMemberID='${
          saveData.sMemberID ? saveData.sMemberID : ""
        }',sPrefix='${saveData.sPrefix ? saveData.sPrefix : ""}',
        sFirstName='${
          saveData.sFirstName ? saveData.sFirstName : ""
        }', sMiddleName='${
          saveData.sMiddleName ? saveData.sMiddleName : ""
        }', sLastName='${
          saveData.sLastName ? saveData.sLastName : ""
        }',sSuffix='${saveData.sSuffix ? saveData.sSuffix : ""}',
        sCredentials='${saveData.sCredentials ? saveData.sCredentials : ""}', 

        sTitle='${saveData.sTitle ? saveData.sTitle : ""}',sCompany='${
          saveData.sCompany ? saveData.sCompany : ""
        }',sAddress1='${saveData.sAddress1 ? saveData.sAddress1 : ""}',
        sAddress2='${saveData.sAddress2 ? saveData.sAddress2 : ""}', 
        
        sAddress3='${saveData.sAddress3 ? saveData.sAddress3 : ""}',sCity='${
          saveData.sCity ? saveData.sCity : ""
        }',sState='${saveData.sState ? saveData.sState : ""}',
        sZip='${saveData.sZip ? saveData.sZip : ""}',

        sCountry='${saveData.sCountry ? saveData.sCountry : ""}',sPhone='${
          saveData.sPhone ? saveData.sPhone : ""
        }',sCell='${saveData.sCell ? saveData.sCell : ""}',
        sFax='${saveData.sFax ? saveData.sFax : ""}',

        sEmail='${saveData.sEmail ? saveData.sEmail : ""}',sOtherInfo1='${
          saveData.sOtherInfo1 ? saveData.sOtherInfo1 : ""
        }',sOtherInfo2='${saveData.sOtherInfo2 ? saveData.sOtherInfo2 : ""}',
        sOtherInfo3='${saveData.sOtherInfo3 ? saveData.sOtherInfo3 : ""}',

        sOtherInfo4='${saveData.sOtherInfo4 ? saveData.sOtherInfo4 : ""}',lRegType='${
          saveData.lRegType ? saveData.lRegType : 0
        }', dtCreatedOn='${util.getCurrentDatetime()}',
        lAccountID=${dataToSet.lAccountID},lEventID=${dataToSet.lEventID}`;
        
        dbConfig.getDB().query(sql, function (err2, result2) {
          if (err2) {
            returnCB = 0;
          }else{
            questionData.map((data3, index3) => {
              var sOther = ''
              var lAnswerID = 0
              if (data3.indexOf(':') !== -1) {
                var lQuestionID = data3.split(':')[0];
                if(isNaN(data3.split(':')[1])){
                  sOther = data3.split(':')[1]
                }else{
                  lAnswerID = data3.split(':')[1];
                }
              }
              var sql2 = `INSERT INTO RegAnswers SET
              lAccountID='${dataToSet.lAccountID}',
              lEventID='${dataToSet.lEventID}',
              lRegID='${result2.insertId}',
              lQuestionID='${lQuestionID}',
              lAnswerID='${lAnswerID}',
              sOther = '${sOther}'`

              dbConfig.getDB().query(sql2, function (err3, result3) {
                if (err3) {
                  returnCB = 0;
                }
              });
            });
          }
        });
      }
    });
  } else {
    returnCB = 0;
  }

  if (returnCB) {
    callback("", 1);
  } else {
    callback("error", []);
  }
};

let tslGetEventHeaderAndFooter = (dataToSet, callback) => {
  var sql = `Select * from Events 
    WHERE lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}'`;
  dbConfig.getDB().query(sql, callback);
};

let tslGetRegTypesTemplate1 = (dataToSet, callback) => {
  var sql = `SELECT rt.lRegTypeID, rt.sCode, rt.sName, rt.dEarlyAmt, rt.dPricePerAddRegEarly, rt.dPricePerGuestEarly, rt.dtEarlyDate, rt.dStandardAmt, rt.dPricePerAddRegStd, rt.dPricePerGuestStd, rt.dtStandardDate, rt.dOnsiteAmt, rt.bNeedMembership, rt.nAddRegMax, rt.dPricePerAddReg, rt.nGuestsMax, rt.dPricePerGuest, rt.sPrintText, rt.nStatus FROM CategoriesConfig cc INNER JOIN RegTypes rt ON FIND_IN_SET(rt.lRegTypeID, cc.sApplyToRegTypes) > 0
            WHERE cc.lAccountID='${dataToSet.lAccountID}' AND cc.lEventID = '${dataToSet.lEventID}' AND cc.lCategoryID = '${dataToSet.lCategoryID}' AND rt.nStatus = 0`;
  //  console.log('sql',sql)         
  dbConfig.getDB().query(sql, callback);
};

let tslGetAdditionalFieldsVisible = (dataToSet, callback) => {
  var sql = `Select sName, bVisibleForAddReg, bRequired FROM GuestsFieldsConfig
   WHERE lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}' AND bVisibleForAddReg = '1'`;
  
    dbConfig.getDB().query(sql, callback);
};

let tslAddFieldsDataDefault = (dataToSet, callback) => {
  var returnCB = 1;
  let fieldsDataArray = dataToSet.fieldsDataArray ? dataToSet.columnArray : []

  if (fieldsDataArray) {
    fieldsDataArray.map((data, index) => {
        var sql = `INSERT INTO QuestionsConfig SET 

        lAccountID='${dataToSet.lAccountID }',lEventID='${dataToSet.lEventID}',
        sCode='${data.sCode ? saveData.sCode : ""}',
        sName='${
          data.sName ? data.sName : "" 
        }', nType= '0' , bBasicField= '1',bVisible= ' ',
        bRequired='${(data.sCode == 'sFirstName' || data.sCode == 'sLastName' || data.sCode == 'sEmail') ? 1 : 0}', 

        nStatus=0,sCompany='${
          saveData.sCompany ? saveData.sCompany : ""
        }',sAddress1='${saveData.sAddress1 ? saveData.sAddress1 : ""}',
        sAddress2='${saveData.sAddress2 ? saveData.sAddress2 : ""}', 
        
        sAddress3='${saveData.sAddress3 ? saveData.sAddress3 : ""}',sCity='${
          saveData.sCity ? saveData.sCity : ""
        }',sState='${saveData.sState ? saveData.sState : ""}',
        sZip='${saveData.sZip ? saveData.sZip : ""}',

        sCountry='${saveData.sCountry ? saveData.sCountry : ""}',sPhone='${
          saveData.sPhone ? saveData.sPhone : ""
        }',sCell='${saveData.sCell ? saveData.sCell : ""}',
        sFax='${saveData.sFax ? saveData.sFax : ""}',

        sEmail='${saveData.sEmail ? saveData.sEmail : ""}',sBooth='${
          saveData.sBooth ? saveData.sBooth : ""
        }',sBoothSize='${saveData.sBoothSize ? saveData.sBoothSize : ""}',
        sDocument='${saveData.sDocument ? saveData.sDocument : ""}',

        sWebSite='${saveData.sWebSite ? saveData.sWebSite : ""}',mAbout='${
          saveData.mAbout ? saveData.mAbout : ""
        }',mNotes='${saveData.mNotes ? saveData.mNotes : ""}',
        nMaxStaff='${saveData.nMaxStaff ? saveData.nMaxStaff : ""}',

        nExhType='${
          saveData.nExhType ? saveData.nExhType : ""
        }',nSponsorType='${saveData.nSponsorType ? saveData.nSponsorType : ""}',
        
        lAccountID=${dataToSet.lAccountID},lEventID=${dataToSet.lEventID}`;

        dbConfig.getDB().query(sql, function (err2, result2) {
          if (err2) {
            returnCB = 0;
          }
        });
    });
  } else {
    returnCB = 0;
  }

  if (returnCB) {
    callback("", 1);
  } else {
    callback("error", []);
  }
};

let tslGetSessionsTicketsDataTemplate1 = (dataToSet, callback) => {
  var sql = `SELECT * FROM SessionsConfig where lAccountID='${dataToSet.lAccountID}' AND 
    lEventID = '${dataToSet.lEventID}' AND FIND_IN_SET(${dataToSet.lRegTypeID},sApplyToRegTypes)`;
  dbConfig.getDB().query(sql, callback);
};

let tslInsertTemplate1RegistrantsData = (dataToSet, callback) => {
  var sql = `INSERT INTO Registrants SET lAccountID='${dataToSet.lAccountID}', lEventID='${dataToSet.lEventID}',
      sMemberID='${dataToSet.step3PostData.sMemberID ? dataToSet.step3PostData.sMemberID : ''}', sPrefix='${dataToSet.step3PostData.sPrefix ? dataToSet.step3PostData.sPrefix : ''}', sFirstName='${dataToSet.step3PostData.sFirstName ? dataToSet.step3PostData.sFirstName : ''}',
      sMiddleName='${dataToSet.step3PostData.sMiddleName ? dataToSet.step3PostData.sMiddleName : ''}', sLastName='${dataToSet.step3PostData.sLastName ? dataToSet.step3PostData.sLastName : ''}', sSuffix='${dataToSet.step3PostData.sSuffix ? dataToSet.step3PostData.sSuffix : ''}',
      sCredentials='${dataToSet.step3PostData.sCredentials ? dataToSet.step3PostData.sCredentials : ''}', sTitle='${dataToSet.step3PostData.sTitle ? dataToSet.step3PostData.sTitle : ''}', sCompany='${dataToSet.step3PostData.sCompany ? dataToSet.step3PostData.sCompany : ''}',
      sAddress1='${dataToSet.step3PostData.sAddress1 ? dataToSet.step3PostData.sAddress1 : ''}', sAddress2='${dataToSet.step3PostData.sAddress2 ? dataToSet.step3PostData.sAddress2 : ''}', sAddress3='${dataToSet.step3PostData.sAddress3 ? dataToSet.step3PostData.sAddress3 : ''}',
      sCity='${dataToSet.step3PostData.sCity ? dataToSet.step3PostData.sCity : ''}', sState='${dataToSet.step3PostData.sState ? dataToSet.step3PostData.sState : ''}', sZip='${dataToSet.step3PostData.sZip ? dataToSet.step3PostData.sZip : ''}', 
      sCountry='${dataToSet.step3PostData.sCountry ? dataToSet.step3PostData.sCountry : ''}', sPhone='${dataToSet.step3PostData.sPhone ? dataToSet.step3PostData.sPhone : ''}', sCell='${dataToSet.step3PostData.sCell ? dataToSet.step3PostData.sCell : ''}',
      sFax='${dataToSet.step3PostData.sFax ? dataToSet.step3PostData.sFax : ''}', sEmail='${dataToSet.step3PostData.sEmail ? dataToSet.step3PostData.sEmail : ''}', sOtherInfo1='${dataToSet.step3PostData.sOtherInfo1 ? dataToSet.step3PostData.sOtherInfo1 : ''}',
      lRegType='${dataToSet.step2PostData.regTypeId}', dRegAmount='${dataToSet.dRegAmount}', dTaxesAmt='0',
      dServiceFeeAmt='0', lDiscountID='0', nStatus='0', dCancellationFee='0', lCategoryID='${dataToSet.lCategoryID}',
      dtCreatedOn='${util.getCurrentDatetime()}', dtUpdatedOn='${util.getCurrentDatetime()}',
      address_type='${dataToSet.step3PostData.addresstype ? dataToSet.step3PostData.addresstype : ''}'`;

      dbConfig.getDB().query(sql, function(err, result){
        if(result){
          if(dataToSet.countRegistrant && dataToSet.countRegistrant > 0){
            for (let index = 1; index <= dataToSet.countRegistrant; index++) { 
              var sql2 = `INSERT INTO RegGuests SET lAccountID='${
                dataToSet.lAccountID ? dataToSet.lAccountID : ""
              }', lEventID='${dataToSet.lEventID ? dataToSet.lEventID : ""}', lRegID='${
                result.insertId
              }',
              sFirstName='${ 
                dataToSet.step3PostData['add_reg_sFirstName_'+index] ? dataToSet.step3PostData['add_reg_sFirstName_'+index] : ""
              }', sLastName='${dataToSet.step3PostData['add_reg_sLastName_'+index] ? dataToSet.step3PostData['add_reg_sLastName_'+index]: ""}', sTitle='${
                dataToSet.step3PostData['add_reg_sTitle_'+index] ? dataToSet.step3PostData['add_reg_sTitle_'+index] : ""
              }',
              sPhone='${dataToSet.step3PostData['add_reg_sPhone_'+index] ? dataToSet.step3PostData['add_reg_sPhone_'+index] : ""}', sEmail='${
                dataToSet.step3PostData['add_reg_sEmail_'+index] ? dataToSet.step3PostData['add_reg_sEmail_'+index] : ""
              }', nType='1',
              dAmount='${dataToSet.addRegAmt ? dataToSet.addRegAmt : ""}', nStatus='0',
              dtCreatedOn='${util.getCurrentDatetime()}'` ;
              dbConfig.getDB().query(sql2, function (err2, result2) {
                if(result2){
                  if(dataToSet.step4PostData){
                    if(dataToSet.step4PostData.additionalfieldsChecked){
                      Object.keys(dataToSet.step4PostData.additionalfieldsChecked).map(function (key) {
                        var sql5 = `INSERT INTO RegAnswers SET lAccountID='${dataToSet.lAccountID}', lEventID='${dataToSet.lEventID}',
                        lRegID='${result2.insertId}', lQuestionID='${key.replace('add_reg', '')}', lAnswerID='${dataToSet.step4PostData.additionalfieldsChecked[key]}'`;
                        dbConfig.getDB().query(sql5);
                      })
                    }
                    if(dataToSet.step4PostData.additionalfieldsText){
                      Object.keys(dataToSet.step4PostData.additionalfieldsText).map(function (key) {
                        var sql5 = `INSERT INTO RegAnswers SET lAccountID='${dataToSet.lAccountID}', lEventID='${dataToSet.lEventID}',
                        lRegID='${result2.insertId}', lQuestionID='${key.replace('add_reg', '')}', sOther='${dataToSet.step4PostData.additionalfieldsText[key]}'`;
                        dbConfig.getDB().query(sql5);
                      })
                    }
                  }
                }
              })
            }
          }

          if(dataToSet.countGuest && dataToSet.countGuest > 0){
            for (let index = 1; index <= dataToSet.countGuest; index++) { 
              var sql3 = `INSERT INTO RegGuests SET lAccountID='${
                dataToSet.lAccountID ? dataToSet.lAccountID : ""
              }', lEventID='${dataToSet.lEventID ? dataToSet.lEventID : ""}', lRegID='${
                result.insertId
              }',
              sFirstName='${ 
                dataToSet.step3PostData['guest_first_name_'+index] ? dataToSet.step3PostData['guest_first_name_'+index] : ""
              }', sLastName='${dataToSet.step3PostData['guest_last_name_'+index] ? dataToSet.step3PostData['guest_last_name_'+index]: ""}', sTitle='${
                dataToSet.step3PostData['guest_title_'+index] ? dataToSet.step3PostData['guest_title_'+index] : ""
              }',
              sPhone='${dataToSet.step3PostData['guest_phone_'+index] ? dataToSet.step3PostData['guest_phone_'+index] : ""}', sEmail='${
                dataToSet.step3PostData['guest_email_'+index] ? dataToSet.step3PostData['guest_email_'+index] : ""
              }', nType='0',
              dAmount='${dataToSet.guestsPrice ? dataToSet.guestsPrice : ""}', nStatus='0',
              dtCreatedOn='${util.getCurrentDatetime()}'` ;

              dbConfig.getDB().query(sql3, function (err3, result3) {
              })
            }
          }

          if(dataToSet.step4PostData){
            if(dataToSet.step4PostData.fieldsChecked){
              Object.keys(dataToSet.step4PostData.fieldsChecked).map(function (key) {
                var sql5 = `INSERT INTO RegAnswers SET lAccountID='${dataToSet.lAccountID}', lEventID='${dataToSet.lEventID}',
                lRegID='${result.insertId}', lQuestionID='${key}', lAnswerID='${dataToSet.step4PostData.fieldsChecked[key]}'`;
                dbConfig.getDB().query(sql5);
              })
            }
          }

          if(dataToSet.step4PostData){
            if(dataToSet.step4PostData.fieldsText){
              Object.keys(dataToSet.step4PostData.fieldsText).map(function (key) {
                var sql5 = `INSERT INTO RegAnswers SET lAccountID='${dataToSet.lAccountID}', lEventID='${dataToSet.lEventID}',
                lRegID='${result.insertId}', lQuestionID='${key}', sOther='${dataToSet.step4PostData.fieldsText[key]}'`;
                dbConfig.getDB().query(sql5);
              })
            }
          }

          if(dataToSet.step5PostData && dataToSet.step5PostData.countSessions !=='undefined'){
            for (let index = 0; index < dataToSet.step5PostData.countSessions; index++) { 
              if(dataToSet.step5PostData['dQty'+index] !== undefined){
                var sql4 = `INSERT INTO RegSessions SET lAccountID='${
                  dataToSet.lAccountID ? dataToSet.lAccountID : ""
                }', lEventID='${dataToSet.lEventID ? dataToSet.lEventID : ""}', lRegID='${result.insertId}',
                lSessionID='${
                  dataToSet.step5PostData['lSessionID'+index] ? dataToSet.step5PostData['lSessionID'+index] : ""
                }', lQty='${dataToSet.step5PostData['dQty'+index] ? dataToSet.step5PostData['dQty'+index] : ""}',
                dTotal='${dataToSet.step5PostData['dTotal'+index] ? dataToSet.step5PostData['dTotal'+index] : ""}', nStatus='0',
                dtCreatedOn='${util.getCurrentDatetime()}'` ;
  
                dbConfig.getDB().query(sql4, function (err4, result4) {
                })
              }
            }
          }

          if(dataToSet.step6PostData){
            var sql5 = `INSERT INTO RegPayments SET lAccountID='${
              dataToSet.lAccountID ? dataToSet.lAccountID : ""
            }', lEventID='${dataToSet.lEventID ? dataToSet.lEventID : ""}', lRegID='${result.insertId}',
            dtDate='${util.getCurrentDatetime()}',
            nType='${dataToSet.step6PostData.payment_type == '1' ? 1 : dataToSet.step6PostData.payment_type == '0' ? 0 : 1}',
            sPayor='${dataToSet.step6PostData.x_first_name 
            ? dataToSet.step6PostData.x_first_name + " " + dataToSet.step6PostData.x_last_name 
            : dataToSet.step3PostData.sFirstName + " " + dataToSet.step3PostData.sLastName}',
            sCompany='${dataToSet.step6PostData.x_company ? dataToSet.step6PostData.x_company : ""}',
            dAmount='${dataToSet.totalAmountDue ? dataToSet.totalAmountDue : 0}',
            sTransactionID='${dataToSet.sTransactionID ? dataToSet.sTransactionID : ""}',
            sInvoice='${dataToSet.sInvoice ? dataToSet.sInvoice : ""}',
            sStatus='${
              dataToSet.step6PostData.payment_type == '1' ? 'Pending' : 'Approved'
            }', dtCreatedOn='${util.getCurrentDatetime()}'`

            dbConfig.getDB().query(sql5, function (err5, result5) {
            })

          }

          callback("", result);
        }else{
          callback(err, []);
        }
      });
}

const tslSendEmail = async(dataToSet, callback) => {
  const transporter = nodemailer.createTransport({
    host: 'mail.tslwebreg.com',
    port: 587,
    secure: true,
    auth: {
      user: 'registration@tslwebreg.com',
      pass: 'TSLeads1',
    },
  });
  
  const emailHtml = dataToSet;
  
  const options = {
    from: 'manikmahajan520@gmail.com',
    to: 'manikmahajan@virtualemployee.com',
    subject: 'hello world',
    html: emailHtml,
  };
  
  await transporter.sendMail(options);
  callback("", options);
}

let tslRegistrantFieldsVisible = (dataToSet, callback) => {
  var sql = `Select sName, bVisible, bRequired FROM GrpRegFieldsConfig
   WHERE lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}' AND bVisible = '1'`;
  
    dbConfig.getDB().query(sql, callback);
};

// let tslGetSessionsTicketsDataTemplate21 = (dataToSet, callback) => {
//   if(dataToSet.lRegTypeID){

//     var sessionTicketsArray = []

//     dataToSet.lRegTypeID.map((data, index)=>{
//       var sql = `SELECT * FROM SessionsConfig where lAccountID='${dataToSet.lAccountID}' AND 
//       lEventID = '${dataToSet.lEventID}' AND FIND_IN_SET(${data},sApplyToRegTypes)`;

//       dbConfig.getDB().query(sql, function(err, result){
//         if(result){
//           sessionTicketsArray.push(result)
//         }
//       });
//     })
//     console.log('sessionTicketsArray',sessionTicketsArray)
//     // callback("",sessionTicketsArray)
//   }  
// };

let tslGetSessionsTicketsDataTemplate21 = async (dataToSet, callback) => {
  if (dataToSet.lRegTypeID) {
    var sessionTicketsArray = [];

    for (const data of dataToSet.lRegTypeID) {
      var sql = `SELECT * FROM SessionsConfig where lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}' AND FIND_IN_SET(${data},sApplyToRegTypes)`;

      // Use promisify to convert the callback-based function to a Promise
      const queryAsync = util2.promisify(dbConfig.getDB().query).bind(dbConfig.getDB());

      try {
        const result = await queryAsync(sql);
        if (result) {
          sessionTicketsArray.push(result);
        }
      } catch (err) {
        // Handle errors if needed
        console.error(err);
      }
    }

    // console.log('sessionTicketsArray', sessionTicketsArray);
    callback("", sessionTicketsArray)
  }
};

let tslInsertTemplate21RegistrantsData = (dataToSet, callback) => {
  var sql = `INSERT INTO Registrants SET lAccountID='${dataToSet.lAccountID}', lEventID='${dataToSet.lEventID}',
      sMemberID='${dataToSet.step2PostData.sMemberID ? dataToSet.step2PostData.sMemberID : ''}', sPrefix='${dataToSet.step2PostData.sPrefix ? dataToSet.step2PostData.sPrefix : ''}', sFirstName='${dataToSet.step2PostData.sFirstName ? dataToSet.step2PostData.sFirstName : ''}',
      sMiddleName='${dataToSet.step2PostData.sMiddleName ? dataToSet.step2PostData.sMiddleName : ''}', sLastName='${dataToSet.step2PostData.sLastName ? dataToSet.step2PostData.sLastName : ''}', sSuffix='${dataToSet.step2PostData.sSuffix ? dataToSet.step2PostData.sSuffix : ''}',
      sCredentials='${dataToSet.step2PostData.sCredentials ? dataToSet.step2PostData.sCredentials : ''}', sTitle='${dataToSet.step2PostData.sTitle ? dataToSet.step2PostData.sTitle : ''}', sCompany='${dataToSet.step2PostData.sCompany ? dataToSet.step2PostData.sCompany : ''}',
      sAddress1='${dataToSet.step2PostData.sAddress1 ? dataToSet.step2PostData.sAddress1 : ''}', sAddress2='${dataToSet.step2PostData.sAddress2 ? dataToSet.step2PostData.sAddress2 : ''}', sAddress3='${dataToSet.step2PostData.sAddress3 ? dataToSet.step2PostData.sAddress3 : ''}',
      sCity='${dataToSet.step2PostData.sCity ? dataToSet.step2PostData.sCity : ''}', sState='${dataToSet.step2PostData.sState ? dataToSet.step2PostData.sState : ''}', sZip='${dataToSet.step2PostData.sZip ? dataToSet.step2PostData.sZip : ''}', 
      sCountry='${dataToSet.step2PostData.sCountry ? dataToSet.step2PostData.sCountry : ''}', sPhone='${dataToSet.step2PostData.sPhone ? dataToSet.step2PostData.sPhone : ''}', sCell='${dataToSet.step2PostData.sCell ? dataToSet.step2PostData.sCell : ''}',
      sFax='${dataToSet.step2PostData.sFax ? dataToSet.step2PostData.sFax : ''}', sEmail='${dataToSet.step2PostData.sEmail ? dataToSet.step2PostData.sEmail : ''}', sOtherInfo1='${dataToSet.step3PostData.sOtherInfo1 ? dataToSet.step3PostData.sOtherInfo1 : ''}',
      lRegType='${dataToSet.step2PostData.regTypeId}', dTaxesAmt='0',
      dServiceFeeAmt='0', lDiscountID='0', nStatus='0', dCancellationFee='0', lCategoryID='${dataToSet.lCategoryID}',
      dtCreatedOn='${util.getCurrentDatetime()}', dtUpdatedOn='${util.getCurrentDatetime()}',
      address_type='${dataToSet.step3PostData.addresstype ? dataToSet.step3PostData.addresstype : ''}'`;

      // dRegAmount='${dataToSet.dRegAmount}',
      
      dbConfig.getDB().query(sql, function(err, result){
        if(result){
          if(dataToSet.countRegistrant && dataToSet.countRegistrant > 0){
            for (let index = 1; index <= dataToSet.countRegistrant; index++) { 
              var sql2 = `INSERT INTO Registrants SET lAccountID='${
                dataToSet.lAccountID ? dataToSet.lAccountID : ""
              }', lEventID='${dataToSet.lEventID ? dataToSet.lEventID : ""}',
              sFirstName='${ 
                dataToSet.step3PostData['add_reg_sFirstName_'+index] ? dataToSet.step3PostData['add_reg_sFirstName_'+index] : ""
              }', sLastName='${dataToSet.step3PostData['add_reg_sLastName_'+index] ? dataToSet.step3PostData['add_reg_sLastName_'+index]: ""}', sTitle='${
                dataToSet.step3PostData['add_reg_sTitle_'+index] ? dataToSet.step3PostData['add_reg_sTitle_'+index] : ""
              }',
              sPhone='${dataToSet.step3PostData['add_reg_sPhone_'+index] ? dataToSet.step3PostData['add_reg_sPhone_'+index] : ""}', sEmail='${
                dataToSet.step3PostData['add_reg_sEmail_'+index] ? dataToSet.step3PostData['add_reg_sEmail_'+index] : ""
              }',
              dRegAmount='${dataToSet.step3PostData['regTypePrice'+index] ? dataToSet.step3PostData['regTypePrice'+index] : ""}',
              lRegType='${dataToSet.step3PostData['regTypeId'+index] ? dataToSet.step3PostData['regTypeId'+index] : ""}', nStatus='0',
              dtCreatedOn='${util.getCurrentDatetime()}'` ;
              dbConfig.getDB().query(sql2, function (err2, result2) { 
                
                if(result2){
                  var sql0 = `INSERT INTO RegistrantsGroups SET lAccountID='${
                    dataToSet.lAccountID ? dataToSet.lAccountID : ""
                  }', lEventID='${dataToSet.lEventID ? dataToSet.lEventID : ""}', lMainRegID = '${result.insertId}',
                  lRegID='${result2.insertId}'`;
                  dbConfig.getDB().query(sql0, function (err0, result0) {
                  })

                  if(dataToSet.step5PostData && dataToSet.step5PostData.countSessions !=='undefined'){
                    // console.log('dataToSet.step5PostData',dataToSet.step5PostData)
                    for (let index2 = 0; index2 < dataToSet.step5PostData.countSessions; index2++) { 
                      if(dataToSet.step5PostData[`dQty${index-1+''+index2}`] !== undefined){
                        
                        var sql4 = `INSERT INTO RegSessions SET lAccountID='${
                          dataToSet.lAccountID ? dataToSet.lAccountID : ""
                        }', lEventID='${dataToSet.lEventID ? dataToSet.lEventID : ""}', lRegID='${result2.insertId}',
                        lSessionID='${
                          dataToSet.step5PostData[`lSessionID${index-1+''+index2}`] ? dataToSet.step5PostData[`lSessionID${index-1+''+index2}`] : ""
                        }', lQty='${dataToSet.step5PostData[`dQty${index-1+''+index2}`] ? dataToSet.step5PostData[`dQty${index-1+''+index2}`] : ""}',
                        dTotal='${dataToSet.step5PostData[`dTotal${index-1+''+index2}`] ? dataToSet.step5PostData[`dTotal${index-1+''+index2}`] : ""}', nStatus='0',
                        dtCreatedOn='${util.getCurrentDatetime()}'` ;

                        console.log('sql4',sql4)
          
                        dbConfig.getDB().query(sql4, function (err4, result4) {
                        })
                      }
                    }
                  }
                }
                if(result2){
                  if(dataToSet.step4PostData){
                    if(dataToSet.step4PostData.additionalfieldsChecked){
                      Object.keys(dataToSet.step4PostData.additionalfieldsChecked).map(function (key) {
                        var sql5 = `INSERT INTO RegAnswers SET lAccountID='${dataToSet.lAccountID}', lEventID='${dataToSet.lEventID}',
                        lRegID='${result2.insertId}', lQuestionID='${key.replace('add_reg', '')}', lAnswerID='${dataToSet.step4PostData.additionalfieldsChecked[key]}'`;
                        dbConfig.getDB().query(sql5, function (err5, result5) {
                        })
                      })
                    }
                    // if(dataToSet.step4PostData.additionalfieldsText){
                    //   Object.keys(dataToSet.step4PostData.additionalfieldsText).map(function (key) {
                    //     var sql5 = `INSERT INTO RegAnswers SET lAccountID='${dataToSet.lAccountID}', lEventID='${dataToSet.lEventID}',
                    //     lRegID='${result2.insertId}', lQuestionID='${key.replace('add_reg', '')}', sOther='${dataToSet.step4PostData.additionalfieldsText[key]}'`;
                    //     dbConfig.getDB().query(sql5);
                    //   })
                    // }
                  }
                }
              })
            }
          }

          // if(dataToSet.step4PostData){
          //   if(dataToSet.step4PostData.fieldsChecked){
          //     Object.keys(dataToSet.step4PostData.fieldsChecked).map(function (key) {
          //       var sql5 = `INSERT INTO RegAnswers SET lAccountID='${dataToSet.lAccountID}', lEventID='${dataToSet.lEventID}',
          //       lRegID='${result.insertId}', lQuestionID='${key}', lAnswerID='${dataToSet.step4PostData.fieldsChecked[key]}'`;
          //       dbConfig.getDB().query(sql5);
          //     })
          //   }
          // }

          // if(dataToSet.step4PostData){
          //   if(dataToSet.step4PostData.fieldsText){
          //     Object.keys(dataToSet.step4PostData.fieldsText).map(function (key) {
          //       var sql5 = `INSERT INTO RegAnswers SET lAccountID='${dataToSet.lAccountID}', lEventID='${dataToSet.lEventID}',
          //       lRegID='${result.insertId}', lQuestionID='${key}', sOther='${dataToSet.step4PostData.fieldsText[key]}'`;
          //       dbConfig.getDB().query(sql5);
          //     })
          //   }
          // }

         

          if(dataToSet.step6PostData){
            var sql5 = `INSERT INTO RegPayments SET lAccountID='${
              dataToSet.lAccountID ? dataToSet.lAccountID : ""
            }', lEventID='${dataToSet.lEventID ? dataToSet.lEventID : ""}', lRegID='${result.insertId}',
            dtDate='${util.getCurrentDatetime()}',
            nType='${dataToSet.step6PostData.payment_type == '1' ? 1 : dataToSet.step6PostData.payment_type == '0' ? 0 : 1}',
            sPayor='${dataToSet.step6PostData.x_first_name 
            ? dataToSet.step6PostData.x_first_name + " " + dataToSet.step6PostData.x_last_name 
            : dataToSet.step3PostData.sFirstName + " " + dataToSet.step3PostData.sLastName}',
            sCompany='${dataToSet.step6PostData.x_company ? dataToSet.step6PostData.x_company : ""}',
            dAmount='${dataToSet.totalAmountDue ? dataToSet.totalAmountDue : 0}',
            sTransactionID='${dataToSet.sTransactionID ? dataToSet.sTransactionID : ""}',
            sInvoice='${dataToSet.sInvoice ? dataToSet.sInvoice : ""}',
            sStatus='${
              dataToSet.step6PostData.payment_type == '1' ? 'Pending' : 'Approved'
            }', dtCreatedOn='${util.getCurrentDatetime()}'`

            dbConfig.getDB().query(sql5, function (err5, result5) {
            })

          }

          callback("", result);
        }else{
          callback(err, []);
        }
      });
}

let tslGetRegistrantsInformationTemplate21 = (dataToSet, callback) => {
  var sql = `Select r.*, rt.sCode from Registrants r left join RegistrantsGroups rg ON (r.lRegID = rg.lRegID) left join 
            RegTypes rt ON (r.lRegType = rt.lRegTypeID)
            WHERE r.lAccountID='${dataToSet.lAccountID}' AND r.lEventID = '${dataToSet.lEventID}' AND rg.lMainRegID='${dataToSet.lRegID}'`;

  dbConfig.getDB().query(sql, callback);
};

let tslGetRegistrantSessionsTemplate21 = (dataToSet, callback) => {
  var sql = `Select rs.*, sc.sCode, sc.sName FROM RegSessions rs LEFT JOIN SessionsConfig sc ON(rs.lSessionID = sc.lSessionID) where rs.lAccountID='${dataToSet.lAccountID}' AND 
  rs.lEventID = '${dataToSet.lEventID}' AND rs.lRegID = '${dataToSet.lRegID}'`;
  
    dbConfig.getDB().query(sql, callback);
};

let tslGetRegistrantsByIDTemplate21 = (dataToSet, callback) => {
  var sql = `Select * FROM Registrants where lAccountID = '${dataToSet.lAccountID}' and lEventID = '${dataToSet.lEventID}' and  lRegID = '${dataToSet.lRegID}'`;
  dbConfig.getDB().query(sql, callback);
};

let tslGetSUMRegistrantsInformationTemplate21 = (dataToSet, callback) => {
  var data = {}
  var sql = `Select SUM(r.dRegAmount) as dRegAmount, SUM(r.dSpecialDiscountAmt) as dSpecialDiscountAmt, SUM(r.dServiceFeeAmt) as dServiceFeeAmt, SUM(r.dTaxesAmt) as dTaxesAmt, SUM(r.dCancellationFee) as dCancellationFee from Registrants r left join RegistrantsGroups rg ON (r.lRegID = rg.lRegID)
            WHERE r.lAccountID='${dataToSet.lAccountID}' AND r.lEventID = '${dataToSet.lEventID}' AND rg.lMainRegID='${dataToSet.lRegID}'`;
  dbConfig.getDB().query(sql, function(err, results){
    if(results){
        data.dRegAmount = results[0].dRegAmount
        data.dSpecialDiscountAmt = results[0].dSpecialDiscountAmt
        data.dServiceFeeAmt = results[0].dServiceFeeAmt
        data.dCancellationFee = results[0].dCancellationFee
        data.dTaxesAmt = results[0].dTaxesAmt
    }

    var sql2 = `Select SUM(dTotal) as dSessionsAmount from RegSessions r left join RegistrantsGroups rg ON (r.lRegID = rg.lRegID)
    WHERE r.lAccountID='${dataToSet.lAccountID}' AND r.lEventID = '${dataToSet.lEventID}' AND rg.lMainRegID='${dataToSet.lRegID}'`;
      dbConfig.getDB().query(sql2, function(err2,result2){
        if(result2 && result2[0]!==undefined){
          data.dSessionsAmount = result2[0].dSessionsAmount
        }
        callback("",data)
      })
        
  });
};

let tslGetMembersList = (dataToSet, callback) => {
  var sql = `Select * FROM Members
   WHERE lAccountID='${dataToSet.lAccountID}'`;
    dbConfig.getDB().query(sql, callback);
};


let tslAddMembers = (dataToSet, callback) => {
  var sql = `INSERT INTO Members SET lAccountID='${
    dataToSet.lAccountID ? dataToSet.lAccountID : null
  }', sMemberType='${dataToSet.sMemberType ? dataToSet.sMemberType : null}',
  sMemberStatus='${dataToSet.sMemberStatus ? dataToSet.sMemberStatus : null}',   
  sMemberActiveDate='${
    dataToSet.sMemberActiveDate ? dataToSet.sMemberActiveDate : '0000-00-00'
  }', sMemberInactiveDate='${dataToSet.sMemberInactiveDate ? dataToSet.sMemberInactiveDate : '0000-00-00'}',
  sMemberID='${
    dataToSet.sMemberID ? dataToSet.sMemberID : null
  }', sOther1='${dataToSet.sOther1 ? dataToSet.sOther1 : null}', sPrefix='${
    dataToSet.sPrefix ? dataToSet.sPrefix : null
  }',
  sOther2='${
    dataToSet.sOther2 ? dataToSet.sOther2 : null
  }', sFirstName='${dataToSet.sFirstName ? dataToSet.sFirstName : null}', sOther3='${
    dataToSet.sOther3 ? dataToSet.sOther3 : null
  }',
  sMiddleName='${dataToSet.sMiddleName ? dataToSet.sMiddleName : null}', sOther4='${
    dataToSet.sOther4 ? dataToSet.sOther4 : null
  }', sLastName='${dataToSet.sLastName ? dataToSet.sLastName : null}',
  sOther5='${dataToSet.sOther5 ? dataToSet.sOther5 : null}', sSuffix='${
    dataToSet.sSuffix ? dataToSet.sSuffix : null
  }', sOther6='${dataToSet.sOther6 ? dataToSet.sOther6 : null}',
  sCredentials='${dataToSet.sCredentials ? dataToSet.sCredentials : null}', sOther7='${
    dataToSet.sOther7 ? dataToSet.sOther7 : null
  }', sTitle='${dataToSet.sTitle ? dataToSet.sTitle : null}',
  sOther8='${dataToSet.sOther8 ? dataToSet.sOther8 : null}', sCompany='${
    dataToSet.sCompany ? dataToSet.sCompany : null
  }', sOther9='${dataToSet.sOther9 ? dataToSet.sOther9 : null}',
  sAddress1='${
    dataToSet.sAddress1 ? dataToSet.sAddress1 : null
  }', sOther10='${
    dataToSet.sOther10 ? dataToSet.sOther10 : null
  }', sAddress2='${dataToSet.sAddress2 ? dataToSet.sAddress2 : null}',
  sOther11='${dataToSet.sOther11 ? dataToSet.sOther11 : null}', sAddress3='${
    dataToSet.sAddress3 ? dataToSet.sAddress3 : null
  }', sOther12='${
    dataToSet.sOther12 ? dataToSet.sOther12 : null
  }', sCity='${dataToSet.sCity ? dataToSet.sCity : null}',
  sOther13='${
    dataToSet.sOther13 ? dataToSet.sOther13 : null
  }', sState='${dataToSet.sCity ? dataToSet.sCity : null}',sOther14='${
    dataToSet.sOther14 ? dataToSet.sOther14 : null
  }', sZip='${
    dataToSet.sZip ? dataToSet.sZip : null
  }', sOther15='${dataToSet.sOther15 ? dataToSet.sOther15 : null}',
  sCountry='${dataToSet.sCountry ? dataToSet.sCountry : null}', sOther16='${
    dataToSet.sOther16 ? dataToSet.sOther16 : null
  }', sPhone='${
    dataToSet.sPhone ? dataToSet.sPhone : null
  }', sOther17='${dataToSet.sOther17 ? dataToSet.sOther17 : null}',
  sCell='${
    dataToSet.sCell ? dataToSet.sCell : null
  }', sOther18='${dataToSet.sOther18 ? dataToSet.sOther18 : null}', sFax='${
    dataToSet.sFax ? dataToSet.sFax : null
  }', sOther19='${
    dataToSet.sOther19 ? dataToSet.sOther19 : null
  }', sEmail='${dataToSet.sEmail ? dataToSet.sEmail : null}',
  sOther20='${dataToSet.sOther20 ? dataToSet.sOther20 : null}',
  dtCreatedOn='${dataToSet.dtCreatedOn ? dataToSet.dtCreatedOn : '0000-00-00'}',
  dtUpdatedOn='${dataToSet.dtUpdatedOn ? dataToSet.dtUpdatedOn : '0000-00-00'}'`;
  dbConfig.getDB().query(sql, callback);  
};

let tslupdateMemberDetails = (dataToSet, callback) => { 
    var sql = `UPDATE Members SET sMemberType='${dataToSet.sMemberType ? dataToSet.sMemberType : null}',
    sMemberStatus='${dataToSet.sMemberStatus ? dataToSet.sMemberStatus : null}',   
    sMemberActiveDate='${
      dataToSet.sMemberActiveDate ? dataToSet.sMemberActiveDate : '0000-00-00'
    }', sMemberInactiveDate='${dataToSet.sMemberInactiveDate ? dataToSet.sMemberInactiveDate : '0000-00-00'}',
    sMemberID='${
      dataToSet.sMemberID ? dataToSet.sMemberID : null
    }', sOther1='${dataToSet.sOther1 ? dataToSet.sOther1 : null}', sPrefix='${
      dataToSet.sPrefix ? dataToSet.sPrefix : null
    }',
    sOther2='${
      dataToSet.sOther2 ? dataToSet.sOther2 : null
    }', sFirstName='${dataToSet.sFirstName ? dataToSet.sFirstName : null}', sOther3='${
      dataToSet.sOther3 ? dataToSet.sOther3 : null
    }',
    sMiddleName='${dataToSet.sMiddleName ? dataToSet.sMiddleName : null}', sOther4='${
      dataToSet.sOther4 ? dataToSet.sOther4 : null
    }', sLastName='${dataToSet.sLastName ? dataToSet.sLastName : null}',
    sOther5='${dataToSet.sOther5 ? dataToSet.sOther5 : null}', sSuffix='${
      dataToSet.sSuffix ? dataToSet.sSuffix : null
    }', sOther6='${dataToSet.sOther6 ? dataToSet.sOther6 : null}',
    sCredentials='${dataToSet.sCredentials ? dataToSet.sCredentials : null}', sOther7='${
      dataToSet.sOther7 ? dataToSet.sOther7 : null
    }', sTitle='${dataToSet.sTitle ? dataToSet.sTitle : null}',
    sOther8='${dataToSet.sOther8 ? dataToSet.sOther8 : null}', sCompany='${
      dataToSet.sCompany ? dataToSet.sCompany : null
    }', sOther9='${dataToSet.sOther9 ? dataToSet.sOther9 : null}',
    sAddress1='${
      dataToSet.sAddress1 ? dataToSet.sAddress1 : null
    }', sOther10='${
      dataToSet.sOther10 ? dataToSet.sOther10 : null
    }', sAddress2='${dataToSet.sAddress2 ? dataToSet.sAddress2 : null}',
    sOther11='${dataToSet.sOther11 ? dataToSet.sOther11 : null}', sAddress3='${
      dataToSet.sAddress3 ? dataToSet.sAddress3 : null
    }', sOther12='${
      dataToSet.sOther12 ? dataToSet.sOther12 : null
    }', sCity='${dataToSet.sCity ? dataToSet.sCity : null}',
    sOther13='${
      dataToSet.sOther13 ? dataToSet.sOther13 : null
    }', sState='${dataToSet.sCity ? dataToSet.sCity : null}',sOther14='${
      dataToSet.sOther14 ? dataToSet.sOther14 : null
    }', sZip='${
      dataToSet.sZip ? dataToSet.sZip : null
    }', sOther15='${dataToSet.sOther15 ? dataToSet.sOther15 : null}',
    sCountry='${dataToSet.sCountry ? dataToSet.sCountry : null}', sOther16='${
      dataToSet.sOther16 ? dataToSet.sOther16 : null
    }', sPhone='${
      dataToSet.sPhone ? dataToSet.sPhone : null
    }', sOther17='${dataToSet.sOther17 ? dataToSet.sOther17 : null}',
    sCell='${
      dataToSet.sCell ? dataToSet.sCell : null
    }', sOther18='${dataToSet.sOther18 ? dataToSet.sOther18 : null}', sFax='${
      dataToSet.sFax ? dataToSet.sFax : null
    }', sOther19='${
      dataToSet.sOther19 ? dataToSet.sOther19 : null
    }', sEmail='${dataToSet.sEmail ? dataToSet.sEmail : null}',
    sOther20='${dataToSet.sOther20 ? dataToSet.sOther20 : null}',
    dtCreatedOn='${dataToSet.dtCreatedOn ? dataToSet.dtCreatedOn : '0000-00-00'}',
    dtUpdatedOn='${dataToSet.dtUpdatedOn ? dataToSet.dtUpdatedOn : '0000-00-00'}'  
      where lMemberUniqueID = ${dataToSet.lMemberUniqueID}`;
    dbConfig.getDB().query(sql, callback);
};


let tslInsertGroupRegistrants = (dataToSet, callback) => {
  var sql = `INSERT INTO Registrants SET lAccountID='${dataToSet.lAccountID}', lEventID='${dataToSet.lEventID}',
      sMemberID='${dataToSet.sMemberID ? dataToSet.sMemberID : 'null'}', sPrefix='${dataToSet.sPrefix ? dataToSet.sPrefix : ''}', sFirstName='${dataToSet.sFirstName ? dataToSet.sFirstName : ''}',
      sMiddleName='${dataToSet.sMiddleName ? dataToSet.sMiddleName : ''}', sLastName='${dataToSet.sLastName ? dataToSet.sLastName : ''}', sSuffix='${dataToSet.sSuffix ? dataToSet.sSuffix : ''}',
      sCredentials='${dataToSet.sCredentials ? dataToSet.sCredentials : ''}', sTitle='${dataToSet.sTitle ? dataToSet.sTitle : ''}', sCompany='${dataToSet.sCompany ? dataToSet.sCompany : ''}',
      sAddress1='${dataToSet.sAddress1 ? dataToSet.sAddress1 : ''}', sAddress2='${dataToSet.sAddress2 ? dataToSet.sAddress2 : ''}', sAddress3='${dataToSet.sAddress3 ? dataToSet.sAddress3 : ''}',
      sCity='${dataToSet.sCity ? dataToSet.sCity : ''}', sState='${dataToSet.sState ? dataToSet.sState : ''}', sZip='${dataToSet.sZip ? dataToSet.sZip : ''}', 
      sCountry='${dataToSet.sCountry ? dataToSet.sCountry : ''}', sPhone='${dataToSet.sPhone ? dataToSet.sPhone : ''}', sCell='${dataToSet.sCell ? dataToSet.sCell : ''}',
      sFax='${dataToSet.sFax ? dataToSet.sFax : ''}', sEmail='${dataToSet.sEmail ? dataToSet.sEmail : ''}',
      lRegType ='${dataToSet.lRegType ? dataToSet.lRegType : ''}',
      dRegAmount='${dataToSet.dRegAmount ?  dataToSet.dRegAmount : 0}',
      nStatus='${dataToSet.nStatus ? dataToSet.nStatus : ''}',
      dTaxesAmt = '${dataToSet.dTaxesAmt ?  dataToSet.dTaxesAmt : 0}',
      dServiceFeeAmt = '${dataToSet.dServiceFeeAmt ? dataToSet.dServiceFeeAmt : 0}',
       lDiscountID ='${dataToSet.lCategoryID ? dataToSet.lCategoryID : ''}',
      dSpecialDiscountAmt = '${dataToSet.dSpecialDiscountAmt ?  dataToSet.dSpecialDiscountAmt : 0}',
       mNotes = '${dataToSet.dtUpdatedOn ? dataToSet.dtUpdatedOn : ''}',
      dCancellationFee = '${dataToSet.dCancellationFee ? dataToSet.dCancellationFee : 0}',
      sDiscountExtraText = '${dataToSet.sDiscountExtraText ? dataToSet.sDiscountExtraText : ''}',
      lCategoryID = '${dataToSet.lCategoryID ? dataToSet.lCategoryID : ''}',
       dtCreatedOn = '${util.getCurrentDatetime()}',
      dtUpdatedOn = '${util.getCurrentDatetime()}',
      sModifiedBy = '${dataToSet.sModifiedBy ? dataToSet.sModifiedBy : ''}',
       dtUpdatedOnMicroSeconds = '${dataToSet.dtUpdatedOnMicroSeconds ? dataToSet.dtUpdatedOnMicroSeconds : ''}', 
      sPicture = '${dataToSet.sPicture ? dataToSet.sPicture : ''}',
       sOtherInfo1 = '${dataToSet.sOtherInfo1 ? dataToSet.sOtherInfo1 : ''}', 
       sOtherInfo2 = '${dataToSet.sOtherInfo2 ? dataToSet.sOtherInfo2 : ''}',
      sOtherInfo3 = '${dataToSet.sOtherInfo3 ? dataToSet.sOtherInfo3 : ''}',
       sOtherInfo4 = '${dataToSet.sOtherInfo4 ? dataToSet.sOtherInfo4 : ''}',
        sSource = '${dataToSet.sSource ? dataToSet.sSource : ''}',
         lImisID = '${dataToSet.lImisID ? dataToSet.lImisID : ''}',
      address_type = '${dataToSet.address_type ? dataToSet.address_type : ''}'`;

         dbConfig.getDB().query(sql, function(err,result){  
         if(result.affectedRows>0){  
         const  sql2 = `INSERT INTO RegistrantsGroups (lAccountID, lEventID, lMainRegID, lRegID, dtCreatedOn) VALUES ('${dataToSet.lAccountID}','${dataToSet.lEventID}','${dataToSet.lMainRegID}','${result.insertId}','${util.getCurrentDatetime()}')`;       
         dbConfig.getDB().query(sql2,callback);
         }
        });
      
}

let tslGetRegistrantsGroupsMainRegIdExist = (dataToSet, callback) => {
  var sql = `Select lMainRegID from RegistrantsGroups where lAccountID = '${dataToSet.lAccountID}' and lEventID = '${dataToSet.lEventID}' and lMainRegID = '${dataToSet.lRegID}'`;
  dbConfig.getDB().query(sql, callback);
};

let tslUpdateGroupRegistrants = (dataToSet, callback) => {
  var sql = `Update Registrants SET sFirstName='${dataToSet.sFirstName ? dataToSet.sFirstName : ''}',
      sMiddleName='${dataToSet.sMiddleName ? dataToSet.sMiddleName : ''}', sLastName='${dataToSet.sLastName ? dataToSet.sLastName : ''}', 
      sTitle='${dataToSet.sTitle ? dataToSet.sTitle : ''}', sPhone='${dataToSet.sPhone ? dataToSet.sPhone : ''}', sCell='${dataToSet.sCell ? dataToSet.sCell : ''}',
      sEmail='${dataToSet.sEmail ? dataToSet.sEmail : ''}',
      lRegType ='${dataToSet.lRegType ? dataToSet.lRegType : ''}',
      dRegAmount='${dataToSet.dRegAmount ?  dataToSet.dRegAmount : 0}',
      nStatus='${dataToSet.nStatus ? dataToSet.nStatus : ''}',
      dTaxesAmt = '${dataToSet.dTaxesAmt ?  dataToSet.dTaxesAmt : 0}',
      dServiceFeeAmt = '${dataToSet.dServiceFeeAmt ? dataToSet.dServiceFeeAmt : 0}',
       lDiscountID ='${dataToSet.lCategoryID ? dataToSet.lCategoryID : ''}',
      dSpecialDiscountAmt = '${dataToSet.dSpecialDiscountAmt ?  dataToSet.dSpecialDiscountAmt : 0}',
       mNotes = '${dataToSet.dtUpdatedOn ? dataToSet.dtUpdatedOn : ''}',
      dCancellationFee = '${dataToSet.dCancellationFee ? dataToSet.dCancellationFee : 0}',
      sDiscountExtraText = '${dataToSet.sDiscountExtraText ? dataToSet.sDiscountExtraText : ''}',
      lCategoryID = '${dataToSet.lCategoryID ? dataToSet.lCategoryID : ''}',
       dtCreatedOn = '${util.getCurrentDatetime()}',
      dtUpdatedOn = '${util.getCurrentDatetime()}',
      sModifiedBy = '${dataToSet.sModifiedBy ? dataToSet.sModifiedBy : ''}',
       dtUpdatedOnMicroSeconds = '${dataToSet.dtUpdatedOnMicroSeconds ? dataToSet.dtUpdatedOnMicroSeconds : ''}', 
      sPicture = '${dataToSet.sPicture ? dataToSet.sPicture : ''}',
       sOtherInfo1 = '${dataToSet.sOtherInfo1 ? dataToSet.sOtherInfo1 : ''}', 
       sOtherInfo2 = '${dataToSet.sOtherInfo2 ? dataToSet.sOtherInfo2 : ''}',
      sOtherInfo3 = '${dataToSet.sOtherInfo3 ? dataToSet.sOtherInfo3 : ''}',
       sOtherInfo4 = '${dataToSet.sOtherInfo4 ? dataToSet.sOtherInfo4 : ''}',
        sSource = '${dataToSet.sSource ? dataToSet.sSource : ''}',
         lImisID = '${dataToSet.lImisID ? dataToSet.lImisID : ''}',
      address_type = '${dataToSet.address_type ? dataToSet.address_type : ''}' Where lRegID= '${dataToSet.lRegID ? dataToSet.lRegID : ''}'`;
      
      dbConfig.getDB().query(sql,callback);   
}

let tslGetDicountCodesByRegType = (dataToSet, callback) => {
  var sql = `SELECT lDiscountID as value,sCode as label, dAmount FROM DiscountsConfig
  WHERE lAccountID='${dataToSet.lAccountID}' AND lEventID = '${dataToSet.lEventID}'
  AND FIND_IN_SET(${dataToSet.sApplyToRegTypes},sApplyToRegTypes)`;
  dbConfig.getDB().query(sql, callback);
};




module.exports = {
  login,
  checkUserExist,
  insertDataForForgotPass,
  getLinkGenerationTime,
  getUserDataRoleBased,
  getSponsorsLogoList,
  getEventMessages,
  getHelpDeskData,
  getLeaderboardData,
  getAllExhibitors,
  getNextPrevExhibitorData,
  getSessionLiveVideoData,
  getLiveEventsList,
  getTechnicalSessionList,
  getAttendeeBoothData,
  getSessionDescription,
  getSpeakerData,
  getSessionDocuments,
  getSessionTrackList,
  getSessionVideo,
  saveEventToSchedule,
  getSessionScheduleList,
  deleteSchedule,
  getScheduleDateList,
  checkSessionExist,
  insertSessionForSurveyInDb,
  saveScanData,
  checkVisitorExist,
  insertBoothOrLeadVisitor,
  getBoothVisitorList,
  getBoothVisitorsCount,
  checkFollowUpVisitorExist,
  insertFollowUpVisitor,
  getFollowupVisitorList,
  getGoldenTicketInfo,
  checkGoldenTicketVisitorExist,
  insertGoldenTicketVisitor,
  getGoldenTicketUserList,
  updateUserProfile,
  checkScanDataForUser,
  getLoginUsers,
  logoutUser,
  checkLoginInfo,
  insertLoginInfo,
  checkSurveyExist,
  getTrackList,
  getTrackLiveSessionList,
  singleSignonLogin,
  checkUserSurveyExistForSession,
  insertUserSurveyForSession,
  getUserSessionSurveyData,
  getSessionDateList,
  saveInOutScanData,
  getSpeakerNameBasedOnId,
  getSessionList,
  fna2022Login,
  tobi2022Login,
  mdapaLogin,
  getPollingSessionQuestions,
  getPollingSessionAnsConfig,
  savePollingAnswers,
  getSurveySubmittedAnswers,
  tslAdminLogin,
  checkAdminExist,
  insertTslAdmin,
  getUserList,
  tslClientLogin,
  getUserTotalCount,
  getUserListById,
  getUserTotalCountById,
  tslEditUser,
  tslDeleteUser,
  tslAddUsers,
  tslAddPaymentDetails,
  tslGetPaymentDetails,
  saveClientInformationWithCompany,
  tslGetClientInformation,
  tslEventsList,
  tslEventsListCount,
  tslAddEvent,
  getEventById,
  tslUpdateEventInfo,
  tslUpdateEventPageDesign,
  tslGetPageDesign,
  tslInsertRegTypesPageDesign,
  tslGetRegTypesPageDesign,
  tslCheckRegTypesScodeExists,
  tslUpdateRegTypesPageDesign,
  tslCheckRegCategoriesScodeExists,
  tslInsertRegCategoriesPageDesign,
  tslGetRegCategoriesPageDesign,
  tslUpdateRegCategoriesPageDesign,
  tslGetRegSCodePageDesign,
  tslCountGetRegTypesPageDesign,
  tslGetRegTypesByIdPageDesign,
  tslGetRegCategoriesByIdPageDesign,
  tslCountGetRegCategoriesPageDesign,
  tslInsertRegistrantInformationWithCompany,
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
  tslUpdateExhibitorsBoothMembers,
  tslGetExhibitorBoothMembers,
  tslGetExhibitorBoothMembersByID,
  tslGetExhibitorListCount,
  tslGetExhibitorBoothMembersCount,
  tslGetEmailSetup,
  tslCheckCustomQuestionsScodeExists,
  tslCheckDiscountCodesScodeExists,
  tslCheckSessionScodeExists,
  tslCheckExtraConfigurationScodeExists,
  tslUpdateEmailSetup,
  tslGetRegistrantsList,
  tslGetCountRegistrantsList,
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
  tslupdateMemberDetails,
  tslInsertGroupRegistrants,
  tslGetRegistrantsGroupsMainRegIdExist,
  tslUpdateGroupRegistrants,
  tslGetDicountCodesByRegType
};
