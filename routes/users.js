const express = require('express');
const router = express.Router();
const db=require('../database');
const bcrypt=require('bcrypt');
const puppeteer = require('puppeteer');
const cli = require('../connect_redis.js');

function isLoggedOut(req,res,next){
    if (req.session.userId)
        res.redirect('/booking');
    else next();
}

function isLoggedIn(req,res,next)
{
    if (req.session.userId)
        next();
    else res.redirect('/loginform');
}

function containsSpecialCharacters(str) {
    const regex = /\./;;
    return regex.test(str);
}

async function getCheckLink(Input) {
    if (containsSpecialCharacters(Input)) {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto('https://safeweb.norton.com/');
        await page.waitForSelector("input[type='url']", { timeout: 2000 });
        const input = await page.$("input[type='url']");
        await input.type(Input);
        await input.press('Enter');
        try {
            await page.waitForNavigation()
            const ratingElement = await page.$("p.rating-label.xl-body-text-bold");
            const ratingText = await page.evaluate(ratingElement => ratingElement.textContent, ratingElement);
            await browser.close();
            return ratingText;
            
        }
        catch {
            await browser.close();
            return "Not Link";
        }
    }
    else {
        return "Not Link";
    }
}

router.post('/signup', async (req, res) => {
    const { fname, lname, email, password, phone, dob } = req.body;
    let hashedPassword = await bcrypt.hash(password, 10);
    let checkfName = await getCheckLink(fname);
    console.log("fname:" + checkfName);
    if (checkfName === "Not Link" || checkfName === "Safe") {
        let checklName = await getCheckLink(lname);
        console.log("lname:" + checklName);
        if (checklName === "Not Link" || checklName === "Safe") {
            let checkPassword = await getCheckLink(password);
            console.log(checkPassword);
            if ((checkPassword === "Not Link" || checkPassword === "Safe")) {
                db.getConnection((err, connection) => {
                    if (err) {
                        throw err;
                    } else {
                        connection.beginTransaction((err) => {
                            if (err) {
                                connection.release();
                                throw err;
                            }
                            connection.query(`SELECT * FROM booker WHERE email='${email}'`, (err, results) => {
                                if (err) {
                                    connection.rollback(() => {
                                        connection.release();
                                        throw err;
                                    });
                                }
                                if (results.length > 0) {
                                    req.flash('error', 'Email already registered');
                                    res.redirect('/signupform');
                                    connection.rollback(() => {
                                        connection.release();
                                    });
                                } else {
                                    connection.query(`INSERT INTO booker( email, password, first_name, last_name, birth_date, phone) VALUES ('${email}', '${hashedPassword}', '${fname}','${lname}','${dob}','${phone}')`, (err) => {
                                        if (err) {
                                            connection.rollback(() => {
                                                connection.release();
                                                throw err;
                                            });
                                        }
                                        connection.commit((err) => {
                                            if (err) {
                                                connection.rollback(() => {
                                                    connection.release();
                                                    throw err;
                                                });
                                            }
                                            connection.release();
                                            res.redirect('/init_redis');
                                        });
                                    });
                                }
                            });
                        });
                    }
                });
            } else {
                return res.status(400).json({ error: 'Password not valid.' });
            }
        } else {
            return res.status(400).json({ error: 'last name not valid.' });
        }
    } else {
        return res.status(400).json({ error: 'First name not valid.' });
    }
});



router.get('/init_redis', (req,res) =>{
    db.query(`SELECT count(*) as cnt FROM bookingapp.booker;`, (err, result) => {
        cli.zadd(`myzset${result[0].cnt + 1}`, 0, '1', 0, '2', 0, '3', 0, '4', 0, '5', 0, '6', (err, reply) => {
            if (err) {
            console.error('Error incrementing score:', err);
            }
            console.log(`myzset${result[0].cnt + 1}`);
        });
    });
    res.redirect('/loginform');
});

router.post('/signin', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(404).json({ message: 'Please enter all fields' });
        return; 
    }
    let checkPassword = await getCheckLink(password);
    console.log(checkPassword);
    if ((checkPassword === "Not Link" || checkPassword === "Safe")) {
        db.query('SELECT * FROM booker WHERE email=?', [email], (err, results) => {
            if (err) throw err;
            if (results.length > 0) {
                const user = results[0];
                bcrypt.compare(password, user.password, (err, isMatch) => {
                    if (err) throw err;
                    if (isMatch) {
                        req.session.userId = user.id;
                        res.redirect('/index');
                    } else {
                        req.flash('error', 'Password is not correct');
                        res.redirect('/loginform');
                    }
                });
            } else {
                req.flash('error', 'Email is not registered');
                res.redirect('/loginform');
            }
        });
    } else {
        return res.status(400).json({ error: 'Password not valid.' });
    }
});


