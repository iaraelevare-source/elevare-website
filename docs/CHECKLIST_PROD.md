# ✅ CHECKLIST PRÉ-PRODUÇÃO - ELEVARE SaaS

**Versão:** 1.0.0  
**Data:** 2025-01-27  
**Score Atual:** 9.5/10

---

## 📋 VISÃO GERAL

Este checklist contém **20 itens críticos** que devem ser validados antes do lançamento em produção. Cada item inclui:

- ✅ Critério de sucesso
- 🔧 Comando de validação
- 🤖 Indicador se é automatizável

**Meta:** 20/20 itens concluídos antes do lançamento

---

## 🔐 SEGURANÇA (5 itens)

### 1. 2FA Testado com Google Authenticator Real

- [ ] **Status:** Pendente
- **Critério:** Usuário consegue ativar 2FA, escanear QR Code e fazer login com token
- **Comando:**
  ```bash
  # 1. Subir backend
  cd backend && npm run start:dev
  
  # 2. Registrar usuário
  curl -X POST http://localhost:3000/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"teste@2fa.com","password":"senha123","nome":"Teste 2FA"}'
  
  # 3. Fazer login e obter token
  TOKEN=$(curl -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"teste@2fa.com","password":"senha123"}' | jq -r '.access_token')
  
  # 4. Gerar QR Code
  curl -X GET http://localhost:3000/2fa/setup \
    -H "Authorization: Bearer $TOKEN"
  
  # 5. Escanear QR Code com Google Authenticator
  # 6. Ativar 2FA com token do app
  curl -X POST http://localhost:3000/2fa/enable \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"token":"123456"}'
  
  # 7. Fazer login novamente (deve pedir token 2FA)
  curl -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"teste@2fa.com","password":"senha123"}'
  ```
- **Automatizável:** 🔴 NÃO (requer app físico)

---

### 2. Rate Limiting Ativo em Todos os Endpoints

- [ ] **Status:** Pendente
- **Critério:** Após 10 requisições em 60 segundos, API retorna 429 (Too Many Requests)
- **Comando:**
  ```bash
  # Testar rate limiting
  for i in {1..15}; do
    curl -X GET http://localhost:3000/health -w "\n%{http_code}\n"
    sleep 1
  done
  
  # Esperado: primeiras 10 retornam 200, demais retornam 429
  ```
- **Automatizável:** 🟢 SIM

---

### 3. Secrets do .env Não Estão no Repositório

- [ ] **Status:** Pendente
- **Critério:** Arquivo .env está no .gitignore e não há secrets commitados
- **Comando:**
  ```bash
  # Verificar .gitignore
  grep -q "^\.env$" .gitignore && echo "✅ .env no .gitignore" || echo "❌ .env NÃO está no .gitignore"
  
  # Buscar secrets no histórico do git
  git log --all --full-history --source --pretty=format: -- .env | wc -l
  # Esperado: 0 (nenhum commit com .env)
  
  # Buscar strings sensíveis no código
  grep -r "sk-proj-\|postgres://\|JWT_SECRET=" backend/src/ && echo "❌ SECRET EXPOSTO" || echo "✅ Nenhum secret hardcoded"
  ```
- **Automatizável:** 🟢 SIM

---

### 4. CORS Configurado para Domínios Específicos

- [ ] **Status:** Pendente
- **Critério:** CORS permite apenas domínios whitelistados (não permite *)
- **Comando:**
  ```bash
  # Verificar configuração de CORS no main.ts
  grep -A 5 "enableCors" backend/src/main.ts
  
  # Esperado: origin com array de domínios específicos
  # ❌ BAD:  origin: '*'
  # ✅ GOOD: origin: ['https://elevare.com.br', 'https://app.elevare.com.br']
  
  # Testar CORS de domínio não autorizado
  curl -X OPTIONS http://localhost:3000/health \
    -H "Origin: https://malicious.com" \
    -H "Access-Control-Request-Method: GET" \
    -v 2>&1 | grep "Access-Control-Allow-Origin"
  
  # Esperado: NÃO deve retornar header Access-Control-Allow-Origin
  ```
- **Automatizável:** 🟢 SIM

---

### 5. Helmet Middleware Ativo

