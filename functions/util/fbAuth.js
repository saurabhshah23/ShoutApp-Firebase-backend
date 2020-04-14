const { admin, db } = require("./admin");

module.exports = (req, res, next) => {
  console.log("FBAuth, authenticating user...");
  let idToken;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    idToken = req.headers.authorization.split("Bearer ")[1];
  } else {
    console.error("No token found.");
    res.status(403).json({ error: "Unauthorized" });
  }
  admin
    .auth()
    .verifyIdToken(idToken)
    .then(decodedToken => {
      req.user = decodedToken; //decodedToken is user object
      // console.log(decodedToken);
      return db
        .collection("users")
        .where("userId", "==", req.user.uid)
        .limit(1)
        .get();
    })
    .then(data => {
      req.user.handle = data.docs[0].data().handle;
      req.user.imageUrl = data.docs[0].data().imageUrl;
      console.log("FBAuth authentication done... going next...");
      return next();
    })
    .catch(err => {
      console.error("Error while verifying token");
      return res
        .status(403)
        .json({ error: `Error while verifying token ${JSON.stringify(err)}` });
    });
};
