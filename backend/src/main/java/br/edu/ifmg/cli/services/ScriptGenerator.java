package br.edu.ifmg.cli.services;

import br.edu.ifmg.cli.models.ast.AstNode;
import br.edu.ifmg.cli.models.ast.SemanticBinding;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List; 
import java.util.stream.Collectors;
import java.util.Optional;

public class ScriptGenerator {

    public String generate(AstNode rootNode) {
        if (rootNode == null) {
            throw new IllegalArgumentException("AST não pode ser nula");
        }
        
        // A raiz é um script_node. Buscamos os filhos lógicos associados à chave "commands".
        // (Conforme definido no systemBlocks.ts do Front-End)
        List<AstNode> commandNodes = extractChildren(rootNode, "commands");
        
        return commandNodes.stream()
            .map(this::dispatch)
            .filter(s -> !s.isBlank())
            .collect(Collectors.joining("\n"));
    }

    private String dispatch(AstNode node) {
        if (node == null || node.semanticData() == null) return "";

        String kind = node.semanticData().kind();

        return switch (kind) {
            case "command" -> generateCommand(node);
            case "control" -> generateControl(node);
            case "operator" -> generateOperator(node);
            // Options e Operands são consumidos internamente por comandos, não geram código sozinhos aqui
            default -> ""; 
        };
    }

    // --- 1. COMANDOS (Dinâmico via AST) ---
    private String generateCommand(AstNode node) {
        StringBuilder sb = new StringBuilder();
        
        // Nome do comando (ex: "ls", "grep")
        sb.append(node.semanticData().name());

        // Processa Opções (Itera sobre a lista definida no binding 'options')
        List<AstNode> options = extractChildren(node, "options");
        for (AstNode opt : options) {
            // O front define as chaves "flag" e "argument" (ou "value" para option arg) no binding
            String flag = extractValue(opt, "flag");
            String arg  = extractValue(opt, "value"); 

            if (flag != null && !flag.isBlank()) {
                sb.append(" ").append(flag);
                if (arg != null && !arg.isBlank()) {
                    sb.append(" ").append(quoteArgument(arg));
                }
            }
        }

        // Processa Operandos
        List<AstNode> operands = extractChildren(node, "operands");
        for (AstNode op : operands) {
            // O front define a chave "value" para o texto do operando
            String val = extractValue(op, "value");
            if (val != null && !val.isBlank()) {
                sb.append(" ").append(quoteArgument(val));
            }
        }

        return sb.toString();
    }

    // --- 2. OPERADORES (Sintaxe Estática Bash) ---
    private String generateOperator(AstNode node) {
        String opName = node.semanticData().name();
        String symbol = getBashOperatorSymbol(opName); 
        
        List<String> parts = new ArrayList<>();
        
        // Itera sobre os slots definidos (ex: A, B) na ordem que vieram no semanticData
        for (SemanticBinding binding : node.semanticData().bindings()) {
            List<AstNode> children = extractChildren(node, binding.key());
            
            String slotCode = children.stream()
                .map(this::dispatch)
                .collect(Collectors.joining("\n"));
            
            if (!slotCode.isBlank()) {
                // Se for multiline, protege com subshell visual para não quebrar a sintaxe
                if (slotCode.contains("\n")) {
                    slotCode = "(" + indent(slotCode) + ")";
                }
                parts.add(slotCode);
            }
        }

        // Ex: Parte1 | Parte2
        return String.join(" " + symbol + " ", parts);
    }
    
    // --- 3. CONTROLES (Sintaxe Estática Bash) ---
    private String generateControl(AstNode node) {
        String controlName = node.semanticData().name();
        
        if ("if".equals(controlName)) {
            String cond = extractSlotCode(node, "CONDITION");
            String body = extractSlotCode(node, "DO");
            String elseBody = extractSlotCode(node, "ELSE"); 
            
            StringBuilder sb = new StringBuilder();
            sb.append("if ").append(cond).append("; then\n");
            sb.append(indent(body)).append("\n");
            if (!elseBody.isBlank()) {
                sb.append("else\n").append(indent(elseBody)).append("\n");
            }
            sb.append("fi");
            return sb.toString();
        }
        
        if ("while".equals(controlName)) {
             String cond = extractSlotCode(node, "CONDITION");
             String body = extractSlotCode(node, "DO");
             return "while " + cond + "; do\n" + indent(body) + "\ndone";
        }
        
        // Adicione outros controles (for, until) conforme necessário aqui
        return "";
    }

    // --- AUXILIARES ---

    private String getBashOperatorSymbol(String opSemanticName) {
        return switch (opSemanticName) {
            case "pipe" -> "|";
            case "redirect_stdout" -> ">";
            case "redirect_append" -> ">>";
            case "redirect_stdin" -> "<";
            case "and" -> "&&";
            case "or" -> "||";
            case "semicolon" -> ";";
            default -> " "; 
        };
    }

    // --- ENGINE DE EXTRAÇÃO (AST DRIVEN) ---

    /**
     * Busca um valor textual (String) baseado na chave semântica (binding key).
     */
    private String extractValue(AstNode node, String key) {
        if (node.semanticData() == null) return null;

        return node.semanticData().bindings().stream()
            .filter(b -> b.key().equals(key))
            .findFirst()
            .flatMap(binding -> {
                if ("field".equals(binding.source())) {
                    return node.getRawFieldValue(binding.name());
                }
                return Optional.empty();
            })
            .orElse(null);
    }

    /**
     * Busca uma lista de nós filhos baseado na chave semântica (binding key).
     */
    private List<AstNode> extractChildren(AstNode node, String key) {
        if (node.semanticData() == null) return Collections.emptyList();

        return node.semanticData().bindings().stream()
            .filter(b -> b.key().equals(key))
            .findFirst()
            .map(binding -> {
                if ("input".equals(binding.source())) {
                    return node.getRawInputChildren(binding.name());
                }
                return Collections.<AstNode>emptyList();
            })
            .orElse(Collections.emptyList());
    }
    
    private String extractSlotCode(AstNode node, String key) {
        List<AstNode> children = extractChildren(node, key);
        return children.stream()
                .map(this::dispatch)
                .collect(Collectors.joining("\n"));
    }

    private String quoteArgument(String raw) {
        if (raw == null || raw.isEmpty()) return "''";
        return "'" + raw.replace("'", "'\\''") + "'";
    }

    private String indent(String code) {
        return code.lines()
                .map(l -> "  " + l)
                .collect(Collectors.joining("\n"));
    }
}
