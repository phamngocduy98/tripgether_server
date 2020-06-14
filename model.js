const admin = require('firebase-admin');
admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: "https://tripgether-b135a.firebaseio.com"
});

const db = admin.firestore();

async function auth(idToken) {
    const decodedIdToken = await admin.auth().verifyIdToken(idToken, true);
    return decodedIdToken;
}

/**
 * createWebPage
 * @param {String} title 
 * @param {String} url 
 * @returns {String} HTML webpage that create intent to url
 */
function createShareWebPage(title, url) {
    return `<html>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css" rel="stylesheet"
        integrity="sha384-9aIt2nRpC12Uk9gS9baDl411NQApFmC26EwAOH8WgZl5MYYxFfc+NcPb1dKGj7Sk" crossorigin="anonymous">
    <link href='https://fonts.googleapis.com/css?family=Roboto' rel='stylesheet'>
    <style>
        body {
            font-family: 'Roboto';
        }
    </style>
    <script>
        function openApp(){
            window.location.replace('${url}');
        }
    </script>
    
    <body style="text-align: center; background-color: #F2F2F2;" onload="openApp()">
        <img class="mt-5" src="https://sites.google.com/site/masoibot/user/tripgether2.svg" height="100" />
        <h3 class="mt-2 mb-3">Tripgether</h3>
        <p>${title}<br>Bấm "Mở ứng dụng" để cài đặt ứng dụng và tiếp tục</p>
        <a class="btn btn-primary mt-3" role="button" href="${url}">
            Mở ứng dụng
        </a>
    </body>
    </html>`;
}

function createSharePostPage(avatarUrl, name, time, body, imageUrl) {
    return `<html>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css" rel="stylesheet"
        integrity="sha384-9aIt2nRpC12Uk9gS9baDl411NQApFmC26EwAOH8WgZl5MYYxFfc+NcPb1dKGj7Sk" crossorigin="anonymous">
    <link href='https://fonts.googleapis.com/css?family=Roboto' rel='stylesheet'>
    <style>
        body {
            font-family: 'Roboto';
        }
    </style>
    
    <body style="background-color: #F2F2F2;" class="container">
        <div class="mt-4 mb-4" style="display: flex; flex-direction: row; align-items: center; justify-content: center;">
            <img src="https://sites.google.com/site/masoibot/user/tripgether2.svg" height="60" />
            <h2 class="ml-2">Tripgether</h2>
        </div>
        <div style="background-color: #fff; border-radius: 22px; padding: 20 40;">
            <div class="row">
                <div>
                    <img src="${avatarUrl}" height="40px" />
                </div>
                <div class="col" style="justify-content: center;">
                    <div>${name}</div>
                    <div style="font-size: 13;">${time}</div>
                </div>
            </div>
            <div class="row mt-3 mb-3">${body}</div>
            <div class="row">
                <img style="width: 100%; object-fit: none; object-position: center; max-height: 250px" class="img-fluid"
                    src="${imageUrl}" />
            </div>
            <div class="mt-3 mb-3" style="display: flex; flex-direction: row; align-items: center; justify-content: center;">
                <svg class="bi bi-download mr-1" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd"
                        d="M.5 8a.5.5 0 0 1 .5.5V12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8.5a.5.5 0 0 1 1 0V12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V8.5A.5.5 0 0 1 .5 8z" />
                    <path fill-rule="evenodd"
                        d="M5 7.5a.5.5 0 0 1 .707 0L8 9.793 10.293 7.5a.5.5 0 1 1 .707.707l-2.646 2.647a.5.5 0 0 1-.708 0L5 8.207A.5.5 0 0 1 5 7.5z" />
                    <path fill-rule="evenodd" d="M8 1a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0v-8A.5.5 0 0 1 8 1z" />
                </svg>
                Tải ngay Tripgether để tham gia cộng đồng
            </div>
        </div>
    </body>
    
    </html>`;
}

