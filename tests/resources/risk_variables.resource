*** Variables ***
${INVALID_ADMIN_USERNAME}       invalid-admin
${INVALID_ADMIN_PASSWORD}       invalid-password
${SQL_INJECTION_TEXT}           '; DROP TABLE products; --
${INVALID_EMAIL}                invalid-email
${EMPTY_VALUE}                  ${EMPTY}
${NON_EXISTING_PRODUCT_ID}      999999
${INVALID_ORDER_STATUS}         ongeldig

&{INVALID_ADMIN_CREDENTIALS}    username=${INVALID_ADMIN_USERNAME}    password=${INVALID_ADMIN_PASSWORD}
&{EMPTY_ORDER_PAYLOAD}          customerName=${EMPTY_VALUE}    email=${EMPTY_VALUE}    phone=${EMPTY_VALUE}    address=${EMPTY_VALUE}    postalCode=${EMPTY_VALUE}    city=${EMPTY_VALUE}    items=@{EMPTY}
&{INVALID_STATUS_PAYLOAD}       status=${INVALID_ORDER_STATUS}
