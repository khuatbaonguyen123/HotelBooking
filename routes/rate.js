const express = require('express');
const router = express.Router();

const Rating = require('../model_mongodb/dbmongo.js');
const db = require('../database');

router.post('/rate', async (req, res) => {
    const roomType = req.body.typeRoom;
    const ratings = req.body.rating;
    const id_reservation = req.body.numberRoom;
    const comment = req.body.comment;

    console.log(req.session.userId);
    console.log(id_reservation);
    console.log(roomType);
    console.log(ratings);

    const sql_query = `SELECT DISTINCT k.id, rr.reservation_id , type_id 
                        FROM booker k 
                        JOIN reservation r ON r.booker_id = k.id 
                        JOIN room_reserved rr ON rr.reservation_id = r.id 
                        JOIN room ro ON ro.id = rr.room_id 
                        WHERE r.status = "checkout" 
                        AND k.id = ? 
                        AND rr.reservation_id = ? 
                        AND type_id = ?;`;

    db.query(sql_query, [req.session.userId, id_reservation, roomType], async (err, results) => {
        try {
            if (err) {
                console.error('Lỗi truy vấn:', err);
                return res.status(500).send('Lỗi truy vấn');
            }

            if (results.length === 0) {
                console.error('Không tìm thấy dữ liệu phù hợp');
                return res.status(404).send('Không tìm thấy dữ liệu phù hợp');
            }

            for (let i = 0; i < results.length; i++) {
                const userId = results[i].id;
                const idR = results[i].reservation_id ;
                const type = results[i].type_id;
                const existingRating = await Rating.findOne({ reservation: idR, typeRoom: type });
                if (existingRating) {
                    existingRating.comment = comment;
                    existingRating.rating = ratings;
                    existingRating.timestamp = new Date();
                    existingRating.comment += " (update)";
                    await existingRating.save();
                }
                else {
                    const newRating = await Rating.create({ 
                        idUser: userId, 
                        typeRoom: type, 
                        reservation: idR, 
                        rating: ratings,   
                        comment: comment
                    });
                }  
            }

            res.redirect(`/profile`);
        } catch (error) {
            console.error('Lỗi xử lý:', error);
            return res.status(500).send('Lỗi xử lý');
        }
    });
});

router.get('/comment', async (req, res) => {
    try {
        const {id} = req.query;
        const comments = await Rating.find({ typeRoom: Number(id) });
        let commentsHTML = ""
        comments.forEach((comment, index) => {
                commentsHTML += ` 
                <div style = "margin-bottom: 1.5cm;border: 3px solid #ccc; padding: 10px; border-radius: 8px;">
                <p class="timestamp">${comment.timestamp}</p>
                <p>idUser: ${comment.idUser}</p> 
                <p>Rate: ${comment.rating}</p> 
                <p>Comment: ${comment.comment}</p>      
                </div>
            `;      
        });
        res.send(commentsHTML);
    } catch (error) {
        console.error('Lỗi lấy dữ liệu từ MongoDB:', error);
        res.status(500).send('Lỗi lấy dữ liệu từ MongoDB');
    }
});

router.get('/data', async (req, res) => {
    const {id} = req.query;
    try {
        const data = await Rating.aggregate([
            { $match: {typeRoom: Number(id)} },
            { $group: { _id: '$rating', count: { $sum: 1 } } },
            { $project: { _id: 0, stars: '$_id', count: 1 } }
        ]);
        console.log(data);
        res.json(data);
    } catch (error) {
        console.error('Error retrieving data:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;