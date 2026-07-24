import TABELA_ECC from "./tabela_ecc.json" with { type: "json" };
import ALIGMENT_PATTERN_TABLE from "./alignment_table.json" with { type: "json" };
import QrCode from "./qrcode.js";

const qrCode = new QrCode();

const qrcode = document.getElementById("qrcode__code");

// Para o primeiro teste, o objetivo é criar um qrcode 21x21 capaz de me
// redirecionar para um vídeo do youtube
let link = "https://youtu.be/dQw4w9WgXcQ?si=M-bihjX-dQRfabe2";
let data = "";
const qrCodeType = qrCode.getMinVersion(link);
const qrCodeTypeKey = qrCodeType.version+"-"+qrCodeType.level

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

let requiredBits = TABELA_ECC[qrCodeTypeKey][0] * 8;
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
    data += "0".repeat(8 - padding);
}

console.log(data);

// Quarta parte: adicionar pad bytes se necessário (caso o tamanho da string de
// bits ainda não atinga o tamanho necessário para a versão e níveis
// especificados, os seguintes pad bytes devem ser adicionados repetidamente
// até que o tamanho seja atingido: "11101100 00010001")

const firstPaddingByte = "11101100";
const secondPaddingByte = "00010001";

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
console.log(TABELA_ECC[qrCodeTypeKey]);

console.log("Começo da correção de erros");

// [QUINTO PASSO]: Correção de erros
const messagePolynomial = qrCode.createMessagePolynomial(data);
console.log(qrCode.createMessagePolynomial(data));

let generatorPolynomial = qrCode.createGenPolynomial(TABELA_ECC[qrCodeTypeKey][1]);
generatorPolynomial = generatorPolynomial.map((e) => qrCode.getLog(e));
console.log(generatorPolynomial);

let intermediatePolynomial = qrCode.generateErrorCorrectionCodewords(
    messagePolynomial,
    generatorPolynomial,
);

console.log(`Correction codewords necessárias: ${TABELA_ECC[qrCodeTypeKey][1]}`);
console.log("codewords de correção");
console.log(intermediatePolynomial);

console.log(data);

// adicionando codewords de correção de erro na string de dados
intermediatePolynomial.map((e) => {
    data += e.toString(2).padStart(8, "0");
});

console.log(data);

// EXIBIÇÃO DO QR-CODE

let qrCodeSize = qrCode.calculateQrCodeSize(qrCodeType.version);
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

//
// canto superior esquerdo
qrCode.drawFinderPattern(0, 0, matrix);
qrCode.drawFinderSeparators(7, 7, matrix);

// canto superior direito
qrCode.drawFinderPattern(0, matrix.length - 7, matrix);
qrCode.drawFinderSeparators(7, matrix.length - 8, matrix);

// canto inferior esquerdo
qrCode.drawFinderPattern(matrix.length - 7, 0, matrix);
qrCode.drawFinderSeparators(matrix.length - 8, 7, matrix);

// busca as posições respectivas do padrão usando a tabela oficial
const positions = ALIGMENT_PATTERN_TABLE[qrCodeType.version];

// Desenha os padrões de alinhamento combinando todos os padrões de linha e
// coluna
positions.forEach((positionX) => {
    if (positionX != "") {
        positions.forEach((positionY) => {
            if (positionY != "") {
                qrCode.drawAlignmentPattern(positionX, positionY, matrix);
                console.log(`(${positionX} ; ${positionY} )`);
            }
        });
    }
});

qrCode.drawTimingPatterns(matrix);

qrCode.drawDarkModule(qrCodeType.version, matrix);

// A área reservada independe da versão

qrCode.reserveFormatArea(matrix);

qrCode.drawDataBits(data, matrix);

qrCode.maskNumber7(matrix);
const mask = 7;

let formatString = "";

formatString += qrCode.ERROR_CORRECTION_BITS[qrCodeType.level];

console.log(formatString);

formatString += mask.toString(2).padStart(3, "0");

console.log(formatString);

let errorCorrectionBits = qrCode.generateFormatCorrectionBits(
    [...formatString].map((e) => Number.parseInt(e)),
    [...qrCode.formatErrorCorrectionPolynomial].map((e) => Number.parseInt(e)),
);

console.log(errorCorrectionBits);
console.log(formatString);

formatString = [...formatString];
console.log(formatString);
formatString.push(...errorCorrectionBits);

let maskString = [..."101010000010010"].map((e) => Number.parseInt(e));
console.log(maskString);

for (let i = 0; i < formatString.length; i++) {
    let tmp = formatString[i] ^ maskString[i];
    formatString[i] = tmp;
}

console.log(formatString);

qrCode.drawFormatBits(formatString, matrix);
