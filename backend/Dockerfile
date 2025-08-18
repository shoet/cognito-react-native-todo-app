FROM golang:1.24.5-bookworm AS build

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . ./
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -trimpath -o ./main ./main.go

FROM gcr.io/distroless/static-debian12 AS deploy
COPY --from=build /app/main /
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.1 /lambda-adapter /opt/extensions/lambda-adapter
ENV PORT=8080
ENV READINESS_CHECK_PATH=/health
EXPOSE 8080
ENTRYPOINT ["/main"]
