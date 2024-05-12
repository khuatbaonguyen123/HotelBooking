const express = require("express");
const router = express.Router();
const db = require("../database");
const clientES = require("../SearchEngine");
// const Message = require("../dbmongo");

function dateFormatting(dateType) {
  let date = dateType.getDate();
  let month = dateType.getMonth() + 1;
  let year = dateType.getFullYear();
  const dateFormat = [
    year,
    (month > 9 ? "" : "0") + month,
    (date > 9 ? "" : "0") + date
  ].join("/");
  return dateFormat;
}
function dateFormatting2(dateType) {
  let date = dateType.getDate();
  let month = dateType.getMonth() + 1;
  let year = dateType.getFullYear();
  const dateFormat = [
    year,
    (month > 9 ? "" : "0") + month,
    (date > 9 ? "" : "0") + date,
  ].join("-");
  return dateFormat;
}

router.post("/admin/login", (req, res) => {
  const { email, password } = req.body;
  if (!email | !password)
    res.status(404).json({ message: "Please enter all fields" });
  else {
    db.query(
      `select * from admin where email='${email}'`,
      (err, results) => {
        if (err) throw err;
        if (results.length > 0) {
          const admin = results[0];
          if (admin.password === password) {
            session = req.session;
            session.adminID = admin.id;
            res.redirect("/admin/dashboard");
          } else {
            req.flash("error", "Password is not correct");
            res.redirect("/admin/login");
          }
        } else {
          req.flash("error", "Email is not registered");
          res.redirect("/admin/login");
        }
      }
    );
  }
});

function isLoggedInAdmin(req, res, next) {
  if (req.session.adminID) next();
  else res.redirect("/admin/login");
}

function isLoggedOutAdmin(req, res, next) {
  if (req.session.adminID) res.redirect("/admin/dashboard");
  else next();
}

router.get("/admin/login", isLoggedOutAdmin, (req, res) => {
  res.render("adminLogin.ejs", { message: req.flash("error") });
}); //if already logged in, redirect to /adminDashboard

router.get("/admin/logout", isLoggedInAdmin, (req, res) => {
  req.session.destroy();
  res.redirect("/admin/login");
});
//DASHBOARD
// router.get("/admin/dashboard", isLoggedInAdmin, async (req, res) => {
//   let response1;
//   let userReservation = [];
//   try {
//     response1 = await new Promise((resolve, reject) => {
//       db.query(`select * from vDashboard`, (err, results) => {
//         if (err) reject(new Error(err.message));
//         resolve(results);
//       });
//     });
//   } catch (error) {
//     console.log(error);
//   }

//   let i = 0; //number of reservations
//   response1.forEach((element, index, arr) => {
//     if (index === 0 || element.id != arr[index - 1].id) {
//       userReservation.push({
//         id: element.id,
//         name: element.name,
//         phone: element.phone,
//         status: element.status,
//         date_in: dateFormatting(element.date_in),
//         date_out: dateFormatting(element.date_out),
//         description: [element.number],
//       });
//       i++;
//     } else {
//       userReservation[i - 1].description.push(element.number);
//     }
//   });
//   res.render("adminDashboard.ejs", { userReservation });
// }); //must login to see

