package br.edu.ifmg.cli.models;

import java.util.List;

public record GameData(List<Level> levels, List<String> levelOrder) {
}