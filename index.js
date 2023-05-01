const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
let mongoose = require('mongoose');
let bodyParser = require('body-parser');

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

mongoose.connect(process.env.MONGO_URI);

const userSchema = new mongoose.Schema({
  username: String,
}, {
  versionKey: false
});
const User = new mongoose.model('User', userSchema);

const exerciseSchema = new mongoose.Schema({
  user_id: String,
  username: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
}, {
  versionKey: false
});

const Exercise = new mongoose.model('Exercise', exerciseSchema);


app.route('/api/users').get((_, res) => {
  User.find({}).then((users) => res.json(users));
}).post(async (req, res) => {
  let username = req.body.username;
  User({ username }).save().then((user) => {
    // console.log(user);
    res.json(user)
  });
});

// let user = User({ username: 'sagargoel' });
// user.save().then(data => {
//   console.log(data._id.toString())
//   console.log(data);
// });

app.post('/api/users/:_id/exercises', async (req, res) => {
  let id = req.params._id;
  let username = await getUserNameByUserId(id);
  Exercise({
    user_id: id,
    username: username,
    description: req.body.description,
    duration: req.body.duration,
    date: req.body.date ? req.body.date : new Date(),
  }).save().then(exercise => {
    result = {
      _id: exercise.user_id,
      username: exercise.username,
      date: exercise.date.toDateString(),
      duration: exercise.duration,
      description: exercise.description,
    };
    res.json(result);
  });
});


app.get('/api/users/:_id/logs', async (req, res) => {
  let id = req.params._id;
  let username = await getUserNameByUserId(id);
  let { from, to, limit } = req.query;
  console.log(from, to, limit);
  let exercises = await Exercise.find({
    user_id: id,
    date: {
      $gte: from ? new Date(from) : new Date('1970-01-01'),
      $lte: to ? new Date(to) : new Date(),
    }
  }).limit(limit ? limit : Infinity);
  // console.log(exercises);
  let responseObject = {
    username,
    _id: id,
    count: exercises.length,
    log: exercises.map((exercise) => Object({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
    })),
  };
  res.json(responseObject);
});
// User.findOne({_id:'644e89ecd5e6a8f253eb2b8b'}).then((data=>console.log(data));


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})


async function getUserNameByUserId(id) {
  let username;
  await User.findOne({ _id: id }).then((user) => {
    username = user.username;
  })
  return username;
}