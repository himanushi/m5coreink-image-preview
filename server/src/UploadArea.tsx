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
              row += brightness > 128 ? "0" : "1";
            }
            matrix.push(row);
          }

          fetch("/images", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ data: matrix }),
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
      };
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
        画像をアップロード
      </button>
      {!loading && <ImageList />}
    </div>
  );
}
