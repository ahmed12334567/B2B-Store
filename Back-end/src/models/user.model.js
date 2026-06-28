const pool = require("../config/db");

const user = 
{
    createUser: (userData, callback) => {
        const qurey = "INSERT INTO users (name, email, password_user, address, phone, isGoogleUser, role) VALUES (?, ?, ?, ?, ?, ?, ?)"
        const data = [userData.username, userData.email, userData.password, userData.address, userData.phone,userData.isGoogleUser,userData.role]
        pool.query(qurey, data, callback);
    },
    createAdmin: (userData, callback) => {
        const qurey = "INSERT INTO users (name, email, password_user, address, phone, isGoogleUser, role) VALUES (?, ?, ?, ?, ?, ?, ?)"
        const data = [userData.username, userData.email, userData.password, userData.address, userData.phone,userData.isGoogleUser,userData.role]
        pool.query(qurey, data, callback);
    },
    findByEmail: (email, callback) => {
        const qurey = "SELECT * FROM users WHERE email = ?"
        pool.query(qurey, [email], callback);
    },
    getAllUsers: (callback) =>{
        const query = "SELECT user_id, name, email, phone, address, role, isGoogleUser FROM users ORDER BY user_id DESC"
        pool.query(query, callback)
    }
}

module.exports = user;

