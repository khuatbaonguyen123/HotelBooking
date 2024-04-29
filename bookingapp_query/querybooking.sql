-- INDEXES

-- Index ho tro sort cho admin/khach xem trang thai cac phong

-- Cho postgresql, mysql automatically index foreign key if we set the engine = innoDB
CREATE INDEX idx_room_reserved_room_id ON room_reserved (room_id);
CREATE INDEX idx_room_reserved_reservation_id ON room_reserved (reservation_id);

-- Index date_in, date_out, cho cac sort, query tim kiem theo ngay
CREATE INDEX idx_reservation_date_in ON reservation (date_in);
CREATE INDEX idx_reservation_date_out ON reservation (date_out);

-- Index cho status cho admin query 
CREATE INDEX idx_reservation_status ON reservation (status);

-- PROCEDURE

-- Procedure make reservation va dua den cho admin duyet
DELIMITER //

CREATE PROCEDURE MakeReservation (
    IN p_date_in DATE,
    IN p_date_out DATE,
    IN p_booker_id INT,
    OUT p_reservation_id INT
)
BEGIN
    -- Insert the reservation into the reservation table
    INSERT INTO reservation (date_in, date_out, booker_id)
    VALUES (p_date_in, p_date_out, p_booker_id);
    
    -- Get the ID of the inserted reservation
    SET p_reservation_id = LAST_INSERT_ID();
END //

-- Thay doi status cua reservation
DELIMITER //

CREATE PROCEDURE change_status (reservation_id INT, change_status enum('accept','decline','pending','checkin','checkout'))
BEGIN
	UPDATE reservation
    SET status = change_status
    WHERE id = reservation_id;
END //

DELIMITER ;

-- TRIGGER

-- trigger tu dong cap nhat khi da toi ngay nhan phong ma khach chua check in - tu dong huy
CREATE EVENT decline_passed_check_in
ON SCHEDULE EVERY 1 DAY
DO
    UPDATE reservation
    SET status = 'decline'
    WHERE status = 'accept' AND date_in < curdate();

-- event khi khach tu dat phong hom nay ma den mai chua duyet tu dong huy
ALTER TABLE reservation 
ADD COLUMN created_date DATE;

CREATE EVENT update_status_event
ON SCHEDULE EVERY 1 DAY
DO
    UPDATE reservation
    SET status = 'decline'
    WHERE status = 'pending' AND created_date < curdate();

-- View 

-- View thong tin tat ca cac reservation
CREATE VIEW accepted_reservation AS
	SELECT 
		CONCAT(b.first_name, ' ', b.last_name) as name, 
        b.phone, 
        re.date_in, 
        re.date_out, 
        r.number as room_number, 
        re.created_date,
        re.status
    FROM 
		booker b join reservation re on b.id = re.booker_id
		join room_reserved rr on re.id = rr.reservation_id 
		join room r on rr.room_id = r.id
	WHERE re.status = 'accept'
    GROUP BY rr.reservation_id, rr.room_id;

-- View thong tin cac phong dang cho duyet 
CREATE VIEW pending_reservations AS
	SELECT 
		CONCAT(b.first_name, ' ', b.last_name) as name, 
        b.phone, 
        re.date_in, 
        re.date_out, 
        r.number as room_number, 
        re.created_date,
        re.status
    FROM 
		booker b join reservation re on b.id = re.booker_id
		join room_reserved rr on re.id = rr.reservation_id 
		join room r on rr.room_id = r.id
	WHERE re.status = 'pending'
    GROUP BY rr.reservation_id, rr.room_id;

