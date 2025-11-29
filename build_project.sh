#!/bin/bash

# Aborta o script se algum comando falhar
set -e

echo "--- [1/3] Construindo o Frontend ---"
cd frontend
npm install
npm run build
cd ..

echo "--- [2/3] Integrando Frontend ao Backend ---"
# Limpa e recria a pasta de estáticos no Java
rm -rf backend/src/main/resources/public
mkdir -p backend/src/main/resources/public
# Copia o build do Vite para lá
cp -r frontend/dist/* backend/src/main/resources/public/

echo "--- [3/3] Compilando e Gerando JAR ---"
cd backend
mvn clean package

# 1. Identifica o arquivo gerado DENTRO da pasta target antes de copiar
# O 'grep -v' ignora o arquivo 'original-*.jar' (que não tem as dependências)
JAR_PATH=$(ls target/*.jar | grep -v "original-" | head -n 1)
JAR_FILE=$(basename "$JAR_PATH")

cd ..

# 2. Copia o arquivo identificado para a raiz
cp "backend/$JAR_PATH" .

echo ""
echo "✅ SUCESSO!"
echo "------------------------------------------------------"
echo "O executável foi gerado na raiz do projeto:"
echo "👉 ./$JAR_FILE"
echo "------------------------------------------------------"
echo "Para rodar, apenas digite:"
echo "java -jar $JAR_FILE"
