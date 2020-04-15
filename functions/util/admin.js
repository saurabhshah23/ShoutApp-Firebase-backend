/** Temp setting for local serve / remote deploy */
const env = "remote"; //"local" | "remote";

// for api reqs.
var admin = require("firebase-admin");

/* firestore integration */
if (env === "local") {
  //Local "firebase serve": below works for postman requests.
  var serviceAccount = require("../../keys/admin.json");
  console.log("using local pvt key...", serviceAccount);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://shouting-app.firebaseio.com",
    storageBucket: "shouting-app.appspot.com",
  });
} else {
  console.log("using remote auth...");
  //Remote "firebase deploy": Below works for firebase deploy cmd.
  // admin.initializeApp(functions.config().firestore);
  admin.initializeApp();
}

// set alias for firestore handle
const db = admin.firestore();
/* firestore integration - end */

module.exports = { admin, db };
