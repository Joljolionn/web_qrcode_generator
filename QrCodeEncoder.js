import TABELA_ECC from "./tabela-ecc.json" with { type: "json" };
import CHAR_CAPACITIES_TABLE from "./char-capacities-table.json" with { type: "json" };
import { QrCodeType } from "./QrCodeTypes.js";

// [TABELAS ESSENCIAIS]

// [TABELA CHAR_CAPACITIES]
// Version
// {
//    Error Correction Level
//        {
//          Numeric Mode, [0]
//          Alphanumeric Mode, [1]
//          Byte Mode, [2]
//          Kanji Mode [3]
//        }
//  }

// [TABELA ECC]
// FORMATO DO JSON:
// Versao-Nivel: [total_data_codewords, ec_codewords_p_block, (qtd_blocos1, tamanho_bloco1), (qtd_blocos2, tamanho_bloco2)]

// [TABELA LOG/ANTILOG]

export default class QrCodeEncoder {
    LOG = [];
    ANTILOG = [];

    ERROR_CORRECTION_BITS = {
        L: "01",
        M: "00",
        Q: "11",
        H: "10",
    };

    formatErrorCorrectionPolynomial = "10100110111";

    constructor() {
        let value = 1;
        for (let I = 0; I < 255; I++) {
            this.ANTILOG[I] = value;
            this.LOG[value] = I;

            value *= 2;
            if (value > 255) {
                value ^= 285;
            }
        }
        this.ANTILOG[255] = this.ANTILOG[0];
    }

    // [FUNÇÕES AUXILIARES]
    // Primeiro, cria-se o polinômio para 3 correction codewords
    // Depois, criam-se os próximos usando os termos até n-1
    createGeneratorPolynomial(n) {
        let polinomio = [1]; // primeiro termo (1x^0 ou 1)

        for (let I = 0; I < n; I++) {
            let alpha = this.ANTILOG[I]; // acha o termo de alpha nessa iteração
            let novoTermo = [1, alpha]; // cria o novo termo (x - a^n)

            // Usa a regra de polinômios em que, dado a multiplicação de dois
            // polinômios, o grau do polinômio resultante será igual à soma dos maiores
            // coeficientes de cada polinômio -1
            let resultadoLen = polinomio.length + novoTermo.length - 1;
            let resultado = new Array(resultadoLen).fill(0);

            // loop duplo para multiplicar termos dos dois polinomios indvidualmente
            for (
                let iPolinomio = 0;
                iPolinomio < polinomio.length;
                iPolinomio++
            ) {
                for (let iNovo = 0; iNovo < novoTermo.length; iNovo++) {
                    // busca os expoentes de cada alpha
                    let coeficientePolinomio = polinomio[iPolinomio];
                    let coeficienteNovo = novoTermo[iNovo];

                    if (coeficientePolinomio == 0 || coeficienteNovo == 0) {
                        continue;
                    }
                    let expoentePolinomio = this.LOG[coeficientePolinomio];
                    let expoenteNovo = this.LOG[coeficienteNovo];

                    // regras para multiplicação dos expoentes no Campo de Galois
                    // devolve o valor inteiro após adição de expoentes e
                    // modulação por 255 para garantir que o número esteja dentro
                    // do campo e faz a adição com xor
                    resultado[iPolinomio + iNovo] ^=
                        this.ANTILOG[(expoenteNovo + expoentePolinomio) % 255];
                }
            }
            polinomio = resultado;
        }
        return polinomio.map((e) => this.getLog(e));
    }

    // Função auxiliar para converter os coeficientes para a anotação alpha
    getLog(coef) {
        return this.LOG[coef]; // devolve o expoente correspondente ao número
    }

    getAntiLog(exponent) {
        return this.ANTILOG[exponent];
    }

