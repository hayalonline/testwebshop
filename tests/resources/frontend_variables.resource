*** Variables ***
${FRONTEND_URL}              %{FRONTEND_URL=http://localhost:5173}
${SERVER_FRONTEND_URL}       %{SERVER_FRONTEND_URL=http://194.31.150.130:3001}
${HOME_PATH}                 /
${SHOP_PATH}                 /shop
${CART_PATH}                 /winkelwagen
${CHECKOUT_PATH}             /afrekenen
${CONTACT_PATH}              /contact
${ADMIN_PATH}                /admin
${PRODUCT_PATH_PREFIX}       /product/

${BRAND_LINK}                css=.brand
${MAIN_NAVIGATION}           css=.main-nav
${SHOP_NAV_LINK}             css=.main-nav a[href="/shop"]
${CONTACT_NAV_LINK}          css=.main-nav a[href="/contact"]
${ADMIN_NAV_LINK}            css=.admin-header-link
${CART_LINK}                 css=a[aria-label="Winkelwagen"]
${HERO_SECTION}              css=.hero
${FEATURED_PRODUCTS_SECTION}  css=.product-grid

${PRODUCT_CARD}              css=.product-card
${PRODUCT_TITLE}             css=.product-title
${PRODUCT_DETAIL}            css=.product-detail
${PRODUCT_STOCK_LABEL}       css=.stock
${ADD_TO_CART_BUTTON}        text=Toevoegen aan winkelwagen

${CART_ITEM}                 css=.cart-row
${CHECKOUT_LINK}             text=Afrekenen
${CHECKOUT_FORM}             css=.checkout-form
${PLACE_ORDER_BUTTON}        text=Bestelling plaatsen
${CHECKOUT_SUCCESS_PANEL}    css=.state-panel.success
${ORDER_SUMMARY}             css=.summary
${FORM_ERROR}                css=.form-error
${FORM_SUCCESS}              css=.form-success
${FIELD_ERROR}               css=.field-error

${LOGIN_FORM}                css=.admin-login-panel
${USERNAME_FIELD}            css=input[autocomplete="username"]
${PASSWORD_FIELD}            css=input[autocomplete="current-password"]
${LOGIN_BUTTON}              css=.admin-login-panel button[type="submit"]
${ADMIN_DASHBOARD}           css=.admin-page
${PRODUCT_EDITOR}            css=.product-editor
${ORDER_TABLE}               css=.admin-table
${LOGOUT_BUTTON}             text=Uitloggen
