package br.edu.ifmg.cli;

import javax.swing.SwingUtilities;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import br.edu.ifmg.cli.server.ServerInitializer;
import br.edu.ifmg.cli.services.DockerService;
import br.edu.ifmg.cli.ui.LauncherWindow;

public class App {
	private static final int APP_PORT = 7000;
	private static final Logger logger = LoggerFactory.getLogger(App.class);

	public static void main(String[] args) {
		SwingUtilities.invokeLater(() -> {
			LauncherWindow window = new LauncherWindow(APP_PORT);

			window.startLogRedirection();
			window.setVisible(true);

			new Thread(() -> startBackendLogic(window), "BackendInitThread").start();
		});
	}

	private static void startBackendLogic(LauncherWindow window) {
		try {
			new DockerService().ensureImageExists();
			new ServerInitializer().start(APP_PORT);
			window.enableBrowserButton();

		} catch (Exception e) {
			logger.error("❌ Erro fatal na inicialização: {}", e.getMessage(), e);
		}
	}
}