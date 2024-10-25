# Use the official Golang base image with Alpine
FROM golang:1.22.3-alpine

# Set environment variables for the Go build
ENV CGO_ENABLED=1 \
    GOOS=linux


# Install necessary packages
RUN apk add --no-cache gcc libc-dev

# Set the working directory in the container
WORKDIR /app

# Copy only the Go mod and sum files first to leverage Docker cache
COPY go.mod go.sum ./

# Download Go modules
RUN go mod download

# Copy the rest of the application files
COPY . .

# Copy the built React app from the 'dist' folder
COPY ./dist /app/dist

# Build the Go app
RUN go build -o funcbase .

# Expose the port that your app will run on (adjust as needed)
EXPOSE 8080

# Set the entrypoint to run the app
CMD ["./funcbase"]
