pipeline {
    agent none
    stages {
        stage('Build') {
            agent {
                node {
                    label 'meta-build'
                }
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
