const express = require("express");
const mustacheExpress = require("mustache-express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const logic = require("./logic");
const { Pool } = require("pg");

const app = express();
const port = 3000;
const authTokens = {};
const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "incode4",
    //password: "*************", //(PGPASSWORD)
    port: 5432,
});

app.set("views", `${__dirname}/../views`);
app.set("view engine", "mustache");
app.engine("mustache", mustacheExpress());

app.use(bodyParser.urlencoded({ extended: false }));

app.use(cookieParser());

app.use("/static", express.static("static"));

app.use(
  (req, res, next) => {
    const authToken = req.cookies["AuthToken"];
    req.user = authTokens[authToken];
    next();
  }
);

app.get("/", async(req, res) => {
    if (!req.user) {
        res.render("login", {message: "Please login to continue", messageClass: "alert-error"});
        //res.redirect("/login?message=Please login to continue&messageClass=alert-danger");

      return;
    }
    const allSchedules = (
      await pool.query(
        "SELECT user_id, day, start_at, end_at, firstname, lastname FROM schedules LEFT JOIN users ON (user_id=users.id) ORDER BY day;"
      )
    ).rows;

    allSchedules.map(el => el.day = logic.displayDayName(el.day));

    res.render("homepage",{schedules: allSchedules, firstname: req.user.firstname, lastname: req.user.lastname});
});

app.get("/register", (req, res) => {
  res.render("signup", {
      message: "To register, please enter your personal data.",
      messageClass: "alert-null"
  });
});

app.post("/register", async (req, res) => {
    const { firstname, lastname, email, password, confirmPassword } = req.body;
    
    const users = (await pool.query("SELECT * FROM users;")).rows;

  if (users.find((user) => user.email === email)) {
    res.render("signup", {
      message: "User already registered.",
      messageClass: "alert-error",
    });

    return;
  }

  if (password !== confirmPassword) {
    res.render("signup", {
      message: "Passwords does not match.",
      messageClass: "alert-error",
    });

    return;
  }

  const hashedPassword = logic.getHashedPassword(password);

  await pool.query(`INSERT INTO users (firstname, lastname, email, password) VALUES
                        ('${firstname}', '${lastname}', '${email}', '${hashedPassword}');`)
    res.render("login", {message: "Registration complete. Please login to continue", messageClass: "alert-success"});
    // res.redirect(
    //   "/login?message=Registration Complete. Please login to continue.&messageClass=alert-succes");
});


app.get("/login", (req, res) => {
    // const message = req.query.message;
    // const messageClass = req.query.messageClass;
    // if (!message) {
    //     res.render("login", {
    //       message: "To log in, please enter your email and password.",
    //       messageClass: "alert-success",
    //     });
    //     return;
    // }
    res.render("login", {
      message: "To log in, please enter your email and password.",
      messageClass: "alert-null",
    });
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const users = (await pool.query("SELECT * FROM users;")).rows;
    
  const hashedPassword = logic.getHashedPassword(password);

  const user = users.find((u) => {
    return u.email === email && u.password === hashedPassword;
  });

  if (!user) {
    res.render("login", {
      message: "Invalid username or password",
      messageClass: "alert-error",
    });

    return;
  }

  const authToken = logic.generateAuthToken();

  authTokens[authToken] = user;
  res.cookie("AuthToken", authToken);

  res.redirect("/");
});

app.get("/logout", (req, res) => {
    const authToken = req.cookies["AuthToken"];
    delete authTokens[authToken];
  res.clearCookie('AuthToken');
  res.render("login", { message: "You are logout", messageClass: "alert-error" });
    //res.redirect("/login?message=You are logout.&messageClass=alert-danger");
});

app.get("/new-schedule", async (req, res) => {

    if (!req.user) {
      res.render("login", {message: "Please login to continue", messageClass: "alert-error"});
      // res.redirect(
      //   "/login?message=Please login to continue&messageClass=alert-danger"
      // );

      return;
    }

    const userSchedules = (
      await pool.query(`SELECT * FROM schedules WHERE user_id=${req.user.id} ORDER BY day;`)
    ).rows;

    userSchedules.map((el) => (el.day = logic.displayDayName(el.day)));

    res.render("scheduleForm", {
        firstname: req.user.firstname,
        lastname: req.user.lastname,
        idNumber: req.user.id,
        schedules: userSchedules,
    })
})

app.post("/new-schedule", async (req, res) => {
    const { user_id, day, start_at, end_at } = req.body;

    await pool.query(`INSERT INTO
                         schedules (user_id, day, start_at, end_at) VALUES
                        ('${user_id}', '${day}', '${logic.timeFormat(start_at)}', '${logic.timeFormat(end_at)}');`);

    res.redirect("/");
});

app.get("/user:id", async (req, res) => {
    if (!req.user) {
      res.render("login", {
        message: "Please login to continue",
        messageClass: "alert-error",
      });
      // res.redirect(
      //   "/login?message=Please login to continue&messageClass=alert-danger"
      // );

      return;
    }
    const idNumber = req.params.id;
    const userSchedules = (await pool.query(`SELECT * FROM schedules WHERE user_id=${idNumber} ORDER BY day;`)).rows;
    const userFirstname = (await pool.query(`SELECT firstname FROM users WHERE id=${idNumber};`)).rows[0].firstname;
    const userLastname = (await pool.query(`SELECT lastname FROM users WHERE id=${idNumber};`)).rows[0].lastname;

    userSchedules.map(el => el.day = logic.displayDayName(el.day));
    res.render("userPage", {
        idNumber: idNumber,
        schedules: userSchedules,
        firstname: req.user.firstname,
        lastname: req.user.lastname,
        userFirstname: userFirstname,
        userLastname: userLastname,
    })
})


app.listen(port, () => {
  console.log(`server started at http://localhost:${port}`);
});
