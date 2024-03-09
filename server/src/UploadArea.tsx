import Cropper from "cropperjs";
import "cropperjs/dist/cropper.min.css";
import { useEffect, useRef, useState } from "preact/hooks";
import { ImageList } from "./ImageList";

export function UploadArea() {
  const [imageSrc, setImageSrc] = useState("");
  const [loading, setLoading] = useState(false);
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

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          ctx.drawImage(img, 0, 0, width, height);

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

      setLoading(true);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, 200, 200);

        const imageData = ctx.getImageData(0, 0, 200, 200);
        for (let i = 0; i < imageData.data.length; i += 4) {
          const red = imageData.data[i];
          const green = imageData.data[i + 1];
          const blue = imageData.data[i + 2];
          // グレースケール値を計算
          const grayscale = red * 0.3 + green * 0.59 + blue * 0.11;

          // 白、黒、グレーに対応するしきい値を設定
          let color: number;
          if (grayscale > 200) {
            color = 255; // 白
          } else if (grayscale > 100) {
            color = 128; // グレー
          } else {
            color = 0; // 黒
          }

          // RGB値を更新
          imageData.data[i] = color;
          imageData.data[i + 1] = color;
          imageData.data[i + 2] = color;
        }
        ctx.putImageData(imageData, 0, 0);

        // Base64エンコードされた画像データを取得
        const base64Data = canvas.toDataURL("image/png");
        // JSONオブジェクトを作成
        const data = { data: base64Data };

        // JSONオブジェクトをサーバーにPOSTする
        fetch("/images/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        })
          .then((response) => {
            setLoading(false);
            if (response.ok) {
              alert("画像が正常にアップロードされました。");
            } else {
              throw new Error("サーバーからエラーが返されました。");
            }
          })
          .catch((error) => {
            setLoading(false);
            console.error("アップロード中にエラーが発生しました:", error);
            alert("画像のアップロードに失敗しました。");
          });
      };
      img.src = URL.createObjectURL(blob);
    }, "image/png");
  };

  return (
    <div>
      <h2>Upload Image</h2>
      <input type="file" onChange={handleImageChange} accept="image/*" />
      <div>
        {imageSrc && (
          <img
            alt="imag"
            ref={imageRef}
            src={imageSrc}
            style={{ maxHeight: "400px" }}
          />
        )}
      </div>
      <button disabled={loading} type="submit" onClick={uploadImage}>
        Upload Image
      </button>
      {!loading && <ImageList />}
    </div>
  );
}
