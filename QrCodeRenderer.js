import ALIGNMENT_PATTERN_TABLE from "./alignment-table.json" with { type: "json" };
import { Module } from "./QrCodeTypes.js";

export default class QrCodeRenderer {
    matrix = [];

    drawFinderPattern(topLeftCornerX, topLeftCornerY) {
        for (let x = 0; x < 7; x++) {
            for (let y = 0; y < 7; y++) {
                if (x == 0 || x == 6) {
                    this.matrix[topLeftCornerX + x][
                        topLeftCornerY + y
                    ].block.style.backgroundColor = "black";
                    this.matrix[topLeftCornerX + x][topLeftCornerY + y].drew =
                        true;
                } else {
                    if (y == 0 || y == 6) {
                        this.matrix[topLeftCornerX + x][
                            topLeftCornerY + y
                        ].block.style.backgroundColor = "black";
                        this.matrix[topLeftCornerX + x][
                            topLeftCornerY + y
                        ].drew = true;
                    } else {
                        if (x > 1 && x < 5 && y > 1 && y < 5) {
                            this.matrix[topLeftCornerX + x][
                                topLeftCornerY + y
                            ].block.style.backgroundColor = "black";
                            this.matrix[topLeftCornerX + x][
                                topLeftCornerY + y
                            ].drew = true;
                        } else {
                            this.matrix[topLeftCornerX + x][
                                topLeftCornerY + y
                            ].block.style.backgroundColor = "white";
                            this.matrix[topLeftCornerX + x][
                                topLeftCornerY + y
                            ].drew = true;
                        }
                    }
                }
            }
        }
    }

    drawFinderSeparators(cornerX, cornerY) {
        const directionX = cornerX > this.matrix.length - cornerX ? 1 : -1;
        const directionY = cornerY > this.matrix.length - cornerY ? 1 : -1;

        for (let i = 0; i <= 7; i++) {
            this.matrix[cornerX + i * directionX][
                cornerY
            ].block.style.backgroundColor = "white";
            this.matrix[cornerX][
                cornerY + i * directionY
            ].block.style.backgroundColor = "white";
            this.matrix[cornerX + i * directionX][cornerY].drew = true;
            this.matrix[cornerX][cornerY + i * directionY].drew = true;
        }
    }

    drawAlignmentPattern(centerX, centerY) {
        const startX = centerX - 2;
        const startY = centerY - 2;

        // verificar perimetro
        for (let x = 0; x < 5; x++) {
            for (let y = 0; y < 5; y++) {
                if (this.matrix[startX + x][startY + y].drew == true) {
                    return;
                }
            }
        }

        // desenhar linhas horizontais
        for (let i = 0; i < 5; i++) {
            this.matrix[startX][startY + i].block.style.backgroundColor =
                "black";
            this.matrix[startX][startY + i].drew = true;
            this.matrix[startX + 4][startY + i].block.style.backgroundColor =
                "black";
            this.matrix[startX + 4][startY + i].drew = true;
        }

        this.matrix[centerX][centerY].block.style.backgroundColor = "black";
        this.matrix[centerX][centerY].drew = true;

        // desenhar linhas verticais e pintar o fundo de branco
        for (let i = 0; i < 5; i++) {
            if (i == 0 || i == 4) {
                this.matrix[startX + 1][
                    startY + i
                ].block.style.backgroundColor = "black";
                this.matrix[startX + 1][startY + i].drew = true;

                this.matrix[startX + 2][
                    startY + i
                ].block.style.backgroundColor = "black";
                this.matrix[startX + 2][startY + i].drew = true;

                this.matrix[startX + 3][
                    startY + i
                ].block.style.backgroundColor = "black";
                this.matrix[startX + 3][startY + i].drew = true;
            } else {
                this.matrix[startX + 1][
                    startY + i
                ].block.style.backgroundColor = "white";
                this.matrix[startX + 1][startY + i].drew = true;

                if (!this.matrix[startX + 2][startY + i].drew) {
                    this.matrix[startX + 2][
                        startY + i
                    ].block.style.backgroundColor = "white";
                }
                this.matrix[startX + 2][startY + i].drew = true;

                this.matrix[startX + 3][
                    startY + i
                ].block.style.backgroundColor = "white";
                this.matrix[startX + 3][startY + i].drew = true;
            }
        }
    }

