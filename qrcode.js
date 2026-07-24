import TABELA_ECC from "./tabela_ecc.json" with { type: "json" };
import ALIGNMENT_PATTERN_TABLE from "./alignment_table.json" with { type: "json" };
import CHAR_CAPACITIES_TABLE from "./char_capacities_table.json" with { type: "json" };

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

export default class QrCode {
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
    createGenPolynomial(n) {
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
        return polinomio;
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

    drawFinderPattern(topLeftCornerX, topLeftCornerY, matrix) {
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
                        matrix[topLeftCornerX + x][topLeftCornerY + y].drew =
                            true;
                    } else {
                        if (x > 1 && x < 5 && y > 1 && y < 5) {
                            matrix[topLeftCornerX + x][
                                topLeftCornerY + y
                            ].block.style.backgroundColor = "black";
                            matrix[topLeftCornerX + x][
                                topLeftCornerY + y
                            ].drew = true;
                        } else {
                            matrix[topLeftCornerX + x][
                                topLeftCornerY + y
                            ].block.style.backgroundColor = "white";
                            matrix[topLeftCornerX + x][
                                topLeftCornerY + y
                            ].drew = true;
                        }
                    }
                }
            }
        }
    }

    drawFinderSeparators(cornerX, cornerY, matrix) {
        const directionX = cornerX > matrix.length - cornerX ? 1 : -1;
        const directionY = cornerY > matrix.length - cornerY ? 1 : -1;

        for (let i = 0; i <= 7; i++) {
            matrix[cornerX + i * directionX][
                cornerY
            ].block.style.backgroundColor = "white";
            matrix[cornerX][
                cornerY + i * directionY
            ].block.style.backgroundColor = "white";
            matrix[cornerX + i * directionX][cornerY].drew = true;
            matrix[cornerX][cornerY + i * directionY].drew = true;
        }
    }

    drawAlignmentPattern(centerX, centerY, matrix) {
        const startX = centerX - 2;
        const startY = centerY - 2;

        // verificar perimetro
        for (let x = 0; x < 5; x++) {
            for (let y = 0; y < 5; y++) {
                if (matrix[startX + x][startY + y].drew == true) {
                    console.log(
                        "retorno em " + (startX + x) + " " + (startY + y),
                    );
                    return;
                }
            }
        }

        // desenhar linhas horizontais
        for (let i = 0; i < 5; i++) {
            matrix[startX][startY + i].block.style.backgroundColor = "black";
            matrix[startX][startY + i].drew = true;
            matrix[startX + 4][startY + i].block.style.backgroundColor =
                "black";
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

    // Sempre começa no mesmo ponto independente da versão então não precisa de
    // parâmetros
    drawTimingPatterns(matrix) {
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

    drawDarkModule(version, matrix) {
        // Uso "matrix.lenght - " o valor real para converter a posição (baixo->cima
        // e esquerda->direita) para o local correto na matrix (cima->baixo e
        // esquerda->direita)

        const moduleY = matrix.length - (4 * version + 9);
        const moduleX = matrix.length - 8;
        matrix[moduleX][moduleY].block.style.backgroundColor = "black";
        matrix[moduleX][moduleY].drew = true;
    }

    reserveFormatArea(matrix) {
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

    drawDataBits(data, matrix) {
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

    maskNumber0(matrix) {
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

    maskNumber1(matrix) {
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
    maskNumber2(matrix) {
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
    maskNumber3(matrix) {
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
    maskNumber4(matrix) {
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
    maskNumber5(matrix) {
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
    maskNumber6(matrix) {
        for (let row = 0; row < matrix.length; row++) {
            for (let column = 0; column < matrix.length; column++) {
                if ((((row * column) % 2) + ((row * column) % 3)) % 2 == 0) {
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
    maskNumber7(matrix) {
        for (let row = 0; row < matrix.length; row++) {
            for (let column = 0; column < matrix.length; column++) {
                if ((((row + column) % 2) + ((row * column) % 3)) % 2 == 0) {
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

    drawFormatBits(formatString, matrix) {
        let startPoint = 8;
        let i = 0;
        let counter = 0;
        while (i < 15) {
            if (
                matrix[matrix.length - 1 - counter][startPoint].block.style
                    .backgroundColor == "red"
            ) {
                matrix[matrix.length - 1 - counter][
                    startPoint
                ].block.style.backgroundColor =
                    formatString[i] == 1 ? "black" : "white";
                i++;
            }
            counter++;
        }

        i = 0;
        counter = 0;
        while (i < 15) {
            if (
                matrix[startPoint][counter].block.style.backgroundColor == "red"
            ) {
                matrix[startPoint][counter].block.style.backgroundColor =
                    formatString[i] == 1 ? "black" : "white";
                i++;
            }

            counter++;
        }
        for (let i = 0; i < 15; i++) {}
        for (let i = 0; i < 15; i++) {}
    }

    getMinVersion(link) {
        for (const versionKey in CHAR_CAPACITIES_TABLE) {
            const version = CHAR_CAPACITIES_TABLE[versionKey];
            for (const levelKey in version) {
                const level = version[levelKey];
                if (level[2] >= link.length)
                    return new QrCodeType(versionKey, levelKey);
            }
        }
        return -1;
    }
}

class QrCodeType {
    constructor(version, level) {
        this.version = version;
        this.level = level;
    }
    version;
    level;
}
