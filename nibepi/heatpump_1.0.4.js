/*MIT License

Copyright (c) 2019 Fredrik Anerdin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
const version = "1.0.4";
var exec = require('child_process').exec;
const serialport = require('serialport');
const mqtt = require('mqtt');
var SunCalc = require('suncalc');
var portName = "/dev/ttyAMA0";
var config = require('./config.json')
var myPort = new serialport(portName, 9600);
const f370 = require('./models/F370.json');
const f470 = require('./models/F470.json');
const f730 = require('./models/F730.json');
const f750 = require('./models/F750.json');
const f1145 = require('./models/F1145.json');
const f1245 = require('./models/F1245.json');
const f1155 = require('./models/F1155.json');
const f1255 = require('./models/F1255.json');
const EventEmitter = require('events').EventEmitter
const nibe = new EventEmitter();
module.exports = nibe;
var dataRegister = []

const fs = require('fs');
var sendQueue = [];
var getQueue = [];
var pump;
var pumpFound = false;
var register = [];
var reset = 10;
var requestCounter = 0;
if(config.version!=version) {
    config.version = version;
    checkConfig(config);
}
var connected = false;
async function checkMQTT() {
    console.log('Checking MQTT');
    var result = await startMQTT();
    if(result===true) {
        connected = true;
        console.log('MQTT started succesfully');
    } else {
        console.log('Waiting for MQTT broker');
    }
}
updatePump(function(result) {
if(result!==undefined && result!=="") {
    console.log('Config updated with pump from file. Pump: '+result)
    config.pump = result;
    checkConfig(config);
}
});

checkMQTT()

myPort.on('open', showPortOpen);
myPort.on('data', concatBuffers);
myPort.on('close', showPortClose);
myPort.on('error', showError);

function showPortOpen() {
    console.log('Port open. Data rate: ' + myPort.baudRate);
    exec('sudo mount -o remount,ro /', function(error, stdout, stderr) {
        if(error) {
            console.log('Boot: Could not set read-only mode')
        } else {
            console.log('Boot: Read-only mode active.')
        }
    });
	addPluginRegisters()
}
function showPortClose() {
    console.log('Port closed. Data rate: ' + myPort.baudRate);
}
function showError() {
    console.log('Error. Data rate: ' + myPort.baudRate);
}

function concatBuffers(data) {
    if(connected===false) {
        return;
    }
    analyze(Array.from(data));
}
function analyze(data) {
    nibe.emit("log",data,"Serial");
    if(data==06) {
        if(waitACK!=false) {
            console.log('Message ACKED')
            nibe.emit("log",waitACK,"ACK");
            getQueue.push(getData(waitACK));
            waitACK = false;
        }
}
      function item(element) {
        return element == 92;
      }
      
      var check = data.findIndex(item)
      if(check!=-1) {
        data = data.slice(check, data.length);
        start = true;
      }
      if(start) {
      msgOut = msgOut.concat(data);
      }
   
    if(msgOut.length>=3) {
        if(msgOut[1]!=0 || msgOut[2]!=32) {
            nibe.emit("log",msgOut,"Err adr");
                msgOut = []
                start = false;
        }
    }
    if(msgOut.length>=6) {
        msgLength = msgOut[4]
        // Change in v 1.0.1 to get full length of discovery message.
        if(msgLength!=0 && msgLength!=1 && msgLength!=6 && msgLength!=80 && msgOut[3]!=109) {
            nibe.emit("log",msgOut,"Err length");
                msgOut = []
                start = false;
        }
        if(msgOut.length<msgLength+6) {
            if(msgLength==80) {
                if(msgOut.length>=msgLength+5) {
                if(msgOut[83]!=0 || msgOut[84]!=0) {
                    nibe.emit("log",msgOut,"Err short");
                    nibe.emit("validate",msgOut);
                }
            }
            }
        } else {
            sliceArray(msgOut,0, msgLength+6, function(err,data) {
                if(err) throw err;
                msgOut = data;
                msStart = new Date().getTime();
                nibe.emit("validate",msgOut);
            })
            
            
        }
    }
}
var msgOut = [];
var msgLength = 0;
nibe.on('log',function(data,key) {
    if(config.debug!==undefined && config.debug==true) {
        fs.appendFile('/home/pi/node-red-static/log/nodered.log', '\n'+key+': '+JSON.stringify(data), function (err) {
            if (err) throw err;
            
        });
    }
})
nibe.on('error',function(err,data,time) {
    /*console.log('Error ('+err+')',JSON.stringify(data))
    var ts = new Date().getTime();
    var time = ts-msStart;
    fs.appendFile('./Buffers.log', '\n'+err+' '+ts+' ms:'+JSON.stringify(data), function (err) {
        if (err) throw err;
        
    });*/
})
var start = false;
function sliceArray(data,start,end,callback) {
    data = data.slice(start, end);
    callback(null,data);
}

