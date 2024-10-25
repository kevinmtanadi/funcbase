package middleware

import (
	"errors"
	"fmt"
	"funcbase/config"
	"funcbase/constants"
	"funcbase/pkg/logger"
	"funcbase/pkg/responses"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"gorm.io/gorm"
)

func UseMiddleware(app *echo.Echo) {
	app.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: config.GetInstance().AllowedOrigins,
		AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAuthorization, "X-API-KEY"},
		AllowMethods: []string{http.MethodGet, http.MethodPut, http.MethodPost, http.MethodDelete},
	}))

	app.Use(middleware.Recover())
	app.Use(middleware.Secure())
	app.Use(middleware.RemoveTrailingSlash())

	loggerDb := logger.GetInstance()
	jobChan := make(chan logger.Log, 100)
	app.Use(LogRequest(jobChan))
	go logToDb(loggerDb, jobChan)
}

func RequireAuth(required bool) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			unauthorizedErr := map[string]interface{}{
				"code":   "401",
				"status": "error",
				"error":  "unauthorized",
			}

			tokenHeader := c.Request().Header.Get("Authorization")
			if tokenHeader != "" {
				tokenHeader = strings.Replace(tokenHeader, "Bearer ", "", 1)

				claims, err := parseJWT(tokenHeader)
				if err != nil {
					if required {
						return c.JSON(http.StatusUnauthorized, unauthorizedErr)
					}
				} else {
					// token is valid

					if float64(time.Now().Unix()) > claims["exp"].(float64) && required {
						return c.JSON(http.StatusUnauthorized, unauthorizedErr)
					}

					userID, ok := claims["sub"].(float64)
					userRole, ok2 := claims["roles"].(string)
					if ok && ok2 {
						c.Set("user_id", int(userID))
						c.Set("roles", userRole)
						return next(c)
					}
				}
			}

			cookies := c.Request().Cookies()
			for _, cookie := range cookies {
				if cookie.Name == "_auth" {
					accessToken := cookie.Value

					claims, err := parseJWT(accessToken)
					if err != nil {
						if required {
							return c.JSON(http.StatusUnauthorized, unauthorizedErr)
						}
					} else {
						// token is valid

						if float64(time.Now().Unix()) > claims["exp"].(float64) && required {
							return c.JSON(http.StatusUnauthorized, unauthorizedErr)
						}

						userID, ok := claims["sub"].(float64)
						userRole, ok2 := claims["roles"].(string)
						if ok && ok2 {
							c.Set("user_id", int(userID))
							c.Set("roles", userRole)
							return next(c)
						}
					}

					if required {
						return c.JSON(http.StatusUnauthorized, unauthorizedErr)
					}

					return next(c)
				}
			}

			if !required {
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
		return []byte(constants.JWT_SECRET_KEY), nil
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

func ValidateAPIKey(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		key := c.Request().Header.Get("X-API-KEY")
		if key == "" {
			return c.JSON(http.StatusUnauthorized, responses.NewResponse(nil, "Missing API Key", errors.New("missing API Key")))
		}

		if key != config.GetInstance().GetAPIKey() && key != constants.MAIN_APP_API_KEY {
			return c.JSON(http.StatusUnauthorized, responses.NewResponse(nil, "Missing API Key", errors.New("missing API Key")))
		}

		return next(c)
	}
}

func ValidateMainAPIKey(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		key := c.Request().Header.Get("X-API-KEY")
		if key == "" {
			return c.JSON(http.StatusUnauthorized, map[string]interface{}{
				"code":   "401",
				"status": "error",
				"error":  "missing API key",
			})
		}

		if key != constants.MAIN_APP_API_KEY {
			return c.JSON(http.StatusUnauthorized, map[string]interface{}{
				"code":   "401",
				"status": "error",
				"error":  "api key invalid",
			})
		}

		return next(c)
	}
}

func logToDb(loggerDb *gorm.DB, jobChan <-chan logger.Log) {
	for job := range jobChan {
		loggerDb.Create(&job)
	}
}

func LogRequest(jobChan chan logger.Log) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			if !isAPICall(c.Request().URL.RequestURI()) {
				return next(c)
			}

			if c.Request().Header.Get("X-MAIN-APP") == "true" {
				return next(c)
			}

			start := time.Now()

			if err := next(c); err != nil {
				return err
			}

			execTime := float32(time.Since(start) / time.Millisecond)
			httpReq := c.Request()
			httpRes := c.Response()

			go func() {
				jobChan <- logger.Log{
					Method:     c.Request().Method,
					Endpoint:   c.Request().URL.RequestURI(),
					StatusCode: httpRes.Status,
					CallerIP:   getCallerIP(httpReq, c.RealIP()),
					UserAgent:  httpReq.UserAgent(),
					ExecTime:   execTime,
				}
			}()

			return nil
		}
	}

}

func isAPICall(uri string) bool {
	return strings.HasPrefix(uri, "/api") && !strings.HasPrefix(uri, "/api/log")
}

func getCallerIP(r *http.Request, fallbackIp string) string {
	if ip := r.Header.Get("CF-Connecting-IP"); ip != "" {
		return ip
	}

	if ip := r.Header.Get("Fly-Client-IP"); ip != "" {
		return ip
	}

	if ip := r.Header.Get("X-Real-IP"); ip != "" {
		return ip
	}

	if ipsList := r.Header.Get("X-Forwarded-For"); ipsList != "" {
		// extract the first non-empty leftmost-ish ip
		ips := strings.Split(ipsList, ",")
		for _, ip := range ips {
			ip = strings.TrimSpace(ip)
			if ip != "" {
				return ip
			}
		}
	}

	return fallbackIp
}
