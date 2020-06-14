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
app.post('/getTrip', async (req, res) => {
    let tripId = req.body.tripId;
    try {
        let tripPublicData = await model.getTrip(tripId);
        let message = {
            success: true,
            data: tripPublicData
        }
        res.status(200).send(message);
    } catch (err) {
        let message = {
            success: false,
            reason: err.message || String(error)
        }
        console.log(`Fail to get trip ${tripId}`);
        console.log("Reason: " +  err.stack || err.message || String(error));
        res.status(200).send(message);
    }
})

/* Receive HTTP POST request with content type application/json */
app.post('/getTrip/getWaitingRoom', async (req, res) => {
    let tripId = req.body.tripId;
    let leaderUid = req.user.uid;
    try {
        let users = await model.getTripWaitingRoom(tripId, leaderUid);
        let message = {
            success: true,
            data: users
        }
        res.status(200).send(message);
    } catch (err) {
        let message = {
            success: false,
            reason: err.message || String(error)
        }
        console.log(`Fail to getTripWaitingRoom ${tripId} by ${leaderUid}`);
        console.log("Reason: " +  err.stack || err.message || String(error));
        res.status(200).send(message);
    }
})


/* Receive HTTP POST request with content type application/json */
app.post('/joinTrip', (req, res) => {
    let requestUid = req.user.uid;
    let uid = req.body.uid;
    let tripId = req.body.tripId;
    let joinCode = req.body.joinCode;

    model.joinTrip(requestUid, uid, tripId, joinCode || null).then(value => {
        console.log("User " + uid + " join trip " + tripId);
        let message = { success: true };
        res.status(200).send(message);
        return message;
    }).catch(err => {
        let message = {
            success: false,
            reason: err.message || String(error)
        }
        console.log("Fail to join user " + uid + " to trip " + tripId);
        console.log("Reason: " +  err.stack || err.message || String(error));
        res.status(200).send(message);
    })
})

/* Receive HTTP POST request with content type application/json */
app.post('/leaveTrip', (req, res) => {
    let uid = req.user.uid;
    model.leaveTrip(uid).then(value => {
        console.log("User " + uid + "leave trip");
        res.status(200).send({ success: true });
        return message;
    }).catch(err => {
        let message = {
            success: false,
            reason: err.message || String(error)
        }
        console.log("Failed to leave user " + uid + " from trip");
        console.log("Reason: " +  err.stack || err.message || String(error));
        res.status(200).send(message);
    })
})

module.exports = app;