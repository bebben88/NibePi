# NibePi

NibePi är en IoT produkt för din Nibe värmepump.
Med en Raspberry Pi Zero+RS485 HAT så kommunicerar NibePi med pumpen via Modbus. NibePi får plats innanför skalet på Värmepumpen och matas direkt från kretskortet i pumpen. NibePi stödjer Nibe F370,F470,F730,F750,F1145,F1245,F1155,F1255.<br>
Grunden i automatisering och styrning av pumpen är baserad på NodeJS och Node-RED. Det finns även möjligheter att kunna redigera fritt.<br>
OBS. NibePi är testad mot en Nibe F750. De andra pumparna fungerar på samma sätt och individuella register för varje modell finns.

En viktig aspekt i hela projektet är att det måste vara en driftsäker lösning. Sönderskrivna SD-kort bör inte kunna hända på en NibePi eftersom att systemet körs i read-only. Detta gör den väldigt driftsäker.<br>

Följande funktioner finns att tillgå i webbinterfacet för att göra värmepumpen smartare:<br><br>
<b>Prognosreglering</b><br>
Hämtar väderdata från SMHI och jämför med nuvarande utetemperatur. Justering görs av kurvjusteringen för att få pumpen att agera som om det vore prognostemperaturen.<br>

![alt text](https://raw.githubusercontent.com/bebben88/NibePi/master/pics/smhi.jpg)

<b>Elprisreglering</b><br>
Hämtar ditt elpris från Tibber (du måste vara kund). I webinterfacet finns det inställningar för hur den ska agera och när den ska agera. Om du inte är kund hos tibber får du gärna använda min affiliate länk och bli det. <a href="https://invite.tibber.com/587354e8">https://invite.tibber.com/587354e8</a><br>

![alt text](https://github.com/bebben88/NibePi/blob/master/pics/tibber1.jpg)
![alt text](https://github.com/bebben88/NibePi/blob/master/pics/tibber2.jpg)

<b>Inomhusreglering</b><br>
Ersätter pumpens inbyggda styrning mot inomhustemperatur. Mer ställbar och anpassar sig till de övriga funktionerna.<br>

![alt text](https://github.com/bebben88/NibePi/blob/master/pics/indoor1.jpg)
![alt text](https://github.com/bebben88/NibePi/blob/master/pics/indoor2.jpg)

<b>Automatisk Lufthastighet</b><br>
Reglerar fläkthastigheten för att hålla lufthastigheten inom ett visst värde.<br>

![alt text](https://github.com/bebben88/NibePi/blob/master/pics/airflow.jpg)

Fler funktioner kommer att byggas till och optimeras löpande. Det går även att uppdatera NibePi direkt via webinterfacet för att få tillgång till de senaste funktionerna.<br>
I webinterfacet finns information samt möjligheter för att starta om hårdvara eller mjukvara.

Hårdvara som behövs.
```
https://thepihut.com/products/raspberry-pi-zero-w / https://www.kiwi-electronics.nl/raspberry-pi-zero-w
https://thepihut.com/products/rs485-pizero?variant=26469099976 / https://www.kiwi-electronics.nl/rs-485-pi
https://thepihut.com/products/wide-input-shim / https://www.kiwi-electronics.nl/wide-input-shim
MicroSD-kort minst 16gb
```
Löd på anslutningskontakter på A och B på RS485 kortet. Stacka sedan ihop alla kort, antingen med headers eller löd dom rätt på varandra för minsta möjliga bygghöjd.<br>

Ladda ner en fullständig image fil att skriva till ett 16GB SD kort.<br>
http://anerdins.se/NibePi/nibepi_1.0.rar<br>
eller<br>
https://1drv.ms/u/s!AijwO0Pec8KrhNUkBiG4TvlsmCgwfQ?e=70lEYL<br>

På boot partionen (som även är tillgänglig i windows) ligger det en fil som heter wpa_supplicant.conf Där skriver du in dina wifi uppgifter.
```
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
country=SE

network={
	ssid="WIFINAMN"
	psk="WIFILÖSEN"
	key_mgmt=WPA-PSK
}
```
Ändra filen enligt ovan och spara.<br>
Om din värmepump inte hittas automatiskt av NibePi så kan du skapa en textfil på boot partionen som heter "pump.txt" där i skriver du in modellbeteckningen på din värmepump. T.ex.
```
F1255
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
```
Aktivera Modbus i Värmepumpen.
Steg 1: Håll in bakåt knappen i ca 7 sekunder, en service meny kommer upp, gå in i den.
Steg 2: Gå in i meny 5.2 Systeminställningar
Steg 3: Nästan längst ner i den menyn bockar man för "Modbus".
Steg 4: Pumpen kan nu börja lysa rött om NibePi inte har startat ordentligt än, vilket kan ta några minuter.
```

Det kan vara så att NibePi inte kan identifiera pumpen automatiskt. Då får man skriva in modellbeteckningen i webinterfacet eller mata in uppgifterna i pump.txt på boot partionen.

Node-RED är nu tillgängligt på NibePi's adress. http://nibepi:1880<br>
Webinterfacet är tillgängligt på http://nibepi:1880/ui<br>
Om det ovanstående länkar inte fungerar så använd IP adressen istället. T.ex http://192.168.0.100:1880
