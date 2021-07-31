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
    budget: {
        type: Object,
        budgetname: {
            type: String
        },
        data: [{ type: Number }],
        envelopes: [{ type: String }]
    },
})

let Users = mongoose.model("Users", userSchema, "budgetUsers");
module.exports.Users = Users;