#!/bin/bash
echo "Starting Update of NibePi"
echo "Setting R/W mode for the filesystem during update..."
mount=$(sudo mount -o remount,rw / 2>/tmp/tar_stderr);
echo "Disabling NibePi Service"
sudo systemctl stop nibepi.service
mount=$(sudo mount -o remount,rw / 2>/tmp/tar_stderr);
sudo systemctl disable nibepi.service
echo "Looking for NibePi folder."
dirNode=$(find / -type f -name 'heatpump.js' 2>/dev/null | sed -r 's|/[^/]+$||' |sort |uniq)
echo "Path found: ${dirNode}"
echo "Removing old version of NibePi..."
rm -R $dirNode
echo "Looking for Node-RED folder."
dirNode=$(find / -type f -name 'flows.json' 2>/dev/null | sed -r 's|/[^/]+$||' |sort |uniq)
echo "Path found: ${dirNode}"
echo "Installing the NibePi addon to Node-RED"
cd $dirNode && npm install node-red-contrib-nibepi --save
echo "Downloading new flows for Node-RED"
cd /tmp && wget https://raw.githubusercontent.com/bebben88/NibePi/master/node-red/flows_1.1.json
cd /tmp && mv -f flows_1.1.json $dirNode/flows.json
echo "Setting R/O mode for the filesystem again..."
mount=$(sudo mount -o remount,ro / 2>/tmp/tar_stderr);
stderr_var=$( cat /tmp/tar_stderr )
if [[ ($stderr_var == "mount: / is busy") ]]
then
    echo "Filesystem is busy"
else
fi
#cleanup
rm /tmp/nibepi.sh
echo "Restarting Node-RED"
sudo service nodered restart
