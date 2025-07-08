const { api,apicookie, verifyJwt ,auth} = require("../helpers/common");
const errors = require("../helpers/errors");

const { jwtSecret ,BASE_URL,SERVICE_KEY} = require('../config/ApplicationSettings');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const {  validateAuth } = require("../validator/admin");
// const { sendEmailVerification } = require('../mail-templates/emailverify');






exports.signin = api(["email", "password"], async (req ,connection) => {
  
  await validateAuth(req);
  const { email, password } = req.body;



  // Fetch admin details from the database
  const admin = await connection.queryOne(
    "SELECT id,email ,password FROM admin WHERE email = $1 ",
    [email]
  );

  if (!admin) throw new errors.INVALID_USER();

  // Validate password
  const isPasswordValid = await bcrypt.compare(password, admin.password);
  if (!isPasswordValid) throw new errors.INVALID_EMAIL_PASS();






  // Generate tokens
  const accessToken =jwt.sign(
    { id: admin.id, email: admin.email ,SERVICE_KEY},
    jwtSecret,
    { expiresIn: "5h" }
  );



  return { flag: 200, accessToken };
});










