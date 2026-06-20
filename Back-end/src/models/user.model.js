const pool = require("../config/db");

const user = 
{
    createUser: (userData, callback) => {
        const qurey = "INSERT INTO users (name, email, password_user, address, phone, isGoogleUser) VALUES (?, ?, ?, ?, ?, ?)"
        const data = [userData.username, userData.email, userData.password, userData.address, userData.phone,userData.isGoogleUser]
        pool.query(qurey, data, callback);
    },
    findByEmail: (email, callback) => {
        const qurey = "SELECT * FROM users WHERE email = ?"
        pool.query(qurey, [email], callback);
    }
}

module.exports = user;

