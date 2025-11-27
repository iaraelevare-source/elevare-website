# 🔐 Teste de Autenticação 2FA

## Pré-requisitos
- Backend rodando: `npm run start:dev`
- Google Authenticator instalado no celular

## Passo 1: Login Normal
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@elevare.com",
    "password": "senha123"
  }'
```

**Resposta esperada:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@elevare.com",
    "nome": "Admin",
    "role": "admin",
    "clinicId": "uuid"
  }
}
```

Copie o `access_token` para os próximos passos.

## Passo 2: Gerar QR Code
```bash
curl -X GET http://localhost:3000/2fa/setup \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada:**
```json
{
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "secret": "JBSWY3DPEHPK3PXP",
  "message": "Escaneie o QR Code com Google Authenticator e chame /2fa/enable"
}
```

## Passo 3: Escanear QR Code
1. Abra o Google Authenticator no celular
2. Toque em "+" para adicionar conta
3. Escolha "Escanear QR Code"
4. Aponte a câmera para o QR Code (cole o `qrCode` em um visualizador HTML)

**Alternativa manual:**
1. No Google Authenticator, escolha "Inserir chave de configuração"
2. Nome da conta: `Elevare`
3. Chave: Cole o `secret` retornado

## Passo 4: Ativar 2FA
Pegue o código de 6 dígitos do Google Authenticator e execute:

```bash
curl -X POST http://localhost:3000/2fa/enable \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "123456"
  }'
```

**Resposta esperada:**
```json
{
  "message": "2FA ativado com sucesso",
  "tfaEnabled": true
}
```

## Passo 5: Testar Login com 2FA
Agora faça login novamente:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@elevare.com",
    "password": "senha123"
  }'
```

**Resposta esperada (diferente!):**
```json
{
  "message": "2FA required",
  "requires2FA": true,
  "tempToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Passo 6: Completar Login com 2FA
Pegue o código de 6 dígitos do Google Authenticator e execute:

```bash
curl -X POST http://localhost:3000/auth/login/2fa \
  -H "Content-Type: application/json" \
  -d '{
    "tempToken": "SEU_TEMP_TOKEN_AQUI",
    "token": "123456"
  }'
```

**Resposta esperada:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@elevare.com",
    "nome": "Admin",
    "role": "admin",
    "clinicId": "uuid"
  }
}
```

✅ **Login com 2FA completado com sucesso!**

## Passo 7: Desativar 2FA (Opcional)
```bash
curl -X POST http://localhost:3000/2fa/disable \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "123456"
  }'
```

## Endpoints Disponíveis
- `GET  /2fa/setup`       → Gerar QR Code
- `POST /2fa/verify`      → Testar token (opcional)
- `POST /2fa/enable`      → Ativar 2FA
- `POST /2fa/disable`     → Desativar 2FA
- `GET  /2fa/status`      → Ver status do 2FA
- `POST /auth/login/2fa`  → Completar login com 2FA

## Swagger
Acesse: http://localhost:3000/api/docs

Procure pela tag **2FA** para ver todos os endpoints documentados.
