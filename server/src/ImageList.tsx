import "css.gg/icons/css/trash.css";
import { useEffect, useState } from "preact/hooks";

type Image = {
  name: string;
  data: string;
};

export const ImageList = () => {
  const [imagesData, setImagesData] = useState<Image[]>([]);

  const loadImages = async () => {
    setImagesData([]);
    const data = await fetch("/sort.json");
    const imageNames = await data.json();
    for (const name of imageNames) {
      const image = await fetch(`/images/${name}`);
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

      setImagesData((prev) => [...prev, { name, data: canvas.toDataURL() }]);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  const deleteImage = (name: string) => async () => {
    await fetch(`/images?name=${name}`, {
      method: "DELETE",
    });
    loadImages();
  };

  const putImage = (name: string) => async () => {
    await fetch(`/images/display?name=${name}`);
  };

  return (
    <div>
      <h2>Image List</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Image</th>
            <th scope="col">Delete</th>
          </tr>
        </thead>
        <tbody>
          {imagesData.map((image, index) => (
            <tr>
              <th scope="row">{index + 1}</th>
              <td>
                <img
                  key={index.toString()}
                  src={image.data}
                  alt="imag"
                  style={{ width: "100px", cursor: "pointer" }}
                  onClick={putImage(image.name)}
                />
              </td>
              <td>
                <button
                  class="contrast"
                  type="button"
                  style="color:rgb(241, 121, 97)"
                  onClick={deleteImage(image.name)}
                >
                  <div class="gg-trash" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