async function createUser(email, uid) {
    let user_record = {
        activeTripRef: null,
        avatar: "https://sites.google.com/site/masoibot/user/user.png",
        battery: 0,
        currentCoord: new admin.firestore.GeoPoint(0, 0),
        currentLocation: "",
        name: "",
        phoneNumber: "",
        email: email,
        speed: 0,
        friends: [],
        friendRequests: [],
        sentFriendRequests: []
    };

    let role_record = {
        isAdmin: false
    };

    await db.collection('users').doc(uid).set(user_record);
    await db.collection('roles').doc(uid).set(role_record);
}

async function deleteUser(uid) {
    db.collection('roles').doc(uid).delete();
    db.collection('users').doc(uid).delete();
}

/**
 * addFriend
 * @param {String} requestUid 
 * @param {String} friendId 
 * @param {String} action value : {"REQUEST", "CANCEL", "ACCEPT", "REJECT", "REMOVE"} 
 */
async function addFriend(requestUid, friendId, action) {
    /**@type {FirebaseFirestore.DocumentSnapshot<User>} */
    let userSnap = await db.collection('users').doc(requestUid).get();
    /**@type {FirebaseFirestore.DocumentSnapshot<User>} */
    let friendSnap = await db.collection('users').doc(friendId).get();
    if (!userSnap.exists) throw new Error("requestUid not found");
    if (!friendSnap.exists) throw new Error("friendId not found");
    let userData = userSnap.data();
    let friendData = friendSnap.data();
    /**@type {FirebaseFirestore.WriteBatch} */
    let batch = db.batch();
    if (action === "REQUEST") {
        // if (friendData.friends.some(fRef=>fRef.id === userRef.id) && userData.friends.some(fRef=>fRef.id === friendRef.id)) throw new Error("You and he/she already be friend");
        // if (friendData.friendRequests.some(fRef=>fRef.id === userRef.id)) throw new Error("You already sent an add friend request");
        batch.update(friendRef, "friendRequests", admin.firestore.FieldValue.arrayUnion(userRef));
        batch.update(userRef, "sentFriendRequests", admin.firestore.FieldValue.arrayUnion(friendRef));
        let requestNotification = {
            avatar: userData.avatar,
            messageParams: [userData.name],
            priority: "normal", // head-up-notifications
            seen: false,
            time: admin.firestore.FieldValue.serverTimestamp(),
            type: "addFriend",
            userRef: userRef
        }
        batch.create(friendRef.collection("notifications").doc(), requestNotification);
    } else if (action === "CANCEL") {
        batch.update(friendRef, "friendRequests", admin.firestore.FieldValue.arrayRemove(userRef));
        batch.update(userRef, "sentFriendRequests", admin.firestore.FieldValue.arrayRemove(friendRef));
    } else if (action === "ACCEPT") {
        batch.update(friendRef, "sentFriendRequests", admin.firestore.FieldValue.arrayRemove(userRef));
        batch.update(userRef, "friendRequests", admin.firestore.FieldValue.arrayRemove(friendRef));
        batch.update(userRef, "friends", admin.firestore.FieldValue.arrayUnion(friendRef));
        batch.update(friendRef, "friends", admin.firestore.FieldValue.arrayUnion(userRef));
        let acceptNotification = {
            avatar: userData.avatar,
            messageParams: [userData.name],
            priority: "normal", // head-up-notifications
            seen: false,
            time: admin.firestore.FieldValue.serverTimestamp(),
            type: "friendAccepted",
            userRef: userRef
        }
        batch.create(friendRef.collection("notifications").doc(), acceptNotification);
    } else if (action === "REJECT") {
        batch.update(friendRef, "sentFriendRequests", admin.firestore.FieldValue.arrayRemove(userRef));
        batch.update(userRef, "friendRequests", admin.firestore.FieldValue.arrayRemove(friendRef));
        let rejectNotification = {
            avatar: userData.avatar,
            messageParams: [userData.name],
            priority: "normal", // head-up-notifications
            seen: false,
            time: admin.firestore.FieldValue.serverTimestamp(),
            type: "friendRejected",
            userRef: userRef
        }
        batch.create(friendRef.collection("notifications").doc(), rejectNotification);
    } else if (action === "REMOVE") {
        batch.update(userRef, "friends", admin.firestore.FieldValue.arrayRemove(friendRef));
        batch.update(friendRef, "friends", admin.firestore.FieldValue.arrayRemove(userRef));
    } else {
        throw new Error("invalid action name");
    }
    return batch.commit();
}

