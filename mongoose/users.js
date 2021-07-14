let mongoose = require("mongoose");

let userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
    }
})

let Users = mongoose.model("Users", userSchema, "budgetUsers");
module.exports.Users = Users;