function checkMessageCHK(data,callback) {
    msgChecksum = data[data[4]+5];
    var calcChecksum = 0;
    for(i = 2; i < (data[4] + 5); i++) {
        calcChecksum ^= data[i];
    }
    if((msgChecksum==calcChecksum) || (msgChecksum==0xC5 && calcChecksum==0x5C)) {
        callback(null,data)
    } else {
        sendNack(function(err) {
            if (err) throw err;
            callback(new Error('Checksum error'))
        });
    }
}
nibe.on('validate',function(data) {
    msgOut = []
    start = false;
    checkMessageCHK(data,function(err,result) {
        if(err) {
            err = "ERROR CHKSUM";
            nibe.emit("log",data,"Err chksum");
        } else {
            makeResponse(result, function(err,result) {
                nibe.emit("log",result,"OK");
                nibe.emit("message",result);
            });
        }
    })
});
nibe.on('message',function(data) {
    parseMessage(data)
})

function makeResponse(data,callback) {
    // Read from heatpump
    if(data[3]==0x69 && data[4]==0x00) {
        if(getQueue.length!==0) {
            var lastMsg = getQueue.pop();
            myPort.write(lastMsg);
            callback(null,data);
        } else {
            //Getting regular messages
                if(requestCounter>=(config.registers.length)) {
                    requestCounter = 0;
                }
                if(config.registers.length!=0) {
                var convert = getData(config.registers[requestCounter].register);
                if(convert!==0) {
                    myPort.write(convert);
                    
                    requestCounter++;
                    callback(null,data);
                } else {
                    sendAck(function(err) {
                        if (err) throw err;
                        callback(null,data);
                    });
                }
                } else {
                sendAck(function(err) {
                    if (err) throw err;
                    callback(null,data);
                });
            }
        }
    // Write to heatpump
    } else if(data[3]==0x6b && data[4]==0x00) {
        if(sendQueue.length!==0) {
            var lastMsg = sendQueue.pop();
            myPort.write(lastMsg);
            nibe.emit("log",lastMsg,"Set");
            console.log('Sending message: ', lastMsg);
        } else {
            sendAck(function(err) {
                if (err) throw err;
                callback(null,data);
            });
        }
    } else {
        sendAck(function(err) {
            if (err) throw err;
            callback(null,data);
        });
    }
}
function setPump(data,callback) {
    var sliced;
    var split;
    var firmware = "";
    if(data[3]==238) {
        sliced = config.pump;
    } else {
        let len = data[4]+5;
        sliced = Buffer.from(data).slice(8,len).toString();
        firmware = (data[6]*256)+data[7];
    }
        split = sliced.split(" ");
        // Change in autodiscovery to remove - from model.
        split = split[0].split("-");
        pump = split[0];
        if(firmware!="" && (config.firmware=="" || config.firmware!=firmware)) {
            config.firmware = firmware;
            checkConfig(config);
            logMQTT('Firmware: '+firmware)
        }
        if(pumpFound==false) {
        logMQTT('Konfigurerar Nibe '+pump)
        console.log('Pump: '+pump+".");
        console.log('Setting up the pump');
        if(pump=='F370') {
            register = f370;
            config.pump = pump;
            config.plugins.airflow.enable = false;
            config.plugins.smhi.enable = true;
            config.plugins.indoor.enable = true;
            config.plugins.tibber.enable = true;
            checkConfig(config);
            publishMQTT('nibe/register',JSON.stringify(register),true);
            pumpFound = true;
            logMQTT('Hämtar register')
            console.log('Setting registers for Nibe '+pump);
            callback()
        } else if(pump=='F470') {
            register = f470;
            config.pump = pump;
            config.plugins.airflow.enable = false;
            config.plugins.smhi.enable = true;
            config.plugins.indoor.enable = true;
            config.plugins.tibber.enable = true;
            checkConfig(config);
            publishMQTT('nibe/register',JSON.stringify(register),true);
            pumpFound = true;
            logMQTT('Hämtar register')
            console.log('Setting registers for Nibe '+pump);
            callback()
        } else if(pump=='F730') {
            register = f730;
            config.pump = pump;
            config.plugins.airflow.enable = true;
            config.plugins.smhi.enable = true;
            config.plugins.indoor.enable = true;
            config.plugins.tibber.enable = true;
            checkConfig(config);
            publishMQTT('nibe/register',JSON.stringify(register),true);
            pumpFound = true;
            logMQTT('Hämtar register')
            console.log('Setting registers for Nibe '+pump);
            callback()
        } else if(pump=='F750') {
            register = f750;
            config.pump = pump;
            config.plugins.airflow.enable = true;
            config.plugins.smhi.enable = true;
            config.plugins.indoor.enable = true;
            config.plugins.tibber.enable = true;
            checkConfig(config);
            publishMQTT('nibe/register',JSON.stringify(register),true);
            pumpFound = true;
            logMQTT('Hämtar register')
            console.log('Setting registers for Nibe '+pump);
            callback()
        } else if(pump=='F1145') {
            register = f1145;
            config.pump = pump;
            config.plugins.airflow.enable = false;
            config.plugins.smhi.enable = true;
            config.plugins.indoor.enable = true;
            config.plugins.tibber.enable = true;
            checkConfig(config);
            publishMQTT('nibe/register',JSON.stringify(register),true);
            pumpFound = true;
            logMQTT('Hämtar register')
            console.log('Setting registers for Nibe '+pump);
            callback()
        } else if(pump=='F1245') {
            register = f1245;
            config.pump = pump;
            config.plugins.airflow.enable = false;
            config.plugins.smhi.enable = true;
            config.plugins.indoor.enable = true;
            config.plugins.tibber.enable = true;
            checkConfig(config);
            publishMQTT('nibe/register',JSON.stringify(register),true);
            pumpFound = true;
            logMQTT('Hämtar register')
            console.log('Setting registers for Nibe '+pump);
            callback()
        } else if(pump=='F1155') {
            register = f1155;
            config.pump = pump;
            config.plugins.airflow.enable = false;
            config.plugins.smhi.enable = true;
            config.plugins.indoor.enable = true;
            config.plugins.tibber.enable = true;
            checkConfig(config);
            publishMQTT('nibe/register',JSON.stringify(register),true);
            pumpFound = true;
            logMQTT('Hämtar register')
            console.log('Setting registers for Nibe '+pump);
            callback()
        } else if(pump=='F1255') {
            register = f1255;
            config.pump = pump;
            config.plugins.airflow.enable = false;
            config.plugins.smhi.enable = true;
            config.plugins.indoor.enable = true;
            config.plugins.tibber.enable = true;
            checkConfig(config);
            publishMQTT('nibe/register',JSON.stringify(register),true);
            pumpFound = true;
            logMQTT('Hämtar register')
            console.log('Setting registers for Nibe '+pump);
            callback()
        } else {
            logMQTT('Värmepumpen som hittats stöds tyvärr inte.', pump)
            callback(new Error('Pump not supported'));
        }
    } else {
        callback()
    }
}
function parseMessage(data) {
    if(data[3]==109) {
        setPump(data,function(err,result) {
            if ( err ) throw err;
        })
        } else if (data[3]==238) {
            if(config.pump!="") {
            startExternalMQTT()
            setPump(data,function(err,result) {
                if ( err ) throw err;
                getQueue.push(getData(45001));
            })
        }
        } else {
    if(register!==undefined) {
        decodeMessage(register,data);
    }

    if(data[3]===0x6A && data[5]===0xC9 && data[6]===0xAF && data[7]===0xFB) {
	if(reset>3) {
        console.log('Got alarm status. Resetting.');
        logMQTT('Kom.avbrott Modbus Larm. Återställer...')
        reset = 0;
        sendQueue.push(setData({"register":45171,"value":1}));
	} else {
		reset++;
        console.log('Still resetting, attempt ('+reset+')');
	}
    } else if(data[3]===106 && data[5]===201 && data[6]===175 && data[7]===0) {
	if(reset!==10) {
	reset = 10;
    console.log('Alarm has been reset');
    logMQTT('Kom.avbrott Modbus har blivit återställt')
}
    }
}
}
function getData(address) {
    if (pump!==undefined) {
        if (register.find(item => item.register == address) !== undefined) {
            var data = [];
            data[0] = 0xc0;
            data[1] = 0x69;
            data[2] = 0x02;
            data[3] = (address & 0xFF);
            data[4] = ((address >> 8) & 0xFF);
            data[5] = Calc_CRC(data);
            return(data);
        }
        else {
            return 0;
        }
    }
    else {
        return 0;
    }
}
function setData(incoming) {
    var data = [];
    data[0] = 0xc0;
    data[1] = 0x6b;
    data[2] = 0x06;
    data[3] = (incoming.register & 0xFF);
    data[4] = ((incoming.register >> 8) & 0xFF);
    data[5] = (incoming.value & 0xFF);
    data[6] = ((incoming.value >> 8) & 0xFF);
    data[7] = ((incoming.value >> 16) & 0xFF);
    data[8] = ((incoming.value >> 24) & 0xFF);
    data[9] = Calc_CRC(data);
    console.log('Sending data: ', incoming.register, ": " + incoming.value);
    return data;
}
function Calc_CRC(data) {
    var calc_checksum = 0;
    for (var i = 0; i < (data[2] + 5); i++)
        calc_checksum ^= data[i];
    return calc_checksum;
}
function sendAck(callback)
{
    const ack = [0x06];
    var send = myPort.write(ack);
	callback(false);
}