async function getUser(uid) {
    /**@type {FirebaseFirestore.DocumentReference<User>} */
    let userRef = db.collection('users').doc(uid);
    let userSnap = await userRef.get();
    if (!userSnap.exists) throw new Error("uid not found");
    return getUserPublicData(userSnap);
}

async function findUserByEmail(email) {
    /**@type {FirebaseFirestore.Query<User>} */
    let userRef = db.collection('users').where('email', '==', email).limit(1);
    let userSnaps = await userRef.get();
    if (userSnaps.empty) throw new Error("user not found");
    return getUserPublicData(userSnaps.docs[0]);
}


async function findUserByPhoneNum(phoneNum) {
    /**@type {FirebaseFirestore.Query<User>} */
    let userRef = db.collection('users').where('phoneNumber', '==', phoneNum).limit(1);
    let userSnaps = await userRef.get();
    if (userSnaps.empty) throw new Error("user not found");
    return getUserPublicData(userSnaps.docs[0]);
}

async function getTripWaitingRoom(tripId, leaderUid) {
    /**@type {FirebaseFirestore.DocumentReference<Trip>} */
    let tripRef = db.collection('trips').doc(tripId);
    let tripSnap = await tripRef.get();
    if (!tripSnap.exists) throw new Error("tripId not found");
    let tripData = tripSnap.data();

    let leaderRef = tripData.leader;
    let leaderSnap = await leaderRef.get();
    if (!leaderSnap.exists) throw new Error("Invalid trip! leader not found");

    if (leaderSnap.id !== leaderUid) {
        throw new Error("Only Leader can access trip waiting room!");
    }

    if (!Array.isArray(tripData.waitingRoom)) throw new Error("Invalid trip: waitingRoom either not an array or null");
    let waitingUsersSnap = await getSnapArrayFromRefArray(tripData.waitingRoom);
    let waitingUsersData = waitingUsersSnap.filter(snap => snap.exists).map(snap => getUserPublicData(snap));
    return waitingUsersData;
}

/**
 * getTrip
 * @param {String} tripId 
 * @returns {TripPublicData}
 */
async function getTrip(tripId) {
    /**@type {FirebaseFirestore.CollectionReference<Checkpoint>} */
    let checkpointsRef = db.collection("trips").doc(tripId).collection("checkpoints");
    let checkpointsSnap = await checkpointsRef.get();
    let checkpointsData = checkpointsSnap.docs.map(snap => snap.data());

    /**@type {FirebaseFirestore.DocumentReference<Trip>} */
    let tripRef = db.collection('trips').doc(tripId);
    let tripSnap = await tripRef.get();
    if (!tripSnap.exists) throw new Error("tripId not found");
    let tripData = tripSnap.data();
    if (!Array.isArray(tripData.members)) throw new Error("Invalid trip: members either not an array or null");
    let membersSnap = await getSnapArrayFromRefArray(tripData.members);
    let membersData = membersSnap.filter(snap => snap.exists).map(snap => getUserPublicData(snap));
    /**@type {TripPublicData} */
    let response = {
        name: tripData.name,
        members: membersData,
        checkpoints: checkpointsData
    }
    return response;
}

/**
 * joinTrip
 * @param {String} requestUid / user's self uid or leader's uid 
 * @param {String} uid  // of user wanna join trip
 * @param {String} tripId 
 * @param {String} joinCode 
 */
