#ifndef ENV_H
#define ENV_H

#include <ArduinoJson.h>
#include <SPIFFS.h>

String getEnvValue(const char *key) {
  if (!SPIFFS.begin(true)) {
    Serial.println("An Error has occurred while mounting SPIFFS");
    return "";
  }

  File file = SPIFFS.open("/setting_values.json", "r");
  if (!file) {
    Serial.println("Failed to open file for reading");
    return "";
  }

  StaticJsonDocument<2000> doc;
  DeserializationError error = deserializeJson(doc, file);
  if (error) {
    Serial.println("Failed to read file, using default configuration");
    file.close();
    return "";
  }

  file.close();

  const char *value = doc[key];
  if (value) {
    return String(value);
  } else {
    return "";
  }
}

#endif