function sendNack(callback)
{
    const nack = [0x15];
    var send = myPort.write(nack);
	callback(false);
}

function decodeMessage(register, buf) {
    var data;
    for (i = 5; i < buf.length - 2; i = i + 1) {
        var address = (buf[i + 1] * 256 + buf[i]);
        var item = register.find(item => item.register == address);
        if (item !== undefined) {
            if (item.size == "s32") {
                if (buf[4] == 80) {
                    item.logset = true;
                    data = (buf[i + 7] * 256 + buf[i + 6]) - (buf[i + 3] * 256 + buf[i + 2]);
                    if (data > (2, 147, 483, 647)) {
                        data = (data - 4, 294, 967, 295);
                    }
                    i = i + 7;
                }
                else {
                    data = (buf[i + 5] * 256 + buf[i + 4]) - (buf[i + 3] * 256 + buf[i + 2]);
                    i = i + 5;
                }
            }
            else if (item.size == "s16") {
                data = (buf[i + 3] & 0xFF) << 8 | (buf[i + 2] & 0xFF);
                if (data > 32767) {
                    data = data - 65536;
                }
                i = i + 3;
            }
            else if (item.size == "s8") {
                data = (buf[i + 3] & 0xFF) << 8 | (buf[i + 2] & 0xFF);
                //Special for old and new firmware
                if (data > 128 && data < 32768) {
                    data = data - 256;
                } else if (data > 32767) {
                    data = data - 65536;
                }
                i = i + 3;
            }
            else if (item.size == "u32") {
                if (buf[4] == 80) {
                    data = (buf[i + 7] * 256 + buf[i + 6]) + (buf[i + 3] * 256 + buf[i + 2]);
                    i = i + 7;
                }
                else {
                    data = (buf[i + 5] * 256 + buf[i + 4]) + (buf[i + 3] * 256 + buf[i + 2]);
                    i = i + 5;
                }
            }
            else if (item.size == "u16") {
                data = (buf[i + 3] & 0xFF) << 8 | (buf[i + 2] & 0xFF);
                i = i + 5;
            }
            else if (item.size == "u8") {
                data = (buf[i + 3] & 0xFF) << 8 | (buf[i + 2] & 0xFF);
                i = i + 3;
            }
            else {
                i = i + 3;
            }
            data = data / item.factor;
            var map = item.map;
            var valueMap;
            if (map !== undefined) {
                for (y = 0; y < map.length; y = y + 1) {
                    var mapValue = Object.values(map[y]);
                    if (Number(Object.keys(map[y])) == data) {
                        valueMap = mapValue[0];
                    }
                }
            }
            var min = Number(item.min);
            var max = Number(item.max);
            var corruptData;
            if (min !== undefined && max !== undefined) {
                if (min !== 0 || max !== 0) {
                    if ((data > max / item.factor) || (data < min / item.factor)) {
                        corruptData = true;
                        console.log('Corrupt payload (', data, ') from register ', address);
                        logMQTT('Korrupt data (', data, ') från register ', address)
                    }
                }
            }
            var logout = item.register+": "+data+" "+item.unit
            nibe.emit("log",logout,"Value");
            if(valueMap!==undefined) {
                item.data = valueMap;
            } else {
            item.data = data;
            }
            function checkIt(element) {
                return element.register == item.register;
              }
              
              let reg = dataRegister.findIndex(checkIt)
              if(reg!=-1) {
                if(item.unit=="A") {
                    dataRegister[reg].dataArray.push(data)
                    if(dataRegister[reg].dataArray.length>5) {
                        dataRegister[reg].dataArray.shift();
                        //console.log(JSON.stringify(dataRegister[reg].dataArray))
                        var divide = 0;
                        for(z = 1; z < dataRegister[reg].dataArray.length; z++) {
                            divide = divide+Number(dataRegister[reg].dataArray[z]);
                        }
                        item.data = (divide/(dataRegister[reg].dataArray.length-1)).toFixed(2);
                        //console.log('TEST: '+item.data+"A");
                    }

                }
                dataRegister[reg] = item;
                //console.log('Register: '+dataRegister[reg].register+", "+dataRegister[reg].data+" "+dataRegister[reg].unit);
              } else {
                item.dataArray = [];
                dataRegister.push(item);
                console.log('Register ('+item.register+') succesfully added to database.')
                checkRegisterType(item,function(err,callback) {
                    if(err) throw err;
                    if(callback!==undefined) {
                        var topic = 'homeassistant/'+callback.component+'/'+item.register.toString()+'/config'
                        var payload = {"name": "Nibe "+item.titel,"device_class":callback.type,"temperature_state_topic":callback.setTempState,"current_temperature_topic":callback.current,"temperature_command_topic":callback.setTemp, "unit_of_measurement":callback.unit, "state_topic":callback.topic,"modes":callback.modes};
                        if(callback.component!==undefined) {
                            publishMQTT(topic,JSON.stringify(payload),true)
                        } else {
                            console.log('Register ('+item.register+') not defined in HA database')
                        }
                    }
                    
                });
              }
            formatMQTT(item);
        }
    }
}
function checkRegisterType(data,callback) {
    var result = {};
    result.unit = data.unit;
    result.topic = config.defaultTopic.toString()+data.register.toString();
    if(data.unit=="°C") {
        result.type = "temperature";
    } else if(data.unit=="A") {
        result.type = "power";
    } else if(data.unit=="kW") {
        result.type = "power";
    } else if(data.unit=="Hz" || data.unit=="%") {
        result.type = undefined;
    } else if(data.unit=="") {
        result.type = undefined;
        result.unit = undefined
    } else {
        
    }
    if(data.mode=="R") {
        result.component = "sensor";
    } else if(data.mode=="R/W") {
        result.component = "sensor";
        if(data.register=="47398") {
            addRegister("40033")
            result.component = "climate";
            result.current = config.defaultTopic.toString()+"40033"
            result.setTemp = config.defaultTopic.toString()+"47398"+"/set"
            result.setTempState = config.defaultTopic.toString()+"47398";
            result.type = undefined;
            result.unit = undefined;
            result.topic = undefined;
            result.modes = ['auto','off','cool','heat'];
        }

    }
    callback(null,result);
}
var DEBUG = false;
var mqtt_client;

