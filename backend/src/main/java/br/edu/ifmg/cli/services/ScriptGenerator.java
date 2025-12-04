package br.edu.ifmg.cli.services;

import br.edu.ifmg.cli.models.AstNode;
import java.util.List;

public class ScriptGenerator {

    public String generate(AstNode rootNode) {
        StringBuilder sb = new StringBuilder();
        if (rootNode == null) return "# ERRO: AST vazia ou nula recebida pelo backend.";

        List<AstNode> commands = rootNode.getChildren("commands");
        for (AstNode cmd : commands) {
            String commandStr = generateCommand(cmd);
            sb.append(commandStr).append("\n");
        }
        return sb.toString().trim();
    }

    private String generateCommand(AstNode node) {
        if (!"command".equals(node.getType())) {
            return "# ERRO: Nó ignorado (Tipo inválido: " + node.getType() + ")";
        }
        if (node.semanticData() == null) {
            return "# ERRO: Nó de comando sem dados semânticos (Corrompido?)";
        }

        StringBuilder sb = new StringBuilder();
        sb.append(node.semanticData().commandName());

        // Options
        for (AstNode opt : node.getChildren("OPTIONS")) {
            String flag = generateOption(opt);
            if (!flag.isEmpty()) sb.append(" ").append(flag);
        }

        // Operands
        for (AstNode op : node.getChildren("OPERANDS")) {
            String value = generateOperand(op);
            if (!value.isEmpty()) sb.append(" ").append(value);
        }

        return sb.toString();
    }

    private String generateOption(AstNode node) {
        return node.getField("FLAG").orElse("");
    }

    private String generateOperand(AstNode node) {
        String rawValue = node.getField("VALUE").orElse("");
        return quoteArgument(rawValue);
    }

    private String quoteArgument(String rawInput) {
        if (rawInput == null || rawInput.isEmpty()) return "''";
        return "'" + rawInput.replace("'", "'\\''") + "'";
    }
}