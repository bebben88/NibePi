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
Ändra filen enligt ovan och spara.
```
Aktivera Modbus i Värmepumpen.
Steg 1: Håll in bakåt knappen i ca 7 sekunder, en service meny kommer upp, gå in i den.
Steg 2: Gå in i meny 5.2 Systeminställningar
Steg 3: Nästan längst ner i den menyn bockar man för "Modbus".
Steg 4: Pumpen kommer nu lysa rött och gå in i Felläge. (Ev åtgärder vidtas i pumpen så varmvatten produktion eller värme kan stanna av)
Steg 5: Stäng av värmepumpen och installera raspberryn.

Installera raspberryn
Steg 1: Ta bort den övre luckan där luftfiltret sitter (Gäller endast vid frånluftspumpar).
Steg 2: Skruva bort de två stora torx T30 skruvarna längst ner i botten på fronten.
Steg 3: Luta ut fronten i nederkant 10-20 cm och lyft fronten uppåt (Den hänger på en skena i ovankant.
Steg 4: Ställ undan fronten.
Steg 5: Ta bort den lilla luckan enl. bild nedan
![alt text](https://github.com/bebben88/NibePi/blob/master/nibepi_1.jpg)


Nu är raspberryn färdig att anslutas till pumpen.

![alt text](https://github.com/bebben88/NibePi/blob/master/nibepi_1.jpg)
![alt text](https://github.com/bebben88/NibePi/blob/master/nibepi_2.jpg)