async function joinTrip(requestUid, uid, tripId, joinCode) {
    /**@type {FirebaseFirestore.DocumentReference<User>} */
    let userRef = db.collection('users').doc(uid);
    /**@type {FirebaseFirestore.DocumentReference<Trip>} */
    let tripRef = db.collection('trips').doc(tripId);
    let userSnap = await userRef.get();
    let tripSnap = await tripRef.get();

    if (!userSnap.exists) throw new Error("Invalid User ID");
    if (!tripSnap.exists) throw new Error("TripId not exists, please check again");

    let userData = userSnap.data();
    let tripData = tripSnap.data();

    if (userData.activeTripRef !== null) {
        // old trip not left
        throw new Error("Could not join trip while you are in another trip, Please leave your current trip!");
    }

    if (tripData.leader === null) throw new Error("invalid trip, leader is Null");
    let leaderSnap = await tripData.leader.get();
    if (!leaderSnap.exists) throw new Error("Trip leader not exists");

    if (requestUid !== leaderSnap.id && requestUid !== uid) throw Error("You can't accept join unless you are leader of the trip");
    if (requestUid === leaderSnap.id && !tripData.waitingRoom.some(uRef => uRef.id === uid)) throw Error("You can't accept join of person who don't wanna join");

    let expiredTimeLeft = Date.now() - tripData.joinCode.createdTime.toDate().getTime();
    console.log("timeleft = " + expiredTimeLeft);
    if (
        requestUid === leaderSnap.id || (
            Array.isArray(tripData.inviteRoom) && tripData.inviteRoom.some(uRef => uRef.id === uid) && requestUid === uid
        ) || (
            joinCode !== null && joinCode === tripData.joinCode.value && expiredTimeLeft < 60 * 1000
        )
    ) {
        /**@type {FirebaseFirestore.WriteBatch} */
        let batch = db.batch();
        // remove from waiting list, add to members list
        batch.update(tripRef, {
            members: admin.firestore.FieldValue.arrayUnion(userRef),
            waitingRoom: admin.firestore.FieldValue.arrayRemove(userRef)
        });
        // update activeTripRef
        batch.update(userRef, { activeTripRef: tripRef });
        // add to chat room
        let discussionRef = tripData.discussionRef;
        batch.update(discussionRef, { members: admin.firestore.FieldValue.arrayUnion(userRef) });
        // add leave notifications
        let joinNotification = {
            avatar: userData.avatar,
            messageParams: [userData.name],
            priority: "normal", // head-up-notifications
            seenList: [],
            time: admin.firestore.FieldValue.serverTimestamp(),
            type: "userAdded",
            userRef: userRef
        }
        batch.create(tripRef.collection("notifications").doc(), joinNotification);
        return batch.commit();
    } else if (joinCode === null) {
        // request join room, wait for leader to accept
        return tripRef.update({ waitingRoom: admin.firestore.FieldValue.arrayUnion(userRef) });
    } else {
        throw new Error("joinCode is either invalid nor expired");
    }
}

/**
 * leaveTrip
 * @param {String} requestUid 
 * @param {String} userCode 
 */
