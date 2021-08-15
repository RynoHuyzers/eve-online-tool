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
        stage('Package: RestAPI Proxy Lambda') {
            steps {
                sh """
                    npm prune --production
                    npx mkdirp deploy/rest-api

                    cd build

                    ## zip all build artifact from rest-api:build
                    zip -r9 ../deploy/rest-api/project-template.zip *
                    cd ..
                    ## zip node modules into zip file
                    zip -r9 deploy/rest-api/project-template.zip node_modules/
                    rm -rf node_modules
                """
            }
        }   
        stage('Prepare Deploy Dependencies') {
            // Basically always perform this step 
            steps {
                script{
                    if (env.DEPLOYMENT_ENVIRONMENT != 'no_deploy') {
                        sh """
                            echo "Install CDK Dependencies"
                            npm install
                        """
                    }
                }
            }
        }
        stage('Deploy: RestAPI Proxy Lambda') {
            steps{
                                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding',
                                    credentialsId: "${env.AWSCredentialId}",
                                    accessKeyVariable: 'AWS_ACCESS_KEY_ID',
                                    secretKeyVariable: 'AWS_SECRET_ACCESS_KEY']]) {
                    sh """
                        echo "Deploy REST API Proxy Lambda"
                        ## cd into cdk directory and compiles cdk
                        npm run cdk:build:rest-api-proxy

                        cd cdk/src/rest-api/proxy-lambda
                        npx rimraf cdk.out

                        ## Deploys zip file created during cdk compile
                        npm run cdk:deploy:rest-api-proxy -- --require-approval=never \
                          -c AWSRegion=${params.AWSRegion} \
                          -c AWSAccountNumber=${env.AWSAccountNumber} \
                          -c ProjectName=${env.ProjectName} \
                          -c Env=${env.DEPLOYMENT_ENVIRONMENT} \
                    """
                }
            }
        }  
    }

}