*** Keywords ***
Value Should Not Be Empty
    [Arguments]    ${value}
    Should Not Be Empty    ${value}

Value Should Equal
    [Arguments]    ${actual}    ${expected}
    Should Be Equal As Strings    ${actual}    ${expected}

Value Should Contain
    [Arguments]    ${actual}    ${expected}
    Should Contain    ${actual}    ${expected}

Create Json Headers
    ${headers}=    Create Dictionary    Content-Type=${CONTENT_TYPE_JSON}
    RETURN    ${headers}

Create Bearer Headers
    [Arguments]    ${token}
    ${authorization}=    Set Variable    ${BEARER_PREFIX} ${token}
    ${headers}=    Create Dictionary    Content-Type=${CONTENT_TYPE_JSON}    ${AUTHORIZATION_HEADER}=${authorization}
    RETURN    ${headers}

Dictionary Value Should Be
    [Arguments]    ${dictionary}    ${key}    ${expected}
    Dictionary Should Contain Key    ${dictionary}    ${key}
    ${actual}=    Get From Dictionary    ${dictionary}    ${key}
    Should Be Equal    ${actual}    ${expected}

Dictionary Value Should Not Be Empty
    [Arguments]    ${dictionary}    ${key}
    Dictionary Should Contain Key    ${dictionary}    ${key}
    ${actual}=    Get From Dictionary    ${dictionary}    ${key}
    Should Not Be Empty    ${actual}
