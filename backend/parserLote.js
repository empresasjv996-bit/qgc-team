const parserFicha = require("./parser");

function separarFichas(texto) {

    const linhas = texto.split(/\r?\n/);

    const fichas = [];

    let atual = [];

    for (const linha of linhas) {

        if (
            linha.startsWith("CNPJ:") &&
            atual.length > 0
        ) {

            fichas.push(atual.join("\n"));

            atual = [];

        }

        atual.push(linha);

    }

    if (atual.length > 0) {

        fichas.push(atual.join("\n"));

    }

    return fichas
        .map(parserFicha)
        .filter(f => f.empresa.cnpj);

}

module.exports = separarFichas;