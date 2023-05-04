// importing
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import companies from "./company.js";
import candidate from "./candidate.js";
import otps from "./otp.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { encrypt, decrypt } from "./cipher.js";

// app config
const app = express();
dotenv.config();
const port = process.env.PORT || 8080;

// middleware
app.use(cors());
app.use(express.json());

//db
const connection_url =
  "mongodb+srv://Abhishek_1191:NVhVzUrb7XF0fP2J@spi-companydatacluster.nl28t3b.mongodb.net/SPI-Auth?retryWrites=true&w=majority";
mongoose.connect(connection_url);

const db = mongoose.connection;

db.once("open", () => console.log("DB connected"));

//mail verification
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.EMAIL,
    pass: process.env.WORD,
    clientId: process.env.OAUTH_CLIENTID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,
    refreshToken: process.env.OAUTH_REFRESH_TOKEN,
  },
});
transporter.verify((err, success) => {
  err
    ? console.log(err)
    : console.log(`=== Server is ready to take messages: ${success} ===`);
});

const sendVerifyMail = async (email) => {
  try {
    const otp = Math.floor(Math.random() * 1000000);

    let strOTP = otp.toString();

    for (let i = strOTP.length; i < 6; i++) {
      strOTP = "0" + strOTP;
    }

    const encryptedOTP = encrypt(strOTP);
    const encryptedEmail = encrypt(email);

    await otps
      .create({ email: encryptedEmail, otp: encryptedOTP })
      .then((result) => {
        if (!result.otp) {
          throw new Error("not created");
        } else {
          const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: "noreply",
            text: `${strOTP} is your code for email verification.`,
          };

          transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
              console.log(err);
            } else {
              console.log("email sent: " + info.response);
            }
          });
        }
      });
  } catch (e) {
    console.log(e.message);
  }
};

//routes

//companies
app.post("/company/new", async (req, res) => {
  const { user, orgName, position, email, password } = req.body;
  const encryptedUser = encrypt(user);
  const encryptedEmail = encrypt(email);
  const encryptedPass = encrypt(password);
  const encryptedOrgName = encrypt(orgName);
  const encryptedPosition = encrypt(position);

  const encryptedData = {
    user: encryptedUser,
    orgName: encryptedOrgName,
    position: encryptedPosition,
    email: encryptedEmail,
    password: encryptedPass,
    verified: true,
  };
  try {
    const exist = await companies.exists({ email: encryptedEmail });
    if (!exist) {
      try {
        await companies.create(encryptedData).then((result) => {
          console.log(result);
          res.status(201).send();
        });
      } catch (e) {
        res.status(500).send();
        console.log(e);
      }
    } else {
      if (exist.verified) {
        res.status(403).send();
      } else {
        sendVerifyMail(req.body.email);
        res.status(201).send();
      }
    }
  } catch (e) {
    console.log(e);
    res.status(500).send();
  }
});

// app.put("/company/update", async (req, res) => {
//   const { verified, _id } = req.body;
//   try {
//     await companies
//       .updateOne({ _id: _id }, { verified: verified })
//       .then((result) => {
//         console.log(result);
//         res.status(202).send({ op: true });
//       });
//   } catch (e) {
//     res.status(500).send({ op: false });
//     console.log(e);
//   }
// });
app.post("/otp/generate", async (req, res) => {
  const { iemail } = req.body;
  const encryptedEmail = encrypt(iemail);
  try {
    const exist = await companies.exists({ email: encryptedEmail });
    if (exist) {
      throw e;
    } else {
      await sendVerifyMail(iemail);
      res.status(201).send();
    }
  } catch (e) {
    res.status(403).send();
  }
});

