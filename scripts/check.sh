#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────
#  MCR SYSTEM — Pre-deploy quality gate
#  Usage:  npm run check
#  Runs:   TypeScript check → Vite build → summary report
# ──────────────────────────────────────────────────────────────────
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

PASS=0
FAIL=0
WARNINGS=()

header() { echo -e "\n${BLUE}${BOLD}▶ $1${NC}"; }
ok()     { echo -e "  ${GREEN}✓${NC} $1"; ((PASS++)) || true; }
fail()   { echo -e "  ${RED}✗${NC} $1"; ((FAIL++)) || true; }
warn()   { echo -e "  ${YELLOW}⚠${NC} $1"; WARNINGS+=("$1"); }

cd "$(dirname "$0")/.."

echo -e "${BOLD}"
echo "  ╔══════════════════════════════════════╗"
echo "  ║   MCR SYSTEM — PRE-DEPLOY CHECK      ║"
echo "  ╚══════════════════════════════════════╝"
echo -e "${NC}"

# ── 1. TypeScript type check ──────────────────────────────────────
header "TypeScript — verificando tipos"
if npx tsc --noEmit 2>&1 | tee /tmp/ts_output.txt; then
  ok "Sem erros de tipo"
else
  TS_ERRORS=$(grep -c "error TS" /tmp/ts_output.txt 2>/dev/null || echo "?")
  fail "Encontrados ${TS_ERRORS} erro(s) de TypeScript"
  echo ""
  cat /tmp/ts_output.txt | grep "error TS" | head -20
fi

# ── 2. Vite build ─────────────────────────────────────────────────
header "Vite build — compilando bundle"
if npx vite build 2>&1 | tee /tmp/build_output.txt; then
  BUNDLE_SIZE=$(du -sh dist/ 2>/dev/null | cut -f1 || echo "?")
  ok "Build concluído — tamanho total: ${BUNDLE_SIZE}"

  # Check for large chunks (warn if > 500kb)
  if grep -q "kB" /tmp/build_output.txt; then
    LARGE=$(grep "kB" /tmp/build_output.txt | awk '{print $NF, $(NF-1)}' | awk -F'[kB]' '$1 > 500 {print}' 2>/dev/null || true)
    if [ -n "$LARGE" ]; then
      warn "Chunks grandes detectados (>500kB) — considere lazy loading"
    fi
  fi
else
  fail "Build falhou"
  echo ""
  grep -i "error\|failed" /tmp/build_output.txt | head -20
fi

# ── 3. Secrets / keys check ───────────────────────────────────────
header "Segurança — verificando secrets expostos"
SECRET_PATTERNS="sk-ant-api|AIzaSy|eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
EXPOSED=$(grep -rn --include="*.ts" --include="*.tsx" --include="*.js" \
  -E "$SECRET_PATTERNS" src/ 2>/dev/null | grep -v "//.*test\|\.env" || true)
if [ -z "$EXPOSED" ]; then
  ok "Nenhuma chave de API exposta no código-fonte"
else
  fail "ATENÇÃO: possível chave exposta detectada:"
  echo "$EXPOSED" | head -5
fi

# ── 4. Console.log check ──────────────────────────────────────────
header "Qualidade — console.log em produção"
LOG_COUNT=$(grep -rn "console\.log(" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
if [ "$LOG_COUNT" -eq 0 ]; then
  ok "Nenhum console.log encontrado"
elif [ "$LOG_COUNT" -lt 10 ]; then
  warn "${LOG_COUNT} console.log(s) encontrados — considere remover"
else
  fail "${LOG_COUNT} console.log(s) em produção — remova antes de deployar"
fi

# ── 5. .env check ─────────────────────────────────────────────────
header "Segurança — verificando .gitignore"
if grep -q "^\.env$" .gitignore 2>/dev/null || grep -q "^\.env\b" .gitignore 2>/dev/null; then
  ok ".env está no .gitignore"
else
  fail ".env NÃO está no .gitignore — risco de exposição de secrets"
fi

# ── Summary ───────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "  RESULTADO FINAL"
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${GREEN}✓ Passou: ${PASS}${NC}   ${RED}✗ Falhou: ${FAIL}${NC}   ${YELLOW}⚠ Avisos: ${#WARNINGS[@]}${NC}"

if [ ${#WARNINGS[@]} -gt 0 ]; then
  echo ""
  echo -e "${YELLOW}  Avisos:${NC}"
  for w in "${WARNINGS[@]}"; do
    echo -e "  ${YELLOW}→${NC} $w"
  done
fi

echo ""
if [ "$FAIL" -eq 0 ]; then
  echo -e "  ${GREEN}${BOLD}✅ PRONTO PARA DEPLOY${NC}"
  exit 0
else
  echo -e "  ${RED}${BOLD}❌ CORRIJA OS ERROS ANTES DE DEPLOYAR${NC}"
  exit 1
fi
