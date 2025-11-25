import { AuthorizationType, CognitoUserPoolsAuthorizer, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { UserPool, UserPoolClient } from 'aws-cdk-lib/aws-cognito';
import { Code, Runtime, Function } from 'aws-cdk-lib/aws-lambda';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';

export class SoftEngeGroupProjectStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define the Cognito User Pool
    const userPool = new UserPool(
      this,
      'UserPool',
      {
        userPoolName: 'soft-enge-user-pool',
        selfSignUpEnabled: true,
        signInAliases: {
          email: true
        },
        autoVerify: {
          email: true
        },
        removalPolicy: cdk.RemovalPolicy.DESTROY
      }
    )

    // Define the Cognito User Pool Client
    const userPoolClient = new UserPoolClient(
      this,
      'UserPoolClient',
      {
        userPool,
        generateSecret: false,
        authFlows: {
          userPassword: true
        }
      }
    )

    // Output the User Pool Client ID
    new cdk.CfnOutput(
      this,
      'UserPoolClientID',
      {
        value: userPoolClient.userPoolClientId
      }
    )

    // Define the Lambda function
    const myFunction = new Function(this, 'MyFunction', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: Code.fromInline(`
        exports.handler = async function(event) {
          console.log('request:', JSON.stringify(event, undefined, 2));
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/plain' },
            body: \`Hello, \${event.requestContext.authorizer.claims['email']}!\`,
          };
        };
      `),
    });

    // 1. Import existing VPC where RDS lives
    const vpc = ec2.Vpc.fromLookup(this, "ExistingVpc", {
      vpcId: "vpc-0f904a9de1410f955",
    });

    // 2. Import the RDS security group
    const rdsSG = ec2.SecurityGroup.fromSecurityGroupId(
      this,
      "RdsSG",
      "sg-05ec573547ce1cd4a"
    );

    // 3. Create a security group for Lambda
    const lambdaSG = new ec2.SecurityGroup(this, "LambdaSG", {
      vpc,
      allowAllOutbound: true,
    });

    // 4. Allow Lambda → RDS (MySQL on port 3306)
    rdsSG.addIngressRule(
      lambdaSG,
      ec2.Port.tcp(3306),
      "Allow Lambda to access RDS MySQL"
    );

    const createStoreChainFunction = new NodejsFunction(this, 'CreateStoreChain', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../lambda/create_store_chain.ts'),
      handler: 'createStoreChain',
      bundling: {
        externalModules: [],
        nodeModules: ["mysql2"],
      },
      vpc,
      securityGroups: [lambdaSG], 
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC
      },
      allowPublicSubnet: true
    });

    // db password
    createStoreChainFunction.addEnvironment("DB_PASSWORD", process.env.DB_PASSWORD!);

    // Define the API Gateway
    const api = new RestApi(this, 'ApiEndpoint', {
      restApiName: 'My Service',
      description: 'This service serves as an example.',
    });

    // Create a Cognito authorizer
    const authorizer = new CognitoUserPoolsAuthorizer(this, 'MyAuthorizer', {
      cognitoUserPools: [userPool],
    });

    // Create an endpoint
    const lambdaIntegration = new LambdaIntegration(myFunction);
    const createStoreChainIntegration = new LambdaIntegration(createStoreChainFunction);
    const resource = api.root.addResource('hello');
    const createStoreChainResource = api.root.addResource('createStoreChain');
    
    resource.addMethod('GET', lambdaIntegration, {
      authorizer,
      authorizationType: AuthorizationType.COGNITO,
    });
    
    createStoreChainResource.addMethod('POST', createStoreChainIntegration, {
      authorizer,
      authorizationType: AuthorizationType.COGNITO,
    });
  }
}
