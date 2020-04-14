const { db } = require("../util/admin");

// Get all shouts
exports.getAllShouts = (req, res) => {
  console.log("serving shouts via express app...");
  db.collection("shouts")
    .orderBy("createdAt", "desc")
    .get()
    .then((data) => {
      let shoutsData = [];
      data.forEach((doc) => {
        shoutsData.push({
          shoutId: doc.id,
          ...doc.data(),
          // shout: doc.data().body,
          // createdAt: doc.data().createdAt,
          // user: doc.data().userHandle
        });
      });
      return res.json(shoutsData);
    })
    .catch((err) => {
      console.error(err);
    });
};

// Create a shout
exports.createShout = (req, res) => {
  const newShout = {
    body: req.body.body,
    userHandle: req.user.handle,
    userImage: req.user.imageUrl,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0,
  };
  console.log(JSON.stringify(newShout));
  db.collection("shouts")
    .add(newShout)
    .then((doc) => {
      let tmpRes = `New shout with id=${doc.id} added successfully in shouts collection.`;
      console.log(tmpRes);
      const resShout = newShout;
      resShout.shoutId = doc.id;
      return res.json(resShout);
      // return res.json({ message: tmpRes });
      // return res.json({"message": "createShout post successful..."})
    })
    .catch((err) => {
      console.log(err);
      return res
        .status(500)
        .json({ message: "Failed to add new shout!" + JSON.stringify(err) });
    });
};

// Get shout details
exports.getShout = (req, res) => {
  console.log("serving getShout...");
  let shoutData = {};
  db.doc(`/shouts/${req.params.shoutId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Shout not found." });
      } else {
        shoutData = doc.data();
        console.log(shoutData);
        shoutData.shoutId = doc.id;
        return db
          .collection("comments")
          .orderBy("createdAt", "desc")
          .where("shoutId", "==", req.params.shoutId)
          .get();
      }
    })
    .then((data) => {
      shoutData.comments = [];
      data.forEach((doc) => {
        shoutData.comments.push(doc.data());
      });
      return res.json(shoutData);
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

// Delete a shout - from shouts collection only if user is the owner of shout. Also delete all comment and like documents from corresponding collections.
exports.deleteShout = (req, res) => {
  console.log("serving deleteShout...");
  db.doc(`/shouts/${req.params.shoutId}`)
    .get()
    .then((doc) => {
      if (!doc.exists)
        return res.status(404).json({ error: "Shout not found" });
      if (doc.data().userHandle !== req.user.handle) {
        return res
          .status(400)
          .json({ error: "Unauthorised to delete this shout" });
      } else {
        return doc.ref.delete();
      }
    })
    .then(() => {
      return res.json({ message: "Shout deleted successfully" });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

// Add a comment on shout will add a comment document in comments collection and increment commentCount in shout document.
exports.addComment = (req, res) => {
  console.log("serving addComment");
  if (req.body.body.trim() === "") {
    return res.status(400).json({ comment: "Must not be empty" });
  }

  let commentData = {
    shoutId: req.params.shoutId,
    userHandle: req.user.handle,
    userImage: req.user.imageUrl,
    body: req.body.body.trim(),
    createdAt: new Date().toISOString(),
  };

  db.doc(`/shouts/${req.params.shoutId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Shout not found" });
      } else {
        return doc.ref.update({ commentCount: doc.data().commentCount + 1 });
      }
    })
    .then(() => {
      return db.collection("comments").add(commentData);
    })
    .then(() => {
      return res.json(commentData);
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

// Like a shout - will add a like document in likes collection and increment likecount in shout document.
exports.likeShout = (req, res) => {
  console.log("serving likeShout...");
  const likeDocument = db
    .collection("likes")
    .where("userHandle", "==", req.user.handle)
    .where("shoutId", "==", req.params.shoutId)
    .limit(1);
  const shoutDocument = db.doc(`/shouts/${req.params.shoutId}`);

  let shoutData;
  shoutDocument
    .get()
    .then((doc) => {
      if (doc.exists) {
        shoutData = doc.data();
        shoutData.shoutId = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: "Shout not found" });
      }
    })
    .then((data) => {
      if (data.empty) {
        db.collection("likes")
          .add({
            userHandle: req.user.handle,
            shoutId: req.params.shoutId,
            createdAt: new Date().toISOString(),
          })
          .then(() => {
            shoutData.likeCount++;
            return shoutDocument.update({ likeCount: shoutData.likeCount });
          })
          .then(() => {
            return res.json(shoutData);
          });
        // .catch(err => {
        //   console.error(err);
        //   return res.status(500).json({ error: err.code });
        // });
      } else {
        return res.status(400).json({ error: "Shout already liked" });
      }
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

// Unlike a shout - will remove the like document from likes collection and decrement likecount in shout document.
exports.unlikeShout = (req, res) => {
  console.log("serving unlikeShout...");

  const likeDocument = db
    .collection("likes")
    .where("userHandle", "==", req.user.handle)
    .where("shoutId", "==", req.params.shoutId)
    .limit(1);
  const shoutDocument = db.doc(`/shouts/${req.params.shoutId}`);

  let shoutData;
  shoutDocument
    .get()
    .then((doc) => {
      if (doc.exists) {
        shoutData = doc.data();
        shoutData.shoutId = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: "Shout not found" });
      }
    })
    .then((data) => {
      if (data.empty) {
        return res.status(400).json({ error: "Shout not liked yet" });
      } else {
        db.doc(`/likes/${data.docs[0].id}`)
          .delete()
          .then(() => {
            shoutData.likeCount--;
            return shoutDocument.update({ likeCount: shoutData.likeCount });
          })
          .then(() => {
            return res.json(shoutData);
          });
        // .catch(err => {
        //   console.error(err);
        //   return res.status(500).json({ error: err.code });
        // });
      }
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};
