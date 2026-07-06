const qrcode = document.getElementById("qrcode__code");
const qrcodeSize = document.getElementById("qrcode__size");

// Para o primeiro teste, o objetivo é criar um qrcode 21x21 capaz de me
// redirecionar para um vídeo do youtube
let link = "https://youtu.be/dQw4w9WgXcQ?si=M-bihjX-dQRfabe2";
let data = "";

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

requiredBits = 55 * 8;
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

firstPaddingByte = "11101100";
secondPaddingByte = "00010001";

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

console.log(data)
console.log(data.length)

// [QUINTO PASSO]: Correção de erros

// Primeira parte: separar data codewords em blocos se necessário (consultar
// tabela de correção de erros)

console.log(data.length / 8)

for (let i = 0; i < 21; i++) {
    for (let j = 0; j < 21; j++) {
        const block = document.createElement("span");
        if ((i + j) % 2 == 0) block.style = "background-color: black";
        qrcode.appendChild(block);
    }
}
