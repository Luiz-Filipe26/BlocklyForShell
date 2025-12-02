package br.edu.ifmg.cli.services;

import java.io.IOException;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Comparator;

public class DockerService {

    private static final String IMAGE_NAME = "blockly-shell-env";
    private static final String DOCKERFILE_RESOURCE = "/docker/Dockerfile";

    /**
     * Garante que o ambiente Docker está configurado, o usuário tem permissão 
     * e a imagem necessária está construída.
     */
    public void ensureImageExists() {
        System.out.println("🐳 Verificando ambiente Docker...");
        
        try {
            if (!checkDockerBinary()) {
                return;
            }

            if (!checkDockerPermissions()) {
                return;
            }

            buildImage();

        } catch (Exception e) {
            System.err.println("❌ ERRO INTERNO DO DOCKER SERVICE: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private boolean checkDockerBinary() throws InterruptedException, IOException {
        try {
            int dockerCheck = new ProcessBuilder("docker", "--version").start().waitFor();
            if (dockerCheck != 0) {
                System.err.println("❌ ERRO: Docker não encontrado ou falhou na execução.");
                System.err.println("   -> Por favor, certifique-se de que o Docker está instalado e no seu PATH.");
                return false;
            }
            return true;
        } catch (IOException e) {
            System.err.println("❌ ERRO CRÍTICO: Binário 'docker' não encontrado.");
            System.err.println("   -> Certifique-se de que o Docker Engine está instalado.");
            return false;
        }
    }

    private boolean checkDockerPermissions() throws InterruptedException, IOException {
        Process process = new ProcessBuilder("docker", "ps").start();
        int permCheck = process.waitFor();
        
        if (permCheck != 0) {
            System.err.println("❌ ERRO DE PERMISSÃO: O usuário atual não pode acessar o daemon Docker.");
            System.err.println("   -> SOLUÇÃO LINUX: Adicione seu usuário ao grupo 'docker' e faça login novamente:");
            System.err.println("      $ sudo usermod -aG docker $USER");
            System.err.println("      (Depois rode 'newgrp docker' ou faça logout)");
            return false;
        }
        return true;
    }

    private void buildImage() throws Exception {
        Path tempDir = Files.createTempDirectory("blockly_docker_build");
        
        try {
            System.out.println("🔨 Extraindo e construindo imagem '" + IMAGE_NAME + "'...");

            extractResource(DOCKERFILE_RESOURCE, tempDir.resolve("Dockerfile"));
            
            ProcessBuilder pb = new ProcessBuilder(
                "docker", "build", "-t", IMAGE_NAME, "."
            );
            pb.directory(tempDir.toFile());
            pb.redirectErrorStream(true);
            
            Process buildProcess = pb.start();
            
            // Opcional: Ler e logar a saída do build em tempo real se necessário
            buildProcess.getInputStream().transferTo(System.out);

            int buildCode = buildProcess.waitFor();

            if (buildCode == 0) {
                System.out.println("✅ Imagem Docker pronta para uso!");
            } else {
                System.err.println("❌ Falha ao construir imagem Docker (Código: " + buildCode + ").");
            }

        } finally {
            // 3. Limpeza: Deleta a pasta temporária recursivamente
            deleteDirectory(tempDir);
        }
    }


    /**
     * Copia um recurso do Classpath (dentro do JAR) para um arquivo no sistema de arquivos.
     */
    private void extractResource(String resourcePath, Path destination) throws IOException {
        URL url = getClass().getResource(resourcePath);
        if (url == null) throw new IOException("Recurso não encontrado: " + resourcePath);
        try (var stream = url.openStream()) {
            Files.copy(stream, destination, StandardCopyOption.REPLACE_EXISTING);
        }
    }

    /**
     * Deleta um diretório e seu conteúdo recursivamente.
     */
    private void deleteDirectory(Path path) {
        try {
            Files.walk(path)
                .sorted(Comparator.reverseOrder()) // Garante que filhos sejam deletados antes dos pais
                .forEach(p -> {
                    try { Files.delete(p); } catch (IOException ignored) {}
                });
        } catch (IOException e) {
            System.err.println("Aviso: Falha ao limpar o diretório temporário: " + path);
        }
    }
}