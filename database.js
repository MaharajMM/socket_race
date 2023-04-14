var sqlite3 = require('sqlite3').verbose()
var sha = require('sha256')

const DBSOURCE = "db.sqlite" 


let db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
      // Cannot open database
      console.error(err.message)
      throw err
    }else{
      console.log('Connected to the SQlite database.')
    }
})
// const createTables = () => {
//   db.run(`
//     CREATE TABLE IF NOT EXISTS users (
//       id INTEGER PRIMARY KEY,
//       username TEXT UNIQUE,
//       password TEXT
//     )
//   `);
  
//   db.run(`
//     CREATE TABLE IF NOT EXISTS questions (
//       id INTEGER PRIMARY KEY,
//       question TEXT,
//       answer TEXT
//     )
//   `);
  
//   db.run(`
//     CREATE TABLE IF NOT EXISTS scores (
//       id INTEGER PRIMARY KEY,
//       user_id INTEGER,
//       score INTEGER,
//       FOREIGN KEY (user_id) REFERENCES users (id)
//     )
//   `);
// };

// createTables();



module.exports = db;

