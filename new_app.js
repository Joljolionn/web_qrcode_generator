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
                let coeficientePolinomio = polinomio[iPolinomio];
                let coeficienteNovo = novoTermo[iNovo];

                if (coeficientePolinomio == 0 || coeficienteNovo == 0) {
                    continue;
                }
                let expoentePolinomio = LOG[coeficientePolinomio];
                let expoenteNovo = LOG[coeficienteNovo];

                // regras para multiplicação dos expoentes no Campo de Galois
                // devolve o valor inteiro após adição de expoentes e
                // modulação por 255 para garantir que o número esteja dentro
                // do campo e faz a adição com xor
                resultado[iPolinomio + iNovo] ^=
                    ANTILOG[(expoenteNovo + expoentePolinomio) % 255];
            }
        }
        polinomio = resultado;
    }
    return polinomio;
}

// Função auxiliar para converter os coeficientes para a anotação alpha
function convertToAlpha(coef) {
    if (coef === 0) {
        // devolve 0 caso o número recebido seja 0
        return 0;
    } else {
        return LOG[coef]; // devolve o expoente correspondente ao número
    }
}

function convertToIntegerNotation(exponent) {
    return ANTILOG[exponent];
}

function createMessagePolynomial(data) {
    // A string deve ser formada corretamente por bytes de tamanho 8
    if (data.length % 8 != 0) return;

    let messagePolynomial = [];
    let bitCounter = 0;
    let savedByte = "";
    for (let i = 0; i < data.length; i++) {
        savedByte += data[i];
        bitCounter++;
        if (bitCounter == 8) {
            messagePolynomial.push(parseInt(savedByte, 2));
            savedByte = "";
            bitCounter = 0;
        }
    }
    return messagePolynomial;
}

// Teste para gerar codewords de correção de erro

let testData =
    "00100000010110110000101101111000110100010111001011011100010011010100001101000000111011000001000111101100000100011110110000010001";
let messagePolynomial = createMessagePolynomial(testData);
console.log(createMessagePolynomial(testData));

let generatorPolynomial = createGenPolynomial(TABELA_ECC[`1-M`][1]);
generatorPolynomial = generatorPolynomial.map((e) => convertToAlpha(e));
console.log(generatorPolynomial);

let intermediatePolynomial = messagePolynomial;
let messageLead;
let multipliedPolynomial = [];

// Executa na mesma quantia de codewords totais
for (let i = 0; i < TABELA_ECC[`1-M`][0]; i++) {
    // Primeiro passo: multiplicar o polinomio gerador pelo primeiro termo do
    // polinomio de mensagem
    messageLead = convertToAlpha(intermediatePolynomial[0]);
    multipliedPolynomial = generatorPolynomial.map((e) => {
        return convertToIntegerNotation((e + messageLead) % 255);
    });

    // Segundo passo: XOR o resultado com o polinomio de mensagem
    let xorPolynomial = [];

    // Usa Math.max() no loop para garantir fazer o XOR de todos os valores dos
    // dois polinômios
    let ii = 0;
    while (
        ii <
        Math.max(multipliedPolynomial.length, intermediatePolynomial.length)
    ) {
        ii++;
        let tmp = intermediatePolynomial[ii] ^ multipliedPolynomial[ii];

        if (tmp == 0) continue;

        xorPolynomial.push(tmp);
    }
    intermediatePolynomial = xorPolynomial;
}
console.log(intermediatePolynomial);
