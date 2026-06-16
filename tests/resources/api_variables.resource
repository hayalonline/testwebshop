*** Variables ***
${API_URL}                    %{API_URL=http://localhost:3001/api}
${SERVER_API_URL}             %{SERVER_API_URL=http://194.31.150.130:3001/api}
${API_SESSION}                rembro_api

${HEALTH_ENDPOINT}            /health
${AUTH_ENDPOINT}              /auth
${LOGIN_ENDPOINT}             /auth/login
${PRODUCTS_ENDPOINT}          /products
${USER_ENDPOINT}              /auth/login
${ORDERS_ENDPOINT}            /orders
${OPENAPI_ENDPOINT}           /../api-docs/openapi.json

${HTTP_OK}                    200
${HTTP_CREATED}               201
${HTTP_NO_CONTENT}            204
${HTTP_BAD_REQUEST}           400
${HTTP_UNAUTHORIZED}          401
${HTTP_NOT_FOUND}             404
${HTTP_CONFLICT}              409
