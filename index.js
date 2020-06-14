const functions = require('firebase-functions');
const model = require('./model');
const share_route_app = require('./routes/share');
const trip_route_app = require('./routes/trip');
const user_route_app = require('./routes/user');
const post_route_app = require('./routes/post');

exports.share = functions.region("asia-east2").https.onRequest(share_route_app);
exports.trip = functions.region("asia-east2").https.onRequest(trip_route_app);
exports.user = functions.region("asia-east2").https.onRequest(user_route_app);
exports.post = functions.region("asia-east2").https.onRequest(post_route_app);

exports.getPost =functions.region("asia-east2").https.onRequest((req, res)=>{
    model.getAllPost().then(posts=>{
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
});

exports.addUser = functions.region("asia-east2").auth.user().onCreate((user) => {
    const email = user.email;
    const uid = user.uid;

    model.createUser(email, uid).catch(err => {
        console.log("Create user" + uid + " FAIL!")
        console.log(err);
    });
});

exports.deleteUser = functions.region("asia-east2").auth.user().onDelete(async (user, context) => {
    const uid = user.uid;

    model.deleteUser(uid).catch(err => {
        console.log("Delete user " + uid + " FAIL!");
        console.log(err);
    })
});

exports.sendMessagesVN = functions.region("asia-east2").firestore.document('messages/{discussionId}/messages/{messageId}').onCreate(async (snap, context) => {
    const discussionId = context.params.discussionId;
    const messageId = context.params.messageId;
    await model.sendMessages(snap, discussionId);
});

exports.sendUserNotificationVN = functions.region("asia-east2").firestore.document('users/{userId}/notifications/{notificationId}').onCreate(async (snap, context) => {
    const userId = context.params.userId;
    const notificationId = context.params.notificationId;
    await model.sendUserNotification(snap, userId);
});

exports.sendTripNotificationVN = functions.region("asia-east2").firestore.document('trips/{tripId}/notifications/{notificationId}').onCreate(async (snap, context) => {
    const tripId = context.params.tripId;
    const notificationId = context.params.notificationId;
    await model.sendTripNotification(snap, tripId);
});

exports.addEventAddCheckpoint = functions.region("asia-east2").firestore.document('trips/{tripId}/checkpoints/{checkpointId}')
    .onCreate(async (snap, context) => {
        let tripId = context.params.tripId;
        let eventRef = await model.addEventCheckpoint(snap, tripId, true);
        console.log("Add checkpoint's event: " + eventRef.id);
    });

exports.addEventRemoveCheckpoint = functions.region("asia-east2").firestore.document('trips/{tripId}/checkpoints/{checkpointId}')
    .onDelete(async (snap, context) => {
        let tripId = context.params.tripId;
        let eventRef = await model.addEventCheckpoint(snap, tripId, false);
        console.log("Remove checkpoint's event: " + eventRef.id);
    })