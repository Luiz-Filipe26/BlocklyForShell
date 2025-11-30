# **Blockly for Shell 🚀**

Um ambiente interativo de **Programação Visual** para desmistificar a Linha de Comando (CLI) Linux.

O **Blockly for Shell** é uma ferramenta educacional que utiliza a metáfora de blocos de encaixar (semelhante ao Scratch) para ensinar a lógica, sintaxe e composição de comandos de terminal (Bash). O objetivo é reduzir a carga cognitiva de iniciantes, permitindo que foquem na *lógica* da operação antes de memorizar a *sintaxe* textual.

## 🚀 Como Rodar (Usuário Final)

Para utilizar a ferramenta, você **não** precisa de Node.js, NPM ou servidores instalados. Apenas o Java Runtime (JRE 17+).

1. Vá para a página de [**Última Versão (Release)**][latest-release].
2. Baixe o arquivo `blockly-for-shell.jar` anexado à *Release*.
3. **Apenas para usuários Linux:** Vá em Propriedades do arquivo e marque a opção "Permitir execução do arquivo como um programa".
4. Dê um **duplo clique** no arquivo baixado para iniciar.
5. Uma janela se abrirá. Clique em **"Abrir no Navegador"** e comece a programar!

[latest-release]: https://github.com/Luiz-Filipe26/BlocklyForShell/releases/tag/build-now

## **✨ Funcionalidades Principais**

* **Programação Visual:** Construa scripts complexos arrastando e soltando blocos.  
* **Live Preview (AST):** Veja o código Shell Script ser gerado em tempo real à medida que você monta a lógica.  
* **Validação Semântica:** O sistema impede conexões inválidas (ex: tentar usar um parâmetro de arquivo onde se espera uma pasta).  
* **Arquitetura Orientada a Dados:** Todos os comandos (ls, mkdir, cd, etc.) são definidos em arquivos JSON externos, permitindo fácil extensão sem recompilar o código.  
* **Zero Configuração:** O artefato final é um executável único (Fat JAR) que contém o servidor, o frontend e as dependências.

## **🛠️ Stack Tecnológica**

O projeto segue uma arquitetura **Full Stack Monolítica Desacoplada**, priorizando performance e portabilidade.

### **Backend (Java 17\)**

* **Javalin:** Servidor Web leve e performático para servir a API e os estáticos.  
* **Maven:** Gerenciamento de dependências e build.  
* **Gson:** Processamento de JSON e serialização da AST.  
* **SLF4J:** Logging estruturado.

### **Frontend (Modern JavaScript)**

* **Vite 6:** Tooling de nova geração para build otimizado e rápido.  
* **Google Blockly:** Motor de renderização dos blocos visuais.  
* **ES Modules:** Código modularizado e limpo (Vanilla JS moderno).

## **💻 Desenvolvimento (Build from Source)**

Se você deseja contribuir ou modificar o código, siga os passos abaixo para configurar o ambiente de desenvolvimento.

### **Pré-requisitos**

* **Java JDK 17** ou superior.  
* **Node.js 20** ou superior (Recomendado LTS).  
* **Maven**.

### **Estrutura do Projeto**

.  
├── backend/  
│   ├── src/main/java/.../cli/  
│   │   ├── controllers/       \# Endpoints da API (Definições, Execução, Geração)  
│   │   ├── models/            \# DTOs e Records (AST, Resultados de Execução)  
│   │   ├── services/          \# Lógica de Negócio (Gerador de Bash, Sandbox)  
│   │   └── App.java           \# Ponto de entrada, Servidor Web e Launcher GUI  
│   ├── src/main/resources/  
│   │   └── definitions/       \# JSONs de definição dos comandos (Data-Driven)  
│   └── pom.xml                \# Configuração Maven e Plugins de Build  
├── frontend/  
│   ├── public/                \# Assets estáticos (Ícones SVG)  
│   ├── src/  
│   │   ├── blockly/           \# Lógica Visual (Builders, Serializer, Validators)  
│   │   ├── main.css           \# Estilização global  
│   │   └── main.js            \# Ponto de entrada e gerenciamento de estado  
│   ├── index.html             \# Template principal da aplicação  
│   └── vite.config.js         \# Configuração de Build e Chunking  
└── build\_project.sh           \# Script de automação de build e distribuição

### **Compilando o Projeto**

O projeto conta com um script de automação (build\_project.sh para Linux/Mac ou .bat para Windows) que realiza todo o processo: instala dependências do frontend, builda o Vite, copia os assets para o backend e empacota o JAR final.

\# 1\. Dê permissão de execução (Linux/Mac)  
chmod \+x build\_project.sh

\# 2\. Rode o script  
./build\_project.sh

Ao final, o executável blockly-for-shell.jar será gerado na **raiz do projeto**.

## **🧩 Como Adicionar Novos Comandos**

O sistema é **Data-Driven**. Você não precisa escrever código Java ou JavaScript para adicionar um comando simples como rm ou touch.

1. Abra o arquivo backend/src/main/resources/definitions/cli\_definitions.json.  
2. Adicione uma nova entrada no array commands:

{  
  "command": "touch",  
  "name": "touch",  
  "description": "Atualiza o timestamp ou cria um arquivo vazio.",  
  "color": "\#4caf50",  
  "options": \[  
    { "flag": "-a", "description": "Muda apenas o tempo de acesso." }  
  \],  
  "operands": \[  
    { "name": "filename", "type": "file", "cardinality": { "min": 1 } }  
  \]  
}

3. Reinicie o servidor. O bloco aparecerá automaticamente na interface\!

## **🧠 Mecanismos de Validação e UX**

O projeto implementa regras de validação em tempo real para garantir que os comandos gerados sejam sintaticamente válidos antes mesmo de serem executados.

### **1\. Validação de Cardinalidade (Auto-Unplug)**

O sistema respeita limites rígidos definidos no JSON. Se um comando aceita no máximo 1 operando (ex: mkdir configurado com max: 1), e o usuário tenta conectar um segundo bloco, o sistema detecta o excesso e **automaticamente desconecta (unplug)** o bloco excedente, impedindo a construção inválida visualmente.

### **2\. Opções Mutuamente Exclusivas**

Alguns comandos possuem flags que não podem coexistir (ex: ls \-t e ls \-S para ordenação). O sistema monitora essas restrições: se o usuário seleciona uma opção conflitante, a anterior é removida automaticamente, garantindo a coerência do comando.

### **3\. Geração via AST (Abstract Syntax Tree)**

Diferente de sistemas que apenas concatenam strings, o frontend serializa os blocos em uma estrutura de árvore JSON (AST). O backend Java recebe essa árvore, valida a estrutura e transcompila para Shell Script. Isso permite uma separação limpa entre a representação visual e a sintaxe final.