    // Sempre começa no mesmo ponto independente da versão então não precisa de
    // parâmetros
    drawTimingPatterns() {
        const startPoint = 6; // posição (6;6)

        for (let i = 0; i < this.matrix.length - startPoint; i++) {
            // linha horizontal
            if (!this.matrix[startPoint][startPoint + i].drew) {
                this.matrix[startPoint][
                    startPoint + i
                ].block.style.backgroundColor = i % 2 == 0 ? "black" : "white";
                this.matrix[startPoint][startPoint + i].drew = true;
            }

            // linha vertical
            if (!this.matrix[startPoint + i][startPoint].drew) {
                this.matrix[startPoint + i][
                    startPoint
                ].block.style.backgroundColor = i % 2 == 0 ? "black" : "white";

                this.matrix[startPoint + i][startPoint].drew = true;
            }
        }
    }

    drawDarkModule(version) {
        // Uso "matrix.lenght - " o valor real para converter a posição (baixo->cima
        // e esquerda->direita) para o local correto na matrix (cima->baixo e
        // esquerda->direita)

        const moduleY = this.matrix.length - (4 * version + 9);
        const moduleX = this.matrix.length - 8;
        this.matrix[moduleX][moduleY].block.style.backgroundColor = "black";
        this.matrix[moduleX][moduleY].drew = true;
    }

    reserveFormatArea() {
        const start = 8; // tamanho do finder pattern + borda

        this.matrix[start][start].block.style.backgroundColor = "red";
        this.matrix[start][start].drew = true;

        // linha horizontal
        for (let y = 0; y < this.matrix.length; y++) {
            if (this.matrix[start - 1][y].drew) {
                if (!this.matrix[start][y].drew) {
                    this.matrix[start][y].block.style.backgroundColor = "red";
                    this.matrix[start][y].drew = true;
                }
            }
        }

        // linha vertical
        for (let x = 0; x < this.matrix.length; x++) {
            if (this.matrix[x][start - 1].drew) {
                if (!this.matrix[x][start].drew) {
                    this.matrix[x][start].block.style.backgroundColor = "red";
                    this.matrix[x][start].drew = true;
                }
            }
        }
    }

    drawDataBits(data) {
        // Começa da ponta direita subindo
        let direction = -1;
        let size = this.matrix.length - 1;
        let bitCounter = 0;
        for (let y = this.matrix.length - 1; y >= 0; y -= 2) {
            // regra para pular timing pattern
            if (y == 6) y -= 1;

            for (let x = 0; x < this.matrix.length; x++) {
                if (direction < 0) {
                    // subindo

                    // direita
                    if (!this.matrix[size + x * direction][y].drew) {
                        this.matrix[size + x * direction][
                            y
                        ].block.style.backgroundColor =
                            data[bitCounter] == 1 ? "black" : "white";
                        bitCounter++;
                    }

                    // esquerda
                    if (!this.matrix[size + x * direction][y - 1].drew) {
                        this.matrix[size + x * direction][
                            y - 1
                        ].block.style.backgroundColor =
                            data[bitCounter] == 1 ? "black" : "white";
                        bitCounter++;
                    }
                } else {
                    // descendo

                    // direito
                    if (!this.matrix[x][y].drew) {
                        this.matrix[x][y].block.style.backgroundColor =
                            data[bitCounter] == 1 ? "black" : "white";
                        bitCounter++;
                    }

                    // esquerdo
                    if (!this.matrix[x][y - 1].drew) {
                        this.matrix[x][y - 1].block.style.backgroundColor =
                            data[bitCounter] == 1 ? "black" : "white";
                        bitCounter++;
                    }
                }
            }
            direction *= -1;
        }
    }

