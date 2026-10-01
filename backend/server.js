const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { v4: uuid } = require("uuid");

const db = require("./database");
const parserFicha = require("./parser");

const app = express();

app.use(cors());
// ======================================
// WEBHOOK SENDSEVEN
// ======================================

app.post("/webhook", async (req, res) => {

    try {

        console.log("========== WEBHOOK ==========");
        console.log(JSON.stringify(req.body, null, 2));

        res.status(200).json({
            sucesso: true
        });

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            sucesso: false,
            erro: erro.message
        });

    }

});
app.use(express.json());

const upload = multer({
    dest: path.join(__dirname, "uploads")
});

//========================================
// CONFIG
//========================================

const PORT = process.env.PORT || 3000;

const SENDSEVEN = {

    url: process.env.SENDSEVEN_URL || "",

    token: process.env.SENDSEVEN_TOKEN || "",

    instance: process.env.SENDSEVEN_INSTANCE || ""

};

//========================================
// HELPERS
//========================================

function now(){

    return new Date().toISOString();

}

function localizarClientePorTelefone(telefone){

    const sql = db.prepare(`
        SELECT *
        FROM clientes
        WHERE telefone_principal=?
        OR telefone_socio_mestre=?
        LIMIT 1
    `);

    return sql.get(telefone,telefone);

}

function localizarConversa(telefone){

    const sql=db.prepare(`
        SELECT *
        FROM conversas
        WHERE telefone=?
        LIMIT 1
    `);

    return sql.get(telefone);

}

function criarConversa(telefone,clienteId,mensagem){

    const sql=db.prepare(`

    INSERT INTO conversas(

    telefone,

    cliente_id,

    ultima_mensagem,

    updated_at

    )

    VALUES(?,?,?,?)

    `);

    const info=sql.run(

        telefone,

        clienteId,

        mensagem,

        now()

    );

    return info.lastInsertRowid;

}

function atualizarConversa(id,mensagem){

    db.prepare(`

    UPDATE conversas

    SET

    ultima_mensagem=?,

    updated_at=?

    WHERE id=?

    `).run(

        mensagem,

        now(),

        id

    );

}

function salvarMensagem(

    conversaId,

    tipo,

    texto

){

    db.prepare(`

    INSERT INTO mensagens(

    conversa_id,

    tipo,

    texto,

    created_at

    )

    VALUES(?,?,?,?)

    `).run(

        conversaId,

        tipo,

        texto,

        now()

    );

}

//========================================
// HOME
//========================================

app.get("/",(req,res)=>{

    res.json({

        sistema:"QGC TEAM",

        status:"ONLINE",

        data:now()

    });

});

//========================================
// CLIENTES
//========================================

app.get("/clientes",(req,res)=>{

    const lista=db.prepare(`

    SELECT *

    FROM clientes

    ORDER BY empresa

    `).all();

    res.json(lista);

});

app.get("/cliente/:telefone",(req,res)=>{

    const telefone=req.params.telefone;

    const cliente=localizarClientePorTelefone(
        telefone
    );

    if(!cliente){

        return res.status(404).json({

            erro:true,

            mensagem:"Cliente não encontrado"

        });

    }

    const socios=db.prepare(`

    SELECT *

    FROM socios

    WHERE cliente_id=?

    ORDER BY id

    `).all(cliente.id);

    cliente.socios=socios;

    res.json(cliente);

});
//========================================
// IMPORTAR FICHA
//========================================

app.post(
"/importar",
upload.single("arquivo"),
(req,res)=>{

try{

if(!req.file){

return res.status(400).json({
erro:true,
mensagem:"Arquivo não enviado"
});

}

const texto = fs.readFileSync(
req.file.path,
"utf8"
);

const ficha = parserFicha(texto);

const empresa = ficha.empresa;
const mestre = ficha.socio_mestre;

const existe = db.prepare(`
SELECT id
FROM clientes
WHERE cnpj=?
LIMIT 1
`).get(empresa.cnpj);

let clienteId;

if(existe){

clienteId = existe.id;

db.prepare(`
UPDATE clientes
SET
empresa=?,
capital=?,
telefone_principal=?,
cpf_socio_mestre=?,
nome_socio_mestre=?,
telefone_socio_mestre=?,
ficha_original=?
WHERE id=?
`).run(
empresa.nome,
empresa.capital,
mestre.telefone,
mestre.cpf,
mestre.nome,
mestre.telefone,
texto,
clienteId
);

db.prepare(`
DELETE FROM socios
WHERE cliente_id=?
`).run(clienteId);

}else{

const insert=db.prepare(`
INSERT INTO clientes(

cnpj,
empresa,
capital,
telefone_principal,
cpf_socio_mestre,
nome_socio_mestre,
telefone_socio_mestre,
ficha_original

)

VALUES(?,?,?,?,?,?,?,?)

`);

const info=insert.run(

empresa.cnpj,
empresa.nome,
empresa.capital,
mestre.telefone,
mestre.cpf,
mestre.nome,
mestre.telefone,
texto

);

clienteId = info.lastInsertRowid;

}

const insertSocio=db.prepare(`
INSERT INTO socios(

cliente_id,
cpf,
nome,
telefone,
renda,
nascimento

)

VALUES(?,?,?,?,?,?)

`);

for(const socio of ficha.socios){

insertSocio.run(

clienteId,
socio.cpf || "",
socio.nome || "",
socio.telefone || "",
socio.renda || "",
socio.nascimento || ""

);

}

try{

fs.unlinkSync(req.file.path);

}catch(e){}

res.json({

sucesso:true,

cliente_id:clienteId,

empresa:empresa.nome,

socios:ficha.socios.length

});

}catch(err){

console.log(err);

res.status(500).json({

erro:true,

mensagem:err.message

});

}

});

