const qrcode = document.getElementById("qrcode__code");
const qrcodeSize = document.getElementById("qrcode__size");

let data = [];

for (let i = 0; i < 21; i++) {
    for (let j = 0; j < 21; j++) {
        const block = document.createElement("span");
        block.className = "bit";
        data[i] = block;
        qrcode.appendChild(block);
    }
}
