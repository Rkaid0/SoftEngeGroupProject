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
import { getCategories } from '../lambda/getCategories';

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

    // COGNITO LAMBDA FUNCTIONS ------------------------------------------------

    //  CALLBACK LAMBDA (/api/callback)
    const callbackLambda = new NodejsFunction(this, "CallbackLambda", {
      runtime: Runtime.NODEJS_22_X,
      entry: path.join(__dirname, "../lambda/callback.ts"),
      handler: "handler",
    });

    //  LOGOUT LAMBDA (/api/logout)
    const logoutLambda = new NodejsFunction(this, "LogoutLambda", {
      runtime: Runtime.NODEJS_22_X,
      entry: path.join(__dirname, "../lambda/logout.ts"),
      handler: "handler",
    });

    // end of COGNITO LAMBDA ----------------------------------------------------

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

    //LAMBDA FUNCTIONS -------------------------------------------------------

    const myFunction = new NodejsFunction(this, "HelloLambda", {
      runtime: Runtime.NODEJS_22_X,
      entry: path.join(__dirname, "../lambda/hello.ts"),
      handler: "handler",
    });

    const nodeLambda = new NodejsFunction(this, 'NodeLambda', {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, '../lambda/test_handler.ts'),
      handler: 'test_handler',
      bundling: {
        forceDockerBundling: false,
      }
    });

    const createStoreChainFunction = new NodejsFunction(this, 'CreateStoreChain', {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, '../lambda/createStoreChain.ts'),
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

    const removeStoreChainFunction = new NodejsFunction(this, 'RemoveStoreChain', {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, '../lambda/removeStoreChain.ts'),
      handler: 'removeStoreChain',
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

    const createStoreFunction = new NodejsFunction(this, 'createStore', {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, '../lambda/createStore.ts'),
      handler: 'createStore',
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
    })

    const removeStoreFunction = new NodejsFunction(this, 'removeStore', {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, '../lambda/removeStore.ts'),
      handler: 'removeStore',
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
    })

    const getStoreChainsFunction = new NodejsFunction(this, 'GetStoreChains', {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, '../lambda/getStoreChains.ts'),
      handler: 'handler',
      bundling: {
        externalModules: [],
        nodeModules: ["mysql2"],
      },
      vpc,
      securityGroups: [lambdaSG],
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      allowPublicSubnet: true,
    });

    const createReceiptFunction = new NodejsFunction(this, 'CreateReceipt', {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, '../lambda/createReceipt.ts'),
      handler: 'createReceipt',
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

    const deleteReceiptFunction = new NodejsFunction(this, 'DeleteReceipt', {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, '../lambda/deleteReceipt.ts'),
      handler: 'handler',
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

    const getReceiptsFunction = new NodejsFunction(this, 'GetReceipts', {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, '../lambda/getReceipts.ts'),
      handler: 'handler',
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

    const getStoresFunction = new NodejsFunction(this, 'GetStores', {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, '../lambda/getStores.ts'),
      handler: 'handler',
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

    const addItemToReceiptFunction = new NodejsFunction(this, 'AddItemToReceipt', {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, '../lambda/addItemToReceipt.ts'),
      handler: 'handler',
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

    const getCategoriesFunction = new NodejsFunction(this, 'GetCategories', {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, '../lambda/getCategories.ts'),
      handler: 'handler',
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

    const addUserToDBFunction = new NodejsFunction(this, 'AddUserToDB', {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, '../lambda/addUserToDB.ts'),
      handler: 'handler',
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
    addUserToDBFunction.grantInvoke(callbackLambda);
    callbackLambda.addEnvironment(
      "ADD_USER_FUNCTION_NAME",
      addUserToDBFunction.functionName
    );

    const createShoppingList = new NodejsFunction(this, 'CreatShoppingList', {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, '../lambda/createShoppingList.ts'),
      handler: 'createShoppingList',
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

    const deleteShoppingListFunction = new NodejsFunction(this, 'DeleteShoppingList', {
     runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, '../lambda/deleteShoppingList.ts'),
      handler: 'deleteShoppingList',
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

        

    // end of LAMBDA FUNCTIONS ---------------------------------------------------------------

    //ADD DATABASE PASSWORD TO DB LAMBDA FUNCTIONS ----------------------------------

    createStoreChainFunction.addEnvironment("DB_PASSWORD", process.env.DB_PASSWORD!);
    removeStoreChainFunction.addEnvironment("DB_PASSWORD", process.env.DB_PASSWORD!)
    createStoreFunction.addEnvironment("DB_PASSWORD", process.env.DB_PASSWORD!)
    removeStoreFunction.addEnvironment("DB_PASSWORD", process.env.DB_PASSWORD!)
    getStoreChainsFunction.addEnvironment("DB_PASSWORD", process.env.DB_PASSWORD!)
    createReceiptFunction.addEnvironment("DB_PASSWORD", process.env.DB_PASSWORD!);
    addUserToDBFunction.addEnvironment("DB_PASSWORD", process.env.DB_PASSWORD!);
    addItemToReceiptFunction.addEnvironment("DB_PASSWORD", process.env.DB_PASSWORD!);
    getStoresFunction.addEnvironment("DB_PASSWORD", process.env.DB_PASSWORD!);
    getReceiptsFunction.addEnvironment("DB_PASSWORD", process.env.DB_PASSWORD!);
    createShoppingList.addEnvironment("DB_PASSWORD", process.env.DB_PASSWORD!);
    deleteShoppingListFunction.addEnvironment("DB_PASSWORD", process.env.DB_PASSWORD!);
    deleteReceiptFunction.addEnvironment("DB_PASSWORD", process.env.DB_PASSWORD!);
    getCategoriesFunction.addEnvironment("DB_PASSWORD", process.env.DB_PASSWORD!);

    //--------------------------------------------------------------------------

    //API GATEWAY --------------------------------------------------------------------
    // Define the API Gateway
    const api = new RestApi(this, 'ApiEndpoint', {
      restApiName: 'My Service',
      description: 'This service serves as an example.',
    });

    //  COGNITO AUTHORIZER
    const authorizer = new CognitoUserPoolsAuthorizer(this, 'MyAuthorizer', {
      cognitoUserPools: [userPool],
    });

    //Integrate lambda for all lambda functions
    const lambdaIntegration = new LambdaIntegration(myFunction);
    const createStoreChainIntegration = new LambdaIntegration(createStoreChainFunction);
    const removeStoreChainIntegration = new LambdaIntegration(removeStoreChainFunction);
    const createStoreIntegration = new LambdaIntegration(createStoreFunction)
    const removeStoreIntegration = new LambdaIntegration(removeStoreFunction)
    const getStoreChainsIntegration = new LambdaIntegration(getStoreChainsFunction);
    const createReceiptIntegration = new LambdaIntegration(createReceiptFunction);
    const addItemToReceiptIntegration = new LambdaIntegration(addItemToReceiptFunction);
    const getStoresIntegration = new LambdaIntegration(getStoresFunction);
    const getReceiptsIntegration = new LambdaIntegration(getReceiptsFunction);
    const createShoppingListIntegration = new LambdaIntegration(createShoppingList);
    const deleteShoppingListIntegration = new LambdaIntegration(deleteShoppingListFunction); 
    
    const deleteReceiptIntegration = new LambdaIntegration(deleteReceiptFunction);
    const getCategoriesIntegration = new LambdaIntegration(getCategoriesFunction);

    //Add resource for each lambda function
    const resource = api.root.addResource('hello');
    const createStoreChainResource = api.root.addResource('createStoreChain');
    const removeStoreChainResource = api.root.addResource('removeStoreChain');
    const createStoreResource = api.root.addResource('createStore')
    const removeStoreResource = api.root.addResource('removeStore')
    const getStoreChainsResource = api.root.addResource('getStoreChains');
    const createReceiptResource = api.root.addResource('createReceipt');
    const addItemToReceiptResource = api.root.addResource('addItemToReceipt');
    const getStoresResource = api.root.addResource('getStores');
    const getReceiptsResource = api.root.addResource('getReceipts');
    const createShoppingListResource = api.root.addResource('createShoppingList');
    const deleteShoppingListResource = api.root.addResource('deleteShoppingList');
   
    const deleteReceiptResource = api.root.addResource('deleteReceipt');
    const getCategoriesResource = api.root.addResource('getCategories');

    // COGNITO LAMBDA RESOURCES  /api/ ENDPOINT (OAuth callback – NO authorization)
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
    //end of COGNITO LAMBDA RESOURCES -------------------------------------------
    
    //Lambda resources
    resource.addMethod('GET', lambdaIntegration, {
      authorizer,
      authorizationType: AuthorizationType.COGNITO,
    });
    createStoreChainResource.addMethod('POST', createStoreChainIntegration, {
      authorizer,
      authorizationType: AuthorizationType.COGNITO,
    });
    removeStoreChainResource.addMethod('POST', removeStoreChainIntegration, {
      authorizer,
      authorizationType: AuthorizationType.COGNITO,
    });
    createStoreResource.addMethod('POST', createStoreIntegration, {
      authorizer,
      authorizationType: AuthorizationType.COGNITO,
    })
    removeStoreResource.addMethod('POST', removeStoreIntegration, {
      authorizer,
      authorizationType: AuthorizationType.COGNITO,
    })
    getStoreChainsResource.addMethod('GET', getStoreChainsIntegration, {
      authorizer,
      authorizationType: AuthorizationType.COGNITO,
    });
    createReceiptResource.addMethod('POST', createReceiptIntegration, {
      authorizer,
      authorizationType: AuthorizationType.COGNITO,
    });
    addItemToReceiptResource.addMethod('POST', addItemToReceiptIntegration, {
      authorizer,
      authorizationType: AuthorizationType.COGNITO,
    });
    getStoresResource.addMethod('POST', getStoresIntegration, {
      authorizer,
      authorizationType: AuthorizationType.COGNITO,
    });
    getReceiptsResource.addMethod('POST', getReceiptsIntegration, {
      authorizer,
      authorizationType: AuthorizationType.COGNITO,
    });
    createShoppingListResource.addMethod('POST', createShoppingListIntegration, {
      authorizer,
      authorizationType: AuthorizationType.COGNITO,
    });
    deleteShoppingListResource.addMethod('DELETE', deleteShoppingListIntegration, {
    deleteReceiptResource.addMethod('POST', deleteReceiptIntegration, {
      authorizer,
      authorizationType: AuthorizationType.COGNITO,
    });
    getCategoriesResource.addMethod('GET', getCategoriesIntegration, {
      authorizer,
      authorizationType: AuthorizationType.COGNITO,
    });

    //Add CORS to Each Resource
    resource.addCorsPreflight({
      allowOrigins: apigateway.Cors.ALL_ORIGINS,
      allowMethods: ['GET'],
      allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
    });
    createStoreChainResource.addCorsPreflight({
      allowOrigins: apigateway.Cors.ALL_ORIGINS,
      allowMethods: ['POST'],
      allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
      allowCredentials: true,
    });
    removeStoreChainResource.addCorsPreflight({
      allowOrigins: apigateway.Cors.ALL_ORIGINS,
      allowMethods: ['POST'],
      allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
      allowCredentials: true,
    });
    createStoreResource.addCorsPreflight({
      allowOrigins: apigateway.Cors.ALL_ORIGINS,
      allowMethods: ['POST'],
      allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
      allowCredentials: true,
    })
    removeStoreResource.addCorsPreflight({
      allowOrigins: apigateway.Cors.ALL_ORIGINS,
      allowMethods: ['POST'],
      allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
      allowCredentials: true,
    })
    getStoreChainsResource.addCorsPreflight({
      allowOrigins: apigateway.Cors.ALL_ORIGINS,
      allowMethods: ['GET'],
      allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
      allowCredentials: true,
    });
    createReceiptResource.addCorsPreflight({
      allowOrigins: apigateway.Cors.ALL_ORIGINS,
      allowMethods: ['POST'],
      allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
      allowCredentials: true,
    });
    addItemToReceiptResource.addCorsPreflight({
      allowOrigins: apigateway.Cors.ALL_ORIGINS,
      allowMethods: ['POST'],
      allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
      allowCredentials: true,
    });
    getStoresResource.addCorsPreflight({
      allowOrigins: apigateway.Cors.ALL_ORIGINS,
      allowMethods: ['POST'],
      allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
      allowCredentials: true,
    });
    getReceiptsResource.addCorsPreflight({
      allowOrigins: apigateway.Cors.ALL_ORIGINS,
      allowMethods: ['POST'],
      allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
      allowCredentials: true,
    });
    createShoppingListResource.addCorsPreflight({
    deleteReceiptResource.addCorsPreflight({
      allowOrigins: apigateway.Cors.ALL_ORIGINS,
      allowMethods: ['POST'],
      allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
      allowCredentials: true,
    });
    deleteShoppingListResource.addCorsPreflight({
      allowOrigins: apigateway.Cors.ALL_ORIGINS,
      allowMethods: ['DELETE'],
    getCategoriesResource.addCorsPreflight({
      allowOrigins: apigateway.Cors.ALL_ORIGINS,
      allowMethods: ['GET'],
      allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
      allowCredentials: true,
    });

    //Helpful outputs after cdk deploy
    new cdk.CfnOutput(
      this,
      'UserPoolClientID',
      {
        value: userPoolClient.userPoolClientId
      }
    )
  }
}
