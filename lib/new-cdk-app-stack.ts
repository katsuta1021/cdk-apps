import { Stack, StackProps, RemovalPolicy, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as path from "path";

/* — AWS サービス — */
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

export class NewCdkAppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // ───────────────────────── DynamoDB ─────────────────────────
    const questionsTable = new dynamodb.Table(this, "QuestionsTable", {
      partitionKey: { name: "sessionId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "timestamp", type: dynamodb.AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY,
    });


    // ───────────────────────── Lambda (DynamoDB保存) ─────────────────────────
    const writeQuestionFunction = new lambda.Function(this, "WriteQuestionFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/write-question")),
      environment: {
        TABLE_NAME: questionsTable.tableName,
      },
    });
    questionsTable.grantWriteData(writeQuestionFunction);

    const api = new apigateway.RestApi(this, "SubmitApi", {
      restApiName: "Submit Service",
    });

    const questionResource = api.root.addResource("submit");
    questionResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(writeQuestionFunction, {
        integrationResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Access-Control-Allow-Headers": "'Content-Type'",
              "method.response.header.Access-Control-Allow-Origin": "'*'",
              "method.response.header.Access-Control-Allow-Methods": "'OPTIONS,POST'",
            },
          },
        ],
        passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_MATCH,
        requestTemplates: {
          "application/json": "{ \"statusCode\": 200 }",
        },
      }),
      {
        methodResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Access-Control-Allow-Headers": true,
              "method.response.header.Access-Control-Allow-Origin": true,
              "method.response.header.Access-Control-Allow-Methods": true,
            },
          },
        ],
      }
    );

    // ───────────────────────── S3 (静的サイトホスティング) ─────────────────────────
    const siteBucket = new s3.Bucket(this, "SiteBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // // S3 保存方式を使う場合はこちらを使う（現在は DynamoDB を使用）
    // const writeQuestionFunction = new lambda.Function(this, "WriteQuestionFunction", {
    //   runtime: lambda.Runtime.NODEJS_18_X,
    //   handler: "index.handler",
    //   code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/write-question")),
    //   environment: {
    //     BUCKET_NAME: siteBucket.bucketName,
    //     FILE_NAME: "questions.jsonl",
    //   },
    // });
    // siteBucket.grantReadWrite(writeQuestionFunction);

    const oai = new cloudfront.OriginAccessIdentity(this, "SiteOAI");
    siteBucket.grantRead(oai);

    const distribution = new cloudfront.Distribution(this, "SiteDistribution", {
      defaultRootObject: "index.html",
      defaultBehavior: {
        origin: new origins.S3Origin(siteBucket, { originAccessIdentity: oai }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
    });

    // new s3deploy.BucketDeployment(this, "DeploySite", {
    //   sources: [s3deploy.Source.asset("./assets")],
    //   destinationBucket: siteBucket,
    //   distribution,
    //   distributionPaths: ["/*"],
    // });
    // lib/new-cdk-app-stack.ts 内
    new s3deploy.BucketDeployment(this, "DeployReactSite", {
      sources: [s3deploy.Source.asset("./react-frontend/build")],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ["/*"],
    });

    

    new CfnOutput(this, "WebURL", {
      value: `https://${distribution.domainName}`,
      description: "CloudFront 経由の Web サイト URL",
    });

    new CfnOutput(this, "ApiEndpoint", {
      value: api.url,
      description: "API Gateway のエンドポイント URL",
    });
  }
}
