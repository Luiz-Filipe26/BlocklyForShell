package br.edu.ifmg.cli.models.ast;

public record AstControlSlot(String key, String syntaxPrefix, boolean obligatory, boolean breakLineBefore) {
}