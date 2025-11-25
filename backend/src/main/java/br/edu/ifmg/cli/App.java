package br.edu.ifmg.cli;

import io.javalin.Javalin;
import io.javalin.http.Context;
import java.nio.charset.StandardCharsets;

public class App {

    public static void main(String[] args) {
        Javalin app = Javalin.create(config -> {
            config.bundledPlugins.enableCors(cors -> {
                cors.addRule(it -> {
                    it.allowHost("http://localhost:5173");
                });
            });
        }).start(7000);

        app.get("/", ctx -> ctx.result("Backend CLI Learning rodando!"));
        app.get("/api/definitions", App::getDefinitions);
    }

    private static void getDefinitions(Context ctx) {
        var resourcePath = "/definitions/cli_definitions.json";

        try (var inputStream = App.class.getResourceAsStream(resourcePath)) {

            if (inputStream == null) {
                ctx.status(404).result("Arquivo de definições não encontrado.");
                return;
            }
            var json = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);

            ctx.contentType("application/json").result(json);

        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).result("Erro interno ao ler definições.");
        }
    }
}