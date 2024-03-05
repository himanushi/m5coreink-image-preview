#include <ArduinoJson.h>
#include <ESPAsyncWebServer.h>
#include <FS.h>
#include <M5Unified.h>
#include <SPIFFS.h>
#include <map>
#include <string>

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

  if (!SPIFFS.begin(true)) {
    M5.Lcd.println("SPIFFS Mount Failed");
    return;
  }

  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(SPIFFS, "/index.html", "text/html");
  });

  server.serveStatic("/assets/", SPIFFS, "/assets/");
  server.serveStatic("/images/", SPIFFS, "/images/");

  server.on("/sort.json", HTTP_GET, [](AsyncWebServerRequest *request) {
    if (SPIFFS.exists("/sort_images.json")) {
      request->send(SPIFFS, "/sort_images.json", "application/json");
    } else {
      DynamicJsonDocument doc(1024);
      JsonArray array = doc.to<JsonArray>();
      File root = SPIFFS.open("/");
      File file = root.openNextFile();

      while (file) {
        String fileName = String(file.name());
        Serial.println(fileName);
        if (fileName.startsWith("image_") && fileName.endsWith(".json")) {
          array.add(fileName);
        }
        file = root.openNextFile();
      }

      String jsonResponse;
      serializeJson(doc, jsonResponse);
      request->send(200, "application/json", jsonResponse);
    }
  });

  server.on(
      "/sort", HTTP_POST, [](AsyncWebServerRequest *request) {}, NULL,
      [](AsyncWebServerRequest *request, uint8_t *data, size_t len,
         size_t index, size_t total) {
        for (size_t i = 0; i < len; i++) {
          receivedData += (char)data[i];
        }

        if (index + len == total) {
          File file = SPIFFS.open("/sort_images.json", FILE_WRITE);
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

          String filePath = "/images/image_" + String(millis()) + ".json";
          File file = SPIFFS.open(filePath, FILE_WRITE);
          if (!file) {
            file.close();
            Serial.println("ファイルの作成に失敗しました");
            request->send(500, "application/json", "{\"status\": \"error\"}");
            return;
          }
          if (serializeJson(doc, file) == 0) {
            file.close();
            Serial.println("JSONデータの保存に失敗しました");
            request->send(500, "application/json", "{\"status\": \"error\"}");
            return;
          }

          file.close();

          Serial.println("JSON Data received and parsed");
          JsonArray arr = doc["data"];

          sprite.clear(TFT_WHITE);
          sprite.pushSprite(0, 0);

          for (int y = 0; y < arr.size(); y++) {
            const char *row = arr[y];
            for (int x = 0; x < strlen(row); x++) {
              int color;
              switch (row[x]) {
              case '0': // 白
                color = TFT_WHITE;
                break;
              case '1': // グレー
                // チェッカーボードパターンのダイザリング
                color = (x + y) % 2 == 0 ? TFT_WHITE : TFT_BLACK;
                break;
              case '2': // 黒
                color = TFT_BLACK;
                break;
              default:
                color = TFT_WHITE;
                break;
              }
              sprite.drawPixel(x, y, color);
            }
          }

          sprite.pushSprite(0, 0);
          receivedData = "";

          request->send(200, "application/json", "{\"status\": \"ok\"}");
        }
      });

  server.on("/images/display", HTTP_GET, [](AsyncWebServerRequest *request) {
    Serial.println("PUT request received1");
    if (request->hasParam("name")) {
      String imageName = request->getParam("name")->value();
      File file = SPIFFS.open("/images/" + imageName, "r");

      if (file) {
        DynamicJsonDocument doc(41000);
        deserializeJson(doc, file);

        sprite.clear(TFT_WHITE);
        sprite.pushSprite(0, 0);

        JsonArray arr = doc["data"].as<JsonArray>();
        Serial.println(file.size());
        Serial.println(arr.size());

        for (int y = 0; y < arr.size(); y++) {
          const char *row = arr[y];
          for (int x = 0; x < strlen(row); x++) {
            int color;
            switch (row[x]) {
            case '0': // 白
              color = TFT_WHITE;
              break;
            case '1': // グレー
              // チェッカーボードパターンのダイザリング
              color = (x + y) % 2 == 0 ? TFT_WHITE : TFT_BLACK;
              break;
            case '2': // 黒
              color = TFT_BLACK;
              break;
            default:
              color = TFT_WHITE;
              break;
            }
            sprite.drawPixel(x, y, color);
          }
        }

        sprite.pushSprite(0, 0);
        file.close();
        request->send(200, "text/plain", "Image displayed");
      } else {
        request->send(404, "text/plain", "File not found");
      }
    } else {
      request->send(400, "text/plain", "Name parameter is missing");
    }
  });

  server.on("/images", HTTP_DELETE, [](AsyncWebServerRequest *request) {
    if (request->hasParam("name")) {
      AsyncWebParameter *p = request->getParam("name");
      String imageName = p->value();
      String filePath = "/images/" + imageName;
      if (SPIFFS.exists(filePath)) {
        if (SPIFFS.remove(filePath)) {
          request->send(200, "application/json",
                        "{\"status\": \"ok\", \"message\": \"Image deleted "
                        "successfully.\"}");
        } else {
          request->send(500, "application/json",
                        "{\"status\": \"error\", \"message\": \"Failed to "
                        "delete the image file.\"}");
        }
      } else {
        request->send(
            404, "application/json",
            "{\"status\": \"error\", \"message\": \"Image file not found.\"}");
      }
    } else {
      request->send(400, "application/json",
                    "{\"status\": \"error\", \"message\": \"Missing image name "
                    "parameter.\"}");
    }
  });

  server.begin();
}

void loop() {}
