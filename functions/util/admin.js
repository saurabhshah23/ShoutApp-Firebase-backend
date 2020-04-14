/** Temp setting for local serve / remote deploy */
const env = "localx"; //"local" | "remote";

// for api reqs.
var admin = require("firebase-admin");

/* firestore integration */
if (env === "local") {
  //Local "firebase serve": below works for postman requests.
  var serviceAccount = require("../../keys/admin.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://shouting-app.firebaseio.com",
    storageBucket: "shouting-app.appspot.com"
  });
} else {
  //Remote "firebase deploy": Below works for firebase deploy cmd.
  // admin.initializeApp(functions.config().firestore);
  admin.initializeApp();
}

// set alias for firestore handle
const db = admin.firestore();
/* firestore integration - end */

module.exports = { admin, db };
