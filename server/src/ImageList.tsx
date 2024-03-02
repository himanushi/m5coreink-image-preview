import { useEffect, useState } from "preact/hooks";

export const ImageList = () => {
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const data = await fetch("/sort.json");
      const imageFiles = await data.json();
      const urls = [];
      for (const imageFile of imageFiles) {
        const image = await fetch(`/images/${imageFile}`);
        const imageData = await image.json();

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = 200;
        canvas.height = 200;

        imageData.data.forEach((row: string, y: number) => {
          row.split("").forEach((pixel, x) => {
            if (!ctx) return;
            ctx.fillStyle = pixel === "1" ? "black" : "white";
            ctx.fillRect(x, y, 1, 1);
          });
        });

        urls.push(canvas.toDataURL());
      }
      setImageUrls(urls);
    })();
  }, []);

  return (
    <div>
      <h2>Image List</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">image</th>
          </tr>
        </thead>
        <tbody>
          {imageUrls.map((url, index) => (
            <tr>
              <th scope="row">{index + 1}</th>
              <td>
                <img
                  key={index.toString()}
                  src={url}
                  alt="imag"
                  style={{ width: "100px" }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