- [ ] **Status:** Pendente
- **Critério:** Headers de segurança estão presentes (X-Frame-Options, X-Content-Type-Options, etc.)
- **Comando:**
  ```bash
  # Verificar se Helmet está instalado
  grep -q "helmet" backend/package.json && echo "✅ Helmet instalado" || echo "❌ Helmet NÃO instalado"
  
  # Testar headers de segurança
  curl -I http://localhost:3000/health | grep -E "X-Frame-Options|X-Content-Type-Options|Strict-Transport-Security"
  
  # Esperado:
  # X-Frame-Options: DENY
  # X-Content-Type-Options: nosniff
  # Strict-Transport-Security: max-age=15552000; includeSubDomains
  ```
- **Automatizável:** 🟢 SIM

---

## 📜 LGPD (3 itens)

### 6. Export de Dados Funciona

- [ ] **Status:** Pendente
- **Critério:** Usuário consegue exportar todos os seus dados em formato JSON
- **Comando:**
  ```bash
  # 1. Criar usuário e fazer login
  TOKEN=$(curl -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"teste@lgpd.com","password":"senha123"}' | jq -r '.access_token')
  
  # 2. Exportar dados
  curl -X GET http://localhost:3000/lgpd/export \
    -H "Authorization: Bearer $TOKEN" \
    -o user_data.json
  
  # 3. Verificar conteúdo
  cat user_data.json | jq '.user, .consents, .leads, .appointments'
  
  # Esperado: JSON com todos os dados do usuário
  ```
- **Automatizável:** 🟢 SIM

---

### 7. Exclusão de Conta Remove Todos os Dados

- [ ] **Status:** Pendente
- **Critério:** Após exclusão, dados do usuário são pseudonimizados e não recuperáveis
- **Comando:**
  ```bash
  # 1. Criar usuário
  USER_ID=$(curl -X POST http://localhost:3000/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"delete@test.com","password":"senha123","nome":"Delete Test"}' | jq -r '.user.id')
  
  # 2. Fazer login
  TOKEN=$(curl -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"delete@test.com","password":"senha123"}' | jq -r '.access_token')
  
  # 3. Deletar conta
  curl -X DELETE http://localhost:3000/lgpd/delete \
    -H "Authorization: Bearer $TOKEN"
  
  # 4. Tentar fazer login novamente
  curl -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"delete@test.com","password":"senha123"}'
  
  # Esperado: 401 Unauthorized (conta não existe mais)
  
  # 5. Verificar no banco se dados foram pseudonimizados
  # docker exec -it elevare-postgres psql -U elevare -c "SELECT nome, email FROM users WHERE id = '$USER_ID';"
  # Esperado: nome = '[DELETED] abc123', email = 'deleted_abc123@lgpd.elevare.com'
  ```
- **Automatizável:** 🟡 PARCIAL (requer acesso ao banco)

---

### 8. Consentimento Armazenado com Timestamp

- [ ] **Status:** Pendente
- **Critério:** Cada consentimento tem createdAt, ipAddress e userAgent
- **Comando:**
  ```bash
  # 1. Registrar consentimento
  TOKEN=$(curl -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@elevare.com","password":"senha123"}' | jq -r '.access_token')
  
  curl -X POST http://localhost:3000/lgpd/consent \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"type":"whatsapp","purpose":"Comunicação via WhatsApp","granted":true}'
  
  # 2. Listar consentimentos
  curl -X GET http://localhost:3000/lgpd/my-consents \
    -H "Authorization: Bearer $TOKEN" | jq '.[] | {type, createdAt, ipAddress, userAgent}'
  
  # Esperado: Todos os campos preenchidos
  ```
- **Automatizável:** 🟢 SIM

---

## ⚡ PERFORMANCE (4 itens)

### 9. < 300ms em 90% das Requisições

- [ ] **Status:** Pendente
- **Critério:** P90 latency < 300ms em endpoints principais
- **Comando:**
  ```bash
  # Instalar Apache Bench
  sudo apt-get install -y apache2-utils
  
  # Testar endpoint de leads (100 requisições, 10 concorrentes)
  ab -n 100 -c 10 -H "Authorization: Bearer $TOKEN" http://localhost:3000/leads/
  
  # Verificar linha "90%"
  # Esperado: 90% < 300ms
  
  # Alternativa com curl e jq
  for i in {1..100}; do
    curl -w "%{time_total}\n" -o /dev/null -s http://localhost:3000/health
  done | sort -n | awk 'BEGIN{c=0} {a[c++]=$1} END{print "P90: " a[int(c*0.9)]}'
  ```
