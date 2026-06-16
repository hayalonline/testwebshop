*** Settings ***
Resource    ../../resources/master.resource
Suite Setup    Create Api Session


*** Variables ***
${RISK_CUSTOMER_NAME}       Risk Test Klant
${RISK_EMAIL}               risk.test@test.local
${RISK_PHONE}               +31 20 000 0001
${RISK_ADDRESS}             Risicostraat 1
${RISK_POSTAL_CODE}         1011 AB
${RISK_CITY}                Amsterdam
${PRIMARY_PRODUCT_ID}       1
${ORDER_QUANTITY}           1
${ADMIN_USERNAME}           %{ADMIN_USERNAME=admin}
${ADMIN_PASSWORD}           %{ADMIN_PASSWORD=admin123}
&{ADMIN_CREDENTIALS}        username=${ADMIN_USERNAME}    password=${ADMIN_PASSWORD}


*** Test Cases ***
Given Invalid Admin Credentials When Login Is Posted Then Request Is Rejected
    [Documentation]    PRSK-002 API-AU-003
    ${response}=    Login Should Be Rejected    ${INVALID_ADMIN_CREDENTIALS}
    Value Should Equal    ${response.status_code}    ${HTTP_UNAUTHORIZED}

Given Protected Orders When Token Is Missing Then Request Is Rejected
    [Documentation]    PRSK-002 API-AU-005
    ${response}=    Protected Orders Should Reject Missing Token
    Value Should Equal    ${response.status_code}    ${HTTP_UNAUTHORIZED}

Given Empty Order Payload When Posted Then Validation Error Is Returned
    [Documentation]    PRSK-003 API-OR-007
    ${response}=    Order Payload Should Be Rejected    ${EMPTY_ORDER_PAYLOAD}
    Value Should Equal    ${response.status_code}    ${HTTP_BAD_REQUEST}

Given Sql Injection Product Identifier When Requested Then Product Is Not Found
    [Documentation]    PRSK-004 API-PR-004
    ${response}=    Product Identifier Should Not Be Found    ${SQL_INJECTION_TEXT}
    Value Should Equal    ${response.status_code}    ${HTTP_NOT_FOUND}

Given Existing Order When Invalid Status Is Sent Then Status Is Rejected
    [Documentation]    PRSK-027 API-OR-018
    ${order_response}=    Create Valid Order Through Api    ${RISK_CUSTOMER_NAME}    ${RISK_EMAIL}    ${RISK_PHONE}    ${RISK_ADDRESS}    ${RISK_POSTAL_CODE}    ${RISK_CITY}    ${PRIMARY_PRODUCT_ID}    ${ORDER_QUANTITY}
    ${order}=    Set Variable    ${order_response.json()}
    ${order_id}=    Get From Dictionary    ${order}    id
    ${login_body}=    Login Through Api    ${ADMIN_CREDENTIALS}
    ${token}=    Get From Dictionary    ${login_body}    token
    ${response}=    Invalid Order Status Should Be Rejected    ${order_id}    ${token}
    Value Should Equal    ${response.status_code}    ${HTTP_BAD_REQUEST}
