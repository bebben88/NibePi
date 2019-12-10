#!/bin/bash
# Version 1.1
echo "Starting Update of NibePi"
echo "Setting R/W mode for the filesystem during update..."
mount=$(sudo mount -o remount,ro / 2>/tmp/tar_stderr);
stderr_var=$( cat /tmp/tar_stderr )
if [[ ($stderr_var == "mount: / is busy") ]]
then
    echo "Filesystem is busy"
else
echo "${stderr_var}"
fi
echo "Looking for Node-RED folder."
dirNode=$(find / -type f -name 'flows.json' 2>/dev/null | sed -r 's|/[^/]+$||' |sort |uniq)
echo "${dirNode}"
cd $dirNode && ls -l
# Cleanup
rm /tmp/nibepi.sh
