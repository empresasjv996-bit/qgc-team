const Database = require("better-sqlite3");

const db = new Database("qgc.db");

db.pragma("journal_mode = WAL");

db.exec(`

CREATE TABLE IF NOT EXISTS clientes(

id INTEGER PRIMARY KEY AUTOINCREMENT,

cnpj TEXT UNIQUE,

empresa TEXT,

capital TEXT,

telefone_principal TEXT,

cpf_socio_mestre TEXT,

nome_socio_mestre TEXT,

telefone_socio_mestre TEXT,

ficha_original TEXT,

created_at DATETIME DEFAULT CURRENT_TIMESTAMP

);



CREATE TABLE IF NOT EXISTS socios(

id INTEGER PRIMARY KEY AUTOINCREMENT,

cliente_id INTEGER,

cpf TEXT,

nome TEXT,

telefone TEXT,

renda TEXT,

nascimento TEXT,

FOREIGN KEY(cliente_id)

REFERENCES clientes(id)

);



CREATE TABLE IF NOT EXISTS conversas(

id INTEGER PRIMARY KEY AUTOINCREMENT,

telefone TEXT,

cliente_id INTEGER,

ultima_mensagem TEXT,

status TEXT DEFAULT 'ABERTA',

updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

FOREIGN KEY(cliente_id)

REFERENCES clientes(id)

);



CREATE TABLE IF NOT EXISTS mensagens(

id INTEGER PRIMARY KEY AUTOINCREMENT,

conversa_id INTEGER,

tipo TEXT,

texto TEXT,

created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

FOREIGN KEY(conversa_id)

REFERENCES conversas(id)

);

`);

module.exports = db;