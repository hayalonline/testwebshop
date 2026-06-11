export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Nordlane Webshop API",
    version: "1.0.0",
    description: "REST API voor producten, orders en admin-authenticatie."
  },
  servers: [
    {
      url: "http://localhost:3001",
      description: "Lokale development server"
    }
  ],
  tags: [
    { name: "Health" },
    { name: "Auth" },
    { name: "Products" },
    { name: "Orders" }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer"
      }
    },
    schemas: {
      Product: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Urban Rugzak" },
          slug: { type: "string", example: "urban-rugzak" },
          description: { type: "string" },
          price: { type: "number", example: 79.95 },
          image: { type: "string", example: "https://example.com/product.jpg" },
          stock: { type: "integer", example: 18 },
          category: { type: "string", example: "Tassen" },
          createdAt: { type: "string", example: "2026-06-11 08:00:00" },
          updatedAt: { type: "string", example: "2026-06-11 08:00:00" }
        }
      },
      ProductInput: {
        type: "object",
        required: ["name", "slug", "description", "price", "image", "stock", "category"],
        properties: {
          name: { type: "string", example: "Nieuwe tas" },
          slug: { type: "string", example: "nieuwe-tas" },
          description: { type: "string", example: "Stevige shopper voor dagelijks gebruik." },
          price: { oneOf: [{ type: "number" }, { type: "string" }], example: 49.95 },
          image: { type: "string", example: "https://example.com/product.jpg" },
          stock: { type: "integer", example: 12 },
          category: { type: "string", example: "Accessoires" }
        }
      },
      Order: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          customerName: { type: "string", example: "Test Klant" },
          email: { type: "string", example: "test@example.com" },
          phone: { type: "string", example: "0612345678" },
          address: { type: "string", example: "Teststraat 1" },
          postalCode: { type: "string", example: "1234 AB" },
          city: { type: "string", example: "Amsterdam" },
          totalAmount: { type: "number", example: 79.95 },
          orderStatus: { type: "string", example: "nieuw" },
          createdAt: { type: "string", example: "2026-06-11 08:00:00" },
          updatedAt: { type: "string", example: "2026-06-11 08:00:00" },
          items: {
            type: "array",
            items: { $ref: "#/components/schemas/OrderItem" }
          }
        }
      },
      OrderItem: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          orderId: { type: "integer", example: 1 },
          productId: { type: "integer", example: 1 },
          productName: { type: "string", example: "Urban Rugzak" },
          quantity: { type: "integer", example: 1 },
          unitPrice: { type: "number", example: 79.95 },
          totalPrice: { type: "number", example: 79.95 }
        }
      },
      OrderInput: {
        type: "object",
        required: ["customerName", "email", "phone", "address", "postalCode", "city", "items"],
        properties: {
          customerName: { type: "string", example: "Test Klant" },
          email: { type: "string", example: "test@example.com" },
          phone: { type: "string", example: "0612345678" },
          address: { type: "string", example: "Teststraat 1" },
          postalCode: { type: "string", example: "1234 AB" },
          city: { type: "string", example: "Amsterdam" },
          items: {
            type: "array",
            items: {
              type: "object",
              required: ["productId", "quantity"],
              properties: {
                productId: { type: "integer", example: 1 },
                quantity: { type: "integer", example: 1 }
              }
            }
          }
        }
      },
      Error: {
        type: "object",
        properties: {
          message: { type: "string", example: "Product niet gevonden." }
        }
      }
    }
  },
  paths: {
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Controleer of de API draait",
        responses: {
          "200": {
            description: "API is bereikbaar"
          }
        }
      }
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Admin login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "password"],
                properties: {
                  username: { type: "string", example: "admin" },
                  password: { type: "string", example: "admin123" }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Login succesvol" },
          "401": { description: "Ongeldige login" }
        }
      }
    },
    "/api/products": {
      get: {
        tags: ["Products"],
        summary: "Alle producten ophalen",
        responses: {
          "200": {
            description: "Productlijst",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Product" }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ["Products"],
        summary: "Product aanmaken",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProductInput" }
            }
          }
        },
        responses: {
          "201": { description: "Product aangemaakt" },
          "401": { description: "Niet ingelogd als admin" }
        }
      }
    },
    "/api/products/{id}": {
      get: {
        tags: ["Products"],
        summary: "Product ophalen op id of slug",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Product gevonden" },
          "404": { description: "Product niet gevonden" }
        }
      },
      put: {
        tags: ["Products"],
        summary: "Product wijzigen",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProductInput" }
            }
          }
        },
        responses: {
          "200": { description: "Product gewijzigd" },
          "401": { description: "Niet ingelogd als admin" }
        }
      },
      delete: {
        tags: ["Products"],
        summary: "Product verwijderen",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "204": { description: "Product verwijderd" },
          "401": { description: "Niet ingelogd als admin" }
        }
      }
    },
    "/api/orders": {
      get: {
        tags: ["Orders"],
        summary: "Alle orders ophalen",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Orderlijst" },
          "401": { description: "Niet ingelogd als admin" }
        }
      },
      post: {
        tags: ["Orders"],
        summary: "Nieuwe order aanmaken",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/OrderInput" }
            }
          }
        },
        responses: {
          "201": { description: "Order aangemaakt" },
          "400": { description: "Validatiefout" }
        }
      }
    },
    "/api/orders/{id}": {
      get: {
        tags: ["Orders"],
        summary: "Order ophalen",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "Order gevonden" },
          "401": { description: "Niet ingelogd als admin" }
        }
      },
      delete: {
        tags: ["Orders"],
        summary: "Order verwijderen",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "204": { description: "Order verwijderd" },
          "401": { description: "Niet ingelogd als admin" }
        }
      }
    },
    "/api/orders/{id}/status": {
      put: {
        tags: ["Orders"],
        summary: "Orderstatus wijzigen",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: {
                    type: "string",
                    enum: ["nieuw", "in_behandeling", "verzonden", "afgerond", "geannuleerd"],
                    example: "verzonden"
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Orderstatus gewijzigd" },
          "401": { description: "Niet ingelogd als admin" }
        }
      }
    }
  }
};

export function swaggerHtml() {
  return `<!doctype html>
<html lang="nl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Nordlane API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: "/api-docs/openapi.json",
        dom_id: "#swagger-ui",
        deepLinking: true,
        persistAuthorization: true
      });
    </script>
  </body>
</html>`;
}
