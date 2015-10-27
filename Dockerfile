FROM node:4-onbuild
EXPOSE 19690
EXPOSE 19691

# Format: MAINTAINER Name <email@addr.ess>
MAINTAINER	Randy randy@conversepoint.com

CMD ./bin/startAll.sh