    createMessagePolynomial(data) {
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

    generateErrorCorrectionCodewords(
        messagePolynomial,
        generatorPolynomialExponents,
    ) {
        // O número de codewords de correção é o tamanho do gerador - 1
        const eccCount = generatorPolynomialExponents.length - 1;

        // Adiciona os "zeros" ao final do polinômio de mensagem
        let result = [...messagePolynomial, ...new Array(eccCount).fill(0)];

        // Divisão polinomial
        // O loop roda exatamente o tamanho da mensagem original
        for (let i = 0; i < messagePolynomial.length; i++) {
            let leadCoef = result[0];

            // Remove o primeiro item e puxa o resto
            result.shift();

            // Só realizar a conta caso o coeficiente não seja 0 (afinal não existe LOG[0]
            if (leadCoef !== 0) {
                let logLead = this.LOG[leadCoef];

                // Faz o XOR apenas com os termos relevantes
                for (let j = 0; j < eccCount; j++) {
                    // j+1 porque pulamos o primeiro termo do polinômio gerador (que é sempre a^0)
                    let genExp = generatorPolynomialExponents[j + 1];
                    let multRes = this.ANTILOG[(genExp + logLead) % 255];

                    result[j] ^= multRes;
                }
            }
        }
        return result;
    }

    calculateQrCodeSize(version) {
        return (version - 1) * 4 + 21;
    }


    generateFormatCorrectionBits(formatString, generatorPolynomial) {
        let intermediatePolynomial = formatString;
        intermediatePolynomial.push(...Array(10).fill(0));
        let counter = 0;
        while (intermediatePolynomial[counter] != 1) {
            counter++;
        }
        intermediatePolynomial = intermediatePolynomial.slice(counter);

        while (intermediatePolynomial.length > 10) {
            let tempGeneratorPolynomial = generatorPolynomial.slice(0);
            if (
                intermediatePolynomial.length > tempGeneratorPolynomial.length
            ) {
                let leftOver =
                    intermediatePolynomial.length -
                    tempGeneratorPolynomial.length;
                tempGeneratorPolynomial.push(...Array(leftOver).fill(0));
            }

            let tempPolynomial = [];
            for (let i = 0; i < intermediatePolynomial.length; i++) {
                tempPolynomial.push(
                    intermediatePolynomial[i] ^ tempGeneratorPolynomial[i],
                );
            }
            intermediatePolynomial = tempPolynomial;

            let newCounter = 0;
            while (intermediatePolynomial[newCounter] != 1) {
                newCounter++;
            }
            intermediatePolynomial = intermediatePolynomial.slice(newCounter);
        }
        if (intermediatePolynomial.length < 10) {
            let padding = 10 - intermediatePolynomial.length;
            intermediatePolynomial.unshift(...Array(padding).fill(0));
        }
        return intermediatePolynomial;
    }

    getMinVersion(data) {
        for (const versionKey in CHAR_CAPACITIES_TABLE) {
            const version = CHAR_CAPACITIES_TABLE[versionKey];
            for (const levelKey in version) {
                const level = version[levelKey];
                if (level[2] >= data.length)
                    return new QrCodeType(versionKey, levelKey);
            }
        }
        return -1;
    }

    encodeData(data) {
        const qrCodeType = this.getMinVersion(data);
        let encodedData = "";

        // [PRIMEIRO PASSO]: Adicionar indicador de modo
        // [Atualmente programa suporta somenta modo byte]
        encodedData += "0100";

        // [SEGUNDO PASSO]: Adicionar contagem de caracteres e padding (para o qrcode
        //   de nivel 1, a contagem deve conter 8 bits, cobrindo para esquerda com
        //   padding de "0"s se sobrarem bits)
        encodedData += data.length.toString(2).padStart(8, "0");

        // [TERCEIRO PASSO]: Codificar o link desejado
        //  Para codificar o link no modo byte, devemos converter cada caractere para
        //  seu byte hexadecimal e em seguida para seu relativo binário (e fazer o
        //  padding com "0"s para cada caractere ocupar um byte com 8 bits)

        for (let i = 0; i < data.length; i++) {
            encodedData += data[i].charCodeAt(0).toString(2).padStart(8, "0");
        }

        // [QUARTO PASSO]: Determinar quantidade de bits que o qrcode deve possuir
        // (depende da versão e nível de correção do qrcode sendo que cada
        // codeword equivale a 8 bits, então temos:
        const requiredBits = TABELA_ECC[qrCodeType.getNotation()][0] * 8;

        // [QUINTO PASSO]: Adicionar os "0"s terminadores para os dados (vai quantos
        // "0"s der pra por, no máximo 4"
        for (let i = 0; i < 4; i++) {
            if (encodedData.length < requiredBits) {
                encodedData += "0";
            }
        }

        // [SEXTO PASSO]: Garantir que o último conjunto de bits forma um byte (8
        // bits), se não, adicionar padding com "0"s
        if (encodedData.length % 8 != 0) {
            let padding = encodedData.length % 8;
            encodedData += "0".repeat(8 - padding);
        }

        // [SÉTIMO PASSO]: Adicionar pad bytes se necessário (caso o tamanho da string de
        // bits ainda não atinga o tamanho necessário para a versão e níveis
        // especificados, os seguintes pad bytes devem ser adicionados repetidamente
        // até que o tamanho seja atingido: "11101100 00010001")

        const firstPaddingByte = "11101100";
        const secondPaddingByte = "00010001";

        if (encodedData.length < requiredBits) {
            const missingBits = requiredBits - encodedData.length;

            const missingBytes = missingBits / 8;

            if (missingBytes % 2 == 0) {
                encodedData += (firstPaddingByte + secondPaddingByte).repeat(
                    missingBytes,
                );
            } else {
                encodedData +=
                    (firstPaddingByte + secondPaddingByte).repeat(
                        Math.floor(missingBytes / 2),
                    ) + firstPaddingByte;
            }
        }

        return encodedData;
    }

    createFormatString(qrCodeType, mask) {
        let formatString = "";

        formatString += this.ERROR_CORRECTION_BITS[qrCodeType.level];

        formatString += mask.toString(2).padStart(3, "0");

        let errorCorrectionBits = this.generateFormatCorrectionBits(
            [...formatString].map((e) => Number.parseInt(e)),
            [...this.formatErrorCorrectionPolynomial].map((e) =>
                Number.parseInt(e),
            ),
        );

        formatString = [...formatString];
        formatString.push(...errorCorrectionBits);

        let maskString = [..."101010000010010"].map((e) => Number.parseInt(e));

        for (let i = 0; i < formatString.length; i++) {
            let tmp = formatString[i] ^ maskString[i];
            formatString[i] = tmp;
        }

        return formatString;
    }

    encodeDataWithECC(data) {
        const qrCodeType = this.getMinVersion(data);

        let encodedData = this.encodeData(data);

        // Error correction steps

        const messagePolynomial = this.createMessagePolynomial(encodedData);

        const generatorPolynomial = this.createGeneratorPolynomial(
            TABELA_ECC[qrCodeType.getNotation()][1],
        );

        let intermediatePolynomial = this.generateErrorCorrectionCodewords(
            messagePolynomial,
            generatorPolynomial,
        );

        // adicionando codewords de correção de erro na string de dados
        intermediatePolynomial.map((e) => {
            encodedData += e.toString(2).padStart(8, "0");
        });

        return encodedData;
    }
}