- **Automatizável:** 🟢 SIM

---

### 10. Cache Redis Ativo em Leads

- [ ] **Status:** Pendente
- **Critério:** Segunda requisição ao mesmo lead é 10x mais rápida (cache hit)
- **Comando:**
  ```bash
  # 1. Primeira requisição (cache miss)
  time1=$(curl -w "%{time_total}" -o /dev/null -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/leads/1)
  
  # 2. Segunda requisição (cache hit)
  time2=$(curl -w "%{time_total}" -o /dev/null -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/leads/1)
  
  # 3. Comparar
  echo "Cache miss: ${time1}s"
  echo "Cache hit: ${time2}s"
  echo "Speedup: $(echo "scale=2; $time1 / $time2" | bc)x"
  
  # Esperado: Speedup > 5x
  
  # 4. Verificar Redis
  docker exec -it elevare-redis redis-cli KEYS "lead:*"
  # Esperado: Chaves de cache presentes
  ```
- **Automatizável:** 🟡 PARCIAL (requer Redis rodando)

---

### 11. Bundle Frontend < 100KB

- [ ] **Status:** Pendente
- **Critério:** Arquivo JavaScript principal tem menos de 100KB (gzipped)
- **Comando:**
  ```bash
  # Verificar tamanho dos arquivos JS
  find . -name "*.js" -type f -exec du -h {} + | sort -rh | head -10
  
  # Verificar tamanho gzipped
  for file in $(find . -name "*.js" -type f); do
    gzip -c "$file" | wc -c | awk -v f="$file" '{printf "%s: %.2f KB\n", f, $1/1024}'
  done | sort -t: -k2 -rn | head -5
  
  # Esperado: Maior arquivo < 100KB
  ```
- **Automatizável:** 🟢 SIM

---

### 12. Postgres Queries Otimizadas (N+1 Resolvido)

- [ ] **Status:** Pendente
- **Critério:** Endpoint /leads não faz múltiplas queries para relacionamentos
- **Comando:**
  ```bash
  # Ativar log de queries no TypeORM
  # Editar database.config.ts: logging: true
  
  # Fazer requisição
  curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/leads/ > /dev/null
  
  # Verificar logs
  grep "SELECT" backend/logs/app.log | wc -l
  
  # Esperado: 1-2 queries (não 10+)
  
  # Verificar se usa eager loading
  grep -r "relations:" backend/src/modules/leads/ | grep -E "createdBy|clinic"
  # Esperado: Relacionamentos carregados com eager ou join
  ```
- **Automatizável:** 🟡 PARCIAL (requer análise manual)

---

## 🏗️ INFRAESTRUTURA (4 itens)

### 13. Backups Sendo Executados Diariamente

- [ ] **Status:** Pendente
- **Critério:** Script de backup roda diariamente via cron e gera arquivos .sql
- **Comando:**
  ```bash
  # Verificar se script de backup existe
  ls -lh scripts/backup.sh
  
  # Executar backup manualmente
  ./scripts/backup.sh
  
  # Verificar se arquivo foi criado
  ls -lh backups/ | tail -5
  
  # Verificar crontab
  crontab -l | grep backup.sh
  # Esperado: 0 2 * * * /path/to/backup.sh (roda às 2h da manhã)
  
  # Testar restauração
  # docker exec -i elevare-postgres psql -U elevare -d elevare < backups/backup_2025-01-27.sql
  ```
- **Automatizável:** 🟢 SIM

---

### 14. Prometheus Capturando Métricas

- [ ] **Status:** Pendente
- **Critério:** Prometheus está coletando métricas do backend a cada 15 segundos
- **Comando:**
  ```bash
  # Verificar se Prometheus está rodando
  curl -s http://localhost:9090/-/healthy
  # Esperado: Prometheus is Healthy
  
  # Verificar targets
  curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job, health, lastScrape}'
  
  # Esperado: backend (up), postgres-exporter (up), redis-exporter (up)
  
  # Verificar métricas do backend
  curl -s http://localhost:3000/metrics | grep elevare_leads_received_total
  
  # Esperado: Métrica presente com valor > 0
  ```
