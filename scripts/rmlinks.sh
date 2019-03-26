#!/bin/bash
cd "$1"
for i in pie-chart logs compilers config; do
    rm -f "$i"
done
rm -f ./htaccess