router.get('/admin/dashboard', isLoggedInAdmin, async (req, res) => {
  try {
      const page = parseInt(req.query.page) || 1; // Trang hiện tại, mặc định là trang 1
      const limit = 10; // Số lượng mục trên mỗi trang
      const offset = (page - 1) * limit; // Vị trí bắt đầu lấy dữ liệu từ CSDL

      let response1;
      try {
          // Lấy dữ liệu từ CSDL với giới hạn số lượng mục và vị trí bắt đầu
          response1 = await new Promise((resolve, reject) => {
              db.query(`SELECT * FROM vDashboard LIMIT ${limit} OFFSET ${offset}`, (err, results) => {
                  if (err) reject(new Error(err.message));
                  resolve(results);
              });
          });
      } catch (error) {
          console.log(error);
          throw new Error('Error fetching data from database');
      }

      let userReservation = [];
      // Xử lý dữ liệu nhận được từ CSDL
      response1.forEach((element, index, arr) => {
          const booking = {
              id: element.id,
              booker_id: element.booker_id,
              name: element.name,
              phone: element.phone,
              date_in: dateFormatting(element.date_in),
              date_out: dateFormatting(element.date_out),
              description: [element.number], // Khởi tạo mảng chứa description
          };

          // Gom nhóm description theo cùng một booking id
          if (index > 0 && element.id === arr[index - 1].id) {
              userReservation[userReservation.length - 1].description.push(element.number);
          } else {
              userReservation.push(booking);
          }
      });

      // Đếm tổng số lượng booking để tính số trang
      const totalCount = await new Promise((resolve, reject) => {
          db.query('SELECT COUNT(DISTINCT id) AS totalCount FROM vDashboard', (err, results) => {
              if (err) reject(new Error(err.message));
              resolve(results[0].totalCount);
          });
      });

      const totalPages = Math.ceil(totalCount / limit); // Tính tổng số trang

      // Truyền dữ liệu và thông tin phân trang vào template
      res.render('adminDashboard.ejs', {
          userReservation,
          totalPages,
          currentPage: page
      });
  } catch (error) {
      console.error('Error processing dashboard:', error);
      res.status(500).send('Internal Server Error');
  }
});

router.post("/admin/accept/:id", isLoggedInAdmin, (req, res) => {
  const { id } = req.params;
  db.query(
    `update reservation set status = 'accept' where id = '${id}';`,
    (err, result) => {
      if (err) throw err;
      else {
        res.redirect("/admin/dashboard");
      }
    }
  );
});
router.post("/admin/decline/:id", isLoggedInAdmin, (req, res) => {
  const { id } = req.params;
  db.query(
    `update reservation set status = 'decline' where id = '${id}';`,
    (err, result) => {
      if (err) throw err;
      else {
        res.redirect("/admin/dashboard");
      }
    }
  );
});

//Reservation

router.get("/admin/reservation", isLoggedInAdmin, (req, res) => {
  let userReservation;
  let keyword;
  let currentPage;
  res.render("adminReservation.ejs", {
    userReservation,
    keyword,
    currentPage,
    message: req.flash("error"),
  });
});
//chat
router.get("/admin/chat", isLoggedInAdmin, (req, res) => {
  const adminQuery = `SELECT id, email FROM admin WHERE id = ${req.session.adminID};`;
  db.query(adminQuery, (err, adminResult) => {
    if (err) {
      console.error("Error fetching admin details:", err);
      throw err;
    } else {
      const adminData = {
        user_id: adminResult[0].id, // Add user_id here
        email: adminResult[0].email,
      };
      const userIdsQuery = "SELECT id,last_name FROM booker";
      db.query(userIdsQuery, (err, userResults) => {
        if (err) {
          console.error("Error fetching user IDs:", err);
          throw err;
        } else {
          const users = userResults.map(user => ({
            id: user.id,
            last_name: user.last_name
          }));

          res.render("adminChat.ejs", {
            user: adminData,
            users: users,
          });
        }
      });
    }
  });
});


