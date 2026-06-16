*** Settings ***
Resource    ../../resources/master.resource
Test Teardown    Close Frontend


*** Variables ***
${EXPECTED_PRODUCT_COUNT}       6
${PRIMARY_PRODUCT_SLUG}         urban-rugzak
${PRIMARY_PRODUCT_NAME}         Urban Rugzak
${ADMIN_USERNAME}               %{ADMIN_USERNAME=admin}
${ADMIN_PASSWORD}               %{ADMIN_PASSWORD=admin123}
${CHECKOUT_CUSTOMER_NAME}       Test Klant
${CHECKOUT_EMAIL}               klant@test.local
${CHECKOUT_PHONE}               +31 20 000 0000
${CHECKOUT_ADDRESS}             Teststraat 1
${CHECKOUT_POSTAL_CODE}         1012 AB
${CHECKOUT_CITY}                Amsterdam


*** Test Cases ***
Given Homepage When Opened Then Core Sections Are Visible
    [Documentation]    FE-HP-001
    Open Frontend Path    ${HOME_PATH}
    Element Should Be Visible    ${HERO_SECTION}
    Element Should Be Visible    ${FEATURED_PRODUCTS_SECTION}

Given Homepage When Navigating Main Menu Then Public Routes Open
    [Documentation]    FE-HP-002
    Open Frontend Path    ${HOME_PATH}
    Navigate To Shop
    Navigate To Cart
    Navigate To Contact

Given Shop When Product Catalog Loads Then Expected Products Are Visible
    [Documentation]    FE-SH-001
    Open Frontend Path    ${SHOP_PATH}
    Element Count Should Be    ${PRODUCT_CARD}    ${EXPECTED_PRODUCT_COUNT}
    Element Should Contain Text    ${FEATURED_PRODUCTS_SECTION}    ${PRIMARY_PRODUCT_NAME}

Given Product Slug When Detail Opens Then Product Information Is Visible
    [Documentation]    FE-PD-001
    Open Frontend Path    ${SHOP_PATH}
    Open Product Detail By Slug    ${PRIMARY_PRODUCT_SLUG}
    Element Should Contain Text    ${PRODUCT_DETAIL}    ${PRIMARY_PRODUCT_NAME}
    Element Should Be Visible    ${PRODUCT_STOCK_LABEL}

Given Product Detail When Adding Product Then Cart Route Shows Item
    [Documentation]    FE-PD-004
    Open Frontend Path    ${PRODUCT_PATH_PREFIX}${PRIMARY_PRODUCT_SLUG}
    Add Visible Product To Cart
    Navigate To Cart
    Element Should Be Visible    ${CART_ITEM}
    Element Should Contain Text    ${CART_ITEM}    ${PRIMARY_PRODUCT_NAME}

Given Cart With Product When Opened Then Totals Are Displayed
    [Documentation]    FE-CT-001
    Open Frontend Path    ${PRODUCT_PATH_PREFIX}${PRIMARY_PRODUCT_SLUG}
    Add Visible Product To Cart
    Navigate To Cart
    Element Should Be Visible    ${ORDER_SUMMARY}
    Element Should Contain Text    ${CART_ITEM}    ${PRIMARY_PRODUCT_NAME}

Given Cart With Product When Navigating Away Then Cart State Remains
    [Documentation]    FE-CT-007
    Open Frontend Path    ${PRODUCT_PATH_PREFIX}${PRIMARY_PRODUCT_SLUG}
    Add Visible Product To Cart
    Navigate To Shop
    Navigate To Cart
    Element Should Contain Text    ${CART_ITEM}    ${PRIMARY_PRODUCT_NAME}

Given Cart With Product When Opening Checkout Then Checkout Form Is Visible
    [Documentation]    FE-CO-001
    Open Frontend Path    ${PRODUCT_PATH_PREFIX}${PRIMARY_PRODUCT_SLUG}
    Add Visible Product To Cart
    Navigate To Cart
    Click Element    ${CHECKOUT_LINK}
    Current Url Should Contain    ${CHECKOUT_PATH}
    Element Should Be Visible    ${CHECKOUT_FORM}
    Element Should Be Visible    ${ORDER_SUMMARY}

Given Checkout Form When Submitted With Valid Data Then Success Is Shown
    [Documentation]    FE-CO-006
    Open Frontend Path    ${PRODUCT_PATH_PREFIX}${PRIMARY_PRODUCT_SLUG}
    Add Visible Product To Cart
    Navigate To Cart
    Click Element    ${CHECKOUT_LINK}
    Fill Checkout Form    ${CHECKOUT_CUSTOMER_NAME}    ${CHECKOUT_EMAIL}    ${CHECKOUT_PHONE}    ${CHECKOUT_ADDRESS}    ${CHECKOUT_POSTAL_CODE}    ${CHECKOUT_CITY}
    Submit Form By Button    ${PLACE_ORDER_BUTTON}
    Element Should Contain Text    ${CHECKOUT_SUCCESS_PANEL}    Bestelling geplaatst

Given Admin Route When Opened Then Login Form Is Visible
    [Documentation]    FE-AD-001
    Open Frontend Path    ${ADMIN_PATH}
    Element Should Be Visible    ${LOGIN_FORM}
    Element Should Be Visible    ${USERNAME_FIELD}
    Element Should Be Visible    ${PASSWORD_FIELD}
    Element Should Be Visible    ${LOGIN_BUTTON}

Given Admin Credentials When Submitted Then Dashboard Is Visible
    [Documentation]    FE-AD-002
    Open Frontend Path    ${ADMIN_PATH}
    Login Through Frontend    ${ADMIN_USERNAME}    ${ADMIN_PASSWORD}
    Element Should Be Visible    ${PRODUCT_EDITOR}
    Element Should Be Visible    ${ORDER_TABLE}
