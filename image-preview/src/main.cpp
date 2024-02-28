#include <ArduinoJson.h>
#include <ESPAsyncWebServer.h>
#include <M5Unified.h>
#include <SPIFFS.h>
#include <map>
#include <string>

#include "env.h"

M5GFX display;
AsyncWebServer server(80);

void setup() {
  M5.begin();
  display.begin();
  Serial.begin(115200);

  WiFi.softAP("M5Stack Wi-Fi AP", "123456789");
  IPAddress IP = WiFi.softAPIP();

  display.fillScreen(TFT_WHITE);

  if (!SPIFFS.begin()) {
    M5.Lcd.println("SPIFFS Mount Failed");
    return;
  }

  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(SPIFFS, "/index.html", "text/html");
  });
  server.serveStatic("/assets/", SPIFFS, "/assets/");
  server.on(
      "/settings", HTTP_POST, [](AsyncWebServerRequest *request) {}, NULL,
      [](AsyncWebServerRequest *request, uint8_t *data, size_t len,
         size_t index, size_t total) {
        if (!index) {
          request->_tempFile = SPIFFS.open("/setting_values.json", "w");
        }
        if (request->_tempFile) {
          request->_tempFile.write(data, len);
        }
        if (index + len == total) {
          request->_tempFile.close();
        }
        request->send(200, "application/json", "{\"result\":\"Success!!\"}");
      });

  server.begin();
}

void loop() {}
