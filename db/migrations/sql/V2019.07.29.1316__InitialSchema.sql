CREATE TABLE users
(
  id varchar(255),
  username varchar(255),
  password varchar(255),
  linkedid varchar(255),
  serializedprofile varchar(10000),
  PRIMARY KEY ("id")
);
