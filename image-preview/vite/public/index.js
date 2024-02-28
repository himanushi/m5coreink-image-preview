const { tags, state, derive } = van;

function convertImageToBlackAndWhite(src, callback) {
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const brightness =
        0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];
      const color = brightness < 128 ? 0 : 255;
      data[i] = data[i + 1] = data[i + 2] = color;
    }
    ctx.putImageData(imageData, 0, 0);
    callback(canvas);
  };
  img.src = src;
}

// 画像アップロードとプレビュー表示機能
const ImageUploadAndPreview = () => {
  const imageUrl = state("");

  const onImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => (imageUrl.val = e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const imagePreview = derive(() => {
    return imageUrl.val
      ? tags.img({
          src: imageUrl.val,
          style: "max-width: 100%; max-height: 400px;",
        })
      : "";
  });

  return tags.div([
    tags.input({ type: "file", accept: "image/*", oninput: onImageChange }),
    imagePreview,
  ]);
};

// 画像操作機能のダミー（実際の画像処理機能は別途実装が必要）
const ImageOperations = () => {
  return tags.div([
    tags.button({ onclick: () => alert("画像を白黒に変換") }, "白黒変換"),
    tags.button({ onclick: () => alert("画像をトリミング") }, "トリミング"),
  ]);
};

// メイン関数
(async () => {
  van.add(document.getElementById("main"), [
    tags.h1("画像アップロードと編集"),
    ImageUploadAndPreview(),
    ImageOperations(),
  ]);
})();
