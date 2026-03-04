from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    
    print("Acessando localhost:3000...")
    page.goto('http://localhost:3000')
    
    # Login Flow
    print("Realizando Login como Administrador...")
    page.locator('button:has-text("Administrador")').click()
    page.fill('input[type="email"]', 'admin@dehood.com')
    page.fill('input[type="password"]', 'admin123')
    page.locator('button[type="submit"]:has-text("Entrar")').click()
    
    # Waiting for Dashboard
    page.wait_for_load_state('networkidle')
    time.sleep(2)
    
    # New Client Flow
    print("Adicionando novo cliente...")
    page.locator('button:has-text("Novo Cliente")').click()
    
    # Fill form
    page.fill('input[placeholder="Nome do Restaurante"]', 'Bot Teste E2E')
    page.fill('input[placeholder="E-mail"]', 'bot@testee2e.com')
    page.fill('input[placeholder="Telefone"]', '11999999999')
    page.fill('input[placeholder="Endereço Completo"]', 'Avenida Paulista, 1000')
    page.fill('input[placeholder="Cidade"]', 'São Paulo')
    
    print("Salvando o cliente...")
    page.locator('button[type="submit"]:has-text("Salvar Cliente")').click()
    
    # Wait for creation animation/api
    time.sleep(3)
    
    # Navigate to get proof in the client list or dashboard
    page.screenshot(path='/tmp/e2e_prova_criacao.png', full_page=True)
    print("Sucesso! Foi salvo em /tmp/e2e_prova_criacao.png a screenshot do painel contendo o novo restaurante.")
    
    browser.close()
