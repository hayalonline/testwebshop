*** Settings ***
Resource    ../../resources/master.resource
Test Teardown    Close Frontend


*** Variables ***
${FRONTEND_URL}                 ${SERVER_FRONTEND_URL}
${PRIMARY_PRODUCT_SLUG}         urban-rugzak
${CHECKOUT_CUSTOMER_NAME}       Risk Test Klant
${CHECKOUT_PHONE}               +31 20 000 0001
${CHECKOUT_ADDRESS}             Risicostraat 1
${CHECKOUT_POSTAL_CODE}         1011 AB
${CHECKOUT_CITY}                Amsterdam


*** Test Cases ***
Given Admin Login Form When Invalid Credentials Are Submitted Then Error Is Visible
    [Documentation]    PRSK-002 FE-AD-003
    Open Frontend Path    ${ADMIN_PATH}
    Admin Login Should Be Rejected    ${INVALID_ADMIN_USERNAME}    ${INVALID_ADMIN_PASSWORD}

Given Checkout With Cart When Required Fields Are Empty Then Validation Errors Are Visible
    [Documentation]    PRSK-003 FE-CO-002
    Open Frontend Path    ${PRODUCT_PATH_PREFIX}${PRIMARY_PRODUCT_SLUG}
    Add Visible Product To Cart
    Navigate To Cart
    Click Element    ${CHECKOUT_LINK}
    Checkout Required Fields Should Be Validated

Given Checkout With Cart When Email Is Invalid Then Validation Error Is Visible
    [Documentation]    PRSK-003 FE-CO-003
    Open Frontend Path    ${PRODUCT_PATH_PREFIX}${PRIMARY_PRODUCT_SLUG}
    Add Visible Product To Cart
    Navigate To Cart
    Click Element    ${CHECKOUT_LINK}
    Checkout Email Should Be Validated    ${CHECKOUT_CUSTOMER_NAME}    ${INVALID_EMAIL}    ${CHECKOUT_PHONE}    ${CHECKOUT_ADDRESS}    ${CHECKOUT_POSTAL_CODE}    ${CHECKOUT_CITY}