//========================================
// WEBHOOK
//========================================

app.post(
"/webhook",
(req,res)=>{

try{

const body=req.body;

const telefone=

body.telefone ||
body.phone ||
body.number ||
body.from ||
"";

const mensagem=

body.mensagem ||
body.message ||
body.text ||
"";

const cliente=
localizarClientePorTelefone(
telefone
);

let conversa=
localizarConversa(
telefone
);

let conversaId;

if(!conversa){

conversaId=
criarConversa(

telefone,

cliente ? cliente.id : null,

mensagem

);

}else{

conversaId=
conversa.id;

atualizarConversa(

conversa.id,

mensagem

);

}

salvarMensagem(

conversaId,

"cliente",

mensagem

);

res.json({

sucesso:true,

telefone,

cliente,

conversa:conversaId

});

}catch(err){

console.log(err);

res.status(500).json({

erro:true,

mensagem:err.message

});

}

});
//========================================
// LISTAR CONVERSAS
//========================================

app.get("/conversas",(req,res)=>{

    const lista = db.prepare(`

        SELECT
            c.id,
            c.telefone,
            c.ultima_mensagem,
            c.updated_at,

            cl.empresa,
            cl.nome_socio_mestre

        FROM conversas c

        LEFT JOIN clientes cl

        ON c.cliente_id = cl.id

        ORDER BY c.updated_at DESC

    `).all();

    res.json(lista);

});

//========================================
// LISTAR MENSAGENS
//========================================

app.get("/mensagens/:id",(req,res)=>{

    const conversaId = req.params.id;

    const mensagens = db.prepare(`

        SELECT *

        FROM mensagens

        WHERE conversa_id=?

        ORDER BY id

    `).all(conversaId);

    res.json(mensagens);

});

//========================================
// ENVIAR MENSAGEM
//========================================

app.post("/enviar", async (req,res)=>{

try{

    const telefone = req.body.telefone;
    const mensagem = req.body.mensagem;

    const conversa =
    localizarConversa(telefone);

    if(!conversa){

        return res.status(404).json({

            erro:true,
            mensagem:"Conversa não encontrada"

        });

    }

    salvarMensagem(

        conversa.id,

        "operador",

        mensagem

    );

    atualizarConversa(

        conversa.id,

        mensagem

    );

    //================================================
    // INTEGRAÇÃO SENDSEVEN
    //================================================
    // Ajuste conforme a documentação da API.

    if(
        SENDSEVEN.url &&
        SENDSEVEN.token
    ){

        try{

            await axios.post(

                SENDSEVEN.url,

                {

                    number:telefone,

                    message:mensagem,

                    instance:SENDSEVEN.instance

                },

                {

                    headers:{

                        Authorization:
                        `Bearer ${SENDSEVEN.token}`

                    }

                }

            );

        }catch(apiErro){

            console.log(
                "Erro SendSeven:",
                apiErro.message
            );

        }

    }

    res.json({

        sucesso:true,

        telefone,

        mensagem

    });

}catch(err){

    console.log(err);

    res.status(500).json({

        erro:true,

        mensagem:err.message

    });

}

});

//========================================
// STATUS
//========================================

app.get("/status",(req,res)=>{

    const clientes=db.prepare(
        "SELECT COUNT(*) total FROM clientes"
    ).get();

    const conversas=db.prepare(
        "SELECT COUNT(*) total FROM conversas"
    ).get();

    const mensagens=db.prepare(
        "SELECT COUNT(*) total FROM mensagens"
    ).get();

    res.json({

        sistema:"QGC TEAM",

        online:true,

        clientes:clientes.total,

        conversas:conversas.total,

        mensagens:mensagens.total,

        data:now()

    });

});

//========================================
// 404
//========================================

app.use((req,res)=>{

    res.status(404).json({

        erro:true,

        mensagem:"Endpoint não encontrado"

    });

});

//========================================
// START
//========================================

app.listen(PORT, "0.0.0.0", () => {

    console.log("");
    console.log("======================================");
    console.log("🔥 QGC TEAM ONLINE");
    console.log(`🚀 Porta: ${PORT}`);
    console.log("======================================");
    console.log("");

});