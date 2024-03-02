import { useEffect, useState } from "preact/hooks";

export const ImageList = () => {
  const images = [
    {
      data: [...Array(200)].map(() =>
        [...Array(200)].map(() => Math.floor(Math.random() * 2)).join(""),
      ),
    },
  ];

  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => {
    const urls = images.map((image) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = 200;
      canvas.height = 200;

      image.data.forEach((row, y) => {
        row.split("").forEach((pixel, x) => {
          if (!ctx) return;
          ctx.fillStyle = pixel === "1" ? "black" : "white";
          ctx.fillRect(x, y, 1, 1);
        });
      });

      return canvas.toDataURL();
    });

    setImageUrls(urls);
  }, []);

  return (
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
                style={{ margin: "10px", width: "50px" }}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
