#!/bin/bash

set -e

echo "--- [1/3] Construindo o Frontend ---"
cd frontend
npm install --silent --no-fund
npm run build --silent
cd ..

echo "--- [2/3] Integrando Frontend ao Backend ---"
rm -rf backend/src/main/resources/public
mkdir -p backend/src/main/resources/public
cp -r frontend/dist/* backend/src/main/resources/public/

echo "--- [3/3] Compilando e Gerando JAR ---"
cd backend
mvn -B clean package

JAR_PATH=$(ls target/*.jar | grep -v "original-" | head -n 1)
JAR_FILE=$(basename "$JAR_PATH")

cd ..

cp "backend/$JAR_PATH" .
chmod +x "$JAR_FILE"

if [ -n "$GITHUB_ENV" ]; then
    echo "GENERATED_JAR_NAME=$JAR_FILE" >> "$GITHUB_ENV"
    echo "⚙️ Enviando nome do JAR para o ambiente do GitHub Actions."
fi

echo ""
echo "✅ SUCESSO!"
echo "------------------------------------------------------"
echo "O executável foi gerado na raiz do projeto:"
echo "> ./$JAR_FILE"
echo "------------------------------------------------------"
echo "Para rodar, apenas digite:"
echo "java -jar $JAR_FILE"
