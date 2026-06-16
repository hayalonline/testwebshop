*** Keywords ***
Open Frontend
    [Arguments]    ${browser}=${DEFAULT_BROWSER}    ${headless}=${HEADLESS_BROWSER}
    New Browser    ${browser}    headless=${headless}
    New Context
    New Page    ${FRONTEND_URL}

Close Frontend
    Close Browser

Go To Frontend Path
    [Arguments]    ${path}
    Go To    ${FRONTEND_URL}${path}

Open Frontend Path
    [Arguments]    ${path}
    Open Frontend
    Go To Frontend Path    ${path}

Wait Until Element Is Ready
    [Arguments]    ${selector}    ${timeout}=${DEFAULT_TIMEOUT}
    Wait For Elements State    ${selector}    visible    timeout=${timeout}
    Wait For Elements State    ${selector}    enabled    timeout=${timeout}

Click Element
    [Arguments]    ${selector}
    Wait Until Element Is Ready    ${selector}
    Click    ${selector}

Fill Text Field
    [Arguments]    ${selector}    ${value}
    Wait Until Element Is Ready    ${selector}
    Fill Text    ${selector}    ${value}

Select Dropdown Option
    [Arguments]    ${selector}    ${value}
    Wait Until Element Is Ready    ${selector}
    Select Options By    ${selector}    value    ${value}

Submit Form By Button
    [Arguments]    ${button_selector}
    Click Element    ${button_selector}

Element Should Be Visible
    [Arguments]    ${selector}    ${timeout}=${DEFAULT_TIMEOUT}
    Wait For Elements State    ${selector}    visible    timeout=${timeout}

Element Should Contain Text
    [Arguments]    ${selector}    ${expected_text}
    Get Text    ${selector}    contains    ${expected_text}

Element Count Should Be
    [Arguments]    ${selector}    ${expected_count}
    Get Element Count    ${selector}    ==    ${expected_count}

Current Url Should Contain
    [Arguments]    ${expected_path}
    ${current_url}=    Get Url
    Should Contain    ${current_url}    ${expected_path}

Clear Browser Storage
    Clear Local Storage
    Clear Session Storage

Navigate To Shop
    Click Element    ${SHOP_NAV_LINK}
    Current Url Should Contain    ${SHOP_PATH}

Navigate To Cart
    Click Element    ${CART_LINK}
    Current Url Should Contain    ${CART_PATH}

Navigate To Contact
    Click Element    ${CONTACT_NAV_LINK}
    Current Url Should Contain    ${CONTACT_PATH}

Open Product Detail By Slug
    [Arguments]    ${slug}
    Go To Frontend Path    ${PRODUCT_PATH_PREFIX}${slug}
    Element Should Be Visible    ${PRODUCT_DETAIL}

Add Visible Product To Cart
    [Arguments]    ${button_selector}=${ADD_TO_CART_BUTTON}
    Click Element    ${button_selector}

Login Through Frontend
    [Arguments]    ${username}    ${password}
    Go To Frontend Path    ${ADMIN_PATH}
    Fill Text Field    ${USERNAME_FIELD}    ${username}
    Fill Text Field    ${PASSWORD_FIELD}    ${password}
    Click Element    ${LOGIN_BUTTON}
    Element Should Be Visible    ${ADMIN_DASHBOARD}

Fill Checkout Form
    [Arguments]    ${customer_name}    ${email}    ${phone}    ${address}    ${postal_code}    ${city}
    Fill Text Field    css=input[name="customerName"]    ${customer_name}
    Fill Text Field    css=input[name="email"]    ${email}
    Fill Text Field    css=input[name="phone"]    ${phone}
    Fill Text Field    css=input[name="address"]    ${address}
    Fill Text Field    css=input[name="postalCode"]    ${postal_code}
    Fill Text Field    css=input[name="city"]    ${city}