async function leaveTrip(requestUid) {
    /**@type {FirebaseFirestore.DocumentSnapshot<User>} */
    let userRef = db.collection('users').doc(requestUid);
    let userSnap = await userRef.get();
    if (!userSnap.exists) throw new Error("Invalid User ID");
    let userData = userSnap.data();

    let tripRef = userData.activeTripRef;
    if (tripRef === null) throw new Error("Bạn chưa tham gia chuyến đi nào!");
    let tripSnap = await tripRef.get();
    if (!tripSnap.exists) throw new Error("User current Trip not exists");
    let tripData = tripSnap.data();

    /**@type {FirebaseFirestore.WriteBatch} */
    let batch = db.batch();
    // remove from members list
    batch.update(tripRef, {
        members: admin.firestore.FieldValue.arrayRemove(userRef)
    });
    // activeTripRef = null
    batch.update(userRef, { activeTripRef: null });
    // leave chat room:
    let discussionRef = tripData.discussionRef;
    batch.update(discussionRef, { members: admin.firestore.FieldValue.arrayRemove(userRef) });
    // add leave notifications
    let leaveNotification = {
        avatar: userData.avatar,
        messageParams: [userData.name],
        priority: "normal", // head-up-notifications
        seenList: [],
        time: admin.firestore.FieldValue.serverTimestamp(),
        type: "userRemoved",
        userRef: userRef
    }
    batch.create(tripRef.collection("notifications").doc(), leaveNotification);
    return batch.commit();
}

async function getPost(requestId, postId) {
    /**@type {FirebaseFirestore.DocumentReference<Post>} */
    let postRef = db.collection("posts").doc(postId);
    let postSnap = await postRef.get();
    if (!postSnap.exists) throw Error("post not exist");
    let postData = postSnap.data();
    let ownerSnap = await postData.ownerRef.get();
    let owner = ownerSnap.data();
    let userLiked = postData.likes.some(uRef=>uRef.id === requestId);
    /**@type {PostPublic} */
    let postPublic = {
        id: postSnap.id,
        ownerId: ownerSnap.id,
        avatar: owner.avatar,
        ownerName: owner.name,
        body: postData.body,
        media: postData.media,
        likes: postData.likes.length,
        userLiked: userLiked,
        time: postData.time,
        tripId: postData.tripRef ? postData.tripRef.id : null,
        coordinate: postData.coordinate
    }
    return postPublic;
}

async function getAllPost(requestId) {
    /**@type {FirebaseFirestore.QuerySnapshot<Post>} */
    let postsSnap = await db.collection("posts").get();
    return Promise.all(postsSnap.docs.map(async snap => {
        let postData = snap.data();
        let ownerSnap = await postData.ownerRef.get();
        let owner = ownerSnap.data();
        let userLiked = postData.likes.some(uRef=>uRef.id === requestId);
        /**@type {PostPublic} */
        let postPublic = {
            id: snap.id,
            ownerId: ownerSnap.id,
            avatar: owner.avatar,
            ownerName: owner.name,
            body: postData.body,
            media: postData.media,
            likes: postData.likes.length,
            userLiked: userLiked,
            time: postData.time,
            tripId: postData.tripRef ? postData.tripRef.id : null,
            coordinate: postData.coordinate
        }
        return postPublic;
    }));
}
/**
 * 
 * @param {String} requestId
 * @param {String} postId 
 * @param {boolean} like 
 */
async function likePost(requestId, postId, like) {
    let postRef = db.collection("posts").doc(postId);
    let postSnap = await postRef.get();
    if (!postSnap.exists) throw Error("post not exist");

    let requestRef = db.collection("users").doc(requestId);
    if (like){
        return postRef.update("likes",  admin.firestore.FieldValue.arrayUnion(requestRef));
    } else {
        return postRef.update("likes",  admin.firestore.FieldValue.arrayRemove(requestRef));
    }
    
}

/**
 * 
 * @param {FirebaseFirestore.DocumentSnapshot<Nofication>} userNotificationSnap 
 * @param {String} uid 
 */
async function sendUserNotification(userNotificationSnap, uid) {
    let userNotification = userNotificationSnap.data();
    /** @type {FirebaseFirestore.DocumentReference<User>} */
    let userRef = db.collection('users').doc(uid);
    let userSnap = await userRef.get();
    if (!userSnap.exists) throw new Error("Invalid User ID");
    let userData = userSnap.data();
    let dataToSend = {
        "notiRefId": String(userNotificationSnap.id),
        "type": String(userNotification.type),
        "avatar": userNotification.avatar,
        "messageParams": userNotification.messageParams.join(","),
        "time": userNotification.time.toDate().toISOString(),
        "priority": userNotification.priority || "normal"
    }
    let message = {
        "token": userData.fcmToken,
        "data": dataToSend,
        "android": {
            "priority": "high"
        }
    };
    console.log("sending message to " + uid + " message = " + message);
    return admin.messaging().send(message);
}

