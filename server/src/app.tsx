import { useState } from "preact/hooks";

export function App() {
  const [image, setImage] = useState(null);
  const [binaryMatrix, setBinaryMatrix] = useState([]);

  const handleImageChange = (event: any) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        convertToMonochromeAndResize(e.target.result, (matrix: any) => {
          setBinaryMatrix(matrix);
          setImage(e.target.result);
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = () => {
    if (binaryMatrix.length === 0) {
      alert("画像が選択されていません。");
      return;
    }
    fetch("/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: binaryMatrix }),
    })
      .then((response) => {
        if (response.ok) {
          alert("画像が正常にアップロードされました。");
        } else {
          throw new Error("サーバーからエラーが返されました。");
        }
      })
      .catch((error) => {
        console.error("アップロード中にエラーが発生しました:", error);
        alert("画像のアップロードに失敗しました。");
      });
  };

  function convertToMonochromeAndResize(
    imageSrc: string,
    callback: (matrix: string[]) => void,
  ): void {
    const targetWidth = 200;
    const targetHeight = 200;

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      if (!ctx) {
        throw new Error("2Dコンテキストが取得できませんでした。");
      }

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const matrix: string[] = [];
      for (let y = 0; y < targetHeight; y++) {
        let row = "";
        for (let x = 0; x < targetWidth; x++) {
          const index = (y * targetWidth + x) * 4;
          const brightness =
            0.34 * imageData.data[index] +
            0.5 * imageData.data[index + 1] +
            0.16 * imageData.data[index + 2];
          row += brightness > 128 ? "1" : "0";
        }
        matrix.push(row);
      }
      callback(matrix);
    };
    img.src = imageSrc;
  }

  return (
    <div>
      <input type="file" onChange={handleImageChange} accept="image/*" />
      {image && (
        <img
          src={image}
          alt="Preview"
          style={{ maxWidth: "100%", maxHeight: "200px" }}
        />
      )}
      <button type="submit" onClick={uploadImage}>
        画像をアップロード
      </button>
    </div>
  );
}