async function startMQTT() {
    return new Promise(function(resolve, reject) {
    var mqtt_host = '127.0.0.1';
    var mqtt_port = 1883;
    var mqtt_subscribe_topic = 'nibe';
    var mqtt_publish_topic = 'nibe';
    var mqtt_username = '';
    var mqtt_password = '';
    var mqtt_client_id = 'nibe_' + Math.random().toString(16).substr(2, 8);
    // MQTT CLIENT OPTIONS
    var mqtt_Options = {
        port: mqtt_port,
        keepalive: 60,
        clientId: mqtt_client_id,
        protocolId: 'MQTT',
        //protocolVersion: 4,
        clean: true,
        reconnectPeriod: 5000,
        connectTimeout: 30 * 1000,
        //username: mqtt_username, //the username required by your broker, if any
        //password: mqtt_password, //the password required by your broker, if any
        will: { topic: mqtt_publish_topic, payload: mqtt_client_id + ' disconnected', qos: 1, retain: false }
    };
    if (DEBUG)
        console.log('Starting MQTT...');
    mqtt_client = mqtt.connect('mqtt://' + mqtt_host, mqtt_Options);
    
    mqtt_client.on('connect', function () {
        console.log('Connected');
        resolve(true)
        if (DEBUG)
            console.log('Subscribing MQTT...');
        mqtt_client.subscribe('#');
        if (DEBUG)
            console.log('Publish MQTT...');
        mqtt_client.publish(mqtt_publish_topic, 'mqtt client ' + mqtt_client_id + ' started at ' + new Date());

    });
    mqtt_client.on('close',function(){
        console.log("MQTT Broker is offline.")
        resolve(false)
      })

    // MQTT INCOMING
    mqtt_client.on('message', function (topic, message) {
        //console.log('Incoming MQTT message:', topic, message.toString());
        if(topic==config.plugins.indoor.mqttsensor) {
            if(config.plugins.indoor.nibesensor==false) {
                if(connected!==undefined && connected==true) {
                    mqtt_client.publish('nibe/plugins/indoor/mqttsensor', message.toString(),{retain:false});
                }
            }
        } else {
            incomingMQTT(topic, message)
        }
    });
})
}
function addRegister(data) {
    let index = register.findIndex(index => index.register == data);
    let item = register.find(item => item.register == data);
    if(item!==undefined) {
        register[index].isChecked = true;
        checkRegister(register)
        var check = config.registers.find(check => check.register == data);
        if(check!==undefined) {
            //console.log('Register ('+item.register+') already exists.')
        } else {
            item = {"register":item.register,"titel":item.titel}
            config.registers.push(item)
            checkConfig(config);
            console.log('Register ('+item.register+') added to database.')
            logMQTT('Register ('+item.register+') tillagd i databasen.')
            getQueue.push(getData(data));
        }
        
    }
}
var waitACK = false;
function publishMQTT(topic,payload,retain) {
    if(retain==undefined) {
        retain = false;
    }
    mqtt_client.publish(topic.toString(), payload.toString(),{retain:retain});
    if(ext_mqtt_connected==true) {
        ext_mqtt_client.publish(topic.toString(), payload.toString(),{retain:retain});
    }
}
function formatMQTT(data) {
    publishMQTT(config.defaultTopic.toString()+data.register.toString(), data.data,true);
}

