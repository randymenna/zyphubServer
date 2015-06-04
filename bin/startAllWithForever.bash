#/bin/bash
cd ../

nodeEnv=${NODE_ENV:-$1}
nodeEnv=${nodeEnv:-default}
echo $nodeEnv;


echo '=======================================';
echo 'Atrium Environment is set to: ' $nodeEnv ;
echo '=======================================';

atriumExecutables=(
                    auditEngine.js
                    conversationRouter.js
                    webhookServer.js
                    restServer.js
                    scheduler.js
                    )

for atriumExecutable in  "${atriumExecutables[@]}"
{
   baseExecutableName=$(basename atriumExecutable .js);
   logFileName=$baseExecutableName;
   logFileName+=".log"
   NODE_ENV=$nodeEnv forever start -v -d --minUptime 1  --append -p ./logs -l $logFileName -e $logFileName -o $logFileName  bin/${atriumExecutable}
}


