function limpar(valor = "") {
    return String(valor).replace(/\r/g, "").trim();
}

function parserFicha(texto) {

    const cliente = {

        empresa: {
            cnpj: "",
            nome: "",
            capital: ""
        },

        socio_mestre: {
            cpf: "",
            nome: "",
            telefone: "",
            renda: "",
            nascimento: ""
        },

        socios: []

    };

    const linhas = texto
        .split(/\n/)
        .map(l => limpar(l))
        .filter(l => l.length > 0);

    let atual = null;
    let lendoSocioMestre = false;

    for (const linha of linhas) {

        if (linha.startsWith("CNPJ:")) {

            cliente.empresa.cnpj = linha.replace("CNPJ:", "").trim();
            continue;

        }

        if (linha.startsWith("NOME:") && !atual) {

            cliente.empresa.nome = linha.replace("NOME:", "").trim();
            continue;

        }

        if (linha.startsWith("CAPITAL:")) {

            cliente.empresa.capital = linha.replace("CAPITAL:", "").trim();
            continue;

        }

        if (linha.startsWith("SÓCIO MESTRE")) {

            lendoSocioMestre = true;

            atual = cliente.socio_mestre;

            continue;

        }

        if (/^SÓCIO-\d+/i.test(linha)) {

            lendoSocioMestre = false;

            atual = {

                cpf: "",
                nome: "",
                telefone: "",
                renda: "",
                nascimento: ""

            };

            cliente.socios.push(atual);

            continue;

        }

        if (!atual)
            continue;

        if (linha.startsWith("CPF:")) {

            atual.cpf = linha.replace("CPF:", "").trim();

            continue;

        }

        if (linha.startsWith("NOME:")) {

            atual.nome = linha.replace("NOME:", "").trim();

            continue;

        }

        if (linha.startsWith("RENDA:")) {

            atual.renda = linha.replace("RENDA:", "").trim();

            continue;

        }

        if (linha.startsWith("DATA NASC:")) {

            atual.nascimento = linha.replace("DATA NASC:", "").trim();

            continue;

        }

        if (linha.startsWith("TELEFONE:")) {

            atual.telefone = linha
                .replace("TELEFONE:", "")
                .replace(/\D/g, "");

            continue;

        }

    }

    if (

        cliente.socio_mestre.telefone === "" &&

        cliente.socios.length > 0

    ) {

        cliente.socio_mestre.telefone =

            cliente.socios[0].telefone;

    }

    return cliente;

}

module.exports = parserFicha;