function setRegister(topic,value) {
    var item = register.find(item => item.register == topic);
    if(item!==undefined) {
    var data = [];
        if(item.mode=="R/W") {
            var min = Number(item.min);
            var max = Number(item.max);
            var corruptData;
            value = value*item.factor;
            if(min!==undefined && max!==undefined) {
                if(min!==0 || max!==0) {
                    if((value>max) || (value<min)) {
                        corruptData = true;
                        console.log('Data ('+value+') out of range, to register '+topic);
                    }
                }
            }
            data[0] = 192;
            data[1] = 107;
            data[2] = 6;
            data[3] = (topic & 0xFF);
            data[4] = ((topic >> 8) & 0xFF);
            data[5] = (value & 0xFF);
            data[6] = ((value >> 8) & 0xFF);
            data[7] = ((value >> 16) & 0xFF);
            data[8] = ((value >> 24) & 0xFF);
            data[9] = Calc_CRC(data);
            if(corruptData===undefined) {
                return(data);
            }
        } else {
            console.log('Register('+topic+') not allowed write access');
            logMQTT('Register('+topic+') går inte att skriva till.')
        }
    }
}
function addPluginRegisters() {
    if(config.plugins.indoor.active==true) {
        if(config.pump!=="") {
            sendQueue.push(setData({"register":47394,"value":0}));
        }
        let index = register.findIndex(index => index.register == "40033");
        if(index!==-1) { if(register[index].isChecked===undefined || register[index].isChecked===false) { index = -1; addRegister("40033"); } }
        index = register.findIndex(index => index.register == "40004");
        if(index!==-1) { if(register[index].isChecked===undefined || register[index].isChecked===false) { index = -1; addRegister("40004"); } }
        index = register.findIndex(index => index.register == "47398");
        if(index!==-1) { if(register[index].isChecked===undefined || register[index].isChecked===false) { index = -1; addRegister("47398"); } }
        index = register.findIndex(index => index.register == "47402");
        if(index!==-1) { if(register[index].isChecked===undefined || register[index].isChecked===false) { index = -1; addRegister("47402"); } }
        index = register.findIndex(index => index.register == "47375");
        if(index!==-1) { if(register[index].isChecked===undefined || register[index].isChecked===false) { index = -1; addRegister("47375"); } }
        index = register.findIndex(index => index.register == "47011");
        if(index!==-1) { if(register[index].isChecked===undefined || register[index].isChecked===false) { index = -1; addRegister("47011"); } }
        index = register.findIndex(index => index.register == "40025");
        if(index!==-1) { if(register[index].isChecked===undefined || register[index].isChecked===false) { index = -1; addRegister("40025"); } }
    }
    if(config.plugins.smhi.active==true) {
        let index = register.findIndex(index => index.register == "40033");
        if(index!==-1) { if(register[index].isChecked===undefined || register[index].isChecked===false) { index = -1; addRegister("40033"); } }
        index = register.findIndex(index => index.register == "40004");
        if(index!==-1) { if(register[index].isChecked===undefined || register[index].isChecked===false) { index = -1; addRegister("40004"); } }
        index = register.findIndex(index => index.register == "47007");
        if(index!==-1) { if(register[index].isChecked===undefined || register[index].isChecked===false) { index = -1; addRegister("47007"); } }
        index = register.findIndex(index => index.register == "47011");
        if(index!==-1) { if(register[index].isChecked===undefined || register[index].isChecked===false) { index = -1; addRegister("47011"); } }
    }
    if(config.plugins.airflow.active==true) {
        index = register.findIndex(index => index.register == "40050");
        if(index!==-1) { if(register[index].isChecked===undefined || register[index].isChecked===false) { index = -1; addRegister("40050"); } }
        index = register.findIndex(index => index.register == "47265");
        if(index!==-1) { if(register[index].isChecked===undefined || register[index].isChecked===false) { index = -1; addRegister("47265"); } }
        index = register.findIndex(index => index.register == "40026");
        if(index!==-1) { if(register[index].isChecked===undefined || register[index].isChecked===false) { index = -1; addRegister("40026"); } }
        index = register.findIndex(index => index.register == "45001");
        if(index!==-1) { if(register[index].isChecked===undefined || register[index].isChecked===false) { index = -1; addRegister("45001"); } }
        index = register.findIndex(index => index.register == "47011");
        if(index!==-1) { if(register[index].isChecked===undefined || register[index].isChecked===false) { index = -1; addRegister("47011"); } }
        index = register.findIndex(index => index.register == "43136");
        if(index!==-1) { if(register[index].isChecked===undefined || register[index].isChecked===false) { index = -1; addRegister("43136"); } }
    }
    if(config.plugins.tibber.active==true) {
        let index = register.findIndex(index => index.register == "40033");
        if(index!==-1) { if(register[index].isChecked===undefined || register[index].isChecked===false) { index = -1; addRegister("40033"); } }
        index = register.findIndex(index => index.register == "40004");
        if(index!==-1) { if(register[index].isChecked===undefined || register[index].isChecked===false) { index = -1; addRegister("40004"); } }
        index = register.findIndex(index => index.register == "47041");
        if(index!==-1) { if(register[index].isChecked===undefined || register[index].isChecked===false) { index = -1; addRegister("47041"); } }
        index = register.findIndex(index => index.register == "43005");
        if(index!==-1) { if(register[index].isChecked===undefined || register[index].isChecked===false) { index = -1; addRegister("43005"); } }
        index = register.findIndex(index => index.register == "47206");
        if(index!==-1) { if(register[index].isChecked===undefined || register[index].isChecked===false) { index = -1; addRegister("47206"); } }
        index = register.findIndex(index => index.register == "47007");
        if(index!==-1) { if(register[index].isChecked===undefined || register[index].isChecked===false) { index = -1; addRegister("47007"); } }
        index = register.findIndex(index => index.register == "47398");
        if(index!==-1) { if(register[index].isChecked===undefined || register[index].isChecked===false) { index = -1; addRegister("47398"); } }
        index = register.findIndex(index => index.register == "47011");
        if(index!==-1) { if(register[index].isChecked===undefined || register[index].isChecked===false) { index = -1; addRegister("47011"); } }
    }
}
function checkConfig(configCheck) {
    fs.readFile('/home/pi/.nibepi/config.json','utf8', (err, data) => {
        if (err) throw err;
        if(JSON.stringify(configCheck)!=data) {
            //logMQTT('Config has changed')
            console.log('Config has changed')
            //startExternalMQTT()
            let savedConfig = JSON.parse(data);
            writeConfig(configCheck,savedConfig);
        }
      });
}
function writeConfig(configCheck,savedConfig) {
exec('sudo mount -o remount,rw /', function(error, stdout, stderr) {
    if (error) {
      console.log(stderr);
    } else {
        console.log('Write mode active')
        fs.writeFile('/home/pi/.nibepi/config.json', JSON.stringify(configCheck), function (err) {
            if (err) console.log(err);
            console.log('Config saved')
            publishMQTT('nibe/config',JSON.stringify(configCheck),true);
            config = configCheck;
            exec('sudo mount -o remount,ro /', function(error, stdout, stderr) {
                if (error) {
                  console.log('Could not set Read only mode');
                  logMQTT('Fel. Kunde inte sätta läsbart läge')
                } else {
                    console.log('Read-only mode active')
                }
                if(config.plugins.indoor.active===true && savedConfig.plugins.indoor.active===false) {
                    logMQTT('Lägger till register för Inomhusreglering')

                    addPluginRegisters()
                }
                if(config.plugins.smhi.active===true && savedConfig.plugins.smhi.active===false) {
                    logMQTT('Lägger till register för Prognosreglering')
                    addPluginRegisters()
                }
                if(config.plugins.tibber.active===true && savedConfig.plugins.tibber.active===false) {
                    logMQTT('Lägger till register för Elprisreglering')
                    addPluginRegisters()
                }
                if(config.plugins.airflow.active===true && savedConfig.plugins.airflow.active===false) {
                    logMQTT('Lägger till register för Automatisk lufthastighet')
                    addPluginRegisters()
                }
              });
        });
    }
  });
}
function checkRegister(configCheck) {
    exec('sudo mount -o remount,rw /', function(error, stdout, stderr) {
        if (error) {
          console.log(stderr);
        } else {
            console.log('Write mode active')
            configCheck = JSON.stringify(configCheck, null, "\t")
            configCheck = configCheck.toString()
            if(configCheck.length>50) {
            fs.writeFile("/home/pi/.nibepi/models/"+config.pump+".json", configCheck, function (err) {
                if (err) console.log(err);
                console.log('Register updated')
                register = require('./models/'+config.pump+'.json');
                publishMQTT('nibe/register',JSON.stringify(register),true);
                
                exec('sudo mount -o remount,ro /', function(error, stdout, stderr) {
                    if (error) {
                      console.log('Could not set Read only mode');
                    } else {
                        console.log('Read-only mode active')
                        logMQTT('Endast läsläge aktivt')
                    }
                  });
            });
        }
        }
      });
    }
