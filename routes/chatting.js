const express = require('express');
const router = express.Router();
const db = require('../database');
const jwt = require("jsonwebtoken");

function isLoggedIn(req,res,next)
{
    const token = req.session.accessToken
    if (req.session.userId) {
        if(token) {
            jwt.verify(token, process.env.JWT_ACCESS_TOKEN, (err, data) => {
                if (err) {
                    console.log(err)
                } else {
                    console.log(`data: ${data} ; accesstoken ${token}`)
                    next();
                }
            })
        } 
    }
    else res.redirect('/loginform');
}

router.get("/chat", isLoggedIn, (req, res) => {
    console.log(req.session.userId);
    const query = `SELECT id, email,last_name FROM booker WHERE id = ${req.session.userId};`;
    console.log("Executing DB Query:", query); 
    db.query(query, (err, result) => {
      if (err) {
        console.error("Error executing DB Query:", err); 
        throw err; 
      } else {
        console.log(result);
        res.render("chat.ejs", {
          user: {
            user_id:result[0].id,
            email: result[0].last_name,
          },
        });
      }
    });
  });
  
  router.post("/chat", isLoggedIn, async (req, res) => {
    res.redirect("/chat");
  });


module.exports = router;
