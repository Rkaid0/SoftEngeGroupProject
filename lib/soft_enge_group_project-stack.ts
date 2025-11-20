import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';

export class SoftEngeGroupProjectStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const nodeLambda = new NodejsFunction(this, 'NodeLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../lambda/test_handler.ts'),
      handler: 'test_handler',
      bundling: {
        forceDockerBundling: false,
      }
    });

    const api = new apigateway.LambdaRestApi(this, 'ApiEndpoint', {
      handler: nodeLambda,
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
    });
  }
}
