package resources

import (
	"fmt"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsapigatewayv2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsapigatewayv2integrations"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsecrassets"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslogs"
	"github.com/aws/jsii-runtime-go"
)

type HttpApiServiceProps struct {
	LambdaEnvironment *map[string]*string
}

type HttpApiService struct {
	HttpApi        awsapigatewayv2.HttpApi
	LambdaLogGroup awslogs.LogGroup
	LambdaFunction awslambda.IFunction
}

func NewHttpApiService(stack awscdk.Stack, props HttpApiServiceProps) *HttpApiService {
	image := awsecrassets.NewDockerImageAsset(stack, jsii.String("DockerImageForLambda"), &awsecrassets.DockerImageAssetProps{
		Directory: jsii.String("../backend"),
		Platform:  awsecrassets.Platform_LINUX_ARM64(),
		Target:    jsii.String("deploy"),
		Exclude: &[]*string{
			jsii.String("cdk"),
			jsii.String("tmp"),
		},
	})
	functionName := fmt.Sprintf("%s-APIFunction", *stack.StackName())
	logGroupName := fmt.Sprintf("%sLogGroup", functionName)
	logGroup := awslogs.NewLogGroup(stack, jsii.String("APILambdaLogGroup"), &awslogs.LogGroupProps{
		LogGroupName:  jsii.String(logGroupName),
		RemovalPolicy: awscdk.RemovalPolicy_DESTROY,
		Retention:     awslogs.RetentionDays_ONE_WEEK,
	})
	lambdaFunction := awslambda.NewDockerImageFunction(
		stack, jsii.String("APILambda"), &awslambda.DockerImageFunctionProps{
			FunctionName: &functionName,
			Architecture: awslambda.Architecture_ARM_64(),
			Code: awslambda.DockerImageCode_FromEcr(image.Repository(), &awslambda.EcrImageCodeProps{
				TagOrDigest: image.ImageTag(),
			}),
			LogGroup:    logGroup,
			Timeout:     awscdk.Duration_Seconds(jsii.Number(30)),
			Environment: props.LambdaEnvironment,
		})

	httpApi := awsapigatewayv2.NewHttpApi(stack, jsii.String("HTTPApi"), &awsapigatewayv2.HttpApiProps{
		ApiName: jsii.Sprintf("%s-HTTPApi", *stack.StackName()),
	})
	httpApi.AddRoutes(&awsapigatewayv2.AddRoutesOptions{
		Methods: &[]awsapigatewayv2.HttpMethod{
			awsapigatewayv2.HttpMethod_ANY,
		},
		Path: jsii.String("/{proxy+}"),
		Integration: awsapigatewayv2integrations.NewHttpLambdaIntegration(
			jsii.String("HTTPLambdaIntegration"), lambdaFunction, &awsapigatewayv2integrations.HttpLambdaIntegrationProps{
				Timeout: awscdk.Duration_Seconds(jsii.Number(29)),
			}),
	})
	return &HttpApiService{
		HttpApi:        httpApi,
		LambdaFunction: lambdaFunction,
		LambdaLogGroup: logGroup,
	}
}
