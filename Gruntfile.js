module.exports = function(grunt) {

    grunt.initConfig({

        shell : {
            configDocker: {
                command : [
                    'cp config/docker-default.yaml config/default.yaml'
                ].join(';')
            },
            buildDocker: {
                command : [
                    'docker build --tag conversepoint .'
                ].join(';')
            },
            configDev: {
                command : [
                    'cp config/dev-default.yaml config/default.yaml'
                ].join(';')
            }
        }
    });

    grunt.loadNpmTasks('grunt-shell');

    grunt.registerTask('docker' ,
        [
            'shell:configDocker',
            'shell:buildDocker'
        ]
    );

    grunt.registerTask('dev' ,
        [
            'shell:configDev'

        ]
    );

};

