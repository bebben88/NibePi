#!/bin/bash
echo "Starting Update of NibePi"
echo "Setting R/W mode for the filesystem during update..."
sudo mount=$(sudo mount -o remount,rw / 2>/tmp/tar_stderr);
sudo rm /etc/cron.hourly/fake-hwclock 2>/tmp/tar_stderr #Bugfix for RO unintentionally

echo "Looking for Node-RED folder."
dirNodeRED=$(find / -type f -name 'flows.json' 2>/dev/null | sed -r 's|/[^/]+$||' |sort |uniq);
echo $dirNodeRED
if [ -z $dirNodeRED ]
then
echo "Path not found, restoring last version."
#/home/pi/.node-red/flows_saved.bak
#/home/pi/.nibepi/heatpump_saved.js
#/home/pi/.nibepi/config_saved.json
cp /home/pi/.node-red/flows_saved.bak /home/pi/.node-red/flows.json 2>/dev/null
cp /home/pi/.nibepi/heatpump_saved.js /home/pi/.nibepi/heatpump.js 2>/dev/null
cp /home/pi/.nibepi/config_saved.json /home/pi/.nibepi/config.json 2>/dev/null
echo "Restarting with the old version"
sudo service nibepi restart
sudo service nodered restart
# Abort
else
echo "Path found: ${dirNodeRED}"
sudo mount=$(sudo mount -o remount,rw / 2>/tmp/tar_stderr);
echo "Installing the NibePi addon to Node-RED"
cd $dirNodeRED && npm uninstall node-red-contrib-nibepi && npm install --save anerdins/node-red-contrib-nibepi#master
echo "Downloading new flows for Node-RED"
sudo mount=$(sudo mount -o remount,rw / 2>/tmp/tar_stderr);
cd /tmp && wget https://raw.githubusercontent.com/anerdins/nibepi-flow/master/flows.json
cd /tmp && mv -f flows.json $dirNodeRED/flows.json
echo "Updated succesfully"

echo "Looking for NibePi folder."
dirNode=$(find / -type f -name 'heatpump.js' 2>/dev/null | sed -r 's|/[^/]+$||' |sort |uniq);
if [ -z $dirNode ]
then
echo "Path not found"
else
echo "Path found: ${dirNode}"
sudo mount=$(sudo mount -o remount,rw / 2>/tmp/tar_stderr);
echo "Disabling NibePi Service"
sudo systemctl stop nibepi.service
mount=$(sudo mount -o remount,rw / 2>/tmp/tar_stderr);
sudo systemctl disable nibepi.service
echo "Removing old version of NibePi..."
rm -R $dirNode
fi

echo "Restarting Node-RED."
sudo service nodered restart

fi
