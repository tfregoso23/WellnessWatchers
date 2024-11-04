const mysql = require("mysql");

const pool = mysql.createPool({
    connectionLimit: 10,
    host: "tviw6wn55xwxejwj.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
    user: "c07y9donybih5ghn",
    password: "spg6k9z7kkqn71vi",
    database: "vdwlany8binqv94t",
});

module.exports = pool;
