#include <ArduinoJson.h>
#include <ESPAsyncWebServer.h>
#include <M5Unified.h>
#include <SPIFFS.h>
#include <map>
#include <string>

#include "env.h"

M5GFX display;
LGFX_Sprite sprite(&display);
String receivedData;
AsyncWebServer server(80);

void setup() {
  M5.begin();
  Serial.begin(115200);

  display.begin();
  display.clear(TFT_WHITE);
  display.setColorDepth(1);
  display.setEpdMode(epd_mode_t::epd_fastest);

  sprite.setColorDepth(1);
  sprite.createSprite(200, 200);

  WiFi.softAP("M5Stack Wi-Fi AP", "123456789");
  IPAddress IP = WiFi.softAPIP();

  sprite.clear(TFT_WHITE);
  sprite.qrcode("WIFI:S:M5Stack Wi-Fi AP;T:WPA;P:123456789;;", 30, 50, 150, 6);
  sprite.setCursor(20, 10);
  sprite.setTextSize(1);
  sprite.setTextColor(TFT_BLACK);
  sprite.println("SSID: M5Stack Wi-Fi AP");
  sprite.pushSprite(0, 0);

  if (!SPIFFS.begin()) {
    M5.Lcd.println("SPIFFS Mount Failed");
    return;
  }

  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(SPIFFS, "/index.html", "text/html");
  });

  server.serveStatic("/assets/", SPIFFS, "/assets/");

  server.on(
      "/upload", HTTP_POST, [](AsyncWebServerRequest *request) {}, NULL,
      [](AsyncWebServerRequest *request, uint8_t *data, size_t len,
         size_t index, size_t total) {
        for (size_t i = 0; i < len; i++) {
          receivedData += (char)data[i];
        }

        if (index + len == total) {
          StaticJsonDocument<4096> doc;
          DeserializationError error = deserializeJson(doc, receivedData);
          if (error) {
            Serial.print(F("deserializeJson() failed: "));
            Serial.println(error.f_str());
            return;
          }

          Serial.println("JSON Data received and parsed");
          JsonArray arr = doc["data"];

          sprite.clear(TFT_WHITE);
          sprite.pushSprite(0, 0);

          for (int y = 0; y < arr.size(); y++) {
            const char *row = arr[y];
            for (int x = 0; x < strlen(row); x++) {
              int color = row[x] == '1' ? TFT_WHITE : TFT_BLACK;
              sprite.drawPixel(x, y, color);
            }
          }
          sprite.pushSprite(0, 0);
          receivedData = "";

          request->send(200, "application/json", "{\"status\": \"ok\"}");
        }
      });

  server.begin();
}

void loop() {}
