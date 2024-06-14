package utils

import (
	"crypto/rand"
	"encoding/json"
	"math/big"
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
