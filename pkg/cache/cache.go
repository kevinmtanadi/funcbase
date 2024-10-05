package cache

import (
	"os"
	"strconv"
	"time"

	"github.com/patrickmn/go-cache"
)

func NewCache() (*cache.Cache, error) {
	cacheDuration := os.Getenv("CACHE_TIME")
	cacheDurationInt, err := strconv.Atoi(cacheDuration)
	if err != nil {
		return nil, err
	}

	cacheCleanup := os.Getenv("CACHE_CLEANUP_INTERVAL")
	cacheCleanupInt, err := strconv.Atoi(cacheCleanup)
	if err != nil {
		return nil, err
	}
	c := cache.New(time.Duration(cacheDurationInt)*time.Minute, time.Duration(cacheCleanupInt)*time.Minute)
	return c, nil
}
