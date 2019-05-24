#!/bin/bash
if [ -d "$1" ]; then
    cd "$1"
    for i in pie-chart logs compilers config; do
        rm -f "$i"
    done
    rm -f ./htaccess
    rm -f ./favicon.png
fi
