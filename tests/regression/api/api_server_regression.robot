*** Settings ***
Resource    ../../resources/master.resource
Suite Setup    Create Api Session


*** Variables ***
${API_URL}                      ${SERVER_API_URL}
${EXPECTED_PRODUCT_COUNT}       6
${PRIMARY_PRODUCT_ID}           1
${PRIMARY_PRODUCT_SLUG}         urban-rugzak
${PRIMARY_PRODUCT_NAME}         Urban Rugzak
${ADMIN_USERNAME}               %{ADMIN_USERNAME=admin}
${ADMIN_PASSWORD}               %{ADMIN_PASSWORD=admin123}
&{ADMIN_CREDENTIALS}            username=${ADMIN_USERNAME}    password=${ADMIN_PASSWORD}
&{ORDER_STATUS_PAYLOAD}         status=in_behandeling


*** Test Cases ***
Given Api When Health Is Requested Then Service Is Available
    [Documentation]    API-GN-001
    ${response}=    Get Api Resource    ${HEALTH_ENDPOINT}
    Value Should Equal    ${response.status_code}    ${HTTP_OK}
    Response Body Should Contain Key    ${response}    status

Given Api When Products Are Requested Then Catalog Is Returned
    [Documentation]    API-PR-001
    ${response}=    Get Products Through Api
    Value Should Equal    ${response.status_code}    ${HTTP_OK}
    ${products}=    Set Variable    ${response.json()}
    Length Should Be    ${products}    ${EXPECTED_PRODUCT_COUNT}

Given Api When Product Id Is Requested Then Product Detail Is Returned
    [Documentation]    API-PR-002
    ${response}=    Get Product Through Api    ${PRIMARY_PRODUCT_ID}
    Value Should Equal    ${response.status_code}    ${HTTP_OK}
    ${product}=    Set Variable    ${response.json()}
    Dictionary Value Should Be    ${product}    name    ${PRIMARY_PRODUCT_NAME}

Given Api When Product Slug Is Requested Then Product Detail Is Returned
    [Documentation]    API-PR-003
    ${response}=    Get Product Through Api    ${PRIMARY_PRODUCT_SLUG}
    Value Should Equal    ${response.status_code}    ${HTTP_OK}
    ${product}=    Set Variable    ${response.json()}
    Dictionary Value Should Be    ${product}    slug    ${PRIMARY_PRODUCT_SLUG}

Given Admin Credentials When Login Is Posted Then Token Is Returned
    [Documentation]    API-AU-001
    ${body}=    Login Through Api    ${ADMIN_CREDENTIALS}
    Dictionary Value Should Not Be Empty    ${body}    token

Given Protected Orders When No Token Is Sent Then Request Is Unauthorized
    [Documentation]    API-AU-005
    ${response}=    Get Api Resource    ${ORDERS_ENDPOINT}    ${HTTP_UNAUTHORIZED}
    Value Should Equal    ${response.status_code}    ${HTTP_UNAUTHORIZED}
    Response Body Should Contain Key    ${response}    message

Given Admin Token When Orders Are Requested Then Orders Are Returned
    [Documentation]    API-OR-001
    ${body}=    Login Through Api    ${ADMIN_CREDENTIALS}
    ${token}=    Get From Dictionary    ${body}    token
    ${response}=    Get Authorized Orders Through Api    ${token}
    Value Should Equal    ${response.status_code}    ${HTTP_OK}
