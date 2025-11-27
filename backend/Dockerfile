# Estágio de build
FROM node:22-alpine AS builder

WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./

# Instala dependências
RUN npm ci

# Copia código fonte
COPY . .

# Compila a aplicação
RUN npm run build

# Estágio de produção
FROM node:22-alpine

WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./

# Instala apenas dependências de produção
RUN npm ci --only=production

# Copia código compilado do estágio de build
COPY --from=builder /app/dist ./dist

# Expõe a porta da aplicação
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["node", "dist/main"]
