package br.edu.ifmg.cli;

import javax.swing.SwingUtilities;

import br.edu.ifmg.cli.server.ServerInitializer;
import br.edu.ifmg.cli.services.DockerService;
import br.edu.ifmg.cli.ui.LauncherWindow;

public class App {
    private static final int APP_PORT = 7000;

    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            LauncherWindow window = new LauncherWindow(APP_PORT);
            
            window.startLogRedirection();
            window.setVisible(true);

            new Thread(() -> startBackendLogic(), "BackendInitThread").start();
        });
    }

    private static void startBackendLogic() {
        try {
            new DockerService().ensureImageExists();
            new ServerInitializer().start(APP_PORT);
            
        } catch (Exception e) {
            System.err.println("❌ Erro fatal na inicialização: " + e.getMessage());
            e.printStackTrace();
        }
    }
}