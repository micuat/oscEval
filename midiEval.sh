cd /home/pi/oscEval

# xdpyinfo | grep dimensions | sed -e 's/.* \([0-9]\+\)x\([0-9]\+\).*/\1\n\2/g'
resx=$(xdpyinfo | grep dimensions | sed -e 's/.* \([0-9]\+\)x\([0-9]\+\).*/\1/g')
resy=$(xdpyinfo | grep dimensions | sed -e 's/.* \([0-9]\+\)x\([0-9]\+\).*/\2/g')

resxh=$(expr $resx / 2)
resyh=$(expr $resy / 2)

wmctrl -r midibash -e 0,$resxh,$resyh,$resxh,$resyh
chromium-browser --app=http://localhost:8081 &

node /home/pi/oscEval/index.js midi $resxh $resyh
