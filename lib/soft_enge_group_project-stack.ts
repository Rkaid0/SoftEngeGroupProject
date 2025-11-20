import { AuthorizationType, CognitoUserPoolsAuthorizer, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { UserPool, UserPoolClient } from 'aws-cdk-lib/aws-cognito';
import { Code, Runtime, Function } from 'aws-cdk-lib/aws-lambda';
import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class SoftEngeGroupProjectStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // Define the Cognito User Pool
    const userPool = new UserPool(
      this,
      'UserPool',
      {
        userPoolName: 'my-user-pool',
        selfSignUpEnabled: true,
        signInAliases: {
          email: true,
          username: true
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

    // Define the API Gateway
    const api = new RestApi(this, 'MyApi', {
      restApiName: 'My Service',
      description: 'This service serves as an example.',
    });

    // Create a Cognito authorizer
    const authorizer = new CognitoUserPoolsAuthorizer(this, 'MyAuthorizer', {
      cognitoUserPools: [userPool],
    });

    // Create an endpoint
    const lambdaIntegration = new LambdaIntegration(myFunction);
    const resource = api.root.addResource('hello');
    resource.addMethod('GET', lambdaIntegration, {
      authorizer,
      authorizationType: AuthorizationType.COGNITO,
    });
  }
}
