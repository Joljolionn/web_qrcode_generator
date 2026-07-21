import TABELA_ECC from "./tabela_ecc.json" with { type: "json" };
import ALIGMENT_PATTERN_TABLE from "./alignment_table.json" with { type: "json" };
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

// Para o primeiro teste, o objetivo é criar um qrcode 21x21 capaz de me
// redirecionar para um vídeo do youtube
let link = "https://youtu.be/dQw4w9WgXcQ?si=M-bihjX-dQRfabe2";
let data = "";
const qrCodeVersion = "3";
const qrCodeEcc = "L";
const qrCodeType = `${qrCodeVersion}-${qrCodeEcc}`;

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
console.log(TABELA_ECC[qrCodeType]);

console.log("Começo da correção de erros");

// [QUINTO PASSO]: Correção de erros
const messagePolynomial = createMessagePolynomial(data);
console.log(createMessagePolynomial(data));

let generatorPolynomial = createGenPolynomial(TABELA_ECC[qrCodeType][1]);
generatorPolynomial = generatorPolynomial.map((e) => convertToAlpha(e));
console.log(generatorPolynomial);

let intermediatePolynomial = messagePolynomial;
let messageLead;
let multipliedPolynomial = [];

// Executa na mesma quantia de codewords totais
for (let i = 0; i < TABELA_ECC[qrCodeType][0]; i++) {
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
console.log(`Correction codewords necessárias: ${TABELA_ECC[qrCodeType][1]}`);
console.log("codewords de correção");
console.log(intermediatePolynomial);

console.log(data);

// adicionando codewords de correção de erro na string de dados
intermediatePolynomial.map((e) => {
    data += e.toString(2).padStart(8, "0");
});

console.log(data);

// EXIBIÇÃO DO QR-CODE

function calculateQrCodeSize(version) {
    return (version - 1) * 4 + 21;
}

let qrCodeSize = calculateQrCodeSize(qrCodeVersion);
console.log(qrCodeSize);
console.log(qrCodeSize ** 2);
qrcode.style.grid = `repeat(${qrCodeSize}, 1fr) / repeat(${qrCodeSize}, 1fr)`;

let matrix = [];
class Module {
    constructor(block) {
        this.block = block;
        this.drew = false;
    }
    block;
    drew;
}
for (let i = 0; i < qrCodeSize; i++) {
    const linha = [];
    for (let j = 0; j < qrCodeSize; j++) {
        const block = document.createElement("span");
        if ((i + j) % 2 == 0) {
            block.style = "background-color: white";
        } else {
            block.style = "background-color: white";
        }
        qrcode.appendChild(block);
        linha.push(new Module(block));
    }
    matrix.push(linha);
}

function drawFinderPattern(topLeftCornerX, topLeftCornerY) {
    for (let x = 0; x < 7; x++) {
        for (let y = 0; y < 7; y++) {
            if (x == 0 || x == 6) {
                matrix[topLeftCornerX + x][
                    topLeftCornerY + y
                ].block.style.backgroundColor = "black";
                matrix[topLeftCornerX + x][topLeftCornerY + y].drew = true;
            } else {
                if (y == 0 || y == 6) {
                    matrix[topLeftCornerX + x][
                        topLeftCornerY + y
                    ].block.style.backgroundColor = "black";
                    matrix[topLeftCornerX + x][topLeftCornerY + y].drew = true;
                } else {
                    if (x > 1 && x < 5 && y > 1 && y < 5) {
                        matrix[topLeftCornerX + x][
                            topLeftCornerY + y
                        ].block.style.backgroundColor = "black";
                        matrix[topLeftCornerX + x][topLeftCornerY + y].drew =
                            true;
                    } else {
                        matrix[topLeftCornerX + x][
                            topLeftCornerY + y
                        ].block.style.backgroundColor = "white";
                        matrix[topLeftCornerX + x][topLeftCornerY + y].drew =
                            true;
                    }
                }
            }
        }
    }
}

function drawFinderSeparators(cornerX, cornerY) {
    const directionX = cornerX > matrix.length - cornerX ? 1 : -1;
    const directionY = cornerY > matrix.length - cornerY ? 1 : -1;

    for (let i = 0; i <= 7; i++) {
        matrix[cornerX + i * directionX][cornerY].block.style.backgroundColor =
            "white";
        matrix[cornerX][cornerY + i * directionY].block.style.backgroundColor =
            "white";
        matrix[cornerX + i * directionX][cornerY].drew = true;
        matrix[cornerX][cornerY + i * directionY].drew = true;
    }
}
//
// canto superior esquerdo
drawFinderPattern(0, 0);
drawFinderSeparators(7, 7);

// canto superior direito
drawFinderPattern(0, matrix.length - 7);
drawFinderSeparators(7, matrix.length - 8);

// canto inferior esquerdo
drawFinderPattern(matrix.length - 7, 0);
drawFinderSeparators(matrix.length - 8, 7);

function drawAlignmentPattern(centerX, centerY) {
    const startX = centerX - 2;
    const startY = centerY - 2;

    // verificar perimetro
    for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
            if (matrix[startX + x][startY + y].drew == true) {
                console.log("retorno em " + (startX + x) + " " + (startY + y));
                return;
            }
        }
    }

    // desenhar linhas horizontais
    for (let i = 0; i < 5; i++) {
        matrix[startX][startY + i].block.style.backgroundColor = "black";
        matrix[startX][startY + i].drew = true;
        matrix[startX + 4][startY + i].block.style.backgroundColor = "black";
        matrix[startX + 4][startY + i].drew = true;
    }

    matrix[centerX][centerY].block.style.backgroundColor = "black";
    matrix[centerX][centerY].drew = true;

    // desenhar linhas verticais e pintar o fundo de branco
    for (let i = 0; i < 5; i++) {
        if (i == 0 || i == 4) {
            matrix[startX + 1][startY + i].block.style.backgroundColor =
                "black";
            matrix[startX + 1][startY + i].drew = true;

            matrix[startX + 2][startY + i].block.style.backgroundColor =
                "black";
            matrix[startX + 2][startY + i].drew = true;

            matrix[startX + 3][startY + i].block.style.backgroundColor =
                "black";
            matrix[startX + 3][startY + i].drew = true;
        } else {
            matrix[startX + 1][startY + i].block.style.backgroundColor =
                "white";
            matrix[startX + 1][startY + i].drew = true;

            if (!matrix[startX + 2][startY + i].drew) {
                matrix[startX + 2][startY + i].block.style.backgroundColor =
                    "white";
            }
            matrix[startX + 2][startY + i].drew = true;

            matrix[startX + 3][startY + i].block.style.backgroundColor =
                "white";
            matrix[startX + 3][startY + i].drew = true;
        }
    }
}

