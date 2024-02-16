"use strict";

let config = require("./config").config;
const sgMail = require("@sendgrid/mail");

let sendMail = (data) => {
  //console.log(data.name);return;
  let name = data.name;
  let email = data.sEmail;
  let eventId = data.lEventID;
  let token = data.sToken;
  let eventName = "fna";
  if (eventId == 556) {
    eventName = "fna";
  } else if (eventId == 524) {
    eventName = "msc";
  } else if (eventId == 605) {
    eventName = "csda";
  } else if (eventId == 607) {
    eventName = "ihca";
  } else if (eventId == 632) {
    eventName = "msc2021";
  } else if (eventId == 674) {
    eventName = "common-powerup2021";
  } else if (eventId == 697) {
    eventName = "goma";
  } else if (eventId == 706) {
    eventName = "ihca-als2021";
  }
  let linkUrl = `${config.FRONTEND_URL.url}/${eventName}/resetPassword?eventId=${eventId}&email=${email}&token=${token}`;
  sgMail.setApiKey(config.SENDGRID.api_key);
  const msg = {
    to: email,
    from: config.SENDGRID.sender_mail,
    template_id: config.SENDGRID.template_id,
    dynamic_template_data: { first_name: name, link_url: linkUrl },
  };
  sgMail.send(msg);
};

module.exports = {
  sendMail,
};
