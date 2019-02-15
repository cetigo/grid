module.exports = function (grunt) {

    grunt.initConfig({
        babel: {
            options: {
                presets: ['es2015']
            },
            dist: {
                files: [{
                    expand: true,
                    cwd: 'src',
                    src: ['*.js.es6'],
                    dest: 'dist',
                    ext: '.js'
                }]
            }
        },

        watch: {
            es6: {
                files: ['src/*.js.es6'],
                tasks: ['babel']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-babel');

    grunt.registerTask('deploy', ['babel']);

};
