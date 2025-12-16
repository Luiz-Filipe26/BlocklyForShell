package br.edu.ifmg.cli.models.ast;

import java.util.Collections;
import java.util.List;

public record SemanticControlDefinition(String syntaxEnd, List<SemanticControlSlot> slots) {
	public SemanticControlDefinition {
		slots = slots != null ? slots : Collections.emptyList();
	}
}