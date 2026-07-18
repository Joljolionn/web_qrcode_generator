// [TABELAS ESSENCIAIS]

// [TABELA ECC]
// FORMATO DO JSON:
// Versao-Nivel: [total_data_codewords, ec_codewords_p_block, (qtd_blocos1, tamanho_bloco1), (qtd_blocos2, tamanho_bloco2)]
import TABELA_ECC from "./tabela_ecc.json" with { type: "json" };

// [TABELA LOG/ANTILOG]

const LOG = []; // recebe numero, devolve expoente
const ANTILOG = []; // recebe expoente, devolve numero

let value = 1;
for (let I = 0; I < 255; I++) {
    ANTILOG[I] = value;
    LOG[value] = I;

    value *= 2;
    if (value > 255) {
        value ^= 285;
    }
}
ANTILOG[255] = ANTILOG[0];

