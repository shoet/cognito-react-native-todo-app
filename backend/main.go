package main

import (
	"log"
	"net/http"

	"github.com/labstack/echo/v4"
)

func main() {
	e := echo.New()

	e.GET("/health", func(ctx echo.Context) error {
		return ctx.JSON(http.StatusOK, struct {
			Message string `json:"message"`
		}{
			Message: "ok",
		})
	})

	if err := e.Start(":8080"); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}
