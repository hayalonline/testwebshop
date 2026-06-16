*** Keywords ***
Admin Login Should Be Rejected
    [Arguments]    ${username}    ${password}
    Go To Frontend Path    ${ADMIN_PATH}
    Fill Text Field    ${USERNAME_FIELD}    ${username}
    Fill Text Field    ${PASSWORD_FIELD}    ${password}
    Click Element    ${LOGIN_BUTTON}
    Element Should Be Visible    ${FORM_ERROR}

Checkout Required Fields Should Be Validated
    Submit Form By Button    ${PLACE_ORDER_BUTTON}
    Element Should Be Visible    ${FIELD_ERROR}

Checkout Email Should Be Validated
    [Arguments]    ${customer_name}    ${email}    ${phone}    ${address}    ${postal_code}    ${city}
    Fill Checkout Form    ${customer_name}    ${email}    ${phone}    ${address}    ${postal_code}    ${city}
    Submit Form By Button    ${PLACE_ORDER_BUTTON}
    Element Should Be Visible    ${FIELD_ERROR}
