import {DatabaseSync} from 'node:sqlite'
//create a new database in memory not in the disk 
const db = new DatabaseSync(':memory:')
//create the db tables and relationships
db.exec(`
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);

CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    status BOOLEAN DEFAULT 0,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
`)
//export the db instance to be used in other files
export default db