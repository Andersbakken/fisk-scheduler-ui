#!/bin/bash
cp img/favicon.ico $1/
cd "$1"
for i in pie-chart logs compilers config; do
    ln -sf ./index.html "$i"
done
echo 'FileETag None
<ifModule mod_headers.c>
Header unset ETag
Header set Cache-Control "max-age=0, no-cache, no-store, must-revalidate"
Header set Pragma "no-cache"
Header set Expires "Wed, 11 Jan 1984 05:00:00 GMT"
</ifModule>' > ./htaccess
