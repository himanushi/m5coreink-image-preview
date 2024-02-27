const { tags } = van;

const Settings = async () => {
  const groups = await fetch("/setting_options.json")
    .then((res) => res.json())
    .catch(() => []);
  const values = await fetch("/setting_values.json")
    .then((res) => res.json())
    .catch(() => ({}));

  const formData = values;

  const onInput = (setting, e) => (formData[setting.key] = e.target.value);

  const SaveButton = () => {
    const buttonLabel = van.state("");

    const onSave = () => {
      buttonLabel.val = "";
      fetch("/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
        .then((response) => response.json())
        .then((data) => (buttonLabel.val = data.result))
        .catch((error) => (buttonLabel.val = "Error"));
    };

    return tags.div([
      tags.label(van.derive(() => buttonLabel.val)),
      tags.button({ onclick: onSave, type: "submit" }, "Save"),
    ]);
  };

  const Input = ({ setting }) => {
    if (setting.type === "select") {
      return tags.select(
        {
          name: setting.name,
          oninput: (e) => onInput(setting, e),
          value: formData[setting.key] ? formData[setting.key] : null,
        },
        setting.options.map((option) =>
          option.value === formData[setting.key]
            ? tags.option({ selected: true, value: option.value }, option.label)
            : tags.option({ value: option.value }, option.label),
        ),
      );
    }
    return tags.input({
      type: setting.type,
      name: setting.name,
      oninput: (e) => onInput(setting, e),
      autocomplete: "new-password",
      value: formData[setting.key] ? formData[setting.key] : null,
    });
  };

  return tags.div(
    ...groups.map((group) => [
      tags.h2(group.category),
      ...group.settings.map((setting) => [
        tags.label(setting.label),
        Input({ setting }),
      ]),
    ]),
    tags.div({ class: "grid" }, SaveButton()),
  );
};

(async () => {
  van.add(document.getElementById("main"), [
    tags.h1({ style: "--pico-color:var(--pico-primary)" }, "Settings"),
    await Settings(),
  ]);
})();
