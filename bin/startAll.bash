cd ../
mkdir logs
nohup node bin/auditEngine.js &
nohup node bin/conversationRouter.js &
nohup node bin/notificationServer.js &
nohup node bin/restServer.js &
nohup node bin/scheduler.js &

