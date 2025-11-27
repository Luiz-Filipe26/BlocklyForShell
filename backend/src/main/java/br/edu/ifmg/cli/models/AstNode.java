package br.edu.ifmg.cli.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties; // <--- IMPORTANTE
import java.util.Collections;
import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true) 
public record AstNode(
    String id, 
    String nodeType, 
    String commandName, 
    String operandName, 
    String relatedCommand,
    Map<String, String> fields, 
    Map<String, List<AstNode>> inputs
) {
    public AstNode {
        fields = fields != null ? fields : Collections.emptyMap();
        inputs = inputs != null ? inputs : Collections.emptyMap();
        
        commandName = commandName != null ? commandName : "";
        operandName = operandName != null ? operandName : "";
        relatedCommand = relatedCommand != null ? relatedCommand : "";
        nodeType = nodeType != null ? nodeType : "";
    }
}