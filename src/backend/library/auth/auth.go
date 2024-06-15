package auth_libraries

import (
	"crypto/rand"
	"encoding/base64"
	"os"
	"time"

	"github.com/golang-jwt/jwt"
	"golang.org/x/crypto/bcrypt"
)

func generateSalt() string {
	saltBytes := make([]byte, 16)
	rand.Read(saltBytes)

	return base64.RawURLEncoding.EncodeToString(saltBytes)
}
func EncryptPassword(password string) (hashedPassword string, salt string, err error) {
	salt = generateSalt()

	byteString := []byte(password + salt)
	hashedPasswordByte, err := bcrypt.GenerateFromPassword(byteString, bcrypt.DefaultCost)
	if err != nil {
		return "", "", err
	}

	return string(hashedPasswordByte), salt, nil
}

func VerifyPassword(password, salt, storedPassword string) bool {
	byteString := []byte(password + salt)

	err := bcrypt.CompareHashAndPassword([]byte(storedPassword), byteString)

	return err == nil
}

func GenerateJWT(userID string) (string, error) {
	token := jwt.New(jwt.SigningMethodHS512)

	claims := token.Claims.(jwt.MapClaims)
	claims["user_id"] = userID
	claims["exp"] = time.Now().Add(time.Hour * 24 * 7).Unix()

	tokenStr, err := token.SignedString([]byte(os.Getenv("JWT_SECRET_KEY")))
	if err != nil {
		return "", err
	}

	return tokenStr, nil
}
