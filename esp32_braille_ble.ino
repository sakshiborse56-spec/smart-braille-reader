/*
  Smart Braille Reader - ESP32 BLE UART receiver (demo)
  Arduino IDE: install/select an ESP32 board package.
  BLE service UUID matches the website's Web Bluetooth code.
  This demo receives UTF-8 JSON and prints it to Serial Monitor.
  It DOES NOT drive Braille actuators; add a validated driver/display layer separately.
*/
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

#define DEVICE_NAME "SmartBraille-ESP32"
static BLEUUID SERVICE_UUID("6e400001-b5a3-f393-e0a9-e50e24dcca9e");
static BLEUUID RX_UUID("6e400003-b5a3-f393-e0a9-e50e24dcca9e");
static BLEUUID TX_UUID("6e400002-b5a3-f393-e0a9-e50e24dcca9e");
BLECharacteristic *txCharacteristic;
String incoming;
bool deviceConnected=false;

class ServerCallbacks: public BLEServerCallbacks {
  void onConnect(BLEServer*) override { deviceConnected=true; Serial.println("BLE client connected"); }
  void onDisconnect(BLEServer*) override { deviceConnected=false; Serial.println("BLE client disconnected"); BLEDevice::startAdvertising(); }
};
class RxCallbacks: public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *characteristic) override {
    std::string value=characteristic->getValue();
    for (char c : value) {
      if (c=='\n') {
        Serial.println("--- Complete UTF-8 JSON payload ---");
        Serial.println(incoming);
        Serial.println("--- End payload ---");
        incoming="";
      } else incoming += c;
    }
  }
};
void setup(){
  Serial.begin(115200);
  BLEDevice::init(DEVICE_NAME);
  BLEServer *server=BLEDevice::createServer();
  server->setCallbacks(new ServerCallbacks());
  BLEService *service=server->createService(SERVICE_UUID);
  txCharacteristic=service->createCharacteristic(TX_UUID,BLECharacteristic::PROPERTY_NOTIFY);
  txCharacteristic->addDescriptor(new BLE2902());
  BLECharacteristic *rx=service->createCharacteristic(RX_UUID,BLECharacteristic::PROPERTY_WRITE|BLECharacteristic::PROPERTY_WRITE_NR);
  rx->setCallbacks(new RxCallbacks());
  service->start();
  BLEAdvertising *advertising=BLEDevice::getAdvertising();
  advertising->addServiceUUID(SERVICE_UUID);
  advertising->setScanResponse(true);
  BLEDevice::startAdvertising();
  Serial.println("SmartBraille-ESP32 BLE UART ready. Open Serial Monitor at 115200.");
}
void loop(){delay(20);}
