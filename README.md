# NibePi

Denna sida visar instruktioner hur man får sin Nibe Värmepump att skicka och ta emot MQTT meddelanden via Node-RED.

Hårdvara som behövs.
```
https://thepihut.com/products/raspberry-pi-zero-w / https://www.kiwi-electronics.nl/raspberry-pi-zero-w
https://thepihut.com/products/rs485-pizero?variant=26469099976 / https://www.kiwi-electronics.nl/rs-485-pi
https://thepihut.com/products/wide-input-shim / https://www.kiwi-electronics.nl/wide-input-shim
https://thepihut.com/products/adafruit-8gb-class-10-sd-microsd-memory-card-sd-adapter-included?variant=27740055697 (Eller vilket kort som helst)
```
Löd på anslutningskontakter på A och B på RS485 kortet. Stacka sedan ihop alla kort, antingen med headers eller löd dom rätt på varandra för minsta möjliga.

Hämta image filen här https://1drv.ms/u/s!AijwO0Pec8Krg54WLSOxh4mu_JdiKg
Skriv den till ett 8GB (eller större) microSD kort.

På boot partionen (som även är tillgänglig i windows) ligger det en fil som heter nibepi.conf. 
```
{
        "ssid":"MittWifi",
        "pass":"mittwifilösen"
}
```
Ändra filen enligt ovan och spara. Nu är raspberryn färdig att anslutas till pumpen.

![alt text](https://github.com/bebben88/NibePi/blob/master/nibepi_1.jpg)
![alt text](https://github.com/bebben88/NibePi/blob/master/nibepi_2.jpg)