/**
 * 
 * @param {FirebaseFirestore.DocumentSnapshot<Message>} messageSnap 
 * @param {String} discussionId 
 */
async function sendMessages(messageSnap, discussionId) {
    /** @type {Message} */
    const message = messageSnap.data();
    /** @type {FirebaseFirestore.DocumentReference<Discussion>} */
    const discussionSnap = await db.doc("messages/" + discussionId).get();
    console.log("Send message " + messageSnap.id + " from discussion " + discussionId);

    if (!discussionSnap.exists) throw new Error("Discussion not exists");
    const discussion = discussionSnap.data();
    if (!Array.isArray(discussion.members) || discussion.members.length === 0) throw new Error("Invalid discussion: members is empty or null");
    let usersSnap = await getSnapArrayFromRefArray(discussion.members);
    // filter user exist and has fcm token, except sender
    let users = usersSnap.filter(snap => snap.exists && snap.id !== message.fromUser.id).map(snap => snap.data()).filter(user => user.fcmToken);
    let tokens = users.map(user => user.fcmToken);
    console.log("loaded tokens = " + tokens);

    let senderSnap = await message.fromUser.get();
    let senderData = senderSnap.data();

    /** message is sent with normal FCM message to handle without android service */
    let messageToSend = {
        "notification": {
            title: senderData.name || "Tripgether Chat",
            body: message.text || "Bạn có tin nhắn mới.",
        }
    }
    console.log("message = " + messageToSend);
    /** send message via Messaging.sendAll */
    return admin.messaging().sendToDevice(tokens, messageToSend, {
        priority: "high",
        contentAvailable: true,
        collapseKey: discussionSnap.id
    });
}

/**
 * 
 * @param {FirebaseFirestore.DocumentSnapshot<Nofication>} tripNoficationSnap 
 * @param {String} tripId 
 */
async function sendTripNotification(tripNoficationSnap, tripId) {
    /** @type {Nofication} */
    const tripNofication = tripNoficationSnap.data();
    /** @type {FirebaseFirestore.DocumentReference<Trip>} */
    const tripRef = db.doc("trips/" + tripId);

    console.log("Trip " + tripId + " add event " + tripNoficationSnap.id);

    const tripSnap = await tripRef.get();
    if (!tripSnap.exists) throw new Error("Trip not exists");
    const trip = tripSnap.data();
    if (!Array.isArray(trip.members) || trip.members.length === 0) throw new Error("Invalid trip: members is empty or null");
    let usersSnap = await getSnapArrayFromRefArray(trip.members);
    // filter user exist and has fcm token, except notification sender
    let users = usersSnap.filter(snap => snap.exists && snap.id !== tripNofication.userRef.id).map(snap => snap.data()).filter(user => user.fcmToken);
    for (let user of users) {
        console.log("loaded user = " + user.name + " token = " + user.fcmToken);
    }
    let dataToSend = {
        "notiRefId": String(tripNoficationSnap.id),
        "type": String(tripNofication.type),
        "avatar": tripNofication.avatar,
        "messageParams": tripNofication.messageParams.join(","),
        "time": tripNofication.time.toDate().toISOString(),
        "priority": tripNofication.priority ? tripNofication.priority : "low"
    }
    console.log("send event data = " + JSON.stringify(dataToSend));
    /** message is sent with data payload only, so that it can be handle via FCM android service */
    let messageToSend = {
        "data": dataToSend,
        "android": {
            "priority": "high"
        }
    }
    /** add token to each message */
    const messages = users.map(user => Object.assign({}, messageToSend, { token: user.fcmToken }));
    /** send message via Messaging.sendAll */
    return admin.messaging().sendAll(messages);
}

