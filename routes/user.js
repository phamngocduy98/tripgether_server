const express = require('express');
const cors = require('cors');
const app = express();
const model = require('../model');

app.use(cors({ origin: true }));

const authenticate = async (req, res, next) => {
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
        res.status(403).send({
            success: false,
            reason: "Could not verify requested user's signature!",
            code: "/auth/empty-token"
        });
        return;
    }
    const idToken = req.headers.authorization.split('Bearer ')[1];
    try {
        const decodedIdToken = await model.auth(idToken);
        req.user = decodedIdToken;
        next();
        return;
    } catch (error) {
        if (error.code === 'auth/id-token-revoked') {
            res.status(403).send({
                success: false,
                reason: error.message || String(error),
                code: error.code
            });
        } else {
            res.status(403).send({
                success: false,
                reason: error.message || String(error),
                code: "/auth/invalid-token"
            });
            
        }
        return;
    }
};

app.use(authenticate);

/* Receive HTTP POST request with content type application/json */
app.post('/getUser', (req, res) => {
    let uid = req.user.uid;
    model.getUser(uid).then(userPublicInfo => {
        console.log("get User " + userPublicInfo);
        res.status(200).send({
            success: true,
            data: userPublicInfo
        });
        return message;
    }).catch(err => {
        let message = {
            success: false,
            reason: err.message || String(error)
        }
        console.log("Fail to get user " + uid);
        console.log("Reason: " +  err.stack || err.message || String(error));
        res.status(200).send(message);
    })
})

/* Receive HTTP POST request with content type application/json */
app.post('/findUser', async (req, res) => {
    let email = req.body.email;
    let phoneNum = req.body.phoneNum;
    try {
        if (email !== undefined && typeof email === "string" && email.length > 0) {
            let userPublicInfo = await model.findUserByEmail(email);
            console.log("find User by email" + userPublicInfo);
            res.status(200).send({
                success: true,
                data: userPublicInfo
            });
        } else if (phoneNum !== undefined && typeof phoneNum === "string" && phoneNum.length > 0) {
            let userPublicInfo = await model.findUserByPhoneNum(phoneNum);
            console.log("find User by phoneNum " + userPublicInfo);
            res.status(200).send({
                success: true,
                data: userPublicInfo
            });
        } else {
            throw new Error("Email or phoneNum must be specified!");
        }
    } catch (err) {
        let message = {
            success: false,
            reason: err.message || String(error)
        }
        console.log("Fail to find user with email " + email + " or phoneNum = " + phoneNum);
        console.log("Reason: " +  err.stack || err.message || String(error));
        res.status(200).send(message);
    }
})

/* Receive HTTP POST request with content type application/json */
app.post('/addFriend', async (req, res) => {
    let uid = req.user.uid;
    let friendId = req.body.friendId;
    let action = req.body.action;
    try {
        await model.addFriend(uid, friendId, action);
        let message = {
            success: true
        }
        res.status(200).send(message);
    } catch (err) {
        let message = {
            success: false,
            reason: err.message || String(error)
        }
        console.log(`Fail to add friend ${uid} vs ${friendId}`);
        console.log("Reason: " +  err.stack || err.message || String(error));
        res.status(200).send(message);
    }
})

module.exports = app;