function logMQTT(data) {
    publishMQTT("nibe/log", data,true);
}
var ext_mqtt_client;
var ext_mqtt_connected = false;
function startExternalMQTT() {
    if(config.mqtt!==undefined) {
        if(config.mqtt.active===true) {
            if(config.mqtt.host!==undefined && config.mqtt.host!=="" && config.mqtt.port!==undefined && config.mqtt.port!="") {
                if(config.mqtt.host=="127.0.0.1" || config.mqtt.host=="localhost") {
                    logMQTT('MQTT brokern är redan konfiguerad som standard')
                } else if(ext_mqtt_connected===false) {
                    externalMQTT()
                } else if(ext_mqtt_connected===true) {

                }
            } else {
                logMQTT('Extern MQTT broker saknar namn eller port')
                if(ext_mqtt_connected===true) {
                    ext_mqtt_client.end(true)
                }
            } 
        } else if(ext_mqtt_connected===true) {
            logMQTT('Stänger av extern MQTT broker')
            ext_mqtt_client.end(true)
        }
    } else if(ext_mqtt_connected===true) {
        ext_mqtt_client.end(true)
    }
}

async function externalMQTT() {
    return new Promise(function(resolve, reject) {
    var ext_mqtt_host = config.mqtt.host;
    var ext_mqtt_port = config.mqtt.port||1883;
    var ext_mqtt_base_topic = config.mqtt.base_topic||'nibe';
    var ext_mqtt_username = config.mqtt.username||'';
    var ext_mqtt_password = config.mqtt.password||'';
    var ext_mqtt_client_id = 'nibepi';
    // MQTT CLIENT OPTIONS
    var mqtt_Options = {
        port: ext_mqtt_port,
        keepalive: 60,
        clientId: ext_mqtt_client_id+'_' + Math.random().toString(16).substr(2, 8),
        protocolId: 'MQTT',
        //protocolVersion: 4,
        clean: true,
        reconnectPeriod: 5000,
        connectTimeout: 30 * 1000,
        username: ext_mqtt_username, //the username required by your broker, if any
        password: ext_mqtt_password, //the password required by your broker, if any
        will: { topic: ext_mqtt_base_topic, payload: ext_mqtt_client_id + ' disconnected', qos: 1, retain: false }
    };

    ext_mqtt_client = mqtt.connect('mqtt://' + ext_mqtt_host, mqtt_Options);
    
    ext_mqtt_client.on('connect', function () {
        if(ext_mqtt_connected==false) {
            ext_mqtt_connected = true;
            console.log('External MQTT broker connected');
            logMQTT('Extern MQTT broker är ansluten')
            resolve(true)
            ext_mqtt_client.subscribe('#');
            ext_mqtt_client.publish(ext_mqtt_base_topic, 'mqtt client ' + ext_mqtt_client_id + ' started at ' + new Date());
        }
    });
    ext_mqtt_client.on('close',function(){
        if(ext_mqtt_connected==true) {
            logMQTT('Extern MQTT broker är frånkopplad')
            console.log("External MQTT Broker is offline.")
            ext_mqtt_connected = false;
        }
        resolve(false)
      })

    // MQTT INCOMING
    ext_mqtt_client.on('message', function (topic, message) {
    //console.log('Incoming External MQTT message:', topic, message.toString());
    if(topic==config.plugins.indoor.mqttsensor) {
        if(config.plugins.indoor.nibesensor==false) {
            if(ext_mqtt_connected!==undefined && ext_mqtt_connected==true) {
                mqtt_client.publish('nibe/plugins/indoor/mqttsensor', message.toString(),{retain:false});
            }
        }
    } else {
        incomingMQTT(topic, message)
    }
    });
})
}

function incomingMQTT(topic, message) {
    if(topic=="nibe/config/get") {
            publishMQTT('nibe/config',JSON.stringify(config),true);
    } else if(topic=="nibe/config/set") {
        var configMsg = JSON.parse(message);
        if(configMsg.pump!=undefined) {
            config = configMsg;
            checkConfig(configMsg);
        }
    } else if(topic=="nibe/suncalc/get") {
        suncalc = JSON.parse(message)
        var times = SunCalc.getTimes(suncalc.timestamp, suncalc.lat, suncalc.lon);
        publishMQTT('nibe/suncalc',JSON.stringify(times).toString(),false);
    } else if(topic=="nibe/register/get") {
        publishMQTT('nibe/register',JSON.stringify(register),true);
    } else if(topic=="nibe/register/set") {
        checkRegister(message);
    } else if(topic=="nibe/register/add") {
        addRegister(message)
    } else if(topic=="nibe/register/remove") {
        let index = register.findIndex(index => index.register == message);
            if(index!==undefined && index!=-1) {
                console.log('Register ('+message+') found at index: '+index)
                register[index].isChecked = false;
                checkRegister(register)
            }
        let indexConfig = config.registers.findIndex(indexConfig => indexConfig.register == message);
        /*function checkIt(element) {
            return element.register == message;
        }
        function checkMa(element) {
            return element.register == message;
        }
        var confReg = config.registers.findIndex(checkMa)
        
        if(confReg!=-1) {
            console.log('Register ('+message+') removed from Registers database')
            config.registers.splice(confReg,1)
            checkConfig(config);
        } else {
            console.log('Register ('+message+') is not in the Registers database.')
        }*/
        if(indexConfig!=-1) {
            console.log('Register ('+message+') found at index: '+indexConfig)
            logMQTT('Register ('+message+') borttagen från registerdatabasen')
            console.log('Register ('+message+') removed from Registers database')
            config.registers.splice(indexConfig,1)
            checkConfig(config);
        } else {
            logMQTT('Register ('+message+') finns inte i registerdatabasen.')
            console.log('Register ('+message+') is not in the Registers database.')
        }
        let indexData = dataRegister.findIndex(indexData => indexData.register == message);
        if(indexData!=-1) {
            console.log('Register Data ('+message+') found at index: '+indexData)
            console.log('Register ('+message+') removed from Data database')
            checkRegisterType(dataRegister[indexData],function(err,callback) {
                if (err) throw err;
                var topicOut = 'homeassistant/'+callback.component+'/'+message+'/config'
                var payload = "";
                publishMQTT(topicOut,payload,true)
                dataRegister.splice(indexData,1)
            });
        } else {
            console.log('Register ('+message+') is not in the Data database.')
        }
        /*let reg = dataRegister.findIndex(checkIt)
        if(reg!=-1) {
            console.log('Register ('+message+') removed from Data database')
            checkRegisterType(dataRegister[reg],function(err,callback) {
                if (err) throw err;
                var topicOut = 'homeassistant/'+callback.component+'/'+message+'/config'
                var payload = "";
                publishMQTT(topicOut,payload,true)
                dataRegister.splice(reg,1)
            });
        } else {
            console.log('Register ('+message+') is not in the Data database.')
        }*/
    } else if(topic.includes(config.defaultTopic)) {
        topic = topic.split("/");
        function find_register_in_topic(element) {
            return element == "set";
        }
        var setReg = topic.findIndex(find_register_in_topic)
        if(setReg!=-1) {
            var regTopic = topic[setReg-1];
            var send = setRegister(regTopic,message);
            if(send!==undefined) {
                sendQueue.push(send);
                waitACK = regTopic;
            }
        }
    }
}
function updatePump(callback) { 
        console.log('Checking for pump settings')
    exec('sudo mount -o remount,rw /boot', function(error, stdout, stderr) {
      if (error) console.log(stderr);
      fs.readFile('/boot/pump.txt','utf8', (err, file) => {
        if (err) return;
        const lines = file.split('\n')
        if(lines[0].length<2) {
          console.log('Missing data in pump config file.');
          return;
        } else {
          console.log(`Pump name found in file: ${lines[0]}`)
          exec('sudo rm /boot/pump.txt', function(error, stdout, stderr) {
            if (err) throw err;
            console.log('/boot/pump.txt deleted.');
            exec('sudo mount -o remount,ro /boot', function(error, stdout, stderr) {
              if (error) {
                console.log('Could not set Read only mode');
              } else {
                  console.log('Pump config finished')
              }
            });
        }); 
          callback(lines[0]);
        }
      });
  });
  }
