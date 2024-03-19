const router = require("express").Router();
const { checkUsernameExists, validateRoleName } = require('./auth-middleware');
const { JWT_SECRET } = require("../secrets"); // use this secret!
const Database = require('../users/users-model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')

router.post("/register", validateRoleName, async (req, res, next) => {
/**
 [POST] /api/auth/register { "username": "anna", "password": "1234", "role_name": "angel" }
    response: status 201,
    {
      "user"_id: 3,
      "username": "anna",
      "role_name": "angel"
    }
   */
  const user = req.body;

  // Password encryption
  const passwordEncrypted = bcrypt.hashSync(user.password, 12);

  // Response destructure 
  const { username } = user;
  console.log(req.role_name)
  const role_name = req.role_name;

  // User re-assembly
  const updatedUser = {
    username: username,
    password: passwordEncrypted,
    role_name: role_name,
  }

  // DB operation
  await Database.add(updatedUser)
  .then(([result]) => {
    res.status(201).json(result);
  })
  .catch(next)
});


router.post("/login", checkUsernameExists, async (req, res, next) => {
  /**
    [POST] /api/auth/login { "username": "sue", "password": "1234" }
    response: status 200,
    {
      "message": "sue is back!",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ETC.ETC"
    }
    The token must expire in one day, and must provide the following information
    in its payload:
    {
      "subject"  : 1       // the user_id of the authenticated user
      "username" : "bob"   // the username of the authenticated user
      "role_name": "admin" // the role of the authenticated user
    }
   */

  const username = req.body.username;
  
  // Database op
  await Database.findBy('username', username)
  .then((result) => {
    res.status(200).json(result)
  })
  .catch(next);
});

module.exports = router;