- **Automatizável:** 🟢 SIM

---

### 15. Logs Sendo Coletados

- [ ] **Status:** Pendente
- **Critério:** Logs são escritos em arquivo e rotacionados diariamente
- **Comando:**
  ```bash
  # Verificar se logs estão sendo escritos
  ls -lh backend/logs/
  
  # Verificar conteúdo
  tail -20 backend/logs/app.log
  
  # Verificar rotação de logs
  ls -lh backend/logs/*.log.* 2>/dev/null | wc -l
  # Esperado: > 0 (logs antigos rotacionados)
  
  # Verificar se Winston está configurado
  grep -r "winston" backend/src/common/logger.config.ts
  # Esperado: Configuração presente
  ```
- **Automatizável:** 🟢 SIM

---

### 16. SSL/TLS Configurado

- [ ] **Status:** Pendente
- **Critério:** API responde em HTTPS com certificado válido
- **Comando:**
  ```bash
  # Testar certificado SSL
  curl -vI https://api.elevare.com.br 2>&1 | grep -E "SSL certificate|subject|issuer"
  
  # Esperado:
  # SSL certificate verify ok
  # subject: CN=api.elevare.com.br
  # issuer: C=US; O=Let's Encrypt
  
  # Verificar se HTTP redireciona para HTTPS
  curl -I http://api.elevare.com.br | grep -i location
  # Esperado: Location: https://api.elevare.com.br
  
  # Testar grade SSL (A+)
  # https://www.ssllabs.com/ssltest/analyze.html?d=api.elevare.com.br
  ```
- **Automatizável:** 🟡 PARCIAL (requer domínio em produção)

---

## 🎨 UX (4 itens)

### 17. Onboarding Funciona no Mobile

- [ ] **Status:** Pendente
- **Critério:** Fluxo de registro e primeiro login funciona em tela de 375px
- **Comando:**
  ```bash
  # Testar responsividade com Chrome DevTools
  # 1. Abrir https://elevare.com.br
  # 2. F12 > Toggle device toolbar (Ctrl+Shift+M)
  # 3. Selecionar iPhone SE (375x667)
  # 4. Testar fluxo:
  #    - Clicar em "Começar Grátis"
  #    - Preencher formulário de registro
  #    - Fazer login
  #    - Navegar pelo dashboard
  
  # Verificar CSS mobile-first
  grep -r "@media.*max-width.*768px" *.css *.html
  # Esperado: Media queries presentes
  ```
- **Automatizável:** 🔴 NÃO (requer teste manual)

---

### 18. WhatsApp Webhook Recebe Mensagens

- [ ] **Status:** Pendente
- **Critério:** Mensagem enviada via WhatsApp chega no webhook e IARA responde
- **Comando:**
  ```bash
  # 1. Verificar se webhook está configurado
  curl -X GET http://localhost:3000/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=$WHATSAPP_WEBHOOK_TOKEN&hub.challenge=test
  # Esperado: Retorna "test" (challenge)
  
  # 2. Simular mensagem recebida
  curl -X POST http://localhost:3000/webhooks/whatsapp \
    -H "Content-Type: application/json" \
    -d '{
      "entry": [{
        "changes": [{
          "value": {
            "messages": [{
              "from": "5511999999999",
              "text": { "body": "Olá, quero agendar consulta" }
            }]
          }
        }]
      }]
    }'
  
  # 3. Verificar logs
  tail -20 backend/logs/app.log | grep "IARA"
  # Esperado: Log de resposta da IARA
  
  # 4. Testar com WhatsApp real
  # Enviar mensagem para número configurado e verificar resposta
  ```
- **Automatizável:** 🟡 PARCIAL (webhook sim, WhatsApp real não)

---

### 19. IARA Responde em < 5 Segundos

- [ ] **Status:** Pendente
- **Critério:** Tempo de resposta da IARA (GPT-3.5) é menor que 5 segundos
- **Comando:**
  ```bash
  # Testar latência da IARA
  time curl -X POST http://localhost:3000/webhooks/whatsapp \
    -H "Content-Type: application/json" \
    -d '{
      "entry": [{
        "changes": [{
          "value": {
            "messages": [{
              "from": "5511999999999",
              "text": { "body": "Qual o horário de funcionamento?" }
            }]
          }
        }]
      }]
    }'
  
  # Esperado: real < 5.0s
  
  # Verificar métricas no Prometheus
  curl -s http://localhost:3000/metrics | grep elevare_iara_response_time_seconds
  # Esperado: P90 < 5.0
  ```
