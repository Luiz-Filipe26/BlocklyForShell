package br.edu.ifmg.cli.controllers;

import br.edu.ifmg.cli.models.AstNode;
import br.edu.ifmg.cli.models.ExecutionResult;
import br.edu.ifmg.cli.services.SandboxRunner;
import br.edu.ifmg.cli.services.ScriptGenerator;
import io.javalin.Javalin;
import io.javalin.http.Context;

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
            AstNode script = ctx.bodyAsClass(AstNode.class);

            String shellScript = generator.generate(script);

            ExecutionResult result = runner.run(shellScript);

            ctx.json(result);

        } catch (Exception e) {
            ctx.status(400).json(new ExecutionResult("", e.getMessage(), 1));
        }
    }
}