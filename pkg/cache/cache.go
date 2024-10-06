package cache

import (
	"funcbase/constants"
	"time"

	"github.com/patrickmn/go-cache"
)

func NewCache() (*cache.Cache, error) {
	cacheDuration := constants.CACHE_TIME
	cacheCleanup := constants.CACHE_CLEANUP_INTERVAL
	c := cache.New(time.Duration(cacheDuration)*time.Minute, time.Duration(cacheCleanup)*time.Minute)
	return c, nil
}