/**
 * 
 * @param {FirebaseFirestore.DocumentSnapshot<Checkpoint>} checkpointSnap 
 * @param {String} tripId 
 * @param {boolean} isAdd 
 */
async function addEventCheckpoint(checkpointSnap, tripId, isAdd) {
    let checkpointData = checkpointSnap.data();
    /**@type {FirebaseFirestore.DocumentSnapshot<Trip>} */
    let tripSnap = await db.collection("trips").doc(tripId).get();
    let tripData = tripSnap.data();
    let leaderRef = tripData.leader;
    let leaderSnap = await leaderRef.get();
    let leaderData = leaderSnap.data();
    let checkpointNotification = {
        avatar: leaderData.avatar,
        messageParams: [checkpointData.name, checkpointData.location],
        priority: "low", // simple notifications
        seenList: [],
        time: admin.firestore.FieldValue.serverTimestamp(),
        type: isAdd ? "checkpointAdded" : "checkpointRemoved",
        userRef: leaderRef,
        checkpointRef: checkpointSnap.ref,
    }
    return db.collection('trips').doc(tripId).collection('notifications').add(checkpointNotification);
}

exports.auth = auth;
exports.createWebPage = createShareWebPage;
exports.createSharePostPage = createSharePostPage;
exports.createUser = createUser;
exports.deleteUser = deleteUser;
exports.getUser = getUser;
exports.findUserByEmail = findUserByEmail;
exports.findUserByPhoneNum = findUserByPhoneNum;
exports.addFriend = addFriend;

exports.sendMessages = sendMessages;
exports.getTripWaitingRoom = getTripWaitingRoom;
exports.getTrip = getTrip;
exports.joinTrip = joinTrip;
exports.leaveTrip = leaveTrip;
exports.getAllPost = getAllPost;
exports.getPost = getPost;
exports.likePost = likePost;
exports.sendUserNotification = sendUserNotification;
exports.sendTripNotification = sendTripNotification;
exports.addEventCheckpoint = addEventCheckpoint;

/**
 * getUserPublicData
 * @param {FirebaseFirestore.DocumentSnapshot<User>} userSnap 
 * @returns {UserPublicData}
 */
function getUserPublicData(userSnap) {
    let user = userSnap.data();
    return ({
        id: userSnap.id,
        name: user.name,
        avatar: user.avatar,
        email: user.email
    });
}

/**
 * getSnapArrayFromRefArray
 * @param {Array<FirebaseFirestore.DocumentReference<User>} documentRefArray DocumentReference array
 * @returns {Array<FirebaseFirestore.DocumentSnapshot<User>} array of document snapshot
 */
async function getSnapArrayFromRefArray(documentRefArray) {
    let snapshotPromises = [];
    for (let ref of documentRefArray) {
        snapshotPromises.push(ref.get())
    }
    return await Promise.all(snapshotPromises);
}
/**
 * Nofication
 * @typedef {Object} Nofication
 * @property {FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>} checkpointRef - DocRef to checkpoint
 * @property {FirebaseFirestore.DocumentReference<User>} userRef - DocRef to user
 * @property {String} avatar
 * @property {String} type - Type: { USER_ADDED = "userAdded";USER_REMOVED ;USER_SOS_ADDED ; USER_SOS_RESOLVED ;CHECKPOINT_ADDED;CHECKPOINT_REMOVED;CHECKPOINT_GATHER_REQUEST }
 * @property {Array<String>} messageParams - params that pass to the message. eg: messsage is "%s is joined", then messageParams[0] is filled in %s position
 * @property {FirebaseFirestore.Timestamp} time - event time
 * @property {String} priority - event priority: ["high", "low"]
 */


/**
 * JoinCode
 * @typedef {Object} JoinCode
 * @property {String} value
 * @property {FirebaseFirestore.Timestamp} createdTime
 */

