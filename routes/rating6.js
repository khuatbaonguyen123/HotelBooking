const express = require('express');
const router = express.Router();
const db = require('../database');

router.post('/submit6', async (req, res) => {
    const { rating } = req.body; // Trích xuất giá trị của opinion và rating từ req.body

    // Kiểm tra nếu opinion hoặc rating là null, không thực hiện truy vấn chèn dữ liệu
    if (!rating) {
        return res.status(400).json({ error: 'Opinion and rating are required fields.' });
    }

    // Nếu không có giá trị null, thực hiện truy vấn chèn dữ liệu
    db.beginTransaction((err) => {
        if (err) throw err;

        db.query(`INSERT INTO rating6 (rating) VALUES ('${rating}')`, (err, result) => {
            if (err) {
                db.rollback(() => {
                    throw err;
                });
            }

            db.commit((err) => {
                if (err) {
                    db.rollback(() => {
                        throw err;
                    });
                }
                res.redirect('/detail6'); // Chuyển hướng sau khi lưu thành công
            });
        });
    });
});

router.get('/data6', (req, res) => {
    const dataQuery = 'SELECT rating, COUNT(*) AS count FROM rating6 GROUP BY rating';
    db.query(dataQuery, (err, results) => {
        if (err) {
            console.error('Error retrieving data:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        // Khởi tạo mảng dữ liệu trống
        let data = [];

        // Duyệt qua kết quả truy vấn và cập nhật mảng dữ liệu
        results.forEach(row => {
            const stars = row.rating;
            const count = row.count;
            data.push({ 'stars': stars, 'count': count });
        });

        // Trả về mảng dữ liệu đã cập nhật dưới dạng JSON
        res.json(data); 
    });
});

module.exports = router;
