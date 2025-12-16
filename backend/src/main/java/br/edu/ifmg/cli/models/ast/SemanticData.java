package br.edu.ifmg.cli.models.ast;

import java.util.Collections;
import java.util.List;

public record SemanticData(String nodeType, String name, List<SemanticBinding> bindings,
		SemanticDefinition definition) {
	public SemanticData {
		bindings = bindings != null ? bindings : Collections.emptyList();
	}
}