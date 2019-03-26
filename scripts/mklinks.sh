#!/bin/bash
cd "$1"
for i in pie-chart logs compilers config; do
    ln -sf ./index.html "$i"
done
echo 'Header set Cache-Control "no-cache"' > ./.htaccess
