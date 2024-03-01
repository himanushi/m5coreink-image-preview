import Cropper from "cropperjs";
import "cropperjs/dist/cropper.min.css";
import { useEffect, useRef, useState } from "preact/hooks";

export function App() {
  const [imageSrc, setImageSrc] = useState("");
  const imageRef = useRef<HTMLImageElement>(null);
  const [cropper, setCropper] = useState<Cropper>();

  const handleImageChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files ? target.files[0] : null;
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const img = new Image();
        img.onload = () => {
          const maxWidth = 800;
          const maxHeight = 800;
          let { width, height } = img;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          // canvasを使用して画像をリサイズ
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          ctx.drawImage(img, 0, 0, width, height);

          // リサイズした画像のデータURLを取得して状態に設定
          const resizedImgUrl = canvas.toDataURL("image/jpeg");
          setImageSrc(resizedImgUrl);
        };
        img.src = e.target.result as string;
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
          if (!ctx) return;
          ctx.drawImage(img, 0, 0, 200, 200);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
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

          fetch("/upload", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ data: matrix }),
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
          style={{ maxHeight: "200px" }}
        />
      )}
      <button type="submit" onClick={uploadImage}>
        画像をアップロード
      </button>
    </div>
  );
}
