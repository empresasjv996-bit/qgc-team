// ======================================
// QGC TEAM - APP.JS
// CONVERSAS + CLIENTES
// ======================================


const API = "http://localhost:3000";


let conversas = [];

let clientes = [];

let conversaAtual = null;





// ======================================
// INICIO
// ======================================


window.onload = () => {


    carregarClientes();


    carregarConversas();


};







// ======================================
// CLIENTES
// ======================================


async function carregarClientes(){


    try{


        let resposta =
        await fetch(
            API + "/clientes"
        );


        clientes =
        await resposta.json();



    }catch(e){


        console.log(e);


    }


}








// ======================================
// CONVERSAS
// ======================================


async function carregarConversas(){


    try{


        let resposta =
        await fetch(
            API + "/conversas"
        );


        conversas =
        await resposta.json();



        mostrarConversas();



    }catch(e){


        console.log(e);


    }


}







function mostrarConversas(){



    let lista =
    document.getElementById(
        "contact-list"
    );



    if(!lista) return;



    document.getElementById(
        "title"
    ).innerHTML =
    "💬 Conversas";



    lista.innerHTML="";





    conversas.forEach((conv,index)=>{


        let item =
        document.createElement("div");



        item.className =
        "contact";



        item.innerHTML = `


        <div class="avatar">

        ${conv.telefone.substring(0,2)}

        </div>



        <div>


        <b>

        ${conv.telefone}

        </b>


        <p>

        ${conv.mensagem}

        </p>


        </div>



        `;



        item.onclick = ()=>{


            abrirConversa(conv);


        };




        lista.appendChild(item);



    });



}









// ======================================
// ABRIR CHAT
// ======================================


function abrirConversa(conv){


    conversaAtual = conv;



    document.getElementById(
        "chat-name"
    ).innerHTML =

    conv.telefone;




    let mensagens =
    document.getElementById(
        "messages"
    );



    mensagens.innerHTML="";




    let div =
    document.createElement("div");



    div.className =
    "received";



    div.innerHTML =
    conv.mensagem;



    mensagens.appendChild(div);



}







// ======================================
// CLIENTES
// ======================================


async function mostrarClientes(){



await carregarClientes();



let lista =
document.getElementById(
"contact-list"
);



document.getElementById(
"title"
).innerHTML =
"👥 Clientes";



lista.innerHTML="";




clientes.forEach(cliente=>{


let nome =
cliente.empresa?.nome
||
"Cliente";



let item =
document.createElement("div");



item.className =
"contact";



item.innerHTML = `

<div class="avatar">

${nome.substring(0,2)}

</div>


<div>

<b>
${nome}
</b>

<p>
${cliente.socio_mestre?.nome || ""}
</p>


</div>

`;



lista.appendChild(item);



});



}









// ======================================
// LISTAS
// ======================================


// ======================================
// LISTAS
// ======================================

function mostrarListas(){

    document.getElementById("title").innerHTML = "📂 Listas";

    const lista = document.getElementById("contact-list");

    lista.innerHTML = `

        <div style="padding:15px">

            <h3>Importar Lista</h3>

            <input
                type="file"
                id="arquivo"
                accept=".txt"
            >

            <br><br>

            <button onclick="importarArquivo()">
                IMPORTAR
            </button>

        </div>

    `;

}

// ======================================
// IMPORTAR
// ======================================

async function importarArquivo(){

    const arquivo = document.getElementById("arquivo").files[0];

    if(!arquivo){

        alert("Selecione um arquivo.");

        return;

    }

    const form = new FormData();

    form.append("arquivo", arquivo);

    try{

        const resposta = await fetch(

            API + "/importar",

            {

                method:"POST",

                body:form

            }

        );

        const json = await resposta.json();

        alert("Importação concluída!");

        console.log(json);

        await carregarClientes();

        mostrarClientes();

    }catch(e){

        console.log(e);

        alert("Erro ao importar.");

    }

}








// ======================================
// ENVIO CHAT
// ======================================


function sendMessage(){


let input =
document.getElementById(
"message"
);



let texto =
input.value;



if(!texto)
return;



let div =
document.createElement(
"div"
);



div.className =
"sent";


div.innerHTML =
texto;



document.getElementById(
"messages"
)
.appendChild(div);



input.value="";


}