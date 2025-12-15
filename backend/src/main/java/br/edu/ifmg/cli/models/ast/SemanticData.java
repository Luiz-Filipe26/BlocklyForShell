package br.edu.ifmg.cli.models.ast;

import java.util.Collections;
import java.util.List;

public record SemanticData(String kind, String name, List<SemanticBinding> bindings) {
	public SemanticData {
		bindings = bindings != null ? bindings : Collections.emptyList();
	}
}