cd /home/pi/oscEval

# xdpyinfo | grep dimensions | sed -e 's/.* \([0-9]\+\)x\([0-9]\+\).*/\1\n\2/g'
resx=$(xdpyinfo | grep dimensions | sed -e 's/.* \([0-9]\+\)x\([0-9]\+\).*/\1/g')
resy=$(xdpyinfo | grep dimensions | sed -e 's/.* \([0-9]\+\)x\([0-9]\+\).*/\2/g')

resxh=$(expr $resx / 2)
resyh=$(expr $resy / 2)

wmctrl -r oscbash -e 0,0,$resyh,$resxh,$resyh
chromium-browser --app=http://localhost:8080 &

node /home/pi/oscEval/index.js osc $resxh $resyh