// busca as posições respectivas do padrão usando a tabela oficial
const positions = ALIGMENT_PATTERN_TABLE[qrCodeType.split("-")[0]];

// Desenha os padrões de alinhamento combinando todos os padrões de linha e
// coluna
positions.forEach((positionX) => {
    if (positionX != "") {
        positions.forEach((positionY) => {
            if (positionY != "") {
                drawAlignmentPattern(positionX, positionY);
                console.log(`(${positionX} ; ${positionY} )`);
            }
        });
    }
});

// Sempre começa no mesmo ponto independente da versão então não precisa de
// parâmetros
function drawTimingPatterns() {
    const startPoint = 6; // posição (6;6)

    for (let i = 0; i < matrix.length - startPoint; i++) {
        // linha horizontal
        if (!matrix[startPoint][startPoint + i].drew) {
            matrix[startPoint][startPoint + i].block.style.backgroundColor =
                i % 2 == 0 ? "black" : "white";
            matrix[startPoint][startPoint + i].drew = true;
        }

        // linha vertical
        if (!matrix[startPoint + i][startPoint].drew) {
            matrix[startPoint + i][startPoint].block.style.backgroundColor =
                i % 2 == 0 ? "black" : "white";

            matrix[startPoint + i][startPoint].drew = true;
        }
    }
}

drawTimingPatterns();

function drawDarkModule(version) {
    // Uso "matrix.lenght - " o valor real para converter a posição (baixo->cima
    // e esquerda->direita) para o local correto na matrix (cima->baixo e
    // esquerda->direita)

    const moduleY = matrix.length - (4 * version + 9);
    const moduleX = matrix.length - 8;
    matrix[moduleX][moduleY].block.style.backgroundColor = "black";
    matrix[moduleX][moduleY].drew = true;
}

drawDarkModule(qrCodeVersion);

// A área reservada independe da versão
function reserveFormatArea() {
    const start = 8; // tamanho do finder pattern + borda

    matrix[start][start].block.style.backgroundColor = "red";
    matrix[start][start].drew = true;

    // linha horizontal
    for (let y = 0; y < matrix.length; y++) {
        if (matrix[start - 1][y].drew) {
            if (!matrix[start][y].drew) {
                matrix[start][y].block.style.backgroundColor = "red";
                matrix[start][y].drew = true;
            }
        }
    }

    // linha vertical
    for (let x = 0; x < matrix.length; x++) {
        if (matrix[x][start - 1].drew) {
            if (!matrix[x][start].drew) {
                matrix[x][start].block.style.backgroundColor = "red";
                matrix[x][start].drew = true;
            }
        }
    }
}

reserveFormatArea();

function drawDataBits(data) {
    // Começa da ponta direita subindo
    let direction = -1;
    let size = matrix.length - 1;
    let bitCounter = 0;
    for (let y = matrix.length - 1; y >= 0; y -= 2) {
        // regra para pular timing pattern
        if (y == 6) y -= 1;

        for (let x = 0; x < matrix.length; x++) {
            if (direction < 0) {
                // subindo

                // direita
                if (!matrix[size + x * direction][y].drew) {
                    matrix[size + x * direction][
                        y
                    ].block.style.backgroundColor =
                        data[bitCounter] == 1 ? "black" : "white";
                    bitCounter++;
                }

                // esquerda
                if (!matrix[size + x * direction][y - 1].drew) {
                    matrix[size + x * direction][
                        y - 1
                    ].block.style.backgroundColor =
                        data[bitCounter] == 1 ? "black" : "white";
                    bitCounter++;
                }
            } else {
                // descendo

                // direito
                if (!matrix[x][y].drew) {
                    matrix[x][y].block.style.backgroundColor =
                        data[bitCounter] == 1 ? "black" : "white";
                    bitCounter++;
                }

                // esquerdo
                if (!matrix[x][y - 1].drew) {
                    matrix[x][y - 1].block.style.backgroundColor =
                        data[bitCounter] == 1 ? "black" : "white";
                    bitCounter++;
                }
            }
        }
        direction *= -1;
    }
}