router.get('/profile', isLoggedIn, (req, res) => {
    db.query('SELECT * FROM booker WHERE id=?', [req.session.userId], (err, results) => {
        if (err) throw err;
        const userData = results[0];
        db.query(`SELECT b.reservation_id, date_in, date_out, number, a.status, type_id
                  FROM reservation a 
                  JOIN room_reserved b ON a.id = b.reservation_id 
                  JOIN room c ON b.room_id = c.id 
                  JOIN payment d ON a.id = d.reservation_id
                  WHERE booker_id = ?
                  ORDER BY reservation_id`, [req.session.userId], (err, results) => {
            if (err) throw err;
            const userReservation = [];
            let i = 0;
            results.forEach((element, index, arr) => {
                if (index === 0 || element.type_id != arr[index - 1].type_id) {
                    userReservation.push({
                        cnt: i + 1,
                        reservation_id: element.reservation_id,
                        typeRoom: element.type_id,
                        date_in: element.date_in,
                        date_out: element.date_out,
                        roomList: [element.number],
                        status: element.status
                    });
                    i++;
                } else {
                    userReservation[i - 1].roomList.push(element.number);
                }
            });
            res.render('profile.ejs', { userData, userReservation });
        });
    });
});


router.get('/loginform', isLoggedOut, (req, res) => {
    res.render('loginform.ejs',{message:req.flash('error')});
})//if already logged in, redirect to /booking

router.get('/editProfile', isLoggedIn, (req, res) => {
    const id=req.query.id;
    if (id)  //param id exists
    {
        if (Number(id)===req.session.userId)  //user can only edit their own profile 
        {
            db.query(`select * 
                    from  booker
                    where booker.id=?`, [id], (err,results)=>{
                        if (err) throw err;
                        const userData=results[0];
                        if (userData){    //user exists in database
                            res.render('editProfile.ejs',{userData, message: req.flash('error')});
                        }
                        else res.redirect('/index')  

        })
        }
        else res.redirect('/index')   //not allow editing others' profiles
        
    }
    else res.redirect('/index'); //param id not exists
   
    
})

router.post('/editProfile', isLoggedIn, async (req, res) => {
    const { id, fname, lname, email, phone, dob } = req.body;
    
    let checkfName = await getCheckLink(fname);
    console.log("fname:" + checkfName);
    if (checkfName === "Not Link" || checkfName === "Safe") {
        let checklName = await getCheckLink(lname);
        console.log("lname:" + checklName);
        if (checklName === "Not Link" || checklName === "Safe") {
            db.query('SELECT * FROM booker WHERE email=? AND id<>?', [email, id], (err, results) => {
                if (err) throw err;
                if (results.length > 0) {
                    req.flash('error', 'Email already registered');
                    res.redirect(`/editProfile?id=${id}`);
                } else {
                    db.query(`UPDATE booker
                              SET first_name=?, last_name=?, email=?, phone=?, birth_date=?
                              WHERE id=?`, [fname, lname, email, phone, dob, id], (err) => {
                        if (err) throw err;
                        res.redirect('/profile');
                    });
                }
            });
        }
    }
});


router.get('/editPassword', isLoggedIn, (req, res) => {
    const id=req.query.id;
    if (id)  //param id exists
    {
        if (Number(id)===req.session.userId)  //user can only edit their own profile 
        {
            res.render('editPassword.ejs',{id,message: req.flash('error')});
        }
        else res.redirect('/index')   //not allow editing others' profiles
        
    }
    else res.redirect('/index'); //param id not exists
    
})

router.post('/editPassword', isLoggedIn, async (req, res) => {
    const { id, oldPassword, newPassword, newPassword2 } = req.body;
    let checkOldPassword = await getCheckLink(oldPassword);
    if (checkOldPassword === "Not Link" || checkOldPassword === "Safe") {
        let checkNewPassword = await getCheckLink(newPassword);
        if (checkNewPassword === "Not Link" || checkNewPassword === "Safe") {
            db.query('SELECT password FROM booker WHERE id=?', [id], (err, results) => {
                if (err) throw err;
                if (results.length > 0) {
                    const { password } = results[0];
                    bcrypt.compare(oldPassword, password, async (err, isMatch) => {
                        if (err) throw err;
                        if (isMatch) {
                            if (newPassword === newPassword2) {
                                let hashedPassword = await bcrypt.hash(newPassword, 10);
                                db.query('UPDATE booker SET password=? WHERE id=?', [hashedPassword, id], (err) => {
                                    if (err) throw err;
                                    res.redirect('/profile');
                                });
                            }
                        } else {
                            req.flash('error', 'You entered the wrong password');
                            res.redirect(`/editPassword?id=${id}`);
                        }
                    });
                } else {
                    res.redirect('/index');
                }
            });
        }
    }
});



router.get('/logout', isLoggedIn, (req,res)=>{
    req.session.destroy();
    res.redirect('/loginform')
})

router.get('/signupform', (req, res) => {
    res.render('signupform.ejs',{message:req.flash('error')});
})



module.exports = router;