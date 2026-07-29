const imageInput = document.getElementById("imageInput");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const compressBtn = document.getElementById("compressBtn");
const qualitySlider = document.getElementById("quality");
const qualityValue = document.getElementById("qualityValue");
const sizeInfo = document.getElementById("sizeInfo");

let originalImage = null;

qualitySlider.addEventListener("input", () => {
    qualityValue.textContent = qualitySlider.value;
});

imageInput.addEventListener("change", (e) => {

    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(event){

        const img = new Image();

        img.onload = function(){

            originalImage = img;

            canvas.width = img.width;
            canvas.height = img.height;

            ctx.drawImage(img, 0, 0);

            sizeInfo.innerHTML =
                `Original Size: ${(file.size/1024).toFixed(2)} KB`;
        };

        img.src = event.target.result;
    };

    reader.readAsDataURL(file);
});


/*
    Divide & Conquer Compression

    Divide image into 4 parts recursively.
    Compress each part independently.
*/

function divideAndCompress(x, y, width, height, depth){

    if(depth === 0 || width < 50 || height < 50){

        const imageData = ctx.getImageData(x, y, width, height);

        for(let i=0; i<imageData.data.length; i+=4){

            imageData.data[i] =
                Math.floor(imageData.data[i] / 20) * 20;

            imageData.data[i+1] =
                Math.floor(imageData.data[i+1] / 20) * 20;

            imageData.data[i+2] =
                Math.floor(imageData.data[i+2] / 20) * 20;
        }

        ctx.putImageData(imageData, x, y);

        return;
    }

    let halfW = Math.floor(width / 2);
    let halfH = Math.floor(height / 2);

    divideAndCompress(x, y, halfW, halfH, depth - 1);

    divideAndCompress(x + halfW, y,
        width - halfW, halfH, depth - 1);

    divideAndCompress(x, y + halfH,
        halfW, height - halfH, depth - 1);

    divideAndCompress(x + halfW, y + halfH,
        width - halfW,
        height - halfH,
        depth - 1);
}


compressBtn.addEventListener("click", () => {

    if(!originalImage){
        alert("Please upload an image first.");
        return;
    }

    canvas.width = originalImage.width;
    canvas.height = originalImage.height;

    ctx.drawImage(originalImage, 0, 0);

    divideAndCompress(
        0,
        0,
        canvas.width,
        canvas.height,
        4
    );

    const quality = parseFloat(qualitySlider.value);

    canvas.toBlob((blob) => {

        const compressedSize =
            (blob.size / 1024).toFixed(2);

        sizeInfo.innerHTML +=
            `<br>Compressed Size: ${compressedSize} KB`;

        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "compressed-image.jpg";
        a.textContent = "Download Compressed Image";

        const oldLink =
            document.getElementById("downloadLink");

        if(oldLink) oldLink.remove();

        a.id = "downloadLink";
        a.style.display = "block";
        a.style.marginTop = "10px";

        document.querySelector(".container")
            .appendChild(a);

    }, "image/jpeg", quality);
});