package br.edu.ifmg.cli.services;

import br.edu.ifmg.cli.models.AstNode;
import java.util.List;

public class ScriptGenerator {

    /**
     * Gera um Shell Script a partir de uma árvore AST.
     * @param rootNode O nó raiz (geralmente do tipo "script").
     * @return O código Bash gerado.
     */
    public String generate(AstNode rootNode) {
        StringBuilder sb = new StringBuilder();

        List<AstNode> commands = rootNode.getChildren("commands");

        for (AstNode cmd : commands) {
            String commandStr = generateCommand(cmd);
            if (!commandStr.isEmpty()) {
                sb.append(commandStr).append("\n");
            }
        }

        return sb.toString().trim();
    }

    private String generateCommand(AstNode node) {
        if (!"command".equals(node.getType())) {
            return "";
        }

        // Se por algum motivo o semanticData não vier, aborta para evitar NullPointerException
        if (node.semanticData() == null) {
            return "";
        }

        StringBuilder sb = new StringBuilder();

        sb.append(node.semanticData().commandName());

        List<AstNode> options = node.getChildren("OPTIONS");
        for (AstNode opt : options) {
            String flag = generateOption(opt);
            if (!flag.isEmpty()) {
                sb.append(" ").append(flag);
            }
        }

        List<AstNode> operands = node.getChildren("OPERANDS");
        for (AstNode op : operands) {
            String value = generateOperand(op);
            if (!value.isEmpty()) {
                sb.append(" ").append(value);
            }
        }

        return sb.toString();
    }

    private String generateOption(AstNode node) {
        return node.getField("FLAG").orElse("");
    }

    private String generateOperand(AstNode node) {
        String rawValue = node.getField("VALUE").orElse("");

        // Sanitização - evita Shell Injection
        return quoteArgument(rawValue);
    }

    /**
     * Envolve o argumento em aspas simples para segurança no Bash.
     * Trata corretamente aspas simples existentes dentro da string.
     * * Ex: O'Neil -> 'O'\''Neil'
     * Ex: arquivo com espaços -> 'arquivo com espaços'
     * Ex: ; rm -rf / -> '; rm -rf /' (vira apenas uma string inofensiva)
     */
    private String quoteArgument(String rawInput) {
        if (rawInput == null || rawInput.isEmpty()) {
            return "''"; // Argumento vazio explícito
        }
        // Fecha a aspa, insere uma aspa escapada, reabre a aspa
        return "'" + rawInput.replace("'", "'\\''") + "'";
    }
}