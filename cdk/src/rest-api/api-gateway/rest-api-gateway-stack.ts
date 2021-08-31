import { App, Stack, StackProps } from '@aws-cdk/core';
import {
    SpecRestApi,
    ApiDefinition,
    DomainName,
    SecurityPolicy,
    EndpointType,
    BasePathMapping
} from '@aws-cdk/aws-apigateway';
import { Role, ServicePrincipal, PolicyStatement } from '@aws-cdk/aws-iam'; 
import { StringParameter, IStringParameter } from '@aws-cdk/aws-ssm';


export class RestAPIStack extends Stack {
  
  constructor(app: App, id: string, props: StackProps) {
    super(app, id, props);


    const certArn: string = this.node.tryGetContext('AdminPortalCertificateARN');
    const environment: string = this.node.tryGetContext('Env');
    const domainName: string = this.node.tryGetContext('AdminPortalDomain');
    // Rest Proxy Function

    /** lambda arn, created in other cdk */
    const restProxyLambdaArn: IStringParameter = StringParameter.fromStringParameterName(
      this, 
      'RestProxy',
      '/AnalyticsMicroservice/RestApi/ProxyLambda/Arn');
/** Adding this to redeploy **/

    /** ClientManagement API **/
    const restSpecFile: string = `${__dirname}/../../../../deploy/rest-api/clients-api.yaml`; /** yaml file was created here during 'Build RestAPI' stage in jenkins build */
    const api: SpecRestApi = new SpecRestApi(
      this, 
      'AdminPortal-RestAPI', {
        restApiName: 'AdminPortalRestAPI',
        apiDefinition: ApiDefinition.fromAsset(restSpecFile),
      }
    );



    /** API Role and policy */
    const apiRole: Role = new Role(
      this, 
      'apiRole', {
        roleName: 'RestAPIRole',
        assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
      }
    );
    
    apiRole.addToPolicy(
      new PolicyStatement({
      resources: [restProxyLambdaArn.stringValue],
        actions: ['lambda:InvokeFunction'],
      }),
    );
  }
}
