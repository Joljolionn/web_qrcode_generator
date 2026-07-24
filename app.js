import ALIGMENT_PATTERN_TABLE from "./alignment-table.json" with { type: "json" };
import QrCodeRenderer from "./QrCodeRenderer.js";
import QrCodeEncoder from "./QrCodeEncoder.js";

const qrCodeRenderer = new QrCodeRenderer();
const qrCodeEncoder = new QrCodeEncoder();

const qrcodeDiv = document.getElementById("qrcode__code");

// Para o primeiro teste, o objetivo é criar um qrcode 21x21 capaz de me
// redirecionar para um vídeo do youtube
const link = "https://youtu.be/dQw4w9WgXcQ?si=M-bihjX-dQRfabe2";
const qrCodeType = qrCodeEncoder.getMinVersion(link);

const data = qrCodeEncoder.encodeDataWithECC(link);

// EXIBIÇÃO DO QR-CODE

const qrCodeSize = qrCodeEncoder.calculateQrCodeSize(qrCodeType.version);

const matrix = qrCodeRenderer.createMatrix(qrcodeDiv, qrCodeSize);

//

qrCodeRenderer.drawBase(qrCodeType);

qrCodeRenderer.drawDataBits(data);

const mask = qrCodeRenderer.maskNumber7(matrix);

const formatString = qrCodeEncoder.createFormatString(qrCodeType, mask);

console.log(formatString);

qrCodeRenderer.drawFormatBits(formatString);