/**
 * Trip
 * @typedef {Object} Trip
 * @property {FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>} activeCheckpointRef - DocRef to roll up checkpoint
 * @property {FirebaseFirestore.DocumentReference<User>} leader - DocRef to leader user
 * @property {FirebaseFirestore.DocumentReference<any>} discussionRef - DocRef to discussion
 * @property {Array<FirebaseFirestore.DocumentReference<User>} members - Array of user's DocRef
 * @property {Array<FirebaseFirestore.DocumentReference<User>} waitingRoom - Array of user's DocRef
 * @property {Array<FirebaseFirestore.DocumentReference<User>} inviteRoom - Array of user's DocRef
 * @property {JoinCode} joinCode
 * @property {String} name - name of the trip
 */

/**
 * @typedef {Object} User
 * @property {FirebaseFirestore.DocumentReference<Trip>} activeTripRef - DocRef to trip user belongs to
 * @property {String} userCode - user code to use RESTapi
 * @property {String} avatar - user's avatar url
 * @property {Number} battery - user's device battery lever (in percent)
 * @property {FirebaseFirestore.GeoPoint} currentCoord - user's coordinate
 * @property {String} currentLocation - user's location address
 * @property {String} email - user's email
 * @property {String} fcmToken - user's firebase cloud messaging token
 * @property {String} name - user's name
 * @property {String} phoneNumber - user's phone number
 * @property {Number} speed - user's speed (in meters per second)
 * @property {Array<FirebaseFirestore.DocumentReference<User>>} friends - user's friends list
 * @property {Array<FirebaseFirestore.DocumentReference<User>>} friendRequests - users that send user an add-friend request
 */


/**
 * @typedef {Object} UserPublicData
 * @property {String} id - user uid
 * @property {String} avatar - user's avatar url
 * @property {String} email - user's email
 * @property {String} name - user's name
 * @property {String} phoneNumber - user's phone number
 */

/**
 * Checkpoint
 * @typedef {Object} Checkpoint
 * @property {FirebaseFirestore.GeoPoint} coordinate
 * @property {String} location
 * @property {String} name
 * @property {FirebaseFirestore.Timestamp} time
 */

/**
 * @typedef {Object} TripPublicData
 * @property {String} name - trip name
 * @property {Array<UserPublicData>} members - trip's members
 * @property {Array<Checkpoint>} checkpoints - trip's checkpoints
 */

/**
 * @typedef {Object} Message
 * @property {FirebaseFirestore.DocumentReference<User>} fromUser
 * @property {String} text content of message
 * @property {FirebaseFirestore.Timestamp} time
 */

/**
 * @typedef {Object} Discussion
 * @property {String} name
 * @property {Array<FirebaseFirestore.DocumentReference<User>} members - Array of user's DocRef
 * @property {FirebaseFirestore.DocumentReference<Trip>} tripRef - if belong to a trip
 */

/**
 * @typedef {Object} PostMedia
 * @property {String} type // image/video
 * @property {String} url
 */

/**
 * @typedef {Object} Post
 * @property {FirebaseFirestore.DocumentReference<User>} ownerRef
 * @property {String} body
 * @property {PostMedia} media
 * @property {Array<FirebaseFirestore.DocumentReference<User>>} likes
 * @property {FirebaseFirestore.Timestamp} time
 * @property {FirebaseFirestore.DocumentReference<Trip>} tripRef
 * @property {FirebaseFirestore.GeoPoint} coordinate
 */

/**
 * @typedef {Object} PostPublic
 * @property {String} id
 * @property {String} avatar
 * @property {String} ownerName
 * @property {String} ownerId
 * @property {String} body
 * @property {PostMedia} media
 * @property {Number} likes
 * @property {boolean} userLiked
 * @property {FirebaseFirestore.Timestamp} time
 * @property {String} tripId
 * @property {FirebaseFirestore.GeoPoint} coordinate
 */