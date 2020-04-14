db = {
  users: [
    {
      userId: "lwnHHBZ5B6ZoeQe7DQRfqh5Yi373",
      email: "user7@abc.com",
      handle: "user7",
      createdAt: "2020-03-21T22:24:51.029Z",
      imageUrl:
        "https://firebasestorage.googleapis.com/v0/b/shouting-app.appspot.com/o/15848696884329814.jpg?alt=media",
      bio: "Hello, my name is user7, nice to meet you.",
      website: "http://user7.com",
      location: "London, UK"
    }
  ],
  shouts: [
    {
      user: "localdb",
      shout: "local db dummy shout",
      createdAt: "2020-03-19T22:28:14.307Z",
      likeCount: 5,
      commentCount: 2,
      userImage: "image/abc.jpg"
    }
  ],
  comments: [
    {
      shoutId: "asdfasdfasdf",
      userHandle: "user4",
      body: "oh boy.. its awesome",
      createdAt: "2020-03-19T22:28:14.307Z"
    }
  ],
  notifications: [
    {
      recipient: "user1",
      sender: "john",
      read: "true | false",
      shoutId: "rK3xAOkp306PNXD6M07s",
      type: "like | comment",
      createdAt: "2020-03-23T07:28:22.557Z"
    }
  ]
};

const userDetails = {
  //REDUX data
  credentials: {
    user_id: "UP9pii07zubCsqOahG1bl6PCsa03",
    email: "user4@abc.com",
    handle: "user4",
    createdAt: "2020-03-21T08:14:08.746Z",
    imageUrl: "image/asdfasdf.jpg",
    bio: "Hi, I am user4, i love to code",
    website: "http://user4.com",
    location: "Mumbai, In"
  },
  likes: [
    {
      userHandle: "user4",
      shoutId: "nbhEkp4PharSpSO37DAg"
    },
    {
      userHandle: "saurabh",
      shoutId: "i4581MOp6sUcjVk3bEIM"
    }
  ]
};
