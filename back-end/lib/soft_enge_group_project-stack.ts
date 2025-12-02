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

    //  CALLBACK LAMBDA (/api/callback)
    const logoutLambda = new NodejsFunction(this, "LogoutLambda", {
      runtime: Runtime.NODEJS_20_X,
      entry: path.join(__dirname, "../lambda/logout.ts"),
      handler: "handler",
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

    const addStoreFunction = new NodejsFunction(this, 'AddStore', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../lambda/add_store.ts'),
      handler: 'addStore',
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
    addStoreFunction.addEnvironment("DB_PASSWORD", process.env.DB_PASSWORD!);

    // Define the API Gateway
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
    const createStoreChainIntegration = new LambdaIntegration(createStoreChainFunction);
    const addStoreIntegration = new LambdaIntegration(addStoreFunction);
    const resource = api.root.addResource('hello');
    const createStoreChainResource = api.root.addResource('createStoreChain');
    const addStoreResource = api.root.addResource('addStore');
    
    resource.addMethod('GET', lambdaIntegration, {
      authorizer,
      authorizationType: AuthorizationType.COGNITO,
    });

    //  /api/callback ENDPOINT (OAuth callback – NO authorization)
    const apiResource = api.root.addResource("api");
    const callbackResource = apiResource.addResource("callback");
    const logoutResource = apiResource.addResource("logout");

    callbackResource.addMethod(
      "GET",
      new LambdaIntegration(callbackLambda),
      { authorizationType: AuthorizationType.NONE }
    );

    logoutResource.addMethod(
      "GET",
      new LambdaIntegration(logoutLambda),
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
    
    createStoreChainResource.addMethod('POST', createStoreChainIntegration, {
      authorizer,
      authorizationType: AuthorizationType.COGNITO,
    });

    addStoreResource.addMethod('POST', addStoreIntegration, {
      authorizer,
      authorizationType: AuthorizationType.COGNITO,
    });
  }
}
