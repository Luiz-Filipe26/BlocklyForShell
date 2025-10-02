const ls_definition = {
    "command": "ls",
    "description": "Lista o conteúdo de diretórios. Mostra informações sobre arquivos e pastas.",
    "color": "#5b80a5",

    "options": [
        {
            "flag": "-l",
            "description": "Usa o formato de listagem longa, mostrando detalhes.",
            "takesArgument": false
        },
        {
            "flag": "-a",
            "longFlag": "--all",
            "description": "Mostra todas as entradas, incluindo as ocultas (que começam com '.').",
            "takesArgument": false
        },
        {
            "flag": "-h",
            "longFlag": "--human-readable",
            "description": "Com -l, mostra os tamanhos de forma legível (ex: 1K, 234M, 2G).",
            "takesArgument": false
        },
        {
            "flag": "-t",
            "description": "Ordena pela data de modificação, com os mais recentes primeiro.",
            "takesArgument": false
        },
        {
            "flag": "-S",
            "description": "Ordena por tamanho de arquivo, com os maiores primeiro.",
            "takesArgument": false
        },
        {
            "flag": "-r",
            "longFlag": "--reverse",
            "description": "Inverte a ordem da ordenação.",
            "takesArgument": false
        },
        {
            "flag": "-R",
            "longFlag": "--recursive",
            "description": "Lista os subdiretórios recursivamente.",
            "takesArgument": false
        }
    ],

    "exclusiveOptions": [
        ["-t", "-S"]
    ],

    "operands": [
        {
            "name": "file",
            "description": "O arquivo ou diretório a ser listado. Se omitido, usa o diretório atual.",
            "type": "path",
            "cardinality": {
                "min": 0,
                "max": "unlimited" // Permite 'ls', 'ls /etc', 'ls /etc /home', etc.
            },
            "validation": [
                {
                    "regex": "^[^;\\0]*$", // Exemplo: não pode conter ';' ou o byte nulo
                    "errorMessage": "O caminho contém caracteres inválidos."
                }
            ]
        }
    ]
};
