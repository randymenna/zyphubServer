boot2docker ssh -L 0.0.0.0:19690:localhost:19690

docker run --name mongo -d apopelo/mongodb-2.4.8
docker run -d -e RABBITMQ_NODENAME=cp-rabbit --name rabbit -p 15672:15672 rabbitmq:3-management
docker run -p 19690:19690 --name conversepoint --link rabbit:rabbit --link mongo:mongo -d -t conversepoint