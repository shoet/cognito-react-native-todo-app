package main

import (
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/MicahParks/keyfunc/v3"
	"github.com/golang-jwt/jwt/v5"
	"github.com/kelseyhightower/envconfig"
	"github.com/labstack/echo/v4"
)

type Env struct {
	CognitoUserPoolId string `envconfig:"COGNITO_USER_POOL_ID" required:"true"`
	Region            string `envconfig:"AWS_DEFAULT_REGION" required:"true"`
}

func main() {
	e := echo.New()

	var env Env
	if err := envconfig.Process("", &env); err != nil {
		log.Fatalf("failed to parse env: %v\n", err)
	}

	jwter := NewJWTer_FromCognito(
		env.Region,
		env.CognitoUserPoolId,
	)

	e.GET("/health", func(ctx echo.Context) error {
		return ctx.JSON(http.StatusOK, struct {
			Message string `json:"message"`
		}{
			Message: "ok",
		})
	})

	e.GET("/secure", func(ctx echo.Context) error {
		token := ctx.Request().Header.Get("Authorization")
		accessToken := strings.TrimPrefix(token, "Bearer ")
		if token == "" {
			return ctx.String(http.StatusBadRequest, "BadRequest")
		}

		fmt.Printf("accessToken: %s\n", accessToken)
		claims, err := jwter.ParseToken(accessToken)
		if err != nil {
			log.Printf("failed to parse token: %v\n", err)
			return ctx.String(http.StatusBadRequest, "BadRequest")
		}

		fmt.Printf("Parsed: %v\n", claims)

		return ctx.JSON(http.StatusOK, struct {
			Message string `json:"message"`
		}{
			Message: "ok",
		})
	})

	if err := e.Start(":8080"); err != nil {
		log.Fatalf("failed to start server: %v\n", err)
	}
}

type JWTer struct {
	publicKeyUrl string
}

func NewJWTer_FromCognito(region, userPoolId string) *JWTer {
	return &JWTer{
		publicKeyUrl: fmt.Sprintf(
			"https://cognito-idp.%s.amazonaws.com/%s/.well-known/jwks.json",
			region, userPoolId,
		),
	}
}

func (j *JWTer) ParseToken(accessToken string) (jwt.MapClaims, error) {
	kf, err := keyfunc.NewDefault([]string{j.publicKeyUrl})
	if err != nil {
		return nil, fmt.Errorf("failed to get keyfunc: %w\n", err)
	}
	token, err := jwt.ParseWithClaims(accessToken, jwt.MapClaims{}, kf.Keyfunc)
	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w\n", err)
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, fmt.Errorf("failed cat to map claims")
	}
	return claims, nil
}
