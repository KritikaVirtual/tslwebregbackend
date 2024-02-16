var config = require("../Utilities/config").config;

var mysql = require("mysql");

var pool = mysql.createPool({
  connectionLimit: 5,
  host: config.DB_URL.host,
  user: config.DB_URL.user,
  password: config.DB_URL.password,
  database: config.DB_URL.database,
});

// var connection = mysql.createConnection({
//     host: config.DB_URL.host,
//     user: config.DB_URL.user,
//     password: config.DB_URL.password,
//     database: config.DB_URL.database
// });

pool.getConnection(function (err, connection) {
  if (err) {
    return console.error("error: " + err.message);
  }
  console.log("Connected to the MySQL server.");
  connection.release();
});

// connection.connect(function(err) {
//     if (err) {
//       return console.error('error: ' + err.message);
//     }
//     console.log('Connected to the MySQL server.');
//   });

//- Error listener
// connection.on('error', function(err) {

//   //- The server close the connection.
//   if(err.code === "PROTOCOL_CONNECTION_LOST"){
//       console.log("/!\\ Cannot establish a connection with the database. /!\\ ("+err.code+")");
//       connection = connection.connect();
//   }

//   //- Connection in closing
//   else if(err.code === "PROTOCOL_ENQUEUE_AFTER_QUIT"){
//       console.log("/!\\ Cannot establish a connection with the database. /!\\ ("+err.code+")");
//       connection = connection.connect();
//   }

//   //- Fatal error : connection variable must be recreated
//   else if(err.code === "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR"){
//       console.log("/!\\ Cannot establish a connection with the database. /!\\ ("+err.code+")");
//       connection = connection.connect();
//   }

//   //- Error because a connection is already being established
//   else if(err.code === "PROTOCOL_ENQUEUE_HANDSHAKE_TWICE"){
//       console.log("/!\\ Cannot establish a connection with the database. /!\\ ("+err.code+")");
//   }

//   //- Anything else
//   else{
//       console.log("/!\\ Cannot establish a connection with the database. /!\\ ("+err.code+")");
//       connection = connection.connect();
//   }

// });

let getDB = () => {
  return pool;
};

module.exports = {
  getDB: getDB,
};
