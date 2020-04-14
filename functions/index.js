/**
 * Shouting App: All endpoints available from here:
 * 1. /signup - POST with user object
 * 2. /login - POST with user object having email and password
 * 3. /getShouts - GET get all available shouts
 * 4. /shout - POST adds a new shout
 * 5. FBAuth - middleware - to check if the user is authorised user with valid token.
 * 6. /image - POST to upload user profile image
 * 7. /user - POST to add user profile details
 * 8. /user - GET get all details of the user.
 */

const functions = require("firebase-functions");
// adding express js.
const app = require("express")();
const Constants = require("./util/constants");

/** MIDDLEWARE */
const FBAuth = require("./util/fbAuth");
// const { FBAuth } = require("./util/fbAuth");
/** MIDDLEWARE - END */

/** ENDPOINTS CREATION STARTS HERE */

// users
const {
  signup,
  login,
  uploadImage,
  updateUserDetails,
  getAuthenticatedUser,
  markNotificationsRead,
  getUserDetails,
} = require("./handlers/users");
app.post("/signup", signup);
app.post("/login", login);
app.post("/image", FBAuth, uploadImage);
app.post("/user", FBAuth, updateUserDetails);
app.get("/user", FBAuth, getAuthenticatedUser);
app.get("/user/:userHandle", getUserDetails);
app.post("/notifications", FBAuth, markNotificationsRead);

// shouts
const {
  getAllShouts,
  createShout,
  getShout,
  addComment,
  likeShout,
  unlikeShout,
  deleteShout,
} = require("./handlers/shouts");
// app.get("/getShouts", getAllShouts); //FIXME: Delete this route.
app.get("/shouts", getAllShouts); //Duplicate of getShouts.
app.post("/shout", FBAuth, createShout);
app.delete("/shout/:shoutId", FBAuth, deleteShout);
app.get("/shout/:shoutId", getShout);
app.post("/shout/:shoutId/comment", FBAuth, addComment);
app.get("/shout/:shoutId/like", FBAuth, likeShout);
app.get("/shout/:shoutId/unlike", FBAuth, unlikeShout);

/** ENDPOINTS CREATION END HERE */

// single export for express app functions.
exports.api = functions.region(Constants.fbRegion).https.onRequest(app);

/*
Exampel to create endpoing without using express js
exports.getShouts = functions.https.onRequest((req,res)=>{
    console.log("serving shouts via exports...");
    admin.firestore().collection('shouts').get()
        .then(data=>{
            let shoutsData = [];
            data.forEach(doc=>{
                shoutsData.push(doc.data());
            })
            return res.json(shoutsData);
        })
        .catch(err=>{
            console.error(err);
        })
});
*/

/** FIRESTORE TRIGGERS */
const { db } = require("./util/admin");

// Notify owner of shout on like
exports.createNotificationOnLike = functions
  .region(Constants.fbRegion)
  .firestore.document("likes/{id}")
  .onCreate((snapshot) => {
    console.log("serving Trigger createNotificationOnLike");
    return db
      .doc(`/shouts/${snapshot.data().shoutId}`)
      .get()
      .then((doc) => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          console.log("creating NotificationOnLike...");
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            read: false,
            type: "like",
            shoutId: doc.id,
          });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  });
// Remove notification on unlike
exports.deleteNotificationOnUnlike = functions
  .region(Constants.fbRegion)
  .firestore.document("likes/{id}")
  .onDelete((snapshot) => {
    console.log("serving Trigger deleteNotificationOnUnlike");
    return db
      .doc(`/shouts/${snapshot.data().shoutId}`)
      .get()
      .then((doc) => {
        if (doc.exists) {
          return db.doc(`/notifications/${snapshot.id}`).delete();
        }
      })
      .catch((err) => {
        console.log(err);
      });
  });

// Notify owner of shout on comment
exports.createNotificationOnComment = functions
  .region(Constants.fbRegion)
  .firestore.document("comments/{id}")
  .onCreate((snapshot) => {
    console.log("serving Trigger createNotificationOnComment");
    return db
      .doc(`/shouts/${snapshot.data().shoutId}`)
      .get()
      .then((doc) => {
        if (
          doc.exists &&
          doc.data().userHandle === snapshot.data().userHandle
        ) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            read: false,
            type: "comment",
            shoutId: doc.id,
          });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  });

// Update UserImageUrl in all Shouts and Comments when User changes the profile Image.
exports.onUserImageChange = functions
  .region(Constants.fbRegion)
  .firestore.document("/users/{userId}")
  .onUpdate((change) => {
    if (change.before.data().imageUrl !== change.after.data().imageUrl) {
      const batch = db.batch();
      return db
        .collection(`shouts`)
        .where("userHandle", "==", change.after.data().handle)
        .get()
        .then((data) => {
          data.forEach((doc) => {
            const shout = db.doc(`/shouts/${doc.id}`);
            batch.update(shout, { userImage: change.after.data().imageUrl });
          });
          return batch.commit();
        });
    } else return true;
  });

// Deleter all Comments, likes, notifications on delete of a Shout.
exports.onShoutDelete = functions
  .region(Constants.fbRegion)
  .firestore.document("/shouts/{shoutId}")
  .onDelete((snapshot, context) => {
    const shoutId = context.params.shoutId;
    const batch = db.batch();
    return db
      .collection("comments")
      .where("shoutId", "==", shoutId)
      .get()
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/comments/${doc.id}`));
        });
        return db.collection("likes").where("shoutId", "==", shoutId).get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/likes/${doc.id}`));
        });
        return db
          .collection("notifications")
          .where("shoutId", "==", shoutId)
          .get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/notifications/${doc.id}`));
        });
        return batch.commit();
      })
      .catch((err) => {
        console.error(err);
      });
  });

/** FIRESTORE TRIGGERS - END */
