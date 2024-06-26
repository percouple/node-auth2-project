const router = require("express").Router();
const { checkUsernameExists, validateRoleName } = require("./auth-middleware");
const { JWT_SECRET } = require("../secrets/index"); // use this secret!
const Database = require("../users/users-model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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
  console.log(req.role_name);
  const role_name = req.role_name;

  // User re-assembly
  const updatedUser = {
    username: username,
    password: passwordEncrypted,
    role_name: role_name,
  };

  // DB operation
  await Database.add(updatedUser)
    .then(([result]) => {
      res.status(201).json(result);
    })
    .catch(next);
});

router.post("/login", checkUsernameExists, async (req, res, next) => {
  const generateToken = (user) => {
    const payload = {
      subject: user.subject, // sub in payload is what the token is about
      username: user.username,
      role_name: user.role_name,
      iat: 0,
      exp: 1,
    };

    const options = {
      // expiresIn: "1d", // show other available options in the library's documentation
    };

    // extract the secret away so it can be required and used where needed
    return jwt.sign(payload, JWT_SECRET, options); // this method is synchronous
  };
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

  const user = req.body;

  // Database op
  await Database.findBy("username", user.username)
    .then((result) => {
      if (user && bcrypt.compareSync(user.password, result[0].password)) {
        const [{ username, role_name, user_id }] = result;
        const tokenData = {
          username: username,
          role_name: role_name,
          subject: user_id
        }
        const token = generateToken(tokenData);
        res
          .status(200)
          .json({ message: `${result[0].username} is back!`, token: token });
      } else {
        return next({ status: 401, message: "Invalid credentials" })
      }
    })
    .catch(next);

  
});

module.exports = router;
