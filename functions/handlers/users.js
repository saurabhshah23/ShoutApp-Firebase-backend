const Constant = require("../util/constants");
const { admin, db } = require("../util/admin");

/**Firebase authentication integration dependencies */
const fbConfig = require("../util/fbConfig");
const firebase = require("firebase");
firebase.initializeApp(fbConfig);
/**Firebase authentication integration dependencies - END */

const {
  validateSignupData,
  validateLoginData,
  reduceUserDetails,
} = require("../util/validators");

// new user signup
exports.signup = (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle,
  };

  const { errors, isValid } = validateSignupData(newUser);
  if (!isValid) return res.status(400).json(errors);

  const defaultAvatar = "no-avatar.png";
  // Do a new firebase Authentication entry.
  let token, userId;
  db.doc(`/users/${newUser.handle}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        return res
          .status(400)
          .json({ handle: "This handle is already taken!" });
      } else {
        // Do a new firebase Authentication entry.
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then((data) => {
      userId = data.user.uid;
      // return res.status(201).json({message:`User ${data.user.uid} signed up successfully.`});
      return data.user.getIdToken();
    })
    .then((tokenId) => {
      token = tokenId;
      const userDetails = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        imageUrl: `https://firebasestorage.googleapis.com/v0/b/${fbConfig.storageBucket}/o/${defaultAvatar}?alt=media`,
        userId,
      };
      // Add user in users collection
      return db.doc(`/users/${newUser.handle}`).set(userDetails);
    })
    .then((data) => {
      return res.status(201).json({ token });
    })
    .catch((err) => {
      if (err.code === "auth/email-already-in-use") {
        res.status(400).json({ email: `Email is already in use.` });
      } else {
        res.status(500).json(Constant.errGeneral);
      }
    });
};

// user login
exports.login = (req, res) => {
  console.log("/login serving...");
  const user = {
    email: req.body.email,
    password: req.body.password,
  };

  // Validation
  const { errors, isValid } = validateLoginData(user);
  if (!isValid) return res.status(400).json(errors);

  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then((userCred) => {
      return (token = userCred.user.getIdToken());
    })
    .then((token) => {
      return res.json({ token });
    })
    .catch((err) => {
      console.error(err.code);
      return res.status(400).json(Constant.errWrongCredentials);
    });
};

// get own user details - after auth
exports.getAuthenticatedUser = (req, res) => {
  console.log("serving getAuthenticatedUser...");
  let userData = {};
  db.doc(`/users/${req.user.handle}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        userData.credentials = doc.data();
        return db
          .collection("likes")
          .where("userHandle", "==", req.user.handle)
          .get();
      }
    })
    .then((data) => {
      userData.likes = [];
      data.forEach((doc) => {
        userData.likes.push(doc.data());
      });
      // return res.json(userData);
      return db
        .collection("notifications")
        .where("recipient", "==", req.user.handle)
        .orderBy("createdAt", "desc")
        .limit(10)
        .get();
    })
    .then((data) => {
      userData.notifications = [];
      data.forEach((doc) => {
        userData.notifications.push({
          ...doc.data(),
          notificationId: doc.id,
        });
      });
      return res.json(userData);
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json(err.code);
    });
};

// updated user bio details
exports.updateUserDetails = (req, res) => {
  console.log("serving updateUserDetails...");
  let userDetails = reduceUserDetails(req.body);
  db.doc(`/users/${req.user.handle}`)
    .update(userDetails)
    .then((writeResult) => {
      return res.json({ message: "Details added successfully" });
    })
    .catch((err) => {
      console.log(err.code);
      return res.status(500).json({ error: err.code });
    });
};

// get any user's details wo auth
exports.getUserDetails = (req, res) => {
  console.log("serve getUserDetails...");
  let userData = {};
  db.doc(`/users/${req.params.userHandle}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        res.status(404).json({ error: "User not found." });
      } else {
        userData.user = doc.data();
        return db
          .collection("shouts")
          .where("userHandle", "==", req.params.userHandle)
          .orderBy("createdAt", "desc")
          .limit(10)
          .get();
      }
    })
    .then((data) => {
      userData.shouts = [];
      data.forEach((doc) => {
        userData.shouts.push({
          ...doc.data(),
          shoutId: doc.id,
        });
      });
      return res.json(userData);
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

exports.markNotificationsRead = (req, res) => {
  console.log("serve markNotificationsRead...");
  let batch = db.batch();
  req.body.forEach((notificationId) => {
    const notification = db.doc(`/notifications/${notificationId}`);
    batch.update(notification, { read: true });
  });
  batch
    .commit()
    .then(() => {
      return res.json({ message: "Notification marked read." });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

// upload a user profile image.
exports.uploadImage = (req, res) => {
  console.log("serving uploadImage...");
  const BusBoy = require("busboy");
  const path = require("path");
  const os = require("os");
  const fs = require("fs");

  const busboy = new BusBoy({ headers: req.headers });

  let imageFilename;
  let imageToBeUploaded = {};
  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
      return res.status(400).json({ error: "Wrong file type submitted" });
    } else {
      const imageExtension = filename.substr(filename.lastIndexOf(".") + 1);
      imageFilename = `${Math.round(
        Date.now() + "" + Math.random() * 10000
      )}.${imageExtension}`;
      // imageFilename = `${Math.round(
      //   Math.random() * 100000000000
      // )}.${imageExtension}`;
      const filepath = path.join(os.tmpdir(), imageFilename);
      imageToBeUploaded = { filepath, mimetype };
      file.pipe(fs.createWriteStream(filepath));
    }
  });
  busboy.on("finish", () => {
    admin
      .storage()
      .bucket()
      .upload(imageToBeUploaded.filepath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: imageToBeUploaded.mimetype,
          },
        },
      })
      .then(() => {
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${fbConfig.storageBucket}/o/${imageFilename}?alt=media`;
        return db.doc(`/users/${req.user.handle}`).update({ imageUrl });
      })
      .then(() => {
        return res.json({ message: "Image uploaded successfully." });
      })
      .catch((err) => {
        console.error("error in image upload:", err);
        return res.status(500).json({ error: err.code });
      });
  });
  busboy.end(req.rawBody);
};
