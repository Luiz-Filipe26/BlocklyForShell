package br.edu.ifmg.cli.models;

import java.util.List;

public record Level(
    String id,
    String title,
    String description,
    List<String> setupCommands,
    String verificationScript
) {}