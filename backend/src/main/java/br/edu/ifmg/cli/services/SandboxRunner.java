package br.edu.ifmg.cli.services;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.TimeUnit;

import br.edu.ifmg.cli.models.ExecutionResult;

public class SandboxRunner {

    private static final String IMAGE_NAME = "blockly-shell-env";
    // Timeout para evitar loops infinitos (while true) travando o pc
    private static final int TIMEOUT_SECONDS = 5;

    /**
     * Executa o script do usuário em um container Docker efêmero, 
     * realizando o setup do ambiente e a verificação final de estado.
     * * @param userScript O script gerado pelo Blockly
     * @param setupCommands Lista de comandos do JSON para preparar o terreno
     * @param verificationScript Script bash do JSON que retorna exit 0 (sucesso) ou 1 (falha)
     */
    public ExecutionResult run(String userScript, List<String> setupCommands, String verificationScript) {
        Path volumeDir = null; // Inicializa fora do try para ser acessível no finally
        try {
            volumeDir = Files.createTempDirectory("sandbox_vol_");

            // 1. Montagem do Payload (Script Combinado)
            StringBuilder fullScript = new StringBuilder();

            // A. Setup: Os comandos rodam em sequência e falham se um anterior falhar (&&)
            if (setupCommands != null && !setupCommands.isEmpty()) {
                for (String cmd : setupCommands) {
                    // Usamos '&&' para garantir que o setup só avance se o comando anterior for bem-sucedido.
                    fullScript.append(cmd).append(" && ");
                }
            }
            
            // Adiciona um marcador visual (opcional) para separar logs de setup
            fullScript.append("echo '--- INICIO DA EXECUÇÃO ---';\n");

            // B. Script do Usuário: Usamos ';' para garantir que a verificação rode 
            // mesmo se o script do usuário der exit 1 ou falhar.
            fullScript.append(userScript).append(" ;\n");

            // C. Verificação (O Juiz): 
            fullScript.append("echo '--- VERIFICACAO ---';\n");
            
            // Se a verificação for nula, assume 'exit 0' (sucesso)
            String verify = (verificationScript != null && !verificationScript.isBlank()) 
                ? verificationScript 
                : "exit 0";
            
            fullScript.append(verify);

            // 2. Execução Docker
            ProcessBuilder pb = new ProcessBuilder(
                "docker", "run", 
                "--rm", "--net", "none",
                "--memory", "100m",
                "-v", volumeDir.toAbsolutePath().toString() + ":/home/aluno",
                IMAGE_NAME,
                "bash", "-c", fullScript.toString()
            );

            Process process = pb.start();
            boolean finished = process.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);

            String stdout;
            String stderr;
            int exitCode;

            if (!finished) {
                process.destroyForcibly();
                stdout = "";
                stderr = "⏱️ Tempo limite excedido. O script demorou mais que " + TIMEOUT_SECONDS + "s.";
                exitCode = 124;
            } else {
                stdout = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
                stderr = new String(process.getErrorStream().readAllBytes(), StandardCharsets.UTF_8);
                exitCode = process.exitValue();
            }

            return new ExecutionResult(stdout, stderr, exitCode);

        } catch (Exception e) {
            e.printStackTrace();
            return new ExecutionResult("", "Erro interno no Sandbox: " + e.getMessage(), 1);
        } finally {
            // Garante que a pasta temporária seja deletada, mesmo se houver exceção
            if (volumeDir != null) deleteDirectory(volumeDir);
        }
    }

    /**
     * Helper para deletar diretório recursivamente.
     */
    private void deleteDirectory(Path path) {
        try {
            Files.walk(path)
                // Ordena em ordem reversa para deletar arquivos antes dos diretórios
                .sorted(Comparator.reverseOrder()) 
                .forEach(p -> {
                    try { Files.delete(p); } catch (IOException ignored) {}
                });
        } catch (IOException e) {
            System.err.println("Falha ao limpar temp dir: " + path + ". Erro: " + e.getMessage());
        }
    }
}