from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto('http://localhost:3000')
    page.wait_for_load_state('networkidle')
    
    # Take screenshot of the login page
    page.screenshot(path='/tmp/login_recon.png', full_page=True)
    
    # Save the HTML content for inspection
    with open('/tmp/login_dom.html', 'w', encoding='utf-8') as f:
        f.write(page.content())
        
    print("Captura da tela de Login salva em /tmp/login_recon.png")
    
    browser.close()
