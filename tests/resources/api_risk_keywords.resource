*** Keywords ***
Login Should Be Rejected
    [Arguments]    ${credentials}
    ${response}=    Post Api Resource    ${LOGIN_ENDPOINT}    ${credentials}    ${HTTP_UNAUTHORIZED}
    Response Body Should Contain Key    ${response}    message
    RETURN    ${response}

Order Payload Should Be Rejected
    [Arguments]    ${payload}
    ${response}=    Create Order Through Api    ${payload}    ${HTTP_BAD_REQUEST}
    Response Body Should Contain Key    ${response}    message
    RETURN    ${response}

Product Identifier Should Not Be Found
    [Arguments]    ${product_identifier}
    ${response}=    Get Api Resource    ${PRODUCTS_ENDPOINT}/${product_identifier}    ${HTTP_NOT_FOUND}
    Response Body Should Contain Key    ${response}    message
    RETURN    ${response}

Protected Orders Should Reject Missing Token
    ${response}=    Get Api Resource    ${ORDERS_ENDPOINT}    ${HTTP_UNAUTHORIZED}
    Response Body Should Contain Key    ${response}    message
    RETURN    ${response}

Invalid Order Status Should Be Rejected
    [Arguments]    ${order_id}    ${token}
    ${response}=    Put Authorized Api Resource    ${ORDERS_ENDPOINT}/${order_id}/status    ${INVALID_STATUS_PAYLOAD}    ${token}    ${HTTP_BAD_REQUEST}
    Response Body Should Contain Key    ${response}    message
    RETURN    ${response}

Create Valid Order Through Api
    [Arguments]    ${customer_name}    ${email}    ${phone}    ${address}    ${postal_code}    ${city}    ${product_id}    ${quantity}
    ${item}=    Create Dictionary    productId=${product_id}    quantity=${quantity}
    @{items}=    Create List    ${item}
    ${payload}=    Create Dictionary    customerName=${customer_name}    email=${email}    phone=${phone}    address=${address}    postalCode=${postal_code}    city=${city}    items=${items}
    ${response}=    Create Order Through Api    ${payload}    ${HTTP_CREATED}
    RETURN    ${response}
