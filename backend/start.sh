#!/bin/bash

# Script de inicialização do backend Elevare
# Configura ambiente e inicia a aplicação

set -e

echo "🚀 Iniciando Elevare Backend..."

# Verifica se o arquivo .env existe
if [ ! -f .env ]; then
    echo "⚠️  Arquivo .env não encontrado. Copiando de .env.example..."
    cp .env.example .env
    echo "✅ Arquivo .env criado. Por favor, configure as variáveis de ambiente."
    exit 1
fi

# Verifica se node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Pergunta se deseja executar migrations
read -p "🗄️  Executar migrations? (s/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo "🔄 Executando migrations..."
    npm run migration:run
fi

# Pergunta se deseja executar seed
read -p "🌱 Executar seed (dados de teste)? (s/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo "🌱 Executando seed..."
    npm run seed
fi

# Inicia a aplicação
echo "🚀 Iniciando aplicação..."
npm run start:dev