router.get("/admin/search", isLoggedInAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Trang hiện tại, mặc định là trang 1
    const limit = 10; // Số lượng mục trên mỗi trang
    const offset = (page - 1) * limit; // Vị trí bắt đầu lấy dữ liệu từ CSDL
    let { searchby, keyword } = req.query;
    console.log(keyword);
    console.log(req.params, req.query, req.body);
    console.log(`"${keyword}"`);
    const data = await clientES.search({
      index: 'bookingapp',
      query: {
        bool: {
          should: [
            {match: { name: `"${keyword}"` }},
            {match_phrase: { date_in: `"${keyword}"` }},
            {match_phrase: { date_out: `"${keyword}"` }},
            {match_phrase: { status: `"${keyword}"` }},
            {match_phrase: { payment_date: `"${keyword}"` }}
          ]
        }
      },
      size: limit,
      from: offset
      //_source: ["account_number", "balance"]
    })
    let userReservation = [];
    for(let i = 0; i < data['hits']['hits'].length; i++) {
      console.log(data['hits']['hits'][i]['_source']);
      userReservation.push(data['hits']['hits'][i]['_source']);
    }
    //let userReservation = data['hits']['hits'][0]['_source'];
    console.log(userReservation);
    //res.json(data['hits']['hits'][0]['_source']);
  // Đếm tổng số lượng booking để tính số trang
    const total = await clientES.count({
      index: 'bookingapp',
      query: {
        bool: {
          should: [
            {match: { name: `"${keyword}"` }},
            {match_phrase: { date_in: `"${keyword}"` }},
            {match_phrase: { date_out: `"${keyword}"` }},
            {match_phrase: { status: `"${keyword}"` }},
            {match_phrase: { payment_date: `"${keyword}"` }}
          ]
        }
      }
      //_source: ["account_number", "balance"]
    })
    const totalCount = total["count"];
    const totalPages = Math.ceil(totalCount / limit); // Tính tổng số trang
    // Truyền dữ liệu và thông tin phân trang vào template
    console.log(keyword, totalPages, page);
      res.render('adminReservation.ejs', {
          userReservation,
          searchby,
          keyword,
          totalPages,
          currentPage: page,
          message: req.flash("error")
      });
    } catch (error) {
        console.error('Error processing dashboard:', error);
        res.status(500).send('Internal Server Error');
    }
});
// router.post("/admin/search", isLoggedInAdmin, async (req, res) => {
//   const { search } = req.body;
//   let record;
//   let userReservation;
//   if (!isNaN(search) && search) {
//     try {
//       record = await new Promise((resolve, reject) => {
//         db.query(
//           `select * from vReservation where id = ${search};`,
//           (err, results) => {
//             if (err) reject(new Error(err.message));
//             resolve(results);
//           }
//         );
//       });
//     } catch (error) {
//       console.log(error);
//     }

//     if (record.length > 0) {
//       record.forEach((element, index, arr) => {
//         if (index === 0 || element.id != arr[index - 1].id) {
//           userReservation = {
//             id: element.id,
//             booker_id: element.booker_id,
//             name: element.name,
//             phone: element.phone,
//             date_in: dateFormatting(element.date_in),
//             date_out: dateFormatting(element.date_out),
//             description: [element.number],
//             status: element.status,
//             price: element.total_price,
//             payment_date: dateFormatting(element.payment_date),
//           };
//         } else {
//           userReservation.description.push(element.number);
//         }
//       });
//     } else {
//       req.flash("error", "ID not found");
//     }
//   }
//   res.render("adminReservation.ejs", {
//     userReservation,
//     message: req.flash("error"),
//   });
// });

router.post("/admin/checkin/:id", isLoggedInAdmin, async (req, res) => {
  const { id } = req.params;
  db.query(`select * from reservation where id = '${id}'`, (err, result) => {
    if (err) throw err;
    else {
      if (result[0].status === "accept") {
        db.query(
          `update reservation set status = 'checkin' where id = '${id}';`,
          (err, result) => {
            if (err) throw err;
            else {
              res.redirect("/admin/reservation");
            }
          }
        );
      } else {
        res.redirect("/admin/reservation");
      }
    }
  });
});

router.post("/admin/checkout/:id", isLoggedInAdmin, async (req, res) => {
  const { id } = req.params;

  db.query(`select * from reservation where id = '${id}'`, (err, result) => {
    if (err) throw err;
    else {
      if (result[0].status === "checkin") {
        db.query(
          `update reservation set status = 'checkout' where id = '${id}';`,
          (err, result) => {
            if (err) throw err;
            else {
              db.query(
                "update payment set payment_date = curdate();",
                (err, result) => {
                  if (err) throw err;
                  else {
                    res.redirect("/admin/reservation");
                  }
                }
              );
            }
          }
        );
      } else {
        res.redirect("/admin/reservation");
      }
    }
  });
});

