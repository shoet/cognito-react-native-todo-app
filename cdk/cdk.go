package main

import (
	resources "cdk/resouces"
	"fmt"
	"log"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
	"github.com/joho/godotenv"
	"github.com/kelseyhightower/envconfig"
)

type Env struct {
	CognitoDomain                   string `envconfig:"COGNITO_DOMAIN"`
	SocialProviderGoogleClientId    string `envconfig:"SOCIAL_PROVIDER_GOOGLE_CLIENT_ID"`
	SocialProviderGoogleSecretValue string `envconfig:"SOCIAL_PROVIDER_GOOGLE_SECRET_VALUE"`
}

func NewEnv() (*Env, error) {
	err := godotenv.Load()
	if err != nil {
		return nil, fmt.Errorf("failed to load dotenv: %v", err)
	}

	var env Env
	if err := envconfig.Process("", &env); err != nil {
		return nil, fmt.Errorf("failed to get env: %v", err)
	}
	return &env, nil
}

type AppStackProps struct {
	awscdk.StackProps
}

func NewAppStack(scope constructs.Construct, id string, props *AppStackProps) awscdk.Stack {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = props.StackProps
	}
	stack := awscdk.NewStack(scope, &id, &sprops)

	env, err := NewEnv()
	if err != nil {
		log.Fatalf("failed to get env: %v", err)
	}

	auth := resources.NewAuth(stack, resources.AuthProps{
		CognitoDomain:                   env.CognitoDomain,
		SocialProviderGoogleClientId:    env.SocialProviderGoogleClientId,
		SocialProviderGoogleSecretValue: env.SocialProviderGoogleSecretValue,
	})
	_ = auth

	api := resources.NewHttpApiService(stack, resources.HttpApiServiceProps{})
	_ = api

	awscdk.NewCfnOutput(stack, jsii.String("APIURL"), &awscdk.CfnOutputProps{
		Value: api.HttpApi.ApiEndpoint(),
	})

	return stack
}

func main() {
	defer jsii.Close()

	app := awscdk.NewApp(nil)

	NewAppStack(app, "CognitoReactNativeTodoApp-dev", &AppStackProps{
		awscdk.StackProps{
			Env: env(),
		},
	})

	app.Synth(nil)
}

func env() *awscdk.Environment {
	return nil
}
