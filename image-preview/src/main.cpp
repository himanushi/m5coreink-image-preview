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

  server.on("/images/sort", HTTP_GET, [](AsyncWebServerRequest *request) {
    if (SPIFFS.exists("/images/sort_images.json")) {
      request->send(SPIFFS, "/images/sort_images.json", "application/json");
    } else {
      File root = SPIFFS.open("/images/");
      String fileList = "[";
      File file = root.openNextFile();
      while (file) {
        String fileName = String(file.name());
        if (fileName.startsWith("/images/image_") &&
            fileName.endsWith(".json")) {
          if (fileList != "[")
            fileList += ", ";
          fileName = fileName.substring(String("/images/").length());
          fileList += "\"" + fileName + "\"";
        }
        file = root.openNextFile();
      }
      fileList += "]";
      request->send(200, "application/json", fileList);
    }
  });

  server.on(
      "/images/sort", HTTP_POST, [](AsyncWebServerRequest *request) {}, NULL,
      [](AsyncWebServerRequest *request, uint8_t *data, size_t len,
         size_t index, size_t total) {
        for (size_t i = 0; i < len; i++) {
          receivedData += (char)data[i];
        }

        if (index + len == total) {
          File file = SPIFFS.open("/images/sort_images.json", FILE_WRITE);
          if (!file) {
            request->send(500, "application/json",
                          "{\"status\": \"error\", \"message\": \"Failed to "
                          "open file for writing.\"}");
            receivedData = "";
            return;
          }
          file.close();
          request->send(200, "application/json", "{\"status\": \"ok\"}");
          receivedData = "";
        }
      });

  server.on(
      "/images", HTTP_POST, [](AsyncWebServerRequest *request) {}, NULL,
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

          String filePath = "/data/images/image_" + String(millis()) + ".json";
          File file = SPIFFS.open(filePath, FILE_WRITE);
          if (!file) {
            Serial.println("ファイルの作成に失敗しました");
            request->send(500, "application/json", "{\"status\": \"error\"}");
            return;
          }
          if (serializeJson(doc, file) == 0) {
            Serial.println("JSONデータの保存に失敗しました");
            file.close();
            request->send(500, "application/json", "{\"status\": \"error\"}");
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
