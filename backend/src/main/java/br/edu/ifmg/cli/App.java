package br.edu.ifmg.cli;

import br.edu.ifmg.cli.controllers.DefinitionController;
import br.edu.ifmg.cli.controllers.ExecutionController;
import br.edu.ifmg.cli.controllers.ScriptController;
import br.edu.ifmg.cli.services.SandboxRunner;
import br.edu.ifmg.cli.services.ScriptGenerator;
import io.javalin.Javalin;
import io.javalin.http.staticfiles.Location;

import javax.swing.*;
import java.awt.*;
import java.net.URI;

public class App {
	private static final String[] CORS_ALLOWED_HOSTS = { "http://localhost:5173" };
	private static final int APP_PORT = 7000;
	private static final String APP_URL = "http://localhost:" + APP_PORT;

	public static void main(String[] args) {
		var serverThread = new Thread(App::startServer);
		serverThread.setName("JavalinServerThread");
		serverThread.start();

		SwingUtilities.invokeLater(App::createLauncherGUI);
	}

	private static void startServer() {
		var app = Javalin.create(config -> {
			config.staticFiles.add("/public", Location.CLASSPATH);
			
            config.jetty.modifyHttpConfiguration(httpConfig -> {
                httpConfig.setOutputBufferSize(5 * 1024 * 1024);
            });

			config.bundledPlugins.enableCors(cors -> {
				cors.addRule(it -> {
					for (var host : CORS_ALLOWED_HOSTS) {
						it.allowHost(host);
					}
				});
			});

			config.http.defaultContentType = "application/json";
		});

		var scriptGenerator = new ScriptGenerator();
		var sandboxRunner = new SandboxRunner();

		new DefinitionController().registerRoutes(app);
		new ExecutionController(scriptGenerator, sandboxRunner).registerRoutes(app);
		new ScriptController(scriptGenerator).registerRoutes(app);

		app.start(APP_PORT);
	}

	private static void createLauncherGUI() {
        var frame = new JFrame("TCC Launcher");
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        frame.setSize(300, 150);
        frame.setLocationRelativeTo(null);

        var label = new JLabel("Servidor rodando em: " + APP_PORT);
        label.setBounds(0, 20, 280, 20);
        label.setHorizontalAlignment(SwingConstants.CENTER);
        frame.add(label);

        var openOnBrowserButton = new JButton("Abrir Navegador");
        openOnBrowserButton.setBounds(50, 60, 180, 30);
        openOnBrowserButton.addActionListener(e -> {
            try { Desktop.getDesktop().browse(new URI(APP_URL)); }
            catch (Exception ex) { ex.printStackTrace(); }
        });
        frame.add(openOnBrowserButton);

        frame.setVisible(true);
	}
}