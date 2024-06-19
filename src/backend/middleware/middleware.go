package middleware

import (
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/golang-jwt/jwt"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func UseMiddleware(app *echo.Echo) {
	app.Use(middleware.Logger())
	app.Use(middleware.Recover())
}

func RequireAuth() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			unauthorizedErr := map[string]interface{}{
				"code":   "401",
				"status": "error",
				"error":  "unauthorized",
			}

			authToken := c.Request().Header.Get("Authorization")
			if authToken == "" {
				return c.JSON(http.StatusUnauthorized, unauthorizedErr)
			}

			claims, err := parseJWT(authToken)
			if err != nil {
				return c.JSON(http.StatusUnauthorized, unauthorizedErr)
			}

			// token is expired
			if float64(time.Now().Unix()) > claims["exp"].(float64) {
				return c.JSON(http.StatusUnauthorized, unauthorizedErr)
			}

			userID, ok := claims["sub"].(string)
			if ok {
				c.Set("user_id", userID)
				return next(c)
			}

			return c.JSON(http.StatusUnauthorized, unauthorizedErr)
		}
	}
}

func parseJWT(tokenStr string) (jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("invalid signing method")
		}
		return []byte(os.Getenv("JWT_SECRET_KEY")), nil
	})

	if err != nil {
		return nil, err
	}

	if _, ok := token.Claims.(jwt.MapClaims); !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	claims := token.Claims.(jwt.MapClaims)
	return claims, nil
}