    drawFormatBits(formatString) {
        let startPoint = 8;
        let i = 0;
        let counter = 0;
        while (i < 15) {
            if (
                this.matrix[this.matrix.length - 1 - counter][startPoint].block
                    .style.backgroundColor == "red"
            ) {
                this.matrix[this.matrix.length - 1 - counter][
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
                this.matrix[startPoint][counter].block.style.backgroundColor ==
                "red"
            ) {
                this.matrix[startPoint][counter].block.style.backgroundColor =
                    formatString[i] == 1 ? "black" : "white";
                i++;
            }

            counter++;
        }
        for (let i = 0; i < 15; i++) {}
        for (let i = 0; i < 15; i++) {}
    }

    createMatrix(div, qrCodeSize) {
        const matrix = [];

        for (let i = 0; i < qrCodeSize; i++) {
            const linha = [];
            for (let j = 0; j < qrCodeSize; j++) {
                const block = document.createElement("span");
                if ((i + j) % 2 == 0) {
                    block.style = "background-color: white";
                } else {
                    block.style = "background-color: white";
                }
                div.appendChild(block);
                linha.push(new Module(block));
            }
            matrix.push(linha);
        }

        div.style.grid = `repeat(${qrCodeSize}, 1fr) / repeat(${qrCodeSize}, 1fr)`;
        this.matrix = matrix;
        return matrix;
    }

    drawMask(number) {
        for (let row = 0; row < this.matrix.length; row++) {
            for (let column = 0; column < this.matrix.length; column++) {
                if (!this.matrix[row][column].drew) {
                    let isMasked = false;
                    switch (number) {
                        case 0:
                            isMasked = (row + column) % 2 == 0;
                            break;
                        case 1:
                            isMasked = row % 2 == 0;
                            break;
                        case 2:
                            isMasked = column % 3 == 0;
                            break;
                        case 3:
                            isMasked = (row + column) % 3 == 0;
                            break;
                        case 4:
                            isMasked =
                                (Math.floor(row / 2) + Math.floor(column / 3)) %
                                    2 ==
                                0;
                            break;
                        case 5:
                            isMasked =
                                ((row * column) % 2) + ((row * column) % 3) ==
                                0;
                            break;
                        case 6:
                            isMasked =
                                (((row * column) % 2) + ((row * column) % 3)) %
                                    2 ==
                                0;
                            break;
                        case 7:
                            isMasked =
                                (((row + column) % 2) + ((row * column) % 3)) %
                                    2 ==
                                0;
                            break;
                        default:
                            console.log("ERRO NA APLICAÇÃO DA MÁSCARA");
                            return;
                    }
                    if (isMasked) {
                        this.matrix[row][column].block.style.backgroundColor =
                            this.matrix[row][column].block.style
                                .backgroundColor == "black"
                                ? "white"
                                : "black";
                    }
                }
            }
        }
        return number;
    }

    drawBase(qrCodeType) {
        // canto superior esquerdo
        this.drawFinderPattern(0, 0);
        this.drawFinderSeparators(7, 7);

        // canto superior direito
        this.drawFinderPattern(0, this.matrix.length - 7);
        this.drawFinderSeparators(7, this.matrix.length - 8);

        // canto inferior esquerdo
        this.drawFinderPattern(this.matrix.length - 7, 0);
        this.drawFinderSeparators(this.matrix.length - 8, 7);

        // busca as posições respectivas do padrão usando a tabela oficial
        const positions = ALIGNMENT_PATTERN_TABLE[qrCodeType.version];

        // Desenha os padrões de alinhamento combinando todos os padrões de linha e
        // coluna
        positions.forEach((positionX) => {
            if (positionX != "") {
                positions.forEach((positionY) => {
                    if (positionY != "") {
                        this.drawAlignmentPattern(positionX, positionY);
                        console.log(`(${positionX} ; ${positionY} )`);
                    }
                });
            }
        });

        this.drawTimingPatterns();

        this.drawDarkModule(qrCodeType.version);

        // A área reservada independe da versão

        this.reserveFormatArea();
    }
}
