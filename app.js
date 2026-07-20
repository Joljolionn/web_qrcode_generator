import TABELA_ECC from "./tabela_ecc.json" with { type: "json" };
// [TABELAS ESSENCIAIS]

// [TABELA ECC]
// FORMATO DO JSON:
// Versao-Nivel: [total_data_codewords, ec_codewords_p_block, (qtd_blocos1, tamanho_bloco1), (qtd_blocos2, tamanho_bloco2)]

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

const qrcode = document.getElementById("qrcode__code");
const qrcodeSize = document.getElementById("qrcode__size");

// Para o primeiro teste, o objetivo é criar um qrcode 21x21 capaz de me
// redirecionar para um vídeo do youtube
let link = "https://youtu.be/dQw4w9WgXcQ?si=M-bihjX-dQRfabe2";
let data = "";
const qrcodeType = "3-L";

// [PRIMEIRO PASSO]: Adicionar indicador de modo
data += "0100";
console.log(data);

// [SEGUNDO PASSO]: Adicionar contagem de caracteres e padding (para o qrcode
//   de nivel 1, a contagem deve conter 8 bits, cobrindo para esquerda com
//   padding de "0"s se sobrarem bits)

let n = link.length;
console.log(n);
data += n.toString(2).padStart(8, "0");

console.log(data);

// [TERCEIRO PASSO]: Codificar o link desejado
//  Para codificar o link no modo byte, devemos converter cada caractere para
//  seu byte hexadecimal e em seguida para seu relativo binário (e fazer o
//  padding com "0"s para cada caractere ocupar um byte com 8 bits)

for (let i = 0; i < link.length; i++) {
    data += link[i].charCodeAt(0).toString(2).padStart(8, "0");
}
console.log(data);

// [QUARTO PASSO]: Adicionar "0"s e pad bytes

// Primeira parte: determinar quantidade de bits que o qrcode deve possuir
// (depende da versão e nível de correção do qrcode, para o meu [3-L], a
// quantia de codewords é 55, sendo que cada codeword equivale a 8 bits, então
// temos:

let requiredBits = 55 * 8;
console.log(data.length);
console.log(requiredBits);

// Segunda parte: adicionar os "0"s terminadores para os dados (vai quantos
// "0"s der pra por, no máximo 4"
for (let i = 0; i < 4; i++) {
    if (data.length < requiredBits) {
        data += "0";
    }
}
console.log(data);

// Terceira parte: garantir que o último conjunto de bits forma um byte (8
// bits), se não, adicionar padding com "0"s

if (data.length % 8 != 0) {
    let padding = data.length % 8;
    data.length += "0".repeat(padding);
}

console.log(data);

// Quarta parte: adicionar pad bytes se necessário (caso o tamanho da string de
// bits ainda não atinga o tamanho necessário para a versão e níveis
// especificados, os seguintes pad bytes devem ser adicionados repetidamente
// até que o tamanho seja atingido: "11101100 00010001")

let firstPaddingByte = "11101100";
let secondPaddingByte = "00010001";

if (data.length < requiredBits) {
    const missingBits = requiredBits - data.length;
    console.log(missingBits);

    const missingBytes = missingBits / 8;
    console.log(missingBytes);

    if (missingBytes % 2 == 0) {
        data += (firstPaddingByte + secondPaddingByte).repeat(missingBytes);
    } else {
        data +=
            (firstPaddingByte + secondPaddingByte).repeat(
                Math.floor(missingBytes / 2),
            ) + firstPaddingByte;
    }
}

console.log(data);
console.log(data.length);
console.log(TABELA_ECC[qrcodeType]);

console.log("Começo da correção de erros");

// [QUINTO PASSO]: Correção de erros
const messagePolynomial = createMessagePolynomial(data);
console.log(createMessagePolynomial(data));

let generatorPolynomial = createGenPolynomial(TABELA_ECC[qrcodeType][1]);
generatorPolynomial = generatorPolynomial.map((e) => convertToAlpha(e));
console.log(generatorPolynomial);

let intermediatePolynomial = messagePolynomial;
let messageLead;
let multipliedPolynomial = [];

// Executa na mesma quantia de codewords totais
for (let i = 0; i < TABELA_ECC[qrcodeType][0]; i++) {
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
    let ii = 1;
    while (
        ii <
        Math.max(multipliedPolynomial.length, intermediatePolynomial.length)
    ) {
        ii++;
        let tmp = intermediatePolynomial[ii] ^ multipliedPolynomial[ii];

        xorPolynomial.push(tmp);
    }
    intermediatePolynomial = xorPolynomial;
}
console.log(`Correction codewords necessárias: ${TABELA_ECC[qrcodeType][1]}`);
console.log("codewords de correção");
console.log(intermediatePolynomial);


for (let i = 0; i < 21; i++) {
    for (let j = 0; j < 21; j++) {
        const block = document.createElement("span");
        if ((i + j) % 2 == 0) block.style = "background-color: black";
        qrcode.appendChild(block);
    }
}
