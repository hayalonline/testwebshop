*** Keywords ***
Create Api Session
    Create Session    ${API_SESSION}    ${API_URL}

Get Api Resource
    [Arguments]    ${endpoint}    ${expected_status}=${HTTP_OK}
    ${response}=    GET On Session    ${API_SESSION}    ${endpoint}    expected_status=${expected_status}
    RETURN    ${response}

Post Api Resource
    [Arguments]    ${endpoint}    ${payload}    ${expected_status}=${HTTP_OK}
    ${headers}=    Create Json Headers
    ${response}=    POST On Session    ${API_SESSION}    ${endpoint}    json=${payload}    headers=${headers}    expected_status=${expected_status}
    RETURN    ${response}

Post Authorized Api Resource
    [Arguments]    ${endpoint}    ${payload}    ${token}    ${expected_status}=${HTTP_OK}
    ${headers}=    Create Bearer Headers    ${token}
    ${response}=    POST On Session    ${API_SESSION}    ${endpoint}    json=${payload}    headers=${headers}    expected_status=${expected_status}
    RETURN    ${response}

Put Authorized Api Resource
    [Arguments]    ${endpoint}    ${payload}    ${token}    ${expected_status}=${HTTP_OK}
    ${headers}=    Create Bearer Headers    ${token}
    ${response}=    PUT On Session    ${API_SESSION}    ${endpoint}    json=${payload}    headers=${headers}    expected_status=${expected_status}
    RETURN    ${response}

Delete Authorized Api Resource
    [Arguments]    ${endpoint}    ${token}    ${expected_status}=${HTTP_NO_CONTENT}
    ${headers}=    Create Bearer Headers    ${token}
    ${response}=    DELETE On Session    ${API_SESSION}    ${endpoint}    headers=${headers}    expected_status=${expected_status}
    RETURN    ${response}

Login Through Api
    [Arguments]    ${credentials}
    ${response}=    Post Api Resource    ${LOGIN_ENDPOINT}    ${credentials}
    ${body}=    Set Variable    ${response.json()}
    Dictionary Value Should Not Be Empty    ${body}    token
    RETURN    ${body}

Get Products Through Api
    ${response}=    Get Api Resource    ${PRODUCTS_ENDPOINT}
    RETURN    ${response}

Get Product Through Api
    [Arguments]    ${product_identifier}
    ${response}=    Get Api Resource    ${PRODUCTS_ENDPOINT}/${product_identifier}
    RETURN    ${response}

Create Order Through Api
    [Arguments]    ${payload}    ${expected_status}=${HTTP_OK}
    ${response}=    Post Api Resource    ${ORDERS_ENDPOINT}    ${payload}    ${expected_status}
    RETURN    ${response}

Get Authorized Orders Through Api
    [Arguments]    ${token}
    ${headers}=    Create Bearer Headers    ${token}
    ${response}=    GET On Session    ${API_SESSION}    ${ORDERS_ENDPOINT}    headers=${headers}    expected_status=${HTTP_OK}
    RETURN    ${response}

Update Order Status Through Api
    [Arguments]    ${order_id}    ${status_payload}    ${token}
    ${response}=    Put Authorized Api Resource    ${ORDERS_ENDPOINT}/${order_id}/status    ${status_payload}    ${token}
    RETURN    ${response}

Response Body Should Contain Key
    [Arguments]    ${response}    ${key}
    ${body}=    Set Variable    ${response.json()}
    Dictionary Should Contain Key    ${body}    ${key}
