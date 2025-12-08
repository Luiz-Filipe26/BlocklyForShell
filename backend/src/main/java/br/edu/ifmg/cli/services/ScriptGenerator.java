package br.edu.ifmg.cli.services;

import br.edu.ifmg.cli.models.AstNode;
import br.edu.ifmg.cli.models.CliDefinitions;
import br.edu.ifmg.cli.models.CliDefinitions.ControlDef;
import br.edu.ifmg.cli.models.CliDefinitions.OperatorDef;
import br.edu.ifmg.cli.models.CliDefinitions.SlotDef;
import com.google.gson.Gson;

import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

public class ScriptGenerator {

    private final Map<String, OperatorDef> operatorsMap;
    private final Map<String, ControlDef> controlsMap;

    public ScriptGenerator() {
        try (var stream = getClass().getResourceAsStream("/definitions/cli_definitions.json")) {
            if (stream == null)
                throw new RuntimeException("cli_definitions.json não encontrado!");

            var reader = new InputStreamReader(stream, StandardCharsets.UTF_8);
            CliDefinitions defs = new Gson().fromJson(reader, CliDefinitions.class);

            this.operatorsMap = defs.getOperatorsMap();
            this.controlsMap = defs.getControlsMap();

        } catch (Exception e) {
            throw new RuntimeException("Falha ao inicializar ScriptGenerator com definições", e);
        }
    }

    public String generate(AstNode rootNode) {
        if (rootNode == null)
            return "# ERRO: AST nula.";

        StringBuilder sb = new StringBuilder();
        List<AstNode> commands = rootNode.getChildren("commands");

        for (AstNode node : commands) {
            String code = dispatch(node);
            if (!code.isEmpty()) {
                sb.append(code).append("\n");
            }
        }

        return sb.toString().trim();
    }
    
    private String dispatch(AstNode node) {
        String type = node.getType();

        return switch (type) {
            case "command" -> generateSimpleCommand(node);
            case "control" -> generateControl(node);
            case "operator" -> generateOperator(node);
            default -> "# Tipo desconhecido: " + type;
        };
    }
    
    private String generateSimpleCommand(AstNode node) {
        if (node.semanticData() == null) return "";

        StringBuilder sb = new StringBuilder();
        sb.append(node.semanticData().commandName());

        for (AstNode opt : node.getChildren("OPTIONS")) {
            String flag = opt.getField("FLAG").orElse("");
            if (!flag.isEmpty())
                sb.append(" ").append(flag);
        }

        for (AstNode op : node.getChildren("OPERANDS")) {
            String value = op.getField("VALUE").orElse("");
            if (!value.isEmpty())
                sb.append(" ").append(quoteArgument(value));
        }

        return sb.toString();
    }

    private String generateOperator(AstNode node) {
        String opId = node.semanticData().commandName();
        
        OperatorDef def = operatorsMap.get(opId);
        if (def == null) return "# Erro: Operador não encontrado: " + opId;

        StringBuilder sb = new StringBuilder();
        
        if (def.slots() != null) {
            for (SlotDef slot : def.slots()) {
                String childContent = resolveSlotContent(node, slot.name());
                
                if (slot.symbol() != null && "before".equals(slot.symbolPlacement())) {
                    sb.append(" ").append(slot.symbol()).append(" ");
                }
                
                sb.append(childContent);
                
                if (slot.symbol() != null && "after".equals(slot.symbolPlacement())) {
                    sb.append(" ").append(slot.symbol()).append(" ");
                }
            }
        }
        
        return sb.toString().trim();
    }

    private String generateControl(AstNode node) {
        String controlId = node.semanticData().commandName();
        
        ControlDef def = controlsMap.get(controlId);
        if (def == null) return "# Erro: Controle não encontrado: " + controlId;

        StringBuilder sb = new StringBuilder();
        
        sb.append(def.command());

        if (def.slots() != null) {
            for (SlotDef slot : def.slots()) {
                String slotContent = resolveSlotContent(node, slot.name());
                
                if (slotContent.isEmpty()) continue; 

                if (slot.syntaxPrefix() != null && !slot.syntaxPrefix().isEmpty()) {
                    sb.append(" ").append(slot.syntaxPrefix());
                }
                
                sb.append("\n").append(slotContent);
            }
        }
        
        sb.append("\n").append(def.syntaxEnd());

        return sb.toString();
    }

    private String resolveSlotContent(AstNode parent, String slotName) {
        StringBuilder sb = new StringBuilder();
        List<AstNode> children = parent.getChildren(slotName);
        
        for (AstNode child : children) {
            String code = dispatch(child);
            if (!code.isEmpty()) {
                sb.append(code).append("\n");
            }
        }
        return sb.toString().trim();
    }
    
    private String quoteArgument(String rawInput) {
        if (rawInput == null || rawInput.isEmpty()) return "''";
        return "'" + rawInput.replace("'", "'\\''") + "'";
    }
}