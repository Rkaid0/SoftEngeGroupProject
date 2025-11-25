import { AuthorizationType, CognitoUserPoolsAuthorizer, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { UserPool, UserPoolClient } from 'aws-cdk-lib/aws-cognito';
import { Code, Runtime, Function } from 'aws-cdk-lib/aws-lambda';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { RemovalPolicy } from "aws-cdk-lib";

export class SoftEngeGroupProjectStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    //  COGNITO USER POOL
    const userPool = UserPool.fromUserPoolId(
      this,
      "ImportedUserPool",
      "us-east-1_40SpM0Fc9"
    );

    //  COGNITO USER POOL CLIENT
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

    // LAMBDA FUNCTIONS

    //  NORMAL LAMBDA FUNCTION (Cognito-protected "hello" endpoint)
    const myFunction = new NodejsFunction(this, "HelloLambda", {
      runtime: Runtime.NODEJS_20_X,
      entry: path.join(__dirname, "../lambda/hello.ts"),
      handler: "handler",
    });

    //  LAMBDA (TEST HANDLER)
    const nodeLambda = new NodejsFunction(this, 'NodeLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../lambda/test_handler.ts'),
      handler: 'test_handler',
      bundling: {
        forceDockerBundling: false,
      }
    });

    //  CALLBACK LAMBDA (/api/callback)
    const callbackLambda = new NodejsFunction(this, "CallbackLambda", {
      runtime: Runtime.NODEJS_20_X,
      entry: path.join(__dirname, "../lambda/callback.ts"),
      handler: "handler",
    });

    //  API GATEWAY SETUP
    const api = new RestApi(this, 'ApiEndpoint', {
      restApiName: 'My Service',
      description: 'This service serves as an example.',
    });

    //  COGNITO AUTHORIZER (used for /hello)
    const authorizer = new CognitoUserPoolsAuthorizer(this, 'MyAuthorizer', {
      cognitoUserPools: [userPool],
    });

    //  /hello ENDPOINT (Cognito protected)
    const lambdaIntegration = new LambdaIntegration(myFunction);
    const resource = api.root.addResource('hello');
    resource.addMethod('GET', lambdaIntegration, {
      authorizer,
      authorizationType: AuthorizationType.COGNITO,
    });

    //  /api/callback ENDPOINT (OAuth callback – NO authorization)
    const apiResource = api.root.addResource("api");
    const callbackResource = apiResource.addResource("callback");

    callbackResource.addMethod(
      "GET",
      new LambdaIntegration(callbackLambda),
      { authorizationType: AuthorizationType.NONE }
    );

    //  S3 STATIC WEBSITE BUCKET
    const websiteBucket = new Bucket(this, "StaticWebsiteBucket", {
      bucketName: "soft-enge-static-website-bucket",
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "404.html",
      publicReadAccess: true,
      blockPublicAccess: new BlockPublicAccess({
        blockPublicAcls: false,
        ignorePublicAcls: false,
        blockPublicPolicy: false,
        restrictPublicBuckets: false,
      }),
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    //Deploy static website to S3 
    new BucketDeployment(this, "DeployWebsite", {
      sources: [Source.asset("../front-end/out")],  // adjust if needed
      destinationBucket: websiteBucket,
    });

    //OUTPUTS
    new cdk.CfnOutput(this, "WebsiteURL", {
      value: websiteBucket.bucketWebsiteUrl,
    });

    new cdk.CfnOutput(this, "CallbackUrl", {
      value: `${api.url}api/callback`,
    });

    new cdk.CfnOutput(
      this,
      'UserPoolClientID',
      {
        value: userPoolClient.userPoolClientId
      }
    )
  }
}
