import { Stack, StackProps, RemovalPolicy, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as path from "path";

/* — AWS サービス — */
import * as s3         from "aws-cdk-lib/aws-s3";
import * as s3deploy   from "aws-cdk-lib/aws-s3-deployment";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins    from "aws-cdk-lib/aws-cloudfront-origins";
import * as lambda     from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";

export class NewCdkAppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    /* ───────────────────────── ① Lambda + API Gateway ───────────────────────── */
    const submitFunction = new lambda.Function(this, "SubmitFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "handler.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda")),
    });

    const api = new apigateway.RestApi(this, "SubmitApi", {
      restApiName: "Submit Service",
    });
    api.root.addMethod("POST", new apigateway.LambdaIntegration(submitFunction));
        api.root.addMethod("OPTIONS", new apigateway.MockIntegration({
      integrationResponses: [{
        statusCode: "200",
        responseParameters: {
          "method.response.header.Access-Control-Allow-Headers": "'Content-Type'",
          "method.response.header.Access-Control-Allow-Origin": "'*'",
          "method.response.header.Access-Control-Allow-Methods": "'OPTIONS,POST'",
        },
      }],
      passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
      requestTemplates: {
        "application/json": "{\"statusCode\": 200}",
      },
    }), {
      methodResponses: [{
        statusCode: "200",
        responseParameters: {
          "method.response.header.Access-Control-Allow-Headers": true,
          "method.response.header.Access-Control-Allow-Origin": true,
          "method.response.header.Access-Control-Allow-Methods": true,
        },
      }],
    });


    /* ───────────────────────── ② S3 (完全プライベート) ───────────────────────── */
    const siteBucket = new s3.Bucket(this, "SiteBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,   // すべてブロック
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.DESTROY,                // サンプルなので削除許可
      autoDeleteObjects: true,
    });
    const writeQuestionFunction = new lambda.Function(this, "WriteQuestionFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/write-question")),
      environment: {
        BUCKET_NAME: siteBucket.bucketName,
        FILE_NAME: "questions.jsonl",
      },
    });
    siteBucket.grantReadWrite(writeQuestionFunction);
    const questionResource = api.root.addResource("submit");
    questionResource.addMethod("POST", new apigateway.LambdaIntegration(writeQuestionFunction));
    questionResource.addMethod("OPTIONS", new apigateway.MockIntegration({
      integrationResponses: [{
        statusCode: "200",
        responseParameters: {
          "method.response.header.Access-Control-Allow-Headers": "'Content-Type'",
          "method.response.header.Access-Control-Allow-Origin": "'*'",
          "method.response.header.Access-Control-Allow-Methods": "'OPTIONS,POST'",
        },
      }],
      passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
      requestTemplates: {
        "application/json": "{\"statusCode\": 200}",
      },
    }), {
      methodResponses: [{
        statusCode: "200",
        responseParameters: {
          "method.response.header.Access-Control-Allow-Headers": true,
          "method.response.header.Access-Control-Allow-Origin": true,
          "method.response.header.Access-Control-Allow-Methods": true,
        },
      }],
    });



    /* ───────────────────────── ③ CloudFront + OAI ───────────────────────── */
    const oai = new cloudfront.OriginAccessIdentity(this, "SiteOAI");
    siteBucket.grantRead(oai);   // OAI に GET 権限を付与

    const distribution = new cloudfront.Distribution(this, "SiteDistribution", {
      defaultRootObject: "index.html",
      defaultBehavior: {
        origin: new origins.S3Origin(siteBucket, {
          originAccessIdentity: oai,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
    });

    /* ───────────────────────── ④ アセットを S3 へデプロイ ──────────────────── */
    new s3deploy.BucketDeployment(this, "DeploySite", {
      sources: [s3deploy.Source.asset("./assets")],  // 📂 静的ファイル置き場
      destinationBucket: siteBucket,
      distribution,              // アップロード後に CloudFront を自動パージ
      distributionPaths: ["/*"], // すべてのオブジェクトを無効化
    });


    /* ───────────────────────── ⑤ 出力値 ───────────────────────── */
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
