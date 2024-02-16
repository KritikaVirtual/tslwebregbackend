let environment = require('./environment').environment;

let serverURLs = {
    "dev": {
        "NODE_SERVER": "https://tslvirtual.herokuapp.com",
        "NODE_SERVER_PORT": "3000",
        "MYSQL_HOST": '50.62.35.131',
        "MYSQL_USER": 'tslwebre_local',
        "MYSQL_PASSWORD": 'Tradeshow@2020',
        'MYSQL_DATABASE': 'tslwebre_tslwebregnew',
        // 'EMAIL_HOST': 'smtp.sendgrid.net',
        // 'EMAIL_PORT': 465,
        // 'EMAIL_SECURE': true, // use SSL
        // 'EMAIL_USER': 'kapilsendgrid',
        // 'EMAIL_PASS': 'kapilworks1',
        // 'FCM_SERVER_KEY':'AIzaSyCc6Dlta_VpaC1qgR8kBbE4rqOcaTgUXrA',
        'jwtSecretToken' : 'tslvirtual',
        'sendGridApiKey' : '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',
        'sendGridTemplateId':'d-a2b9f040dd4f41afa761a52f164c3d83',
        
        'sendGridSenderMail':'toms@tsleads.net',
        "FRONTEND_URL":"https://sad-dubinsky-d485b2.netlify.app"
    },
    "tslvirtual": {
        "NODE_SERVER": "https://api.tslvirtualconference.com",
        "NODE_SERVER_PORT": "3000",
        "MYSQL_HOST": '50.62.35.131',
        "MYSQL_USER": 'tslwebre_local',
        "MYSQL_PASSWORD": 'Tradeshow@2020',
        'MYSQL_DATABASE': 'tslwebre_tslwebregnew',
        // 'EMAIL_HOST': 'smtp.sendgrid.net',
        // 'EMAIL_PORT': 465,
        // 'EMAIL_SECURE': true, // use SSL
        // 'EMAIL_USER': 'kapilsendgrid',
        // 'EMAIL_PASS': 'kapilworks1',
        // 'FCM_SERVER_KEY':'AIzaSyCc6Dlta_VpaC1qgR8kBbE4rqOcaTgUXrA',
        'jwtSecretToken' : 'tslvirtual',
        'sendGridApiKey' : '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',
        'sendGridTemplateId':'d-a2b9f040dd4f41afa761a52f164c3d83',
        'sendGridSenderMail':'toms@tsleads.net',
        "FRONTEND_URL":"https://www.tslvirtualconference.com"
    },
    "local": {
        "NODE_SERVER": "http://localhost:3001",
        "NODE_SERVER_PORT": "3001",
        "MYSQL_HOST": '50.62.35.131',
        "MYSQL_USER": 'tslwebre_local',
        "MYSQL_PASSWORD": 'Tradeshow@2020',
        'MYSQL_DATABASE': 'tslwebre_tslwebregnew',
        // 'EMAIL_HOST': 'smtp.sendgrid.net',
        // 'EMAIL_PORT': 465,
        // 'EMAIL_SECURE': true, // use SSL
        // 'EMAIL_USER': 'kapilsendgrid',
        // 'EMAIL_PASS': 'kapilworks1',
        // 'FCM_SERVER_KEY':'AIzaSyCc6Dlta_VpaC1qgR8kBbE4rqOcaTgUXrA',
        'jwtSecretToken' : 'tslvirtual',
        'sendGridApiKey' : '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',
        'sendGridTemplateId':'d-a2b9f040dd4f41afa761a52f164c3d83',
        'sendGridSenderMail':'toms@tsleads.net',
        "FRONTEND_URL":"https://affectionate-bohr-4d306b.netlify.app"
    }
}

let config = {
    "DB_URL": {
        "host": `${serverURLs[environment].MYSQL_HOST}`,
        "user": `${serverURLs[environment].MYSQL_USER}`,
        "password": `${serverURLs[environment].MYSQL_PASSWORD}`,
        "database": `${serverURLs[environment].MYSQL_DATABASE}`
    },
    "NODE_SERVER_PORT": {
        "port": `${serverURLs[environment].NODE_SERVER_PORT}`
    },
    "NODE_SERVER_URL": {
        "url": `${serverURLs[environment].NODE_SERVER}`
    },
    "EMAIL_CONFIG": {
        "host": `${serverURLs[environment].EMAIL_HOST}`,
        "port": `${serverURLs[environment].EMAIL_PORT}`,
        "secure": `${serverURLs[environment].EMAIL_SECURE}`,
        "auth": {
            "user": `${serverURLs[environment].EMAIL_USER}`,
            "pass": `${serverURLs[environment].EMAIL_PASS}`,
        }
    },
    "FCM_SERVER_KEY": {
        "server_key": `${serverURLs[environment].FCM_SERVER_KEY}`,
    },
    "JWT_SECRET_TOKEN":`${serverURLs[environment].jwtSecretToken}`,
    "SENDGRID":{
        "api_key":`${serverURLs[environment].sendGridApiKey}`,
        "template_id":`${serverURLs[environment].sendGridTemplateId}`,
        "sender_mail":`${serverURLs[environment].sendGridSenderMail}`
    },
    "FRONTEND_URL": {
        "url": `${serverURLs[environment].FRONTEND_URL}`
    }
    
};

module.exports = {
    config: config
};
