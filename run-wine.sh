#!/usr/bin/env bash
cd winvm
# docker build -t syncwine .
docker rm -f gamevm
# docker run -d --network=host --env "USE_XVFB=yes" --env "XVFB_SERVER=:99" --env "DISPLAY=:99" --env "XVFB_RESOLUTION=1280x800x16" --env "XVFB_SCREEN=0" --env "TZ=Asia/Singapore" --env "apppath=$1" --env "appfile=$2" --env "appname=$3" --name "gamevm" --rm --mount type=bind,source="$(pwd)"/games,target=/games --hostname="$(hostname)" --shm-size=1g --volume=winehome:/home/wineuser --workdir=/home/wineuser syncwine supervisord
docker run -d --privileged --network=host --rm --name "gamevm" --mount type=bind,source="$(pwd)"/games,target=/games --env "appfile=$2" --env "apppath=$1" --env "appname=$3" --env "DISPLAY=:99" --volume "/tmp/.X11-unix:/tmp/.X11-unix:ro" --volume="${XAUTHORITY:-${HOME}/.Xauthority}:/root/.Xauthority:ro" --volume "winecfg:/root/.wine" syncwine supervisord
# docker run -d --privileged --network=host --rm --name "gamevm" --mount type=bind,source="$(pwd)"/games,target=/games --env "appfile=$2" --env "apppath=$1" --env "appname=$3" --env "DISPLAY=:99" --volume "/tmp/.X11-unix:/tmp/.X11-unix:ro" --volume="${XAUTHORITY:-${HOME}/.Xauthority}:/root/.Xauthority:ro" --mount type=bind,source="$(pwd)"/winecfg,target=/root/.wine syncwine supervisord