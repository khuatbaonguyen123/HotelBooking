const express = require('express');
const router = express.Router();
const db = require('../database');
const Message = require('../dbmongo');



function dateFormatting(dateType) {

    let date = dateType.getDate();
    let month = dateType.getMonth() + 1;
    let year = dateType.getFullYear();
    const dateFormat = [(date > 9 ? '' : '0') + date, (month > 9 ? '' : '0') + month, year].join('/');
    return dateFormat;
}
function dateFormatting2(dateType) {
    let date = dateType.getDate();
    let month = dateType.getMonth() + 1;
    let year = dateType.getFullYear();
    const dateFormat = [year, (month > 9 ? '' : '0') + month, (date > 9 ? '' : '0') + date].join('-');
    return dateFormat;
}

router.post('/admin/login', (req, res) => {
    const { email, password } = req.body;
    if (!email | !password)
        res.status(404).json({ message: 'Please enter all fields' });
    else {
        db.query(`select * from account where email='${email}' and type_of_account = 'admin'`, (err, results) => {
            if (err) throw err;
            if (results.length > 0) {
                const admin = results[0];
                if (admin.password === password) {
                    session = req.session;
                    session.adminID = admin.id;
                    res.redirect('/admin/dashboard');
                } else {
                    req.flash('error', 'Password is not correct');
                    res.redirect('/admin/login');
                }
            }
            else {
                req.flash('error', 'Email is not registered');
                res.redirect('/admin/login');
            }
        })
    }
})

function isLoggedInAdmin(req, res, next) {
    if (req.session.adminID)
        next();
    else res.redirect('/admin/login');
}

function isLoggedOutAdmin(req, res, next) {
    if (req.session.adminID)
        res.redirect('/admin/dashboard');
    else next();
}

router.get('/admin/login', isLoggedOutAdmin, (req, res) => {
    res.render('adminLogin.ejs', { message: req.flash('error') });
})//if already logged in, redirect to /adminDashboard

router.get('/admin/logout', isLoggedInAdmin, (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login')
})
//DASHBOARD
router.get('/admin/dashboard', isLoggedInAdmin, async (req, res) => {
    let response1;
    let userReservation = [];
    try {
        response1 = await new Promise((resolve, reject) => {
            db.query(`select * from vDashboard`, (err, results) => {
                if (err) reject(new Error(err.message));
                resolve(results);
            });
        });
    } catch (error) {
        console.log(error);
    }

    let i = 0; //number of reservations
    response1.forEach((element, index, arr) => {
        if (index === 0 || element.id != arr[index - 1].id) {
            userReservation.push({
                id: element.id,
                booker_id: element.booker_id,
                name: element.name,
                phone: element.phone,
                date_in: dateFormatting(element.date_in),
                date_out: dateFormatting(element.date_out),
                description: [element.number],
            });
            i++;
        }
        else {
            userReservation[i - 1].description.push(element.number);
        }
    });
    res.render('adminDashboard.ejs', { userReservation });
}) //must login to see

router.post('/admin/accept/:id', isLoggedInAdmin, (req, res) => {
    const { id } = req.params;
    db.query(`update reservation set status = 'accept' where id = '${id}';`, (err, result) => {
        if (err) throw err;
        else {
            res.redirect('/admin/dashboard')
        }
    })

})
router.post('/admin/decline/:id', isLoggedInAdmin, (req, res) => {
    const { id } = req.params;
    db.query(`update reservation set status = 'decline' where id = '${id}';`, (err, result) => {
        if (err) throw err;
        else {
            res.redirect('/admin/dashboard')
        }
    })

})

//Reservation

router.get('/admin/reservation', isLoggedInAdmin, (req, res) => {
    let userReservation;
    res.render('adminReservation.ejs', { userReservation, message: req.flash('error') })
})
//chat
router.get('/admin/chat', isLoggedInAdmin, (req, res) => {
    let userReservation;
    let chatHistory;
    res.render('adminChat.ejs', { userReservation,chatHistory, message: req.flash('error') })
})

router.post('/admin/chat', isLoggedInAdmin, async (req, res) => {
    const { search } = req.body;
    let userReservation;
    let record;
    let chatHistory;

    if (!isNaN(search) && search) {
        try {
            record = await new Promise((resolve, reject) => {
                db.query(`select * from vReservation where id = ${search};`, (err, results) => {
                    if (err) reject(new Error(err.message));
                    resolve(results);
                });
            });
        } catch (error) {
            console.log(error);
        }
    
        if (record.length > 0) {
            userReservation = {
                id: record[0].id,
                booker_id: record[0].booker_id,
                name: record[0].name,
                phone: record[0].phone,
                
            };

            chatHistory = await Message.find({ idUser: search });
        } else {
            req.flash('error', 'ID not found');
        }
    }

    res.render('adminChat.ejs', { userReservation,chatHistory, message: req.flash('error') });
});

router.post('/messages', isLoggedInAdmin, async (req, res) => {
    const { idUser, content } = req.body; 

    const newMessage = new Message({
        idUser: idUser, 
        content: content, 
    });

    try {
        await newMessage.save();
    } catch (error) {
        console.error('Error saving message:', error);
        req.flash('error', 'Error saving message');
    }
    res.redirect('/admin/chat');
});

