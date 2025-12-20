# **ShellBlocks 🧩**

Um ambiente interativo de **Programação Visual** para desmistificar a Linha de Comando (CLI) Linux.

O **ShellBlocks** é uma ferramenta educacional que utiliza a metáfora de blocos de encaixar (semelhante ao Scratch) para ensinar a lógica, sintaxe e composição de comandos de terminal (Shell). O objetivo é reduzir a carga cognitiva de iniciantes, permitindo que foquem na _lógica_ da operação antes de memorizar a _sintaxe_ textual.

## **🚀 Como Rodar**

Para utilizar a ferramenta, você **não** precisa de Node.js, NPM ou servidores web instalados — apenas os pré-requisitos abaixo.

### **Pré-requisitos Essenciais**

- **Java Runtime (JRE 17+)**
- **Docker Engine** instalado e rodando.

### **Instalação (Linux, Windows e macOS)**

1. Acesse a página de [**Última Versão (Release)**](https://github.com/Luiz-Filipe26/ShellBlocks/releases/latest).
2. Baixe o arquivo `shell-blocks.jar` da versão mais recente.

### **Configuração de Permissões (APENAS USUÁRIOS LINUX)**

Se você não conseguir rodar o Docker sem sudo, o aplicativo Java falhará. Resolva isso adicionando seu usuário ao grupo docker:

```sh
sudo usermod -aG docker $USER
# Faça logout e login novamente para aplicar a mudança.
```

### **Inicialização**

1. **(Linux/macOS):** Dê permissão de execução ao JAR (ou use java \-jar).
2. **(Windows):** Clique duas vezes no arquivo baixado para iniciar.
3. Uma janela do Launcher Java se abrirá exibindo os logs.
4. Clique em **"Abrir Navegador"** e comece a programar\!

## **✨ Funcionalidades Principais**

- **Programação Visual:** Construa scripts complexos arrastando e soltando blocos.
- **Live Preview (AST):** Veja o código Shell Script ser gerado em tempo real à medida que você monta a lógica.
- **Validação Semântica:** O sistema impede conexões inválidas (ex: tentar usar um parâmetro de arquivo onde se espera uma pasta).
- **Arquitetura Orientada a Dados:** Todos os comandos (ls, mkdir, cd, etc.) são definidos em arquivos JSON externos, permitindo fácil extensão sem recompilar o código.
- **Zero Configuração:** O artefato final é um executável único (Fat JAR) que contém o servidor, o frontend e as dependências.

## **🛠️ Stack Tecnológica**

O projeto segue uma arquitetura **Full Stack Monolítica Desacoplada**, priorizando performance e portabilidade.

### **Backend (Java 17\)**

- **Javalin:** Servidor Web leve e performático para servir a API e os estáticos.
- **Maven:** Gerenciamento de dependências e build.
- **Gson:** Processamento de JSON e serialização da AST.
- **SLF4J:** Logging estruturado.

### **Frontend (Modern JavaScript)**

- **Vite 6:** Ferramenta de build de nova geração, rápida e otimizada.
- **TypeScript:** Linguagem para tipagem estática e segurança do código.
- **Google Blockly:** Motor de renderização dos blocos visuais.
- **ES Modules:** Código modularizado e limpo (Vanilla JS moderno).

## **💻 Desenvolvimento: Configuração e Compilação**

Se você deseja contribuir ou modificar o código, siga os passos abaixo para configurar o ambiente de desenvolvimento.

### **Pré-requisitos**

- **Java JDK 17** ou superior.
- **Node.js 20** ou superior (Recomendado LTS).
- **Maven**.

### **Estrutura do Projeto**

```
.
├── backend/
│   ├── src/main/java/.../cli/
│   │   ├── controllers/ \# Endpoints da API (Definições, Execução)
│   │   ├── models/      \# DTOs e Records (AST, Resultados)
│   │   ├── services/    \# Lógica de Negócio (Gerador de Bash)
│   │   └── App.java     \# Ponto de entrada e servidor Web
│   ├── src/main/resources/
│   │   └── definitions/ \# JSONs de definição dos comandos
│   └── pom.xml          \# Configuração Maven
├── frontend/
│   ├── public/          \# Assets estáticos
│   ├── src/
│   │   ├── blockly/     \# Builders, Serializer, Validators
│   │   ├── main.css     \# Estilização global
│   │   └── main.js      \# Ponto de entrada
│   ├── index.html       \# Template principal
│   └── vite.config.js   \# Configuração do Vite
└── build\_project.sh     \# Script de automação de build
```

## **🧠 Mecanismos de Validação e UX**

O projeto implementa regras de validação em tempo real para garantir que os comandos gerados sejam sintaticamente válidos antes mesmo de serem executados.

### **1\. Validação de Cardinalidade (Auto-Unplug)**

O sistema respeita limites rígidos definidos no JSON. Se um comando aceita no máximo 1 operando (ex: mkdir configurado com max: 1\) e o usuário tenta conectar um segundo bloco, o sistema detecta o excesso e **automaticamente desconecta (unplug)** o bloco excedente, impedindo a construção inválida visualmente.

### **2\. Opções Mutuamente Exclusivas**

Alguns comandos possuem flags que não podem coexistir (ex: ls \-t e ls \-S para ordenação). O sistema monitora essas restrições: se o usuário seleciona uma opção conflitante, a anterior é removida automaticamente, garantindo a coerência do comando.

### **3\. Geração via AST (Abstract Syntax Tree)**

Diferente de sistemas que apenas concatenam strings, o frontend serializa os blocos em uma estrutura de árvore JSON (AST). O backend Java recebe essa árvore, valida a estrutura e transcompila para Shell Script. Isso permite uma separação limpa entre a representação visual e a sintaxe final.

### **Compilando o Projeto**

O projeto conta com um script de automação (build_project.sh para Linux/macOS ou .bat para Windows) que realiza todo o processo: instala dependências do frontend, gera o build do Vite, copia os assets para o backend e empacota o JAR final.

\# 1\. Dê permissão de execução (Linux/macOS)

```sh
chmod +x build_project.sh

# 2. Rode o script
./build_project.sh
```

Ao final, o executável shell-blocks.jar será gerado na **raiz do projeto**.

## **🧩 Como Adicionar Novos Comandos**

O sistema é **Data-Driven**. Você não precisa escrever código Java ou JavaScript para adicionar um comando simples como rm ou touch.

1. Abra o arquivo backend/src/main/resources/definitions/cli_definitions.json.
2. Adicione uma nova entrada no array commands:

```json
{
  "commands": [
    {
      "id": "touch",
      "shellCommand": "touch",
      "label": "touch",
      "description": "Atualiza o timestamp ou cria um arquivo vazio.",
      "color": "#4caf50",
      "optionColor": "#7fbf7f",
      "options": [
        {
          "flag": "-a",
          "description": "Muda apenas o tempo de acesso.",
          "takesArgument": false
        }
      ],
      "operands": [
        {
          "id": "filename",
          "label": "Arquivo",
          "description": "Nome do arquivo a ser criado ou atualizado.",
          "color": "#a67f5f",
          "type": "file",
          "defaultValue": "novo_arquivo.txt",
          "cardinality": { "min": 1, "max": "unlimited" },
          "validations": [
            {
              "regex": "^[^/\\0;]*$",
              "errorMessage": "Nome de arquivo inválido."
            }
          ]
        }
      ]
    }
  ],
  "operators": [
    {
      "id": "pipe",
      "label": "pipe",
      "description": "Redireciona a saída de um comando para a entrada do próximo.",
      "color": "#b1745b",
      "slots": [
        { "name": "A", "type": "statement", "check": "command" },
        {
          "name": "B",
          "type": "statement",
          "check": "command",
          "symbol": "|",
          "symbolPlacement": "before"
        }
      ]
    }
  ],
  "controls": [
    {
      "id": "if_statement",
      "shellCommand": "if",
      "label": "if",
      "description": "Executa comandos condicionalmente baseado no sucesso de um teste.",
      "color": "#dbaa25",
      "syntaxEnd": "fi",
      "slots": [
        {
          "name": "CONDITION",
          "type": "statement",
          "check": "command",
          "label": "Se (comando):",
          "obligatory": true
        },
        {
          "name": "DO",
          "type": "statement",
          "check": "command",
          "label": "Então faça (then):",
          "syntaxPrefix": "; then",
          "obligatory": true
        }
      ]
    }
  ]
}
```

3. Reinicie o servidor. O bloco aparecerá automaticamente na interface\!
