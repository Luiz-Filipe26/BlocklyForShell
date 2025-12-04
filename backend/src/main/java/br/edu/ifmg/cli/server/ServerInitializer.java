package br.edu.ifmg.cli.server;

import java.lang.reflect.Type;
import java.util.Arrays;

import org.jetbrains.annotations.NotNull;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import br.edu.ifmg.cli.controllers.DefinitionController;
import br.edu.ifmg.cli.controllers.ExecutionController;
import br.edu.ifmg.cli.controllers.ScriptController;
import br.edu.ifmg.cli.services.LevelService;
import br.edu.ifmg.cli.services.SandboxRunner;
import br.edu.ifmg.cli.services.ScriptGenerator;
import io.javalin.Javalin;
import io.javalin.http.staticfiles.Location;
import io.javalin.json.JsonMapper;

public class ServerInitializer {

    private static final String[] CORS_ALLOWED_HOSTS = { "http://localhost:5173" };
    private static final String PUBLIC_FOLDER = "/public";

    public void start(int port) {
        Gson gson = new GsonBuilder().create();
        
        JsonMapper gsonMapper = new JsonMapper() {
            @Override
            public String toJsonString(@NotNull Object obj, @NotNull Type type) {
                return gson.toJson(obj, type);
            }
            @Override
            public <T> T fromJsonString(@NotNull String json, @NotNull Type targetType) {
                return gson.fromJson(json, targetType);
            }
        };

        var app = Javalin.create(config -> {
            config.staticFiles.add(PUBLIC_FOLDER, Location.CLASSPATH);
            config.jsonMapper(gsonMapper);
            config.bundledPlugins.enableCors(cors -> {
                cors.addRule(it -> {
                    Arrays.stream(CORS_ALLOWED_HOSTS).forEach(it::allowHost);
                    it.allowHost("http://localhost:" + port);
                });
            });
            config.http.defaultContentType = "application/json";
        });

        var scriptGenerator = new ScriptGenerator();
        var sandboxRunner = new SandboxRunner();
        var levelService = new LevelService();

        new DefinitionController().registerRoutes(app);
        new ExecutionController(scriptGenerator, sandboxRunner, levelService).registerRoutes(app);
        new ScriptController(scriptGenerator).registerRoutes(app);

        app.start(port);
        
        System.out.println("✅ Servidor Backend iniciado na porta " + port);
        System.out.println("👉 Clique em 'Abrir Navegador' para começar.");
    }
}