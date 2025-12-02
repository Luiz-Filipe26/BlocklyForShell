package br.edu.ifmg.cli.services;

import br.edu.ifmg.cli.models.ExecutionResult;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.TimeUnit;

public class SandboxRunner {

    private static final String IMAGE_NAME = "blockly-shell-env";
    // Timeout para evitar loops infinitos (while true) travando o pc
    private static final int TIMEOUT_SECONDS = 5; 

    public ExecutionResult run(String shellScript) {
        try {
            // 1. Cria um diretório temporário no Host para ser o "Volume" do nível
            // (Aqui futuramente entra a lógica de popular o nível com arquivos do levels.json)
            Path volumeDir = Files.createTempDirectory("sandbox_vol_");
            
            // 2. Prepara o comando Docker
            // --rm: Deleta o container assim que acabar
            // --net none: Isola da rede (segurança)
            // -v: Monta o volume temporário como a pasta home do usuário
            ProcessBuilder pb = new ProcessBuilder(
                "docker", "run", 
                "--rm", 
                "--net", "none",
                "--memory", "100m", // Limita memória (opcional)
                "-v", volumeDir.toAbsolutePath().toString() + ":/home/aluno",
                IMAGE_NAME,
                "bash", "-c", shellScript
            );

            Process process = pb.start();

            // 3. Gerenciamento de Timeout
            boolean finished = process.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);
            
            String stdout;
            String stderr;
            int exitCode;

            if (!finished) {
                // Se estourou o tempo, mata o processo
                process.destroyForcibly();
                stdout = "";
                stderr = "⏱️ Tempo limite de execução excedido (" + TIMEOUT_SECONDS + "s). Verifique loops infinitos.";
                exitCode = 124; // Código comum para timeout
            } else {
                // Leitura das saídas
                stdout = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
                stderr = new String(process.getErrorStream().readAllBytes(), StandardCharsets.UTF_8);
                exitCode = process.exitValue();
            }

            // 4. Limpeza (Deleta o diretório temporário do Host)
            // Em um cenário real, você verificaria o conteúdo de volumeDir aqui 
            // para validar se o aluno cumpriu o objetivo (ex: criou o arquivo certo)
            deleteDirectory(volumeDir);

            return new ExecutionResult(stdout, stderr, exitCode);

        } catch (Exception e) {
            e.printStackTrace();
            return new ExecutionResult("", "Erro interno no Sandbox: " + e.getMessage(), 1);
        }
    }

    // Helper para deletar diretório recursivamente
    private void deleteDirectory(Path path) {
        try {
            Files.walk(path)
                .sorted((a, b) -> b.compareTo(a)) // Deleta filhos antes dos pais
                .forEach(p -> {
                    try { Files.delete(p); } catch (Exception ignored) {}
                });
        } catch (Exception e) {
            System.err.println("Falha ao limpar temp dir: " + e.getMessage());
        }
    }
}