router.post("/admin/decline/:id", isLoggedInAdmin, (req, res) => {
  const { id } = req.params;
  db.query(`select * from reservation where id = '${id}'`, (err, result) => {
    if (err) throw err;
    else {
      if (result[0].status === "accept") {
        db.query(
          `update reservation set status = 'decline' where id = '${id}';`,
          (err, result) => {
            if (err) throw err;
            else {
              res.redirect("/admin/reservation");
            }
          }
        );
      } else {
        res.redirect("/admin/reservation");
      }
    }
  });
});

router.get("/admin/rooms", isLoggedInAdmin, (req, res) => {
  let query = "select t.id, name, count(*) as room_count from type t " 
            + "join room r on t.id = r.type_id "
            + "group by id;";
  db.query(query, (err, room) => {
      if (err) throw err;
      else {
        //console.log(room);
        res.render("adminRoom.ejs", { room, message: req.flash("error") });
      }
    }
  );
});

// router.post("/admin/deleteRoom/:id", isLoggedInAdmin, (req, res) => {
//   const { id } = req.params;
//   console.log(id);
//   db.query(`delete from room where id = '${id}'`, (err, room) => {
//     if (err) throw err;
//     else {
//       console.log(room);
//       res.redirect("/admin/rooms");
//     }
//   });
// });

// router.post("/admin/editRoom", isLoggedInAdmin, (req, res) => {
//   const { id } = req.query;
//   console.log(id);
//   db.query(
//     `select *
//             from facilities f
//             where f.room_id=${id}`,
//     (err, data) => {
//       if (err) {
//         throw err;
//       }
//       console.log(data);
//       if (data) {
//         //user exists in database
//         res.render("adminEditRoom.ejs", { data, message: req.flash("error") });
//       } else res.redirect("/admin/rooms");
//     }
//   );
// });

router.post("/admin/roomlist", isLoggedInAdmin, (req, res) => {
  const { id } = req.query;
  console.log(id);
  db.query(
    `select id, number, status, 
      if(status = 'available', null, booker) as booker
      from vroomlist
      where type_id =${id}`,
    (err, data) => {
      if (err) {
        throw err;
      }
      console.log(data);
      res.render("adminRoomList.ejs", { data, message: req.flash("error") });
    }
  );
});

async function addRoom(number, rtype) {
  try {
      await new Promise((resolve, reject) => {
          db.query(`insert into room(number, type_id)
          values
          (?,?)`, [number, rtype], (err, results) => {
              if (err) reject(new Error(err.message));
              resolve();
          });
      });
  } catch (error) {
      console.log(error);
  }
}

router.post("/admin/addRoom", async(req, res)=>{
  console.log(req.body);
  const {number, type} = req.body;
  let query = "select id from type where name = '" + type.toLowerCase() + "';";
  console.log(query);
  let rtype = 1;
  db.query(query, (err, data) => {
    if (err) {
      throw err;
    }
    console.log(data);
     rtype = data[0].id;
    console.log(rtype);
    db.query(`SELECT * FROM room WHERE number = ${number};`, async (error, data1) => {
      if (error) {
        throw error;
      }
      console.log(data1);
      if(data1.length > 0) {
        console.log(data1);
        req.flash('error', `Room ${number} already exists`);
        res.redirect("/admin/rooms");
      } else {
        try {
          addRoom(number, rtype);
          console.log('adddddddd');
          req.flash('error', `Successfully added ${type} room ${number}` );
          res.redirect("/admin/rooms");
        } catch (err) {
          console.log(err);
          res.status(500).send('Internal server error');
        }
      }
    });
  });
});

router.get("/admin/addRoomForm", (req, res) => {
  
  res.render("adminAddRoom.ejs");
});

module.exports = router;
