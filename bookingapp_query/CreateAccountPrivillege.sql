CREATE USER 'admin1'@'localhost' IDENTIFIED BY 'secure_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON bookingapp1.* TO 'admin1'@'localhost';
flush privileges;
ALTER USER 'admin1'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password';
flush privileges;




