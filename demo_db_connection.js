let mysql = require('mysql');


let connection = mysql.createConnection({
    host: '50.62.35.131',
    user: 'TSL',
    password: 'peachbus20',
    database: 'tslwebreg'
});


connection.connect(function(err) {
  if (err) {
    return console.error('error: ' + err.message);
  }

  console.log('Connected to the MySQL server.');
});

connection.query('SELECT * FROM Admin', (err,rows) => {
  if(err) throw err;

  console.log('Data received from Db:');
  console.log(rows);
});