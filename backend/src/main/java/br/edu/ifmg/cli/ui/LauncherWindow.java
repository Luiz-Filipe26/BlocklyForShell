package br.edu.ifmg.cli.ui;

import java.awt.BorderLayout;
import java.awt.Color;
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
import javax.swing.JTextPane;
import javax.swing.SwingUtilities;
import javax.swing.event.DocumentListener;
import javax.swing.text.BadLocationException;
import javax.swing.text.Style;
import javax.swing.text.StyleConstants;
import javax.swing.text.StyleContext;
import javax.swing.text.StyledDocument;

@SuppressWarnings("serial")
public class LauncherWindow extends JFrame {

	private static final String LAUNCHER_ICON_PATH = "/launcher_icon.png";
	
	private final JTextPane logPane; 
	private final String appUrl;
	private JButton openBrowserButton;

	public LauncherWindow(int port) {
		this.appUrl = "http://localhost:" + port;

		setTitle("ShellBlocks Launcher");
		setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
		setSize(600, 450);
		setLocationRelativeTo(null);
		setLayout(new BorderLayout());

		setupIcon();
		setupTopPanel();

		logPane = new JTextPane();
		logPane.setEditable(false);
		logPane.setFont(new Font("Monospaced", Font.PLAIN, 12));
		
		setupStyles();
		setupAutoScrollerDocumentListener(logPane);

		add(new JScrollPane(logPane), BorderLayout.CENTER);
	}
	
	public void enableBrowserButton() {
        SwingUtilities.invokeLater(() -> openBrowserButton.setEnabled(true));
    }
	
	private void setupAutoScrollerDocumentListener(JTextPane logPane) {
		logPane.getDocument().addDocumentListener(new DocumentListener() {
			public void insertUpdate(javax.swing.event.DocumentEvent e) { scrollToBottom(); }
			public void removeUpdate(javax.swing.event.DocumentEvent e) { scrollToBottom(); }
			public void changedUpdate(javax.swing.event.DocumentEvent e) { scrollToBottom(); }
			
			private void scrollToBottom() {
				SwingUtilities.invokeLater(() -> 
					logPane.setCaretPosition(logPane.getDocument().getLength())
				);
			}
		});
	}

	private void setupStyles() {
		StyledDocument doc = logPane.getStyledDocument();
		Style def = StyleContext.getDefaultStyleContext().getStyle(StyleContext.DEFAULT_STYLE);
		
		Style regular = doc.addStyle("regular", def);
		StyleConstants.setForeground(regular, Color.BLACK);

		Style error = doc.addStyle("error", def);
		StyleConstants.setForeground(error, new Color(200, 0, 0));
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
		openBrowserButton = new JButton("Abrir Navegador");
		openBrowserButton.setEnabled(false);

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

	public void startLogRedirection() {
		System.setOut(new PrintStream(new StyledOutputStream("regular"), true));
		System.setErr(new PrintStream(new StyledOutputStream("error"), true));
	}

	private class StyledOutputStream extends OutputStream {
		private final String styleName;

		public StyledOutputStream(String styleName) {
			this.styleName = styleName;
		}

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
			SwingUtilities.invokeLater(() -> {
				try {
					StyledDocument doc = logPane.getStyledDocument();
					doc.insertString(doc.getLength(), text, doc.getStyle(styleName));
				} catch (BadLocationException e) {
				}
			});
		}
	}
}
