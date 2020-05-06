#!/bin/bash

file1="/etc/cron.hourly/fake-hwclock"
file2="/tmp/fake-hwclock"
if [ ! -f ${file2} ];
then
cd /tmp && wget "https://raw.githubusercontent.com/bebben88/NibePi/master/update/bugfix/fake-hwclock"
fi
if [ -f ${file2} ];
then
if cmp -s "$file1" "$file2"; then
    printf 'The file "%s" is the same as "%s"\n' "$file1" "$file2"
    rm $file2
else
    printf 'The file "%s" is different from "%s"\n' "$file1" "$file2"
        if [ -f ${file2} ];
        then
        sudo mount -o remount,rw / && sudo chmod u+x $file2
        sudo mount -o remount,rw / && sudo mv $file2 $file1
        fi
fi
fi
