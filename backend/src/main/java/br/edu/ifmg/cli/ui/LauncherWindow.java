package br.edu.ifmg.cli.ui;

import java.awt.BorderLayout;
import java.awt.Desktop;
import java.awt.Font;
import java.awt.Image;
import java.io.IOException;
import java.io.OutputStream;
import java.io.PrintStream;
import java.net.URI;
import java.util.List;

import javax.imageio.ImageIO;
import javax.swing.JButton;
import javax.swing.JFrame;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTextArea;
import javax.swing.SwingUtilities;
import javax.swing.event.DocumentListener;

@SuppressWarnings("serial")
public class LauncherWindow extends JFrame {

	private static final String LAUNCHER_ICON_PATH = "/launcher_icon.png";
	private final JTextArea logArea;
	private final String appUrl;

	public LauncherWindow(int port) {
		this.appUrl = "http://localhost:" + port;

		setTitle("Blockly for Shell Launcher");
		setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
		setSize(600, 450);
		setLocationRelativeTo(null);
		setLayout(new BorderLayout());

		setupIcon();
		setupTopPanel();

		logArea = new JTextArea();
		logArea.setEditable(false);
		logArea.setFont(new Font("Monospaced", Font.PLAIN, 12));

		logArea.getDocument().addDocumentListener(new DocumentListener() {
			public void insertUpdate(javax.swing.event.DocumentEvent e) {
				scrollToBottom();
			}

			public void removeUpdate(javax.swing.event.DocumentEvent e) {
				scrollToBottom();
			}

			public void changedUpdate(javax.swing.event.DocumentEvent e) {
				scrollToBottom();
			}

			private void scrollToBottom() {
				logArea.setCaretPosition(logArea.getDocument().getLength());
			}
		});

		add(new JScrollPane(logArea), BorderLayout.CENTER);
	}

	private void setupIcon() {
		try (var stream = getClass().getResourceAsStream(LAUNCHER_ICON_PATH)) {
			if (stream != null) {
				Image icon = ImageIO.read(stream);
				setIconImages(List.of(icon));
			}
		} catch (IOException e) {
			System.err.println("Falha ao carregar ícone: " + e.getMessage());
		}
	}

	private void setupTopPanel() {
		JPanel topPanel = new JPanel();
		var openBrowserButton = new JButton("Abrir Navegador");

		openBrowserButton.addActionListener(e -> {
			try {
				Desktop.getDesktop().browse(new URI(appUrl));
			} catch (Exception ex) {
				ex.printStackTrace();
			}
		});

		topPanel.add(openBrowserButton);
		add(topPanel, BorderLayout.NORTH);
	}

	/**
	 * Intercepta System.out e System.err e redireciona para o JTextArea.
	 */
	public void startLogRedirection() {
		OutputStream outputStream = new OutputStream() {
			@Override
			public void write(int b) {
				updateText(String.valueOf((char) b));
			}

			@Override
			public void write(byte[] b, int off, int len) {
				updateText(new String(b, off, len));
			}

			@Override
			public void write(byte[] b) {
				write(b, 0, b.length);
			}

			private void updateText(String text) {
				SwingUtilities.invokeLater(() -> logArea.append(text));
			}
		};

		PrintStream printStream = new PrintStream(outputStream, true);
		System.setOut(printStream);
		System.setErr(printStream);
	}
}