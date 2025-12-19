package br.edu.ifmg.cli.models.ast;

import java.util.List;

public record AstControlConfig(String syntaxEnd, List<AstControlSlot> slots) {
}