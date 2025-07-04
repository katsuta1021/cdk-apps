import { Stack, StackProps, RemovalPolicy, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as path from "path";

export class NewCdkAppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Lambda関数
    const submitFunction = new lambda.Function(this, "SubmitFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "handler.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda")),
    });

    // API Gateway
    const api = new apigateway.RestApi(this, "SubmitApi", {
      restApiName: "Submit Service",
    });
    api.root.addMethod("POST", new apigateway.LambdaIntegration(submitFunction));

    // S3 Static Hosting
    // const siteBucket = new s3.Bucket(this, "SiteBucket", {
    //   websiteIndexDocument: "index.html",
    //   publicReadAccess: true,
    //   removalPolicy: RemovalPolicy.DESTROY,
    //   autoDeleteObjects: true
    // });
    const siteBucket = new s3.Bucket(this, "SiteBucket", {
      websiteIndexDocument: "index.html",
      publicReadAccess: true,
      // blockPublicAccess: s3.BlockPublicAccess.NONE,  // 🔑 必須
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });


    // index.html のデプロイ
    new s3deploy.BucketDeployment(this, "DeploySite", {
      sources: [s3deploy.Source.asset("./assets")],
      destinationBucket: siteBucket,
    });

    // 出力情報（S3 WebサイトURLとAPIエンドポイント）
    new CfnOutput(this, "WebURL", {
      value: siteBucket.bucketWebsiteUrl,
      description: "S3でホスティングされたWebサイトのURL",
    });

    new CfnOutput(this, "ApiEndpoint", {
      value: api.url,
      description: "API GatewayのエンドポイントURL",
    });
  }
}
