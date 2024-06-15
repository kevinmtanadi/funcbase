package middleware

import (
	"fmt"
	"net/http"
	"os"
	"strings"

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

			cookiesStr := c.Request().Header.Get("Cookie")
			if cookiesStr == "" {
				return c.JSON(http.StatusUnauthorized, unauthorizedErr)
			}

			cookies := strings.Split(cookiesStr, ";")
			for _, ck := range cookies {
				cookie := strings.TrimSpace(ck)
				key, value := strings.Split(cookie, "=")[0], strings.Split(cookie, "=")[1]
				if key == "_auth" {
					fmt.Println(value)
					claims, err := parseJWT(value)
					if err != nil {
						return c.JSON(http.StatusUnauthorized, unauthorizedErr)
					}

					userID, ok := claims["user_id"].(string)
					if !ok {
						return c.JSON(http.StatusUnauthorized, unauthorizedErr)
					}

					c.Set("user_id", userID)
					return next(c)
				}
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
