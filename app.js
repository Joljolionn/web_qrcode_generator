import TABELA_ECC from "./tabela_ecc.json" with { type: "json" };
import ALIGMENT_PATTERN_TABLE from "./alignment_table.json" with { type: "json" };
import QrCode from "./qrcode.js";

const qrCode = new QrCode();

const qrcodeDiv = document.getElementById("qrcode__code");

// Para o primeiro teste, o objetivo é criar um qrcode 21x21 capaz de me
// redirecionar para um vídeo do youtube
let link = "https://youtu.be/dQw4w9WgXcQ?si=M-bihjX-dQRfabe2";
const qrCodeType = qrCode.getMinVersion(link);
const qrCodeTypeKey = qrCodeType.version + "-" + qrCodeType.level;

let data = qrCode.encodeDataWithECC(link);

// EXIBIÇÃO DO QR-CODE

let qrCodeSize = qrCode.calculateQrCodeSize(qrCodeType.version);
console.log(qrCodeSize);
console.log(qrCodeSize ** 2);
qrcodeDiv.style.grid = `repeat(${qrCodeSize}, 1fr) / repeat(${qrCodeSize}, 1fr)`;

let matrix = qrCode.createMatrix(qrcodeDiv, qrCodeSize);

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

const formatString = qrCode.createFormatString(qrCodeType, mask);

console.log(formatString);

qrCode.drawFormatBits(formatString, matrix);
