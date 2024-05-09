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