app.post("/company/login", async (req, res) => {
  const { iemail, ipass } = req.body;
  const encryptedEmail = encrypt(iemail);
  try {
    await companies.findOne({ email: encryptedEmail }).then((result) => {
      if (result) {
        console.log(result);
        const { _id, user, password, orgName, position } = result;
        const decryptedPass = decrypt(password);
        const decryptedUser = decrypt(user);
        const decryptedOrgName = decrypt(orgName);
        const decryptedPosition = decrypt(position);
        const out = {
          _id: _id,
          user: decryptedUser,
          email: iemail,
          orgName: decryptedOrgName,
          position: decryptedPosition,
          valid: true,
        };
        if (ipass === decryptedPass) {
          res.status(200).send(out);
        } else {
          res.status(200).send({ valid: false });
        }
      } else {
        res.status(404).send({ valid: false });
      }
    });
  } catch (e) {
    res.status(404).send({ valid: false });
    console.log(e);
  }
});

//user otp validation
app.post("/otp/check", async (req, res) => {
  const { email, iotp } = req.body;
  console.log(email);
  const encryptedEmail = encrypt(email);
  const encryptedOTP = encrypt(iotp);
  try {
    await otps.findOne({ email: encryptedEmail }).then((result) => {
      if (result.otp === encryptedOTP) {
        try {
          otps
            .deleteOne({ email: result.email })
            .then(() => console.log("otp deleted"));
        } catch (err) {
          console.log(err);
        }
        res.status(200).send({ valid: true });
      } else {
        res.status(200).send({ valid: false });
      }
    });
  } catch (e) {
    res.status(500).send();
    console.log(e);
  }
});

const endt = encrypt("657889");
console.log(endt);
console.log(decrypt(endt));

//candidates
app.post("/candidate/new", async (req, res) => {
  const { user, email, password } = req.body;
  const encryptedUser = encrypt(user);
  const encryptedEmail = encrypt(email);
  const encryptedPass = encrypt(password);
  const encryptedLinkedIn = encrypt(linkedin);

  const encryptedData = {
    user: encryptedUser,
    email: encryptedEmail,
    password: encryptedPass,
    linkedin: encryptedLinkedIn,
  };
  try {
    const exist = await candidate.exists({ email: encryptedEmail });
    if (!exist) {
      try {
        await candidate.create(encryptedData).then((result) => {
          console.log(result);
          res.status(201).send();
        });
      } catch (e) {
        res.status(500).send();
        console.log(e);
      }
    } else {
      res.status(403).send();
    }
  } catch (e) {
    console.log(e);
    res.status(500).send();
  }
});

// app.put("/candidate/update", async (req, res) => {
//   const { verified, _id } = req.body;
//   try {
//     await companies
//       .updateOne({ _id: _id }, { verified: verified })
//       .then((result) => {
//         console.log(result);
//         res.status(202).send({ op: true });
//       });
//   } catch (e) {
//     res.status(500).send({ op: false });
//     console.log(e);
//   }
// });

app.post("/candidate/login", async (req, res) => {
  const { iemail, ipass } = req.body;
  const encryptedEmail = encrypt(iemail);
  try {
    await candidate.findOne({ email: encryptedEmail }).then((result) => {
      console.log(result);
      const { pass } = result;
      const decryptedPass = decrypt(pass);
      if (ipass === decryptedPass) {
        res.status(200).send({ valid: true });
      } else {
        res.status(200).send({ valid: false });
      }
    });
  } catch (e) {
    res.status(404).send({ valid: false });
    console.log(e);
  }
});

// app.post("/otp/check", async (req, res) => {
//   const { email, iotp } = req.body;
//   const encryptedEmail = encrypt(email);
//   try {
//     await otps.findOne({ email: encryptedEmail }).then((result) => {
//       const decryptedOTP = decrypt(iotp);
//       if (result.otp === decryptedOTP) {
//         res.status(200).send({ valid: true });
//       } else {
//         res.status(200).send({ valid: false });
//       }
//     });
//   } catch (e) {
//     res.status(404).send({ valid: false });
//     console.log(e);
//   }
// });

app.listen(port, () => console.log(`listening on localhost:${port}`));
