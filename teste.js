const mask = 4;

const qrCodeVersion = "3";
const qrCodeEcc = "L";
let formatString = "";

const ERROR_CORRECTION_BITS = {
    L: "01",
    M: "00",
    Q: "11",
    H: "10",
};

formatString += ERROR_CORRECTION_BITS[qrCodeEcc];

console.log(formatString);

formatString += mask.toString(2).padStart(3, "0");

console.log(formatString);

const formatErrorCorrectionPolynomial = "10100110111";

function generateFormatCorrectionBits(formatString, generatorPolynomial) {
    let intermediatePolynomial = formatString;
    intermediatePolynomial.push(...Array(10).fill(0));
    console.log(`Intermediate Polynomial: ${intermediatePolynomial}`);
    let counter = 0;
    while (intermediatePolynomial[counter] != 1) {
        counter++;
    }
    intermediatePolynomial = intermediatePolynomial.slice(counter);

    console.log(`Intermediate Polynomial: ${intermediatePolynomial}`);

    let loop = 1;
    while (intermediatePolynomial.length > 10) {
        let tempGeneratorPolynomial = generatorPolynomial.slice(0);
        console.log(`Iteração ${loop}`);

        console.log(`Intermediate Polynomial: ${intermediatePolynomial}`);
        console.log(`Generator Polynomial: ${tempGeneratorPolynomial}`);
        if (intermediatePolynomial.length > tempGeneratorPolynomial.length) {
            let leftOver =
                intermediatePolynomial.length - tempGeneratorPolynomial.length;
            tempGeneratorPolynomial.push(...Array(leftOver).fill(0));
        }

        console.log(`Generator Polynomial: ${tempGeneratorPolynomial}`);
        console.log(`Intermediate Polynomial: ${intermediatePolynomial}`);
        let tempPolynomial = [];
        for (let i = 0; i < intermediatePolynomial.length; i++) {
            tempPolynomial.push(
                intermediatePolynomial[i] ^ tempGeneratorPolynomial[i],
            );
        }
        intermediatePolynomial = tempPolynomial;

        console.log(`Intermediate Polynomial: ${intermediatePolynomial}`);

        let newCounter = 0;
        while (intermediatePolynomial[newCounter] != 1) {
            newCounter++;
        }
        intermediatePolynomial = intermediatePolynomial.slice(counter);
        console.log(intermediatePolynomial);
        loop++;
    }
    return intermediatePolynomial;
}

let errorCorrectionBits = generateFormatCorrectionBits(
    [...formatString].map((e) => Number.parseInt(e)),
    [...formatErrorCorrectionPolynomial].map((e) => Number.parseInt(e)),
);

console.log(errorCorrectionBits.toString());
