require("dotenv").config();

module.exports = {
  development: {
    url: process.env.MYSQL_URL,  
    dialect: "mysql"
  },
  production: {
    url: process.env.MYSQL_URL, 
    dialect: "mysql"
  }
};
