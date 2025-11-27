package br.edu.ifmg.cli.services;

import br.edu.ifmg.cli.models.AstScript;
import br.edu.ifmg.cli.models.AstNode;

public class ScriptGenerator {

    public String generate(AstScript script) {
        StringBuilder sb = new StringBuilder();

        if (!"script".equals(script.type()))
            throw new IllegalArgumentException("AST root inválida.");

        for (AstNode cmd : script.commands()) {
            sb.append(generateCommand(cmd)).append("\n");
        }

        return sb.toString().trim();
    }


    private String generateCommand(AstNode node) {
        if (!"command".equals(node.nodeType()))
            throw new IllegalArgumentException("Esperado nodeType 'command'.");

        StringBuilder sb = new StringBuilder();

        sb.append(node.commandName());

        // OPTIONS
        var options = node.inputs().get("OPTIONS");
        if (options != null) {
            for (AstNode opt : options) {
                sb.append(" ").append(generateOption(opt));
            }
        }

        // OPERANDS
        var operands = node.inputs().get("OPERANDS");
        if (operands != null) {
            for (AstNode op : operands) {
                sb.append(" ").append(generateOperand(op));
            }
        }

        return sb.toString();
    }

    private String generateOption(AstNode node) {
        if (!"option".equals(node.nodeType()))
            throw new IllegalArgumentException("Esperado nodeType 'option'.");

        return node.fields().get("FLAG");
    }

    private String generateOperand(AstNode node) {
        if (!"operand".equals(node.nodeType()))
            throw new IllegalArgumentException("Esperado nodeType 'operand'.");

        return node.fields().get("VALUE");
    }
}