drawDataBits(data);


function maskNumber0() {
    for (let row = 0; row < matrix.length; row++) {
        for (let column = 0; column < matrix.length; column++) {
            if ((row + column) % 2 == 0) {
                if (!matrix[row][column].drew) {
                    if (
                        matrix[row][column].block.style.backgroundColor ==
                        "black"
                    ) {
                        matrix[row][column].block.style.backgroundColor =
                            "white";
                    } else {
                        matrix[row][column].block.style.backgroundColor =
                            "black";
                    }
                }
            }
        }
    }
}

function maskNumber1() {
    for (let row = 0; row < matrix.length; row++) {
        for (let column = 0; column < matrix.length; column++) {
            if ((row + column) % 2 == 0) {
                if (!matrix[row][column].drew) {
                    if (
                        matrix[row][column].block.style.backgroundColor ==
                        "black"
                    ) {
                        matrix[row][column].block.style.backgroundColor =
                            "white";
                    } else {
                        matrix[row][column].block.style.backgroundColor =
                            "black";
                    }
                }
            }
        }
    }
}
function maskNumber2() {
    for (let row = 0; row < matrix.length; row++) {
        for (let column = 0; column < matrix.length; column++) {
            if (row % 2 == 0) {
                if (!matrix[row][column].drew) {
                    if (
                        matrix[row][column].block.style.backgroundColor ==
                        "black"
                    ) {
                        matrix[row][column].block.style.backgroundColor =
                            "white";
                    } else {
                        matrix[row][column].block.style.backgroundColor =
                            "black";
                    }
                }
            }
        }
    }
}
function maskNumber3() {
    for (let row = 0; row < matrix.length; row++) {
        for (let column = 0; column < matrix.length; column++) {
            if (column % 3 == 0) {
                if (!matrix[row][column].drew) {
                    if (
                        matrix[row][column].block.style.backgroundColor ==
                        "black"
                    ) {
                        matrix[row][column].block.style.backgroundColor =
                            "white";
                    } else {
                        matrix[row][column].block.style.backgroundColor =
                            "black";
                    }
                }
            }
        }
    }
}
function maskNumber4() {
    for (let row = 0; row < matrix.length; row++) {
        for (let column = 0; column < matrix.length; column++) {
            if ((Math.floor(row / 2) + Math.floor(column / 3)) % 2 == 0) {
                if (!matrix[row][column].drew) {
                    if (
                        matrix[row][column].block.style.backgroundColor ==
                        "black"
                    ) {
                        matrix[row][column].block.style.backgroundColor =
                            "white";
                    } else {
                        matrix[row][column].block.style.backgroundColor =
                            "black";
                    }
                }
            }
        }
    }
}
function maskNumber5() {
    for (let row = 0; row < matrix.length; row++) {
        for (let column = 0; column < matrix.length; column++) {
            if (((row * column) % 2) + ((row * column) % 3) == 0) {
                if (!matrix[row][column].drew) {
                    if (
                        matrix[row][column].block.style.backgroundColor ==
                        "black"
                    ) {
                        matrix[row][column].block.style.backgroundColor =
                            "white";
                    } else {
                        matrix[row][column].block.style.backgroundColor =
                            "black";
                    }
                }
            }
        }
    }
}
function maskNumber6() {
    for (let row = 0; row < matrix.length; row++) {
        for (let column = 0; column < matrix.length; column++) {
            if ( 	( ((row * column) % 2) + ((row * column) % 3) ) % 2 == 0) {
                if (!matrix[row][column].drew) {
                    if (
                        matrix[row][column].block.style.backgroundColor ==
                        "black"
                    ) {
                        matrix[row][column].block.style.backgroundColor =
                            "white";
                    } else {
                        matrix[row][column].block.style.backgroundColor =
                            "black";
                    }
                }
            }
        }
    }
}
function maskNumber7() {
    for (let row = 0; row < matrix.length; row++) {
        for (let column = 0; column < matrix.length; column++) {
            if ( 	( ((row + column) % 2) + ((row * column) % 3) ) % 2 == 0) {
                if (!matrix[row][column].drew) {
                    if (
                        matrix[row][column].block.style.backgroundColor ==
                        "black"
                    ) {
                        matrix[row][column].block.style.backgroundColor =
                            "white";
                    } else {
                        matrix[row][column].block.style.backgroundColor =
                            "black";
                    }
                }
            }
        }
    }
}

maskNumber7();
