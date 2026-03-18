# Mapa do Sistema: D&E Hood Cleaning Management System

Este documento serve como guia para o Claude e o VS Code entenderem a estrutura do projeto.

## Arquitetura Geral
O sistema é uma aplicação full-stack moderna:
- **Frontend**: React 19 + Vite 6 + Tailwind CSS 4.
- **Backend**: Express.js rodando via `tsx` (Node.js).
- **Banco de Dados**: SQLite local (`hood_cleaning.db`) para persistência rápida e Supabase para autenticação e armazenamento em nuvem.
- **Autenticação**: Migrado de Clerk para Supabase + Autenticação Local (cookies/bcrypt).

## Estrutura de Pastas Úteis
- `/src`: Contém todo o código do frontend (componentes, hooks, contextos).
  - `/components`: UI dividida por funcionalidades (agendamento, automação, clientes, etc).
  - `/lib`: Integrações (Supabase, axios).
  - `/translations`: Arquivos de internacionalização (i18n).
- `/server`: Lógica do banco de dados SQLite e utilitários de servidor.
- `/supabase`: Configurações de Edge Functions e esquema remoto.

## Arquivos de Contexto Gerados
- [schema_db.sql](file:///Users/darlanposso/Downloads/d&e-hood-cleaning-management-system/schema_db.sql): Estrutura completa do banco SQLite.
- [project_snapshot.md](file:///Users/darlanposso/Downloads/d&e-hood-cleaning-management-system/project_snapshot.md): Código consolidado para análise profunda.
- [claude_instructions.md](file:///Users/darlanposso/Downloads/d&e-hood-cleaning-management-system/claude_instructions.md): Instruções de como usar esses arquivos.

## Principais Fluxos
1. **Login**: `server.ts` gerencia o login via `/api/login`, verificando no SQLite e sincronizando com Supabase.
2. **Serviços**: Fluxo de "Inspecionar -> Executar -> Finalizar" com upload de fotos para ImgBB.
3. **Automação**: Envio de lembretes automáticos via `nodemailer` e `node-cron`.
