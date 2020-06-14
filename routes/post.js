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
app.post('/getAllPosts', (req, res) => {
    let requestId = req.user.uid;
    model.getAllPost(requestId).then(posts=>{
        let message = {
            success : true,
            data: posts
        }
        res.status(200).send(message);
        return message;
    }).catch(err => {
        let message = {
            success: false,
            reason: err.message || String(error)
        }
        console.log("Failed to get posts Reason: " + err.stack || err.message || String(error));
        res.status(200).send(message);
    })
})

/* Receive HTTP POST request with content type application/json */
app.post('/likePost', async (req, res) => {
    let requestId = req.user.uid;
    let postId = req.body.postId;
    let like = req.body.like;
    model.likePost(requestId, postId, like).then(val=>{
        let message = {
            success : true,
        }
        res.status(200).send(message);
        return message;
    }).catch(err => {
        let message = {
            success: false,
            reason: err.message || String(error)
        }
        console.log("Failed to like post Reason: " + err.stack || err.message || String(error));
        res.status(200).send(message);
    })
})

module.exports = app;