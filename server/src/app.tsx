import Cropper from "cropperjs";
import "cropperjs/dist/cropper.min.css";
import { useEffect, useRef, useState } from "preact/hooks";

export function App() {
  const [imageSrc, setImageSrc] = useState("");
  const [binaryMatrix, setBinaryMatrix] = useState<string[]>([]);
  const imageRef = useRef<HTMLImageElement>(null);
  const [cropper, setCropper] = useState<Cropper>();

  const handleImageChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files ? target.files[0] : null;
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (imageRef.current && imageSrc) {
      if (cropper) {
        cropper.destroy();
      }

      const cropperInstance = new Cropper(imageRef.current, {
        aspectRatio: 1,
        crop: () => {},
      });
      setCropper(cropperInstance);
    }
  }, [imageSrc]);

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

  const convertToMonochromeAndResize = () => {
    if (!cropper) return;

    cropper.getCroppedCanvas({ width: 200, height: 200 }).toBlob((blob) => {
      if (!blob) return;
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64data = reader.result;
        const img = new Image();
        img.src = base64data as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = 200;
          canvas.height = 200;
          ctx?.drawImage(img, 0, 0, 200, 200);
          const imageData = ctx?.getImageData(
            0,
            0,
            canvas.width,
            canvas.height,
          );
          if (!imageData) return;

          const matrix: string[] = [];
          for (let y = 0; y < imageData.height; y++) {
            let row = "";
            for (let x = 0; x < imageData.width; x++) {
              const index = (y * imageData.width + x) * 4;
              const r = imageData.data[index];
              const g = imageData.data[index + 1];
              const b = imageData.data[index + 2];
              const brightness = 0.34 * r + 0.5 * g + 0.16 * b;
              row += brightness > 128 ? "1" : "0";
            }
            matrix.push(row);
          }
          setBinaryMatrix(matrix);
        };
      };
    }, "image/png");
  };

  return (
    <div>
      <input type="file" onChange={handleImageChange} accept="image/*" />
      {imageSrc && (
        <img
          alt="imag"
          ref={imageRef}
          src={imageSrc}
          style={{ maxWidth: "100%" }}
        />
      )}
      <button type="button" onClick={convertToMonochromeAndResize}>
        トリミングして変換
      </button>
      <button type="submit" onClick={uploadImage}>
        画像をアップロード
      </button>
    </div>
  );
}
