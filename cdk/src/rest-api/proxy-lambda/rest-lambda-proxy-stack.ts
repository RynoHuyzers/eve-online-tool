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
        // NestJS Rest API Layer
        const layerArn: IStringParameter = StringParameter.fromStringParameterName(
            this,
            'NestJSRestLayerARN',
            '/ClientManagement/RestApi/NestJsLayer/Arn',
        );
        const nestjsLayer: ILayerVersion = LayerVersion.fromLayerVersionAttributes(this, 'NestJSRestLayer', {
            layerVersionArn: layerArn.stringValue,
        });

        /******** Roles and policies */
        const customLambdaRole = new Role(this, 'analyticsRole', {
            roleName: 'analyticsRole',
            assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [
                ManagedPolicy.fromAwsManagedPolicyName('AWSLambda_FullAccess'),
                ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'),
                ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMFullAccess'),
                ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
                ManagedPolicy.fromAwsManagedPolicyName('AmazonEventBridgeFullAccess'),
            ],
        });
        customLambdaRole.addToPolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            resources: [`arn:aws:quicksight:eu-west-1:${accountNumber}:dashboard/*`],
            actions: ['quicksight:GetDashboardEmbedUrl'],
        }));
        customLambdaRole.addToPolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            resources: ['*'],
            actions: ['quicksight:DescribeUser',
                'quicksight:RegisterUser',
                'quicksight:GetAuthCode']
        }));

        // Rest Proxy Function
        const restProxyFnPath: string = `${__dirname}/../../../../deploy/rest-api/analytics-rest-lambda.zip`;
        const restProxyLambda: Function = new Function(this, 'Analytics_RestAPI_ProxyLambda', {
            functionName: 'Analytics-RestProxy',
            code: new AssetCode(restProxyFnPath),
            handler: 'rest-api/rest-api/src/lambda-rest-handler.handler',
            layers: [nestjsLayer],
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