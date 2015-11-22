module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      app: {
        options: {
          sourceMap: true,
          sourceMapIncludeSources: true
        },
        files: {
          'ui/build/app.min.js': ['ui/app.js']
        }
      },
      deps: {
        options: {
          sourceMap: true,
          sourceMapIncludeSources: true
        },
        files: {
          'ui/build/deps.min.js': [
            
          ]
        }
      }
    },
    sass: {
        options: {
            sourceMap: true
        },
        dist: {
            files: {
                'ui/build/style.css': 'ui/style.scss'
            }
        }
    },
    watch: {
      js: {
        files: ['ui/app.js'],
        tasks: ['uglify:app']
      },
      style: {
        files: ['ui/style.scss'],
        tasks: ['sass']
      }
    },
    nodemon: {
      dev: {
        script: 'server.js'
      }
    },
    concurrent: {
      dev: {
        tasks: ['nodemon', 'watch'],
        options: {
          logConcurrentOutput: true
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-nodemon');
  grunt.loadNpmTasks('grunt-sass');

  grunt.registerTask('default', ['uglify', 'sass']);
  grunt.registerTask('dev', ['concurrent']);
};
