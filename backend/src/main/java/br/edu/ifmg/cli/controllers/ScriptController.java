package br.edu.ifmg.cli.controllers;

import br.edu.ifmg.cli.models.AstScript;
import br.edu.ifmg.cli.models.GeneratedScript;
import br.edu.ifmg.cli.services.ScriptGenerator;
import io.javalin.Javalin;
import io.javalin.http.Context;

public class ScriptController {

    private final ScriptGenerator generator;

    public ScriptController(ScriptGenerator generator) {
        this.generator = generator;
    }

    public void registerRoutes(Javalin app) {
        app.post("/api/generate", this::generateScript);
    }

    private void generateScript(Context ctx) {
        try {
            AstScript script = ctx.bodyAsClass(AstScript.class);

            String shellScript = generator.generate(script);
            
            ctx.json(new GeneratedScript(shellScript));

        } catch (Exception e) {
        	e.printStackTrace();
            ctx.status(400).json(new GeneratedScript("ERRO: " + e.getMessage()));
        }
    }
}