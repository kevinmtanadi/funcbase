package utils

import (
	"crypto/rand"
	"encoding/json"
	"math/big"
	"strings"

	"github.com/google/uuid"
)

func JSONify(data interface{}) (string, error) {
	bytes, err := json.Marshal(data)
	if err != nil {
		return "", err
	}

	return string(bytes), nil
}

const letterBytes = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

func GenerateRandomString(length int) (string, error) {
	result := make([]byte, length)
	for i := range result {
		// Generate a random index for the letterBytes string
		num, err := rand.Int(rand.Reader, big.NewInt(int64(len(letterBytes))))
		if err != nil {
			return "", err
		}
		// Assign the character at the random index to the result
		result[i] = letterBytes[num.Int64()]
	}
	return string(result), nil
}

func MiniHash(input string) (output string) {
	bytes := []byte(input)

	for i := 0; i < len(bytes); i++ {
		bytes[i] = ((bytes[i] + 100) % 96) + 32
	}

	return string(bytes)
}

func GenerateUUIDV7() string {
	id, _ := uuid.NewV7()

	return strings.ReplaceAll(id.String(), "-", "")
}
