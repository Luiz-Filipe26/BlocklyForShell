package br.edu.ifmg.cli.models.ast;

import java.util.Collections;
import java.util.List;

public record SemanticOperatorDefinition(List<SemanticOperatorSlot> slots) {
	public SemanticOperatorDefinition {
		slots = slots != null ? slots : Collections.emptyList();
	}
}