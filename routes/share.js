const express = require('express');
const cors = require('cors');
const app = express();
const model = require('../model');

app.use(cors({ origin: true }));

app.get('/trip/:tripId', (req, res) => {
    let tripId = req.params.tripId;
    let html = model.createShareWebPage(
        "Một người bạn đã mời bạn tham gia chuyến đi trên Tripgether",
        `intent://trips/${tripId}/#Intent;scheme=tripgether;package=cf.bautroixa.maptest;end`
    );
    res.status(200).send(html);
});
app.get('/trip/:tripId/join/:joinCode', (req, res) => {
    let tripId = req.params.tripId;
    let joinCode = req.params.joinCode;
    let html = model.createShareWebPage(
        "Một người bạn đã mời bạn tham gia chuyến đi trên Tripgether",
        `intent://trips/${tripId}/join/${joinCode}/#Intent;scheme=tripgether;package=cf.bautroixa.maptest;end`
    );
    res.status(200).send(html);
});
app.get('/user/:userId', (req, res) => {
    let userId = req.params.userId;
    let html = model.createShareWebPage(
        "Một người bạn đã mời bạn tham gia Tripgether",
        `intent://users/${userId}/#Intent;scheme=tripgether;package=cf.bautroixa.maptest;end`
    );
    res.status(200).send(html);
});

app.get('/post/:postId', async (req, res) => {
    let postId = req.params.postId;
    let post = await model.getPost(null, postId);
    let html = model.createSharePostPage(post.avatar, post.ownerName, post.time.toDate().toISOString(), post.body, post.media.url);
    res.status(200).send(html);
});

module.exports = app;