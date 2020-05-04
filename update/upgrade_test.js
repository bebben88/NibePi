var child = require('child_process');
let exec = child.exec;
const fs = require('fs');
if (!fs.existsSync("/etc/nibepi")) {
    exec(`sudo mount -o remount,rw / && sudo mkdir /etc/nibepi && sudo chown ${process.env.USER}:${process.env.USER} /etc/nibepi`, function(error, stdout, stderr) {
        console.log('Configuration directory created /etc/nibepi');
    });
}
function requireF(modulePath){ // force require
    try {
        return require(modulePath);
    }
    catch (e) {
        return;
    }
}
function startUpgrade() {
    child.spawn('bash', ['/tmp/upgrade.sh'], {
        detached: false,
        stdio: 'inherit'
      });
}
let started = false;
let config = {
    "version":"1.1",
    "registers":[],
    "connection":{
        "enable":"serial",
        "series":"fSeries"
    },
    "serial":{
        "port":"/dev/ttyAMA0"
    },
    "system":{
        "readonly":true
    },
    "home":{
        "adjust_s1":0,
        "adjust_s2":0
    },
    "mqtt": {
        "enable":true,
        "host":"127.0.0.1",
        "port":"1883",
        "user":"",
        "pass":"",
        "topic":"nibe/modbus/"
    },
    "weather":{

    },"price":{

    },
    "hotwater": {
        "enable_autoluxury": false,
        "diff": 20,
        "time": 10,
        "enable_hw_priority": false
    },
    "log": {
        "enable": false,
        "info": false,
        "core": false,
        "debug": false,
        "error": true
    },
    "indoor": {
        "dm_reset_enable":false,
        "dm_reset_enable_stop":false,
        "dm_reset_stop_diff":0.7,
        "dm_reset_slow_diff":0.3
    },
    "fan": {
        "co2_limit":800,
        "low_cpr_freq":40
    }
};
let mqtt_client;
function fail() {
    console.log('Script ended, terminating.')
    setTimeout(() => {
        process.exit(99);
        }, 2000);
}
function close() {
    setTimeout(() => {
    if(mqtt_client!==undefined) {
        mqtt_client.end();
    }
}, 5000);
}
function saveConfig() {
    return new Promise(function(resolve, reject) {
    exec('sudo mount -o remount,rw /', function(error, stdout, stderr) {
            fs.writeFile('./new_config.json', JSON.stringify(config,null,2), async function(err) {
                if(err) {
                    reject(err);
                } else {
                    resolve()
                }
            });
    });
});
}
function convertConfig () {
    return new Promise(function(resolve, reject) {
        let old_config = requireF('/home/pi/.nibepi/config.json');
        if(old_config!==undefined) {
            publishMQTT('upgrade',`Konverterar gamla inställningar till nya.`);
            // Registers
            if(old_config.registers!==undefined) {
                publishMQTT('upgrade',`Sparar ner ${old_config.registers.length} register.`);
                for (const arr of old_config.registers) {
                    config.registers.push(arr.register);
                }
            }
            // Plugins
            if(old_config.plugins!==undefined) {
                if(old_config.plugins.smhi!==undefined) {
                    if(old_config.plugins.smhi.active!==undefined) publishMQTT('upgrade',`Sparar inställningar för prognosreglering.`);
                    config.weather.enable_s1 = old_config.plugins.smhi.active;
                    config.home.hours_s1 = old_config.plugins.smhi.hours;
                    if(old_config.plugins.smhi.hours!==undefined) publishMQTT('upgrade',`Prognostid: ${old_config.plugins.smhi.hours} timmar`);
                    if(old_config.plugins.smhi.lat!==undefined) publishMQTT('upgrade',`Koordinater: Latitud: ${old_config.plugins.smhi.lat}, Longitud: ${old_config.plugins.smhi.lon}`);
                    config.home.lat = old_config.plugins.smhi.lat;
                    config.home.lon = old_config.plugins.smhi.lon;
                    if(old_config.plugins.smhi.sun_active!==undefined) publishMQTT('upgrade',`Sparar solfaktor inställningar.`);
                    config.weather.sun_enable = old_config.plugins.smhi.sun_active;
                    config.weather.clear = old_config.plugins.smhi.clear;
                    config.weather.half_clear = old_config.plugins.smhi.half_clear;
                    config.weather.mostly_clear = old_config.plugins.smhi.mostly_clear;
                    if(old_config.plugins.smhi.wind_active!==undefined) publishMQTT('upgrade',`Sparar vindfaktor inställningar.`);
                    config.weather.wind_enable = old_config.plugins.smhi.wind_active;
                    config.weather.wind_factor_n = old_config.plugins.smhi.wind_factor_n;
                    config.weather.wind_factor_s = old_config.plugins.smhi.wind_factor_s;
                    config.weather.wind_factor_w = old_config.plugins.smhi.wind_factor_w;
                    config.weather.wind_factor_e = old_config.plugins.smhi.wind_factor_e;
                }
                if(old_config.plugins.tibber!==undefined && old_config.plugins.tibber.active!==undefined) publishMQTT('upgrade',`Sparar inställningar för Elprisreglering.`);
                    config.price.enable = old_config.plugins.tibber.active;
                    if(old_config.plugins.tibber!==undefined && old_config.plugins.tibber.token!==undefined && old_config.plugins.tibber.token!=="") {
                        publishMQTT('upgrade',`Sparar Tibber token.`);
                        config.price.token = old_config.plugins.tibber.token;
                        config.price.source = "tibber";
                        if(old_config.plugins.tibber.active!==undefined && old_config.plugins.tibber.active===true) {
                            publishMQTT('upgrade',`Sparar inställningar för värmereglering`);
                            config.price.price_enable_heat_s1 = true;
                            config.price.heat_very_expensive_s1 = old_config.plugins.tibber.adjust_high;
                            config.price.heat_expensive_s1 = old_config.plugins.tibber.adjust_high;
                            config.price.heat_cheap_s1 = old_config.plugins.tibber.adjust_low;
                            config.price.heat_very_cheap_s1 = old_config.plugins.tibber.adjust_superlow;
                        }
                        if(old_config.plugins.tibber.hotwater_active!==undefined && old_config.plugins.tibber.hotwater_active===true) {
                            publishMQTT('upgrade',`Sparar inställningar för varmvattenreglering`);
                            config.price.hotwater_very_expensive = old_config.plugins.tibber.hotwater_price_high;
                            config.price.hotwater_expensive = old_config.plugins.tibber.hotwater_price_high;
                            config.price.hotwater_normal = old_config.plugins.tibber.hotwater_price_normal;
                            config.price.hotwater_cheap = old_config.plugins.tibber.hotwater_price_low;
                            config.price.hotwater_very_cheap = old_config.plugins.tibber.hotwater_price_superlow;
                        }
                    }
            }
        // MQTT
        if(old_config.mqtt!==undefined) {
            publishMQTT('upgrade',`Sparar inställningar för MQTT`);        
            if(old_config.mqtt.host!==undefined && old_config.mqtt.host!=="" && old_config.mqtt.active!==undefined && old_config.mqtt.active===true) {
                config.mqtt.enable = old_config.mqtt.active;
                config.mqtt.host = old_config.mqtt.host;
                config.mqtt.port = old_config.mqtt.port;
                config.mqtt.user = old_config.mqtt.username;
                config.mqtt.pass = old_config.mqtt.password;
            } else {
                config.mqtt.enable = true;
                config.mqtt.host = "127.0.0.1";
                config.mqtt.port = 1883;
                config.mqtt.user = "";
                config.mqtt.pass = "";
            }
            config.mqtt.topic = old_config.defaultTopic;
        }
        resolve(config);
        } else {
            reject(new Error('No old config'));
        }
    });
}
startMQTT().then(async function (result) {
    result.subscribe('#');
    if(mqtt_client!==undefined && mqtt_client.connected===true) {
        mqtt_client.on('message', async function (topic, message) {
            if(topic=="startupgrade" && started===false) {
                console.log('Node-RED is started, starting upgrade');
                started = true;
                await publishMQTT('upgrade',`Intern MQTT Broker är ansluten`);
                await convertConfig().then(result => {
                   config = result;
                },(err => {
                    console.log(err)
                    publishMQTT('upgrade','Misslyckades hämta gamla inställningar, fortsätter med standard.');
                }));
                publishMQTT('config',JSON.stringify(config));
                await saveConfig().then(result => {
                    publishMQTT('upgrade','Inställningar sparade till /etc/nibepi/config.json');
                },(err => {
                    console.log(err)
                    publishMQTT('upgrade','Kunde inte spara inställningar till SD-kort. Avbryter');
                }))
                startUpgrade()
                close();
            }
        });
    }
    
},(err => {
    console.log(err)
    fail();
}))
async function startMQTT() {
    return new Promise(function(resolve, reject) {
    const mqtt = require('mqtt');
    var mqtt_host = "127.0.0.1";
    var mqtt_port = "1883";
    var mqtt_publish_topic = 'nibe';
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
        rejectUnauthorized: false,
        //username: mqtt_username, //the username required by your broker, if any
        //password: mqtt_password, //the password required by your broker, if any
        will: { topic: mqtt_publish_topic, payload: mqtt_client_id + ' disconnected', qos: 1, retain: false }
    };
    mqtt_client = mqtt.connect('mqtt://' + mqtt_host, mqtt_Options);
    
    mqtt_client.on('connect', function () {
        console.log("MQTT Broker is connected.")
        resolve(mqtt_client);
    });
    mqtt_client.on('close',function(){
        console.log("MQTT Broker is disconnected.")
        reject(mqtt_client);
      })
      mqtt_client.on('error',function(){
        console.log("Could not connect to MQTT broker")
        reject(mqtt_client);
      })
})
}
async function publishMQTT(topic,message,retain=false) {
    const promise = new Promise((resolve,reject) => {
    if(mqtt_client!==undefined) {
        if(mqtt_client.connected===true && mqtt_client.disconnecting!==true) {
            mqtt_client.publish(topic, message.toString(),{retain:retain},(err,result) => {
                resolve(true);
            });
        } else {
            reject(false);
        }
    } else {
        reject(false);
    }
});
return promise;
}
