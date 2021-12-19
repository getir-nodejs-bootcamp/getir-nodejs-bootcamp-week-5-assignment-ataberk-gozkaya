const hs = require("http-status");
const { list, insert, findOne, modify } = require("../services/Users");
const { passwordToHash, generateJWTAccessToken, generateJWTRefreshToken } = require("../scripts/utils/helper");
const uuid = require("uuid");
const eventEmitter = require("../scripts/utils/events/eventEmitter");

const index = (req, res) => {
  list()
    .then((userList) => {
      if (!userList) res.status(hs.INTERNAL_SERVER_ERROR).send({ error: "Sorun var.." });
      res.status(hs.OK).send(userList);
    })
    .catch((e) => res.status(hs.INTERNAL_SERVER_ERROR).send(e));
};

const create = (req, res) => {
  req.body.password = passwordToHash(req.body.password);
  insert(req.body)
    .then((createdUser) => {
      if (!createdUser) res.status(hs.INTERNAL_SERVER_ERROR).send({ error: "Sorun var.." });
      res.status(hs.OK).send(createdUser);
    })
    .catch((e) => res.status(hs.INTERNAL_SERVER_ERROR).send(e));
};

const login = (req, res) => {
  req.body.password = passwordToHash(req.body.password);
  findOne(req.body)
    .then((user) => {
      if (!user) return res.status(hs.NOT_FOUND).send({ message: "Böyle bir kullanıcı bulunmamaktadır." });
      user = {
        ...user.toObject(),
        tokens: {
          access_token: generateJWTAccessToken(user),
          refresh_token: generateJWTRefreshToken(user),
        },
      };
      delete user.password;
      res.status(hs.OK).send(user);
    })
    .catch((e) => res.status(hs.INTERNAL_SERVER_ERROR).send(e));
};

//! ÖDEV Video Üzerinden izleyip implemente edilecek.
// https://www.youtube.com/watch?v=pMi3PiITsMc

const resetPassword = (req, res) => {
  const new_password = uuid.v4()?.split("-")[0] || `usr-${new Date().getTime()}`;

  modify({ email: req.body.email }, { password: passwordToHash(new_password) })
    .then((updatedUser) => {
      if (!updatedUser) {
        res.status(hs.NOT_FOUND).send("E-mail not found");
      } else {
        console.log(updatedUser.email);
        eventEmitter.emit("send_email", {
          to: updatedUser.email,
          subject: "Reset Password(noreply)",
          html: `User password has been changed <br/>
          Please change your password after login <br/>
          Your new generated password <br/> please do not reply this mail -> ${new_password}`,
        });
        res.status(hs.OK).send(`New password is sent to given e-mail address`);
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(hs.INTERNAL_SERVER_ERROR).send("Something went wrong");
    });
};

module.exports = {
  index,
  create,
  login,
  resetPassword,
};
