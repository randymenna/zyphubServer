# cd ../
# mkdir logs
nohup node bin/conversationRouter.js &
nohup node bin/notificationServer.js &
nohup node bin/restServer.js &

