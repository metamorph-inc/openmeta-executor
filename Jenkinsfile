pipeline {
    agent none
    stages {
        stage('Build') {
            agent {
                node {
                    label 'meta-build'
                }
            }
            triggers {
                pollSCM('H/5 * * * *')
            }
            steps {
                checkout scm
                dir('jenkins') {
                    bat('jenkins_build.cmd')
                }

                archiveArtifacts artifacts: 'jenkins/remote-executor.zip', onlyIfSuccessful: true
            }

        }
    }
}
