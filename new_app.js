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

// [FUNÇÕES AUXILIARES]
// Primeiro, cria-se o polinômio para 3 correction codewords
// Depois, criam-se os próximos usando os termos até n-1
function createGenPolynomial(n) {
    let polinomio = [1]; // primeiro termo (1x^0 ou 1)

    for (let I = 0; I < n; I++) {
        let alpha = ANTILOG[I]; // acha o termo de alpha nessa iteração
        let novoTermo = [1, alpha]; // cria o novo termo (x - a^n)

        // Usa a regra de polinômios em que, dado a multiplicação de dois
        // polinômios, o grau do polinômio resultante será igual à soma dos maiores
        // coeficientes de cada polinômio -1
        let resultadoLen = polinomio.length + novoTermo.length - 1;
        let resultado = new Array(resultadoLen).fill(0);

        // loop duplo para multiplicar termos dos dois polinomios indvidualmente
        for (let iPolinomio = 0; iPolinomio < polinomio.length; iPolinomio++) {
            for (let iNovo = 0; iNovo < novoTermo.length; iNovo++) {
                // busca os expoentes de cada alpha
                let coeficientePolinomio = polinomio[iPolinomio]
                let coeficienteNovo = novoTermo[iNovo]

                if (coeficientePolinomio == 0 || coeficienteNovo == 0) {
                    continue;
                }
                let expoentePolinomio = LOG[coeficientePolinomio];
                let expoenteNovo = LOG[coeficienteNovo];

                // regras para multiplicação dos expoentes no Campo de Galois
                    // devolve o valor inteiro após adição de expoentes e
                    // modulação por 255 para garantir que o número esteja dentro
                    // do campo e faz a adição com xor
                    resultado[iPolinomio + iNovo] ^= ANTILOG[((expoenteNovo + expoentePolinomio) % 255)];
            }
        }
      polinomio = resultado
    }
  return polinomio
}

