# NibePi

NibePi är en IoT produkt för din Nibe värmepump.
Med en Raspberry Pi Zero+RS485 HAT så kommunicerar NibePi med pumpen via Modbus. NibePi får plats innanför skalet på Värmepumpen och matas direkt från kretskortet i pumpen. NibePi stödjer Nibe F370,F470,F730,F750,F1145,F1245,F1155,F1255.

OBS. NibePi är testad mot en Nibe F750. De andra pumparna fungerar på samma sätt och individuella register för varje modell finns.

En viktig aspekt i hela projektet är att det måste vara en driftsäker lösning. Sönderskrivna SD-kort bör inte kunna hända på en NibePi eftersom att systemet körs i read-only. Detta gör den väldigt driftsäker.

I webinterfacet finns information samt möjligheter för att starta om hårdvara eller mjukvara.

Hårdvara som behövs.
```
https://thepihut.com/products/raspberry-pi-zero-w / https://www.kiwi-electronics.nl/raspberry-pi-zero-w
https://thepihut.com/products/rs485-pizero?variant=26469099976 / https://www.kiwi-electronics.nl/rs-485-pi
https://thepihut.com/products/wide-input-shim / https://www.kiwi-electronics.nl/wide-input-shim
https://thepihut.com/products/adafruit-8gb-class-10-sd-microsd-memory-card-sd-adapter-included?variant=27740055697 (Eller vilket kort som helst)
```
Löd på anslutningskontakter på A och B på RS485 kortet. Stacka sedan ihop alla kort, antingen med headers eller löd dom rätt på varandra för minsta möjliga.


På boot partionen (som även är tillgänglig i windows) ligger det en fil som heter wifi.conf. 
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
Steg 5: Stäng av värmepumpen och installera NibePi.
```
```
Installera NibePi
Steg 1: Ta bort den övre luckan där luftfiltret sitter (Gäller endast vid frånluftspumpar).
Steg 2: Skruva bort de två stora torx T30 skruvarna längst ner i botten på fronten.
Steg 3: Luta ut fronten i nederkant 10-20 cm och lyft fronten uppåt (Den hänger på en skena i ovankant.
Steg 4: Ställ undan fronten.
Steg 5: Ta bort det lilla snäpplocket enl. bild nedan
```
![alt text](https://github.com/bebben88/NibePi/blob/master/pics/nibepi_1.jpg)
```
Steg 6: Anslut NibePi enl. bild nedan. Inkopplingen kan skilja sig från olika värmepumpar https://www.nibe.se/assets/documents/9133/031725-4.pdf 
```
![alt text](https://github.com/bebben88/NibePi/blob/master/pics/nibepi_2.jpg)
```
Steg 7: Stoppa in SD-kortet. Starta värmepumpen med fronten av så länge.
```
Vid uppstart så kommer värmepumpen att börja lysa rött igen. Vid första uppstarten av NibePi kommer den hämta wifi uppgifter från wifi.conf och sedan starta om NibePi.
Efter några minuter så kommer den röda lampan att bli grön igen. När lampan är grön så har NibePi hittat värmepumpen automatiskt och startat webinterfacet.

Node-RED är nu tillgängligt på NibePi's IP adress. T.ex http://192.168.0.100:1880<br>
Webinterfacet är tillgängligt på http://192.168.0.100:1880/ui
