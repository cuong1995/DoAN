## DB definition
https://docs.google.com/spreadsheets/d/1REF6HfskSElDkvaEzKwkINBV1RBUC1RjSNa-b16uspY/edit?usp=sharing

## Env definition
```
SECRET=supersecretkey
NODE_ENV=development

FACEBOOK_APP_ID=1817173048527454
FACEBOOK_APP_SECRET=8555a81f25eec12e4c802046bf77d3f0

APP_ENDPOINT=http://local.sotatek.com:1337
```

## Database seeding
Run command
```
  npm run seeds
```
Or
```
  make seeds
```

## Request definition

### Authenticate
- Request with field `access_token` in query or body (formarted as `x-www-form-urlencoded`)
- Set token in header `X-Access-Token`

### Public Instagram APIs
Reference: https://www.instagram.com/developer/endpoints/

### Enhanced APIs

#### GET `/users/self/follows`
Add `isMyIdol` attribute to the response entity format. Example response:
```
{
    "data": [{
        "username": "kevin",
        "profile_picture": "http://images.ak.instagram.com/profiles/profile_3_75sq_1325536697.jpg",
        "full_name": "Kevin Systrom",
        "id": "3",
        "is_my_idol": true
    },
    {
        "username": "instagram",
        "profile_picture": "http://images.ak.instagram.com/profiles/profile_25025320_75sq_1340929272.jpg",
        "full_name": "Instagram",
        "id": "25025320",
        "is_my_idol": false
    }]
}
```

### Additional APIs

#### POST `/device-id`
- Requires authenticate
- Body parameters
```
  os            : ['required', 'string'],  // enum: ['android', 'ios'],
  device_id     : ['required', 'string']   // The uuid of the device
  device_token  : ['required', 'string']   // The device token to send push notification
```

#### POST `/push-notification/ios`
- Body parameters
```
  user_ids: ['required', 'string'],
  badge: ['natural'],
  alert: ['string'],
```

#### POST `/push-notification/android`
```
  // TODO
```

#### GET `/newsfeed`
- Requires authenticate
- Query parameters
```
  // TODO: pagination
```
- Sample response

https://github.com/sotatek-dev/instagram-server/blob/develop/dummy/response/newsfeed_GET.js

#### POST `/media`
- Requires authenticate
- Body parameters
```
  type: ['required', 'string'] // enum: ['image', 'video']
  caption: ['string']
  locationId: ['naturalNonZero']
  media: ['file'] // For now, only allow file smaller than 50000 bytes (server capacity is limited)
  tag_users: ['string'] // user_id string, separated by commas
```
- Sample response

https://github.com/sotatek-dev/instagram-server/blob/develop/dummy/response/media_POST.js

#### POST `/profile`
- Update user profile information
- Require authenticate
- Body parameters
```
  email: ['email'],
  full_name: ['string'],
  bio: ['string'],
  website: ['string'],
  phone: ['string'],
  gender: ['string'],
```

#### POST `/avatar`
- Update user's avatar
- Require authenticate
- Body parameters (form-data)
```
  image: File
```

### Pagination
- Pagination base on ObjectId. The greater id, the order data ({ id: 80, content: xxx } is newer than { id: 10, content: yyy })
- Request with field `before_id`, `after_id`, `count` in query. If there is no pagination parameters in query, server will return the 20 newest entries by default.
- Currently avaiable on
```
  GET /newsfeed
  GET /users/self/media/recent
  GET /users/:user-id/media/recent
```
- Query parameters
```
  after_id: Return data later than this `after_id`
  before_id: Return data earlier than this `before_id`
  count: Maximum size of data to return (20 by default)
```
- Sample request
```
  /newsfeed                       //Return 20 newest medias with ObjectId from 100 to 81
  /newsfeed?before_id=81          //Return medias with ObjectId from 80 to 61
  /newsfeed?before_id=61          //Return medias with ObjectId from 60 to 41
  /newsfeed?before_id=81&count=10 //Return medias with ObjectId from 80 to 71
  /newsfeed?after_id=80           //Return medias with ObjectID from 81 to 100
  /newsfeed?after_id=81&count=10  //Return medias with ObjectId from 80 to 91
```

## Socket communication
- Using `sails.io`, a wrapper of `socket.io`
- Emitted data is similar with normal http request's parameters
- Parameter `access_token` is required for ALL socket events. Below parts will not mention it anymore.
- Example debug page: [User 1](http://local.sotatek.com:1337/debug-socket?access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjMwMzAzMDMwMzAzMDMwMzAzMDMwMzAzNyIsImlhdCI6MTQ4MDk4OTQ2OSwiZXhwIjoxNDgzNTgxNDY5fQ.ibGTHhW6yVZvHaWjhWvE8r7UykHKZQtMfBKQ804F2VE) and [User 2](http://local.sotatek.com:1337/debug-socket?access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjMwMzAzMDMwMzAzMDMwMzAzMDMwMzAzMyIsImlhdCI6MTQ4MTAwMzUxNywiZXhwIjoxNDgzNTk1NTE3fQ.8v5zpbVZEFySRJnP7SttYFspMJf300uunWNOBtV48Gw)

### Events emitted from client side

#### `/socket/subscribe`
- Subscribe for events of a room
- Data parameters:
```
  type: ['required', 'string'], // Currently available only type: media
  id: ['required', 'string'],   // The media_id
```

#### `/socket/unsubscribe`
- Ubsubscribe from a room that is subscribed before
- Data parameters:
```
  type: ['required', 'string'], // Currently available only type: media
  id: ['required', 'string'],   // The media_id
```

### Events emitted from server side

#### `like`
- There's a new like
- Data format:
```
{
  "id": "58465502a65a110c6240fb51",
  "user_id": "303030303030303030303037",
  "media_id": "303030303030303030303036",
  "created_time": "2016-12-06T06:04:50.917Z",
  "updated_time": "2016-12-06T06:04:50.917Z",
  "user": {
    "id": "303030303030303030303037",
    "full_name": "George W. Bush",
    "profile_picture": "http://cdn.jolie.de/bilder/george-w-bush-400x400-bild-11-1696851.jpg"
  }
  "count": 10
}
```

#### `comment`
- There's a new comment
- Data format:
```
{
  "id": "584658b3a65a110c6240fb52",
  "user_id": "303030303030303030303037",
  "media_id": "303030303030303030303036",
  "content": "zzz",
  "created_time": "2016-12-06T06:20:35.770Z",
  "updated_time": "2016-12-06T06:20:35.770Z",
  "user": {
    "id": "303030303030303030303037",
    "full_name": "George W. Bush",
    "profile_picture": "http://cdn.jolie.de/bilder/george-w-bush-400x400-bild-11-1696851.jpg"
  }
  "count": 7,
}
```

## Push notification

### Payload data format
```js
  // Just follow Apple documentation
  aps: {
    badge: 5,
    sound: 'default',
    alert: {
      title: 'Foo',
      body: 'Hello world!'
    }
  },
  // Define the scene should be shown when clicking to the notification
  target: {
    type: 'media'  // Enum: ['media', 'user']
    id: '584b5194f3a1a24e2d14b87a'
  }
```

## Coding convention
- Reference: https://github.com/felixge/node-style-guide
- At least, these rules must be followed strictly:
  - Use only 2 spaces to indent, swear an oath to NEVER mix with tabs
  - Trim all trailing whitespaces
  - Use single quotes for string, do not mix with double quotes
  - Avoid deep nesting of loops and if-statements (nested level should be smaller than 4)
"# DoAN" 
