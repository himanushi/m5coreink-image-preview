import { useCallback, useState } from "preact/hooks";

export const SlideShow = () => {
  const [interval, setInterval] = useState(5);

  const start = useCallback(() => {
    if (
      confirm(
        "スライドショーを開始しますか？開始後に再度設定したい場合は再起動してください。",
      )
    ) {
      fetch("/slideshow/start", { method: "POST" });
    }
  }, [interval]);

  return (
    <div>
      <h2>SlideShow</h2>
      <label>Interval</label>
      <input
        type="number"
        placeholder="Interval"
        value={interval}
        onChange={(e) =>
          setInterval(Number((e.target as HTMLInputElement).value))
        }
      />
      <button type="button" onClick={start}>
        Start
      </button>
    </div>
  );
};