//chat
router.post('/admin/search', isLoggedInAdmin, async (req, res) => {
    const { search } = req.body;
    let record;
    let userReservation;
    if (!isNaN(search) && search) {
        try {
            record = await new Promise((resolve, reject) => {
                db.query(`select * from vReservation where id = ${search};`, (err, results) => {
                    if (err) reject(new Error(err.message));
                    resolve(results);
                });
            });
        } catch (error) {
            console.log(error);
        }
    
        if (record.length > 0) {
            record.forEach((element, index, arr) => {
                if (index === 0 || element.id != arr[index - 1].id) {
                    userReservation = {
                        id: element.id,
                        booker_id: element.booker_id,
                        name: element.name,
                        phone: element.phone,
                        date_in: dateFormatting(element.date_in),
                        date_out: dateFormatting(element.date_out),
                        description: [element.number],
                        status: element.status,
                        price: element.total_price,
                        payment_date: dateFormatting(element.payment_date)
                    };
                }
                else {
                    userReservation.description.push(element.number);
                }
            });
        } else {
            req.flash('error', 'ID not found');
        }
    }
    res.render('adminReservation.ejs', { userReservation, message: req.flash('error') });
})


router.get('/admin/checkin/:id', isLoggedInAdmin, async (req, res) => {
    const { id } = req.params;
    db.query(`select * from reservation where id = '${id}'`, (err, result) => {
        if (err) throw err;
        else {
            if (result[0].status === 'accept') {
                db.query(`update reservation set status = 'checkin' where id = '${id}';`, (err, result) => {
                    if (err) throw err;
                    else {
                        res.redirect('/admin/reservation');
                    }
                })
            } else {
                res.redirect('/admin/reservation');
            }
        }
    })

})

router.get('/admin/checkout/:id', isLoggedInAdmin, async (req, res) => {
    const { id } = req.params;

    db.query(`select * from reservation where id = '${id}'`, (err, result) => {
        if (err) throw err;
        else {
            if (result[0].status === 'checkin') {
                db.query(`update reservation set status = 'checkout' where id = '${id}';`, (err, result) => {
                    if (err) throw err;
                    else {
                        db.query('update payment set payment_date = curdate();', (err, result) => {
                            if (err) throw err;
                            else {
                                res.redirect('/admin/reservation')
                            }
                        })

                    }
                })
            } else {
                res.redirect('/admin/reservation');
            }
        }
    })


})



router.get('/admin/decline/:id', isLoggedInAdmin, (req, res) => {
    const { id } = req.params;
    db.query(`select * from reservation where id = '${id}'`, (err, result) => {
        if (err) throw err;
        else {
            if (result[0].status === 'accept') {
                db.query(`update reservation set status = 'decline' where id = '${id}';`, (err, result) => {
                    if (err) throw err;
                    else {
                        res.redirect('/admin/reservation');
                    }
                })
            } else {
                res.redirect('/admin/reservation');
            }
        }
    })

})

router.get('/admin/rooms', isLoggedInAdmin, (req, res) => {
    db.query('select r.id, r.number, t.name as type_name from room r join type t on r.type_id = t.id ', (err, room) => {
        if (err) throw err;
        else {
            //console.log(room);
            res.render('adminRoom.ejs', {room ,message: req.flash('error') });
        }
    })
})

router.post('/admin/deleteRoom/:id', isLoggedInAdmin, (req, res) => {
    const {id} = req.params;
    db.query(`select r.status from reservation r join room_reserved rv on rv.reservation_id = r.id where rv.room_id = '${id}'`, (error, result) => {
        console.log(result[0].status);
        let status = result[0].status;
        if (error) throw error;
        else if(status == "accept" || status == "checkin" || status == "pending") {
            res.redirect('/admin/rooms');
        }
        else {
            console.log(result.status);
            db.query(`delete from room where id = '${id}'`, (err, room) => {
                if (err) throw err;
                else {
                    console.log(room);
                    res.redirect('/admin/rooms');
                }
            })
        }
    })
})

router.post('/admin/editRoom', isLoggedInAdmin, (req, res) => {
    const {id}=req.query;
    console.log(id);
    db.query(`select *
            from facilities f
            where f.room_id=${id}`,(err,data)=>{
            if (err){
                throw err;
            }
            console.log(data);
            if (data){    //user exists in database
                res.render('adminEditRoom.ejs',{data, message: req.flash('error')});
            }
            else res.redirect('/admin/rooms');
        }
    )
})

async function addRoom(number, type_id) {
    try {
        await new Promise((resolve, reject) => {
            db.query(`insert into room (number,type_id)
            values
            (?,?)`, [number,type_id], (err, results) => {
                if (err) reject(new Error(err.message));
                resolve();
            });
        });
    } catch (error) {
        console.log(error);
    }
}

router.get('/admin/addRoom', isLoggedInAdmin, (req, res) => {
    //res.status(404).json({ message: 'Please enter all fields' });
    let message = null;
    res.render('adminAddRoom.ejs', message);
})
module.exports = router;