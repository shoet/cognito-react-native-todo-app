package resouces

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscognito"
	"github.com/aws/jsii-runtime-go"
)

type UserPoolIDp struct {
	Google awscognito.UserPoolIdentityProviderGoogle
}

type Auth struct {
	CognitoUserPool       awscognito.UserPool
	CognitoUserPoolClient awscognito.UserPoolClient
	UserPoolIDp
}

type AuthProps struct {
	CognitoDomain                   string
	SocialProviderGoogleClientId    string
	SocialProviderGoogleSecretValue string
}

func NewAuth(stack awscdk.Stack, props AuthProps) *Auth {
	userPool := awscognito.NewUserPool(stack, jsii.String("UserPool"), &awscognito.UserPoolProps{
		UserPoolName: jsii.Sprintf("%s-UserPool", *stack.StackName()),
		AutoVerify: &awscognito.AutoVerifiedAttrs{
			Email: jsii.Bool(true),
		},
		StandardAttributes: &awscognito.StandardAttributes{
			Email: &awscognito.StandardAttribute{
				Required: jsii.Bool(true),
				Mutable:  jsii.Bool(false),
			},
		},
		DeletionProtection: jsii.Bool(false),
		RemovalPolicy:      awscdk.RemovalPolicy_DESTROY,
	})

	awscognito.NewUserPoolDomain(stack, jsii.String("UserPoolDomain"), &awscognito.UserPoolDomainProps{
		UserPool: userPool,
		CognitoDomain: &awscognito.CognitoDomainOptions{
			DomainPrefix: jsii.String(props.CognitoDomain),
		},
	})

	googleIDp := awscognito.NewUserPoolIdentityProviderGoogle(
		stack,
		jsii.String("IDPGoogle"),
		&awscognito.UserPoolIdentityProviderGoogleProps{
			UserPool:          userPool,
			ClientId:          jsii.String(props.SocialProviderGoogleClientId),
			ClientSecretValue: awscdk.SecretValue_PlainText(jsii.String(props.SocialProviderGoogleSecretValue)),
			Scopes: &[]*string{
				jsii.String("email"),
				jsii.String("openid"),
			},
			AttributeMapping: &awscognito.AttributeMapping{
				Email: awscognito.ProviderAttribute_GOOGLE_EMAIL(),
			},
		})

	userPoolClient := awscognito.NewUserPoolClient(stack, jsii.String("UserPoolClient"), &awscognito.UserPoolClientProps{
		UserPoolClientName: jsii.Sprintf("%s-UserPoolClient", *stack.StackName()),
		UserPool:           userPool,
		SupportedIdentityProviders: &[]awscognito.UserPoolClientIdentityProvider{
			awscognito.UserPoolClientIdentityProvider_COGNITO(),
			awscognito.UserPoolClientIdentityProvider_GOOGLE(),
		},
		OAuth: &awscognito.OAuthSettings{
			Flows: &awscognito.OAuthFlows{
				AuthorizationCodeGrant: jsii.Bool(true),
			},
			CallbackUrls: &[]*string{
				jsii.String("cognitoreactnativetodoapp://"),
				jsii.String("exp://localhost:8082"),
				jsii.String("exp://192.168.0.33:8082"),
			},
			LogoutUrls: &[]*string{
				jsii.String("cognitoreactnativetodoapp://"),
				jsii.String("exp://localhost:8082"),
				jsii.String("exp://192.168.0.33:8082"),
			},
			Scopes: &[]awscognito.OAuthScope{
				awscognito.OAuthScope_OPENID(),
				awscognito.OAuthScope_EMAIL(),
			},
		},
	})

	userPoolClient.Node().AddDependency(googleIDp)

	return &Auth{
		CognitoUserPool:       userPool,
		CognitoUserPoolClient: userPoolClient,
		UserPoolIDp: UserPoolIDp{
			Google: googleIDp,
		},
	}
}
