#include <M5Unified.h>
#include <qrcode.h>

void displayQRCode(const String &data, int startX, int startY) {
  M5.Lcd.fillScreen(TFT_BLACK);
  QRCode qrcode;
  uint8_t qrcodeData[qrcode_getBufferSize(3)];
  qrcode_initText(&qrcode, qrcodeData, 3, 0, data.c_str());

  int pixSize = 4;
  for (int y = 0; y < qrcode.size; y++) {
    for (int x = 0; x < qrcode.size; x++) {
      if (qrcode_getModule(&qrcode, x, y)) {
        M5.Lcd.fillRect(startX + x * pixSize, startY + y * pixSize, pixSize,
                        pixSize, TFT_WHITE);
      } else {
        M5.Lcd.fillRect(startX + x * pixSize, startY + y * pixSize, pixSize,
                        pixSize, TFT_BLACK);
      }
    }
  }
}
