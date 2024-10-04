# React Vite with NextUI + Golang

This is a custom fullstack framework built by combining React as the frontend with Golang as the backend. It already comes with [NextUI](https://nextui.org) and [TailwindCSS](https://tailwindcss.com/) for easier UI development.

## Development mode

In the development mode, we will have 2 servers running. The front end code will be served by vite dev server while the backend will be run by [NoDemon](https://nodemon.io/) which helps by automatically rebuilding and restarting the server whenever you save changes to the backend code.

## Production Mode

In production, the react app will be compiled into a static file which would be hosted by a single server, by golang.

## Quick Start

```bash
# Go to the directory
cd funcbase

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

## Documentation

### Folder Structure

All the source code is inside **src** directory. Inside src, it is splitted into 2 subdirectory, backend and frontend.
