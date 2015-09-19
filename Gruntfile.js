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
        },
        jshint: {
            files: ['bin/*.js','src/**/*.js']
        }
    });

    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-contrib-jshint');

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

    grunt.registerTask('lint',
        [
            'jshint'
        ]
    );

};

