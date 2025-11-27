package br.edu.ifmg.cli.controllers;

import io.javalin.Javalin;
import io.javalin.http.Context;

import br.edu.ifmg.cli.models.AstScript;
import br.edu.ifmg.cli.services.ScriptGenerator;
import br.edu.ifmg.cli.services.SandboxRunner;
import br.edu.ifmg.cli.models.ExecutionResult;

public class ExecutionController {

    private final ScriptGenerator generator;
    private final SandboxRunner runner;

    public ExecutionController(ScriptGenerator generator, SandboxRunner runner) {
        this.generator = generator;
        this.runner = runner;
    }

    public void registerRoutes(Javalin app) {
        app.post("/api/run", this::run);
    }

    private void run(Context ctx) {
        try {
            AstScript script = ctx.bodyAsClass(AstScript.class);

            String shellScript = generator.generate(script);

            ExecutionResult result = runner.run(shellScript);

            ctx.json(result);

        } catch (Exception e) {
            ctx.status(400).json(new ExecutionResult("", e.getMessage(), 1));
        }
    }
}