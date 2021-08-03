let express = require("express");
let app = express();
let mongoose = require("mongoose");
let jwt = require("jsonwebtoken");
let cors = require("cors");
let Models = require("./mongoose/users.js");
let bcrypt = require("bcrypt");
let Users = Models.Users;
require("dotenv").config();
let port = process.env.PORT || 250;
let connected = process.env.CONNECTION_STRING;
let secret = process.env.SECRET;

app.use(express.json());
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));
mongoose.connect(connected, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connection.on("open", () => {
    console.log("mongoose connected!")
})


app.get("/", (req, res) => {
    res.send("hello from main page");
})
app.get("/profile", authenticateToken, (req, res) => {
    res.send("logged in");
})
app.get("/budgets/:Username", authenticateToken, (req, res) => {
    let user = req.params.Username;
    console.log(user);
    Users.findOne({ username: req.params.Username }, function (err, obj) {
        if (err) {
            res.send(err);
        }
        else {
            res.send({ obj })
        }
    })

})
app.post("/userdata", authenticateToken, (req, res) => {
    Users.findOneAndUpdate({ username: req.body.username }, {
        $addToSet:
        {
            budget: {
                budgetname: req.body.budgetname,
                data: req.body.data,
                envelopes: req.body.envelopes
            }
        }
    },
        { new: true }, // This line makes sure that the updated document is returned
        (err, updatedDocument) => {
            if (err) {
                console.error(err);
                res.status(500).send('Error: ' + err);
            } else {
                res.json(updatedDocument);
            }
        });
});
app.post("/deleteuserdata", authenticateToken, (req, res) => {
    Users.findOneAndUpdate({ username: req.body.username }, {
        $pull:
        {
            budget: req.body.budget[req.body.index]
        }
    },
        { new: true }, // This line makes sure that the updated document is returned
        (err, updatedDocument) => {
            if (err) {
                console.error(err);
                res.status(500).send('Error: ' + err);
            } else {
                res.json(updatedDocument);
            }
        });
});
app.get("/users", (req, res) => {
    Users.find()
        .then((result) => {
            if (result) {
                res.json({ result })
            }
            else {
                res.json({ result: "user doesn't exist" });
            }

        }).catch((err) => {
            console.log(err);
            res.json({ result: "unauthorized" });
        })
})
app.post("/register", (req, res) => {
    Users.findOne({ username: req.body.username })
        .then((user) => {
            if (user) res.send({ error: "user already exists" });
            else {
                Users.create({
                    username: req.body.username,
                    password: generateHash(req.body.password),
                    email: req.body.email,
                    envelopes: [],
                    data: []
                }).then((result) => {
                    if (result) res.json({ user: true });
                }).catch((err) => {
                    if (err) {
                        res.json({ user: false });
                    }
                })
            }
        }).catch((err) => {
            if (err) {
                console.log(err);
                res.json({ error: err });
            }
        })
})
app.post("/login", (req, res) => {
    Users.findOne({ username: req.body.username })
        .then((user) => {
            if (!user) res.json({ user: false })
            if (user) {
                if (comparePassword(req.body.password, user.password)) {
                    token = generateAccessToken(req.body.username);
                    // res.cookie('token', token, { httpOnly: true });
                    res.json({ token: token, username: req.body.username });
                }
                else {
                    res.json({ password: false });
                }
            }
        }).catch((err) => {
            if (err) res.json({ error: err });
        })
})
app.listen(port, (err) => {
    if (err) {
        console.log(err);
    }
    console.log(`listening on port ${port}`);
});

function generateHash(password) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    return hash;
}
function comparePassword(password, hash) {
    return bcrypt.compareSync(password, hash);
}
function generateAccessToken(username) {
    let limit = 60 * 30;
    let expires = Math.floor(Date.now() / 1000) + limit;
    let payload = {
        username: username,
        exp: expires
    }
    return jwt.sign(payload, secret);
}
function authenticateToken(req, res, next) {
    const authHeader = req.header("Authorization");
    const [type, token] = authHeader.split(" ");
    if (type === "Bearer" && typeof token !== undefined) {
        try {
            jwt.verify(token, secret, (err, user) => {
                if (err) return res.sendStatus(401);
                req.username = user;
                next();
            });

        }
        catch (err) {
            res.status(401).send({ result: "expired or invalid token" })
        }
    } else {
        res.status(401).send({ result: "you arent logged in, access denied" })
    }
}