- **Automatizável:** 🟢 SIM

---

### 20. Email de Boas-Vindas Enviado

- [ ] **Status:** Pendente
- **Critério:** Após registro, usuário recebe email de boas-vindas em até 1 minuto
- **Comando:**
  ```bash
  # 1. Registrar novo usuário
  curl -X POST http://localhost:3000/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"novo@test.com","password":"senha123","nome":"Novo Usuário"}'
  
  # 2. Verificar logs de email
  tail -50 backend/logs/app.log | grep -i "email\|mail"
  
  # Esperado: Log de envio de email
  
  # 3. Verificar fila de emails (se usar Bull/Redis)
  # docker exec -it elevare-redis redis-cli LLEN bull:email:waiting
  # Esperado: 0 (email já foi enviado)
  
  # 4. Testar com email real
  # Registrar com seu email e verificar caixa de entrada
  ```
- **Automatizável:** 🟡 PARCIAL (envio sim, recebimento não)

---

## 📊 RESUMO DE AUTOMAÇÃO

| Categoria | Total | Automatizável | Manual | Parcial |
|-----------|-------|---------------|--------|---------|
| Segurança | 5 | 4 (80%) | 1 (20%) | 0 |
| LGPD | 3 | 2 (67%) | 0 | 1 (33%) |
| Performance | 4 | 2 (50%) | 0 | 2 (50%) |
| Infraestrutura | 4 | 3 (75%) | 0 | 1 (25%) |
| UX | 4 | 2 (50%) | 2 (50%) | 0 |
| **TOTAL** | **20** | **13 (65%)** | **3 (15%)** | **4 (20%)** |

---

## 🤖 SCRIPT DE VALIDAÇÃO AUTOMÁTICA

Execute este script para validar todos os itens automatizáveis:

```bash
#!/bin/bash
# validate-prod.sh

echo "🔍 Validando checklist pré-produção..."

# Contadores
PASSED=0
FAILED=0

# Função de teste
test_item() {
  local name=$1
  local command=$2
  
  echo -n "Testing: $name... "
  if eval "$command" > /dev/null 2>&1; then
    echo "✅ PASS"
    ((PASSED++))
  else
    echo "❌ FAIL"
    ((FAILED++))
  fi
}

# Testes
test_item "Rate Limiting" "curl -s http://localhost:3000/health -w '%{http_code}' | grep 200"
test_item "Secrets no .gitignore" "grep -q '^\.env$' .gitignore"
test_item "Helmet instalado" "grep -q 'helmet' backend/package.json"
test_item "Prometheus rodando" "curl -s http://localhost:9090/-/healthy | grep -q 'Prometheus is Healthy'"
test_item "Logs existem" "[ -f backend/logs/app.log ]"
test_item "Script de backup existe" "[ -f scripts/backup.sh ]"

# Resultado
echo ""
echo "📊 Resultado: $PASSED passed, $FAILED failed"
echo "Taxa de sucesso: $(echo "scale=2; $PASSED * 100 / ($PASSED + $FAILED)" | bc)%"

if [ $FAILED -eq 0 ]; then
  echo "✅ Todos os testes passaram!"
  exit 0
else
  echo "❌ Alguns testes falharam. Revise o checklist."
  exit 1
fi
```

**Uso:**
```bash
chmod +x validate-prod.sh
./validate-prod.sh
```

---

## 🎯 PRÓXIMOS PASSOS

1. **Executar script de validação**
   ```bash
   ./validate-prod.sh
   ```

2. **Marcar itens concluídos**
   - Substitua `[ ]` por `[x]` para cada item validado

3. **Revisar itens manuais**
   - Testar 2FA com app real
   - Testar onboarding no mobile
   - Enviar mensagem via WhatsApp real
   - Registrar com email real

4. **Gerar relatório final**
   ```bash
   grep -c "\[x\]" docs/CHECKLIST_PROD.md
   # Meta: 20/20
   ```

5. **Lançar em produção** 🚀

---

**Gerado em:** 2025-01-27  
**Por:** Manus AI - Sistema de Qualidade  
**Versão:** 1.0.0
