import { SlideShow } from "./SlideShow";
import { UploadArea } from "./UploadArea";

export function App() {
  return (
    <div>
      <h1 style="--pico-color:var(--pico-primary)">Micro Photo Frame</h1>
      <SlideShow />
      <UploadArea />
    </div>
  );
}
