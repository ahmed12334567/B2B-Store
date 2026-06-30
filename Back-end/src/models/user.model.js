const pool = require("../config/db");

const user = 
{
    createUser: (userData, callback) => {
        const qurey = "INSERT INTO users (name, email, password_user, address, phone, isGoogleUser, role) VALUES (?, ?, ?, ?, ?, ?, ?)"
        const data = [userData.username, userData.email, userData.password, userData.address, userData.phone,userData.isGoogleUser,userData.role]
        pool.execute(qurey, data, callback);
    },
    createAdmin: (userData, callback) => {
        const qurey = "INSERT INTO users (name, email, password_user, address, phone, isGoogleUser, role) VALUES (?, ?, ?, ?, ?, ?, ?)"
        const data = [userData.username, userData.email, userData.password, userData.address, userData.phone,userData.isGoogleUser,userData.role]
        pool.execute(qurey, data, callback);
    },
    findByEmail: (email, callback) => {
        const qurey = "SELECT * FROM users WHERE email = ?"
        pool.execute(qurey, [email], callback);
    },
    getAllUsers: (callback) =>{
        const query = "SELECT user_id, name, email, phone, address, role, isGoogleUser FROM users ORDER BY user_id DESC"
        pool.execute(query, callback)
    },
    deleteUser: (user_id, callback) =>{
        const query = "DELETE FROM users WHERE user_id = ?"
        const deleteData = [user_id]
        pool.execute(query, deleteData, callback)
    }
}

module.exports = user;

