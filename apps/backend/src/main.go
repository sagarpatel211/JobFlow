package main

import (
    "fmt"
    "log"
    "net/http"

    // "github.com/99designs/gqlgen/handler"
    // Import your generated code if using gqlgen
    // "myproject/apps/graphql-api/src/generated"
    // "myproject/apps/graphql-api/src/resolvers"
)

func main() {
    // Example: Simple HTTP endpoint
    http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintln(w, "OK")
    })

    // Example: GraphQL endpoint
    // If using gqlgen, you'd do something like:
    //
    // srv := handler.GraphQL(generated.NewExecutableSchema(generated.Config{
    //     Resolvers: &resolvers.Resolver{},
    // }))
    // http.Handle("/query", srv)
    //
    // For demonstration, let's just respond with a placeholder.
    http.HandleFunc("/query", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        _, _ = w.Write([]byte(`{"data":"Hello from Go GraphQL!"}`))
    })

    log.Println("GraphQL API server running on http://localhost:8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}
