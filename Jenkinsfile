pipeline {
    agent any

    environment {
        AWS_DEFAULT_REGION="${params.AWSRegion}"
    }

    parameters {
        string(name: 'ProjectName', defaultValue: 'Project Template')

        string(name: 'AWSRegion', defaultValue: 'eu-west-1', description: 'AWS Region')

        //Dev
        string(name: 'DevAWSAccountNumber', defaultValue: '327579255305', description: '')
        string(name: 'DevAWSCredentialsId', defaultValue: 'JenkinsUser', description: 'AWS Credentials added to Jenkins')
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '4', artifactNumToKeepStr: '1'))
    }

    stages {
        stage('Env Setup') {
            steps {
                script {
                    switch(env.Branch_Name) {
                        case 'development':
                            env.DEPLOYMENT_ENVIRONMENT = "dev";
                            env.AWSAccountNumber="${params.DevAWSAccountNumber}"
                            env.AWSCredentialId = "${params.DevAWSCredentialsId}";
                    }
                    env.EnvLowerCase = "${env.DEPLOYMENT_ENVIRONMENT.toLowerCase()}";

                    env.AWS_DEFAULT_REGION = "${params.AWSRegion}";
                }
                script{
                    sh """
                        npm install
                    """

                }
            }
        }
        stage('Build: RestAPI Proxy lambda') {
            steps {
                
                    sh """
                        ## cd into correct directory, and nest build lambda code
                        npm run rest-api:build
                    """
                
            }
        }        
    }

}