package br.edu.ifmg.cli.models.ast;

import java.util.Collections;
import java.util.List;

public record AstParameter(String key, String value, List<AstNode> children) {
	public AstParameter {
		value = value != null ? value : "";
		children = children != null ? children : Collections.emptyList();
	}

	public boolean isContainer() {
		return !children.isEmpty();
	}
}