# NibePi

NibePi är en IoT produkt för din Nibe värmepump.
Med en Raspberry Pi Zero+RS485 HAT så kommunicerar NibePi med pumpen via Modbus. NibePi får plats innanför skalet på Värmepumpen och matas direkt från kretskortet i pumpen. NibePi stödjer Nibe F370,F470,F730,F750,F1145,F1245,F1155,F1255.

OBS. NibePi är testad mot en Nibe F750. De andra pumparna fungerar på samma sätt och individuella register för varje modell finns.

En viktig aspekt i hela projektet är att det måste vara en driftsäker lösning. Sönderskrivna SD-kort bör inte kunna hända på en NibePi eftersom att systemet körs i read-only. Detta gör den väldigt driftsäker.

I Node-RED flödet finns snabbknappar för att starta om/stänga av, sätta NibePi i read läge, eller write läge.
Innan varje Deploy så måste man sätta write läge, efter Deploy sätts NibePi automatiskt i read läge. 

![alt text](https://github.com/bebben88/NibePi/blob/master/pics/nodered_2.png)

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
Vid uppstart så kommer värmepumpen att börja lysa rött igen. Vid första uppstarten av NibePi kommer den hämta wifi uppgifter från nibepi.conf och sedan starta om NibePi.
Efter ca 1.5 minut så kommer den röda lampan att bli grön igen, för att sedan släckas igen efter några sekunder medans NibePi startar om. Efter ytterligare ca 1.5 minut så kommer lampan lysa grönt igen och anslutningen är färdig!

Node-RED är nu tillgängligt på NibePi's IP adress. T.ex http://192.168.0.100:1880

![alt text](https://github.com/bebben88/NibePi/blob/master/pics/nodered_1.png)

Gå in på NibePi's sida och dubbelklicka på config noden. Skriv in vilken värmepump som är inkopplad. Samt vilket topic det ska annonseras på. Det går även att få NibePi att starta om efter 5 minuter ifall den inte kan pinga en IP adress som väljs i flödet. Sätt rebootOnNetworkLoss:true om det ska fungera.
```
var config = {
    heatPump:"F750",
    defaultTopic:"nibe/modbus/",
    rebootOnNetworkLoss:false
};
```
Välj även vilka register som ska hämtas under updateRegister. Som standard är det flera valda, för att se mer information om dessa så får man söka längre ner i texten.
Spara, dubbelklicka sedan på MQTT noderna och välj/anslut en MQTT broker. Konfigueringen är färdig. För att spara flödet måste man trycka på "Write mode" i flödet och sedan "Deploy" längst uppe i hörnet.

Nu kommer värden att börja publiceras till din broker.
Som standard kommer exempelvis utomhustemperaturen finnas tillgänglig på topic nibe/modbus/40004. Inomhustemperatur på nibe/modbus/40033

För att skicka ett värde till ett register. lägg på /set efter register. (OBS alla register går inte att skriva till).
Ett register man kan skriva till är t.ex Gradminuter (43005). Man kan t.ex skicka värde -100 på topic nibe/modbus/43005/set
Gradminuterna kommer att ändras till -100 i pumpen.
