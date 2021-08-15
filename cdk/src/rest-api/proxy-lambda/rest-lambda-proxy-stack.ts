import {App, Duration, Stack, StackProps} from "@aws-cdk/core";
import {IStringParameter, StringParameter} from "@aws-cdk/aws-ssm";
import {AssetCode, ILayerVersion, LayerVersion, Runtime, Function} from "@aws-cdk/aws-lambda";
import {Effect, ManagedPolicy, PolicyStatement, Role, ServicePrincipal} from "@aws-cdk/aws-iam";

export class ProxyLambda extends Stack{
    constructor(app: App, id: string, props: StackProps) {
        super(app, id, props);

        const appName = this.node.tryGetContext('AppName');
        const environment = this.node.tryGetContext('Env');
        const accountNumber = this.node.tryGetContext('AWSAccountNumber')

        /******** Roles and policies */
        const customLambdaRole = new Role(this, 'analyticsRole', {
            roleName: 'analyticsRole',
            assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [
                ManagedPolicy.fromAwsManagedPolicyName('AWSLambda_FullAccess'),
                ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'),
                ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMFullAccess'),
                ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
            ],
        });

        // Rest Proxy Function
        const restProxyFnPath: string = `${__dirname}/../../../../deploy/rest-api/project-template.zip`;
        const restProxyLambda: Function = new Function(this, 'RestAPI_ProxyLambda', {
            functionName: 'RestProxy',
            code: new AssetCode(restProxyFnPath),
            handler: 'rest-api/rest-api/src/lambda-rest-handler.handler',
            runtime: Runtime.NODEJS_12_X,
            memorySize: 1024,
            timeout: Duration.seconds(60),
            environment: {},
            logRetention: 5,
            role: customLambdaRole,
        });

        //SSM Parameters
        new StringParameter(this, 'RestApiProxyLambdaArnParameter', {
            parameterName: '/AnalyticsMicroservice/RestApi/ProxyLambda/Arn',
            stringValue: restProxyLambda.functionArn,
        });
    }
}