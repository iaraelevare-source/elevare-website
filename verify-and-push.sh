#!/bin/bash

# Script simples para verificar e sincronizar commits com GitHub
# Uso: ./verify-and-push.sh

set -e

echo "🔍 Verificando status do git..."
echo ""

# Buscar atualizações do remoto
git fetch origin master 2>/dev/null || git fetch origin main 2>/dev/null || true

# Detectar branch principal
BRANCH=$(git branch --show-current)
REMOTE_BRANCH="origin/$BRANCH"

echo "📌 Branch atual: $BRANCH"
echo ""

# Verificar se há mudanças não commitadas
UNCOMMITTED=$(git status --porcelain | wc -l)
if [ $UNCOMMITTED -gt 0 ]; then
  echo "⚠️  Há $UNCOMMITTED arquivo(s) não commitado(s):"
  git status --short
  echo ""
  read -p "Deseja commitar agora? (y/n): " COMMIT_NOW
  if [ "$COMMIT_NOW" = "y" ]; then
    git add .
    read -p "Mensagem do commit: " COMMIT_MSG
    git commit -m "$COMMIT_MSG"
    echo "✅ Commit realizado!"
  else
    echo "❌ Abortando. Commite suas mudanças antes de continuar."
    exit 1
  fi
fi

# Verificar commits locais não enviados
AHEAD=$(git rev-list $REMOTE_BRANCH..HEAD --count 2>/dev/null || echo "0")

if [ $AHEAD -gt 0 ]; then
  echo "📊 Há $AHEAD commit(s) local(is) não enviado(s) para GitHub:"
  echo ""
  git log $REMOTE_BRANCH..HEAD --oneline --decorate
  echo ""
  
  read -p "Deseja enviar para GitHub agora? (y/n): " PUSH_NOW
  if [ "$PUSH_NOW" = "y" ]; then
    echo "🚀 Enviando para GitHub..."
    git push origin $BRANCH --tags
    echo ""
    echo "✅ Enviado com sucesso!"
  else
    echo "⚠️  Commits locais não foram enviados."
  fi
else
  echo "✅ Repositório já está sincronizado com GitHub"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 ÚLTIMO COMMIT LOCAL:"
echo ""
git log -1 --pretty="   SHA: %H%n   Mensagem: %s%n   Autor: %an%n   Data: %ar"
echo ""

echo "📝 ÚLTIMO COMMIT REMOTO:"
echo ""
git log $REMOTE_BRANCH -1 --pretty="   SHA: %H%n   Mensagem: %s%n   Autor: %an%n   Data: %ar" 2>/dev/null || echo "   (não disponível)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar se commits locais e remotos são iguais
LOCAL_SHA=$(git rev-parse HEAD)
REMOTE_SHA=$(git rev-parse $REMOTE_BRANCH 2>/dev/null || echo "")

if [ "$LOCAL_SHA" = "$REMOTE_SHA" ]; then
  echo ""
  echo "✅ STATUS: SINCRONIZADO"
  echo ""
  echo "🔗 URL do último commit:"
  REPO_URL=$(git remote get-url origin | sed 's/\.git$//' | sed 's/git@github.com:/https:\/\/github.com\//')
  echo "   $REPO_URL/commit/$LOCAL_SHA"
else
  echo ""
  echo "⚠️  STATUS: DESSINCRONIZADO"
  echo ""
  echo "   Local:  $LOCAL_SHA"
  echo "   Remoto: $REMOTE_SHA"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
