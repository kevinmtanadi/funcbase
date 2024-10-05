package main

import (
	"bytes"
	"fmt"
	"math/rand"
	"mime/multipart"
	"net/http"
	"time"
)

func randomAddress() string {
	mainStreet := []string{"Antara", "MT. Haryono", "Ahmad Yani", "Pahlawan", "DI Pandjaitan", "R. Suprapto", "Tj. Duren", "Mangga Besar", "Mangga", "Kebon Jati", "Bina Karya", "Buaran Raya", "Ganggeng Raya", "Tj Morawa", "Raya Mastrip Kebraon", "Jend. Sudirman", "Gergaji", "Tanjung Selor", "Madrasah", "Gayam", "Bintaro Jaya", "Sunan Giri", "Rawamangun", "Budi", "Antara", "Kebon Jeruk"}
	streetNumber := rand.Intn(999)

	return fmt.Sprintf("Jl. %s %d", mainStreet[rand.Intn(len(mainStreet))], streetNumber)
}

func main() {
	mainAPIKey := "019039ff-f5be-7520-8ab8-bbcf248a6585"
	url := "http://localhost:8080/api"

	statusList := []string{"shipped", "completed", "canceled", "refunded"}
	paymentMethodList := []string{"cash", "credit_card", "debit_card", "paypal"}
	notes := []string{"Taroh depan pintu", "titip lobby", "jangan dibuka", ""}

	client := &http.Client{}

	startTime := time.Now()
	for i := 0; i < 100_000; i++ {
		if (i+1)%1000 == 0 {
			time.Sleep(100 * time.Millisecond)
			fmt.Printf("Inserted %d rows in %v\n", i+1, time.Since(startTime))
		}
		var requestBody bytes.Buffer
		writer := multipart.NewWriter(&requestBody)

		body := map[string]interface{}{
			"user_id":          rand.Intn(2000),
			"product_id":       rand.Intn(2000),
			"amount":           rand.Intn(50) * 100,
			"status":           statusList[rand.Intn(4)],
			"payment_method":   paymentMethodList[rand.Intn(4)],
			"shipping_address": randomAddress(),
			"notes":            notes[rand.Intn(4)],
		}

		for key, value := range body {
			_ = writer.WriteField(key, fmt.Sprintf("%v", value))
		}

		writer.Close()

		req, err := http.NewRequest("POST", fmt.Sprintf("%s/main/transactions/insert", url), &requestBody)
		if err != nil {
			panic(err)
		}

		req.Header.Set("Content-Type", writer.FormDataContentType())
		req.Header.Set("X-API-KEY", mainAPIKey)

		resp, err := client.Do(req)
		if err != nil {
			panic(err)
		}
		defer resp.Body.Close()
	}

	fmt.Println("The process took", time.Since(startTime))
}
