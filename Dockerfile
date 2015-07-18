FROM node:0.10-onbuild
EXPOSE 19690

# Format: MAINTAINER Name <email@addr.ess>
MAINTAINER	Randy randy@conversepoint.com

CMD ./bin/startAll.sh

