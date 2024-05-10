-- Break admin and booker table
ALTER TABLE booker DROP FOREIGN KEY FK_bookerID;

CREATE TABLE admin (
  id int AUTO_INCREMENT primary key,
  email varchar(255) not null,
  password varchar(255) not null
);

ALTER TABLE booker
ADD COLUMN email varchar(255) not null,
ADD COLUMN password varchar(255) not null;

insert into admin(email,password)
values ('admin@test.com','admin');

-- trigger when delete a booker also delete all their reservations
DELIMITER //

CREATE TRIGGER delete_booker_reservation
BEFORE DELETE ON booker
FOR EACH ROW
BEGIN
	delete from reservation where booker_id = OLD.id;
END //

DELIMITER ;	

-- trigger to restrict modification on date_in, date_out once inserted
DELIMITER //

CREATE TRIGGER prevent_date_modification
BEFORE UPDATE ON reservation
FOR EACH ROW
BEGIN
    IF OLD.date_in != NEW.date_in OR OLD.date_out != NEW.date_out THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot modify date_in and date_out once inserted';
    END IF;
END//

DELIMITER ;

-- restrict viec xoa phong da dat (trigger to restrict delete if the booker still exists)
DELIMITER //

CREATE TRIGGER restrict_reservation_deletion
BEFORE DELETE ON reservation
FOR EACH ROW
BEGIN
    IF EXISTS (SELECT 1 FROM booker WHERE id = OLD.booker_id) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete reservation because corresponding booker exists';
    END IF;
END//

DELIMITER ;





