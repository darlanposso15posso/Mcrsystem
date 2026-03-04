from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    print("Navegando para o sistema...")
    page.goto('http://localhost:3000')
    page.wait_for_load_state('networkidle')
    
    print("Selecionando Perfil Administrativo...")
    page.locator('button:has-text("Administrador")').click()
    
    print("Preenchendo credenciais e processando login...")
    page.fill('input[type="email"]', 'admin@dehood.com')
    page.fill('input[type="password"]', 'admin123')
    page.locator('button[type="submit"]:has-text("Entrar")').click()
    
    # Aguardando a barra lateral carregar ou nova renderização do Dashboard
    page.wait_for_load_state('networkidle')
    time.sleep(3) # Pausa estratégica para dar tempo de preencher os dados do banco
    
    # Capturando estado e a prova visual
    page.screenshot(path='/tmp/dashboard_recon.png', full_page=True)
    
    # Capturando o HTML gerado para que a IA possa escolher o próximo botão a clicar (MenuLateral)
    with open('/tmp/dashboard_dom.html', 'w', encoding='utf-8') as f:
        f.write(page.content())

    print("Login executado com sucesso! DOM e Screenshot extraídos na pasta /tmp.")
    browser.close()
