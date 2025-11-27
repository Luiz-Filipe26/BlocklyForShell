package br.edu.ifmg.cli.controllers;

import io.javalin.Javalin;
import io.javalin.http.Context;
import java.nio.charset.StandardCharsets;

public class DefinitionController {

    private static final String RESOURCE_PATH = "/definitions/cli_definitions.json";

    public void registerRoutes(Javalin app) {
        app.get("/api/definitions", this::getDefinitions);
    }

    private void getDefinitions(Context ctx) {
        try (var input = getClass().getResourceAsStream(RESOURCE_PATH)) {

            if (input == null) {
                ctx.status(404).result("{\"error\":\"definitions not found\"}");
                return;
            }

            var json = new String(input.readAllBytes(), StandardCharsets.UTF_8);
            ctx.contentType("application/json").result(json);

        } catch (Exception e) {
            ctx.status(500).result("{\"error\": \"Failed to read CLI definitions.\"}");
        }